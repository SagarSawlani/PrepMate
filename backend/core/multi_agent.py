from fastapi import APIRouter
from google import genai
from google.genai import types
from google.genai import errors as genai_errors
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langgraph.graph import MessagesState
from typing import TypedDict, Literal
from langchain_core.messages import AIMessage
from langgraph.types import Command
from langgraph.graph import END
from langgraph.graph import StateGraph
from tavily import TavilyClient
from pydantic import BaseModel
from dotenv import load_dotenv
from core.rag import llm_call
import json
import re
import os
import asyncio

load_dotenv()

gemini_llm = ChatGoogleGenerativeAI(
  model="gemini-2.5-flash",
  temperature=1.0,
  max_tokens=None,
  timeout=None,
  max_retries=2
)

groq_llm = ChatGroq(
  model="openai/gpt-oss-120b",
  temperature=0.3,
  max_tokens=500,
  reasoning_format="parsed",
  reasoning_effort="medium",
  timeout=None,
  max_retries=2,
)

tools = [{"google_search": {}}]
llm_with_search = gemini_llm.bind_tools(tools)

def research_agent(query):
  response = llm_with_search.invoke(query)
  content = response.content

  # When Gemini uses a tool (e.g. google_search), content is a list of parts
  # like [{"type": "text", "text": "..."}, {"type": "tool_result", ...}].
  # Extract only the text parts and join them.
  if isinstance(content, list):
    text_parts = []
    for part in content:
      if isinstance(part, str):
        text_parts.append(part)
      elif isinstance(part, dict):
        text_parts.append(part.get("text", ""))
    content = "".join(text_parts)

  return content

def clean_json(response):
    # remove ```json and ```
    cleaned = re.sub(r"```json|```", "", response)
    return json.loads(cleaned)
    
router = APIRouter()

@router.post("/colleges-recommendations")
async def colleges_recommendations(exam: str, percentile: str, rank: str, reservation: str, preferred_state: str = None, budget: str = None, extra: str = None, preferred_branch: str = None):
  system_prompt = f"""
    Exam: {exam}
    Percentile: {percentile}
    Rank: {rank}
    Reservation: {reservation}
    Preferred State: {preferred_state}
    Budget: {budget}
    Extra: {extra}
    Preferred Branch: {preferred_branch}

    Task:
    1. Find a LIST of 5–8 engineering colleges in Maharashtra that are relevant for this rank.
    2. Include a mix of:
   - safe colleges (within rank)
   - target colleges (slightly competitive)
   - dream colleges (top tier)
    Do NOT return only one college. Do NOT filter too strictly. Include multiple possible options even if cutoff is approximate. Make sure you consider the rank, reservation and cutoffs that is given so that only eligible colleges are returned. Return the colleges in a JSON Format. The JSON should have the following keys: "college_name", "fit_score" (integer 0-100, where 100 = perfect fit based on rank/budget/branch match), "pros" (in array form), "cons" (in array form), "reason_for_admission", "branch", "location", "fees", "cutoff", "ranking", "placement", "hostel", "mess", "campus_life". ONLY return JSON. No Explanation, No extra text, No markdown.
  """

  college_list = research_agent(system_prompt)
  
  print(college_list)
  college_list = clean_json(college_list)
  return {"answer": college_list}



class State(MessagesState):
  next: str

def teacher_agent(state: State):
  print("\n---- Teacher Agent ----\n")

  messages = state["messages"]

  response = groq_llm.invoke([
    {"role": "system", "content": "You are a teacher. Focus on: academics, placements and long-term career. IMPORTANT RULES: Do NOT blindly agree with previous agents, Critically evaluate ALL colleges, If you disagree with previous opinions, clearly explain why, If another agent made a weak argument, point it out. Respond to the discussion so far and give your opinion on the best college. Keep the output under 80 words"},
    *messages
  ])

  new_message = AIMessage(
    content=response.content,
    name="teacher"
  )

  return {"messages": messages + [new_message]}

def parent_agent(state: State):
  print("\n---- Parent Agent ----\n")

  messages = state["messages"]

  response = groq_llm.invoke([
    {"role": "system", "content": "You are a parent. Focus on: fees, safety and stability.IMPORTANT RULES:Do NOT just agree with previous agents, You may disagree if another college is more practical, If another agent made a weak argument, point it out. Respond to the discussion so far and give your opinion on the best college. Keep the output under 80 words"},
    *messages
  ])

  new_message = AIMessage(
    content=response.content,
    name="parent"
  )

  return {"messages": messages + [new_message]}

def friend_agent(state: State):
  print("\n---- Friend Agent ----\n")

  messages = state["messages"]

  response = groq_llm.invoke([
    {"role": "system", "content": "You are a friend. Focus on: campus life, social life, extra curricular activities and fun. IMPORTANT6 RULES: You are allowed to disagree with others, Prefer lifestyle and experience over pure academics if needed, If another agent made a weak argument, point it out. Respond to the discussion so far and give your opinion on the best college. Keep the output under 80 words"},
    *messages
  ])

  new_message = AIMessage(
    content=response.content,
    name="friend"
  )

  return {"messages": messages + [new_message]}

def final_decision_agent(state: State):
    print("\n---- FINAL DECISION ----\n")

    messages = state["messages"]

    response = groq_llm.invoke([
        {
            "role": "system",
            "content": """
You are a final decision-maker.

Your job:
- Analyze the full discussion between teacher, parent, and friend
- Identify the most agreed-upon or best overall college

Rules:
- Choose ONLY ONE college
- Consider trade-offs (placements, fees, campus life, admission chances)
- Prefer realistic options (not impossible cutoffs)

Output format:
Final Answer: <college name>
Reason: <short explanation>
Confidence: <Low / Medium / High>

Keep it under 100 words.
"""
        },
        *messages
    ])

    new_message = AIMessage(
        content=response.content,
        name="final"
    )

    return {"messages": messages + [new_message]}

def make_supervisor_agent(members):
  options = ["FINISH"] + members

  system_prompt = f"""
    You are a supervisor managing a discussion between three agents:
    - teacher (focus: academics, placements, career)
    - parent (focus: fees, safety, stability)
    - friend (focus: campus life, social experience)

    Your job is to:
    1. Decide which agent should speak next
    2. Ensure all agents participate in the discussion
    3. Maintain a logical flow of conversation
    4. Stop the discussion only after sufficient debate

    STRICT RULES (VERY IMPORTANT):

    TURN ORDER:
    - If no one has spoken → choose teacher
    - Then follow strict rotation:
      teacher → parent → friend → repeat

    PARTICIPATION:
    - You MUST ensure that teacher, parent, and friend ALL speak at least once
    - Do NOT choose FINISH before all three agents have spoken

    STOPPING CONDITIONS:
    - Only allow FINISH after at least one full cycle (teacher → parent → friend)
    - After that, you may stop IF:
      - all agents clearly agree on one college
      - OR discussion becomes repetitive with no new insights

    SAFETY RULE:
    - If unsure → continue discussion (DO NOT finish early)

    MAXIMUM TURNS:
    - Stop after 3 full cycles (9 messages)
    - NEVER exceed this

    OUTPUT FORMAT (STRICT):
    Respond with ONLY one word:
    teacher OR parent OR friend OR FINISH

    If agents repeat the same recommendation twice → FINISH
    Do NOT explain anything.
    Do NOT output extra text.
    """

  def supervisor_agent(state: State) -> Command:
    last_agent = state.get("next", "None")

    messages = [{"role": "system", "content": system_prompt + "Last Agent: " + last_agent}] + state["messages"]

    response = groq_llm.invoke(messages)
    goto = response.content.strip()


    if goto not in options:
      goto = "FINISH"

    if goto == "FINISH":
      return Command(goto="final")

    return Command(goto=goto, update={"next": goto})

  return supervisor_agent
  

# ─── Async streaming agent helpers (used by the parallel /discussion endpoint) ─

SYSTEM_PROMPTS = {
  "teacher": (
    "You are a teacher. Focus on: academics, placements and long-term career. "
    "IMPORTANT RULES: Do NOT blindly agree with previous agents. Critically evaluate ALL colleges. "
    "If you disagree with previous opinions, clearly explain why. "
    "If another agent made a weak argument, point it out. "
    "Respond to the discussion so far and give your opinion on the best college. Keep the output under 80 words."
  ),
  "parent": (
    "You are a parent. Focus on: fees, safety and stability. "
    "IMPORTANT RULES: Do NOT just agree with previous agents. "
    "You may disagree if another college is more practical. "
    "If another agent made a weak argument, point it out. "
    "Respond to the discussion so far and give your opinion on the best college. Keep the output under 80 words."
  ),
  "friend": (
    "You are a friend. Focus on: campus life, social life, extra-curricular activities and fun. "
    "IMPORTANT RULES: You are allowed to disagree with others. "
    "Prefer lifestyle and experience over pure academics if needed. "
    "If another agent made a weak argument, point it out. "
    "Respond to the discussion so far and give your opinion on the best college. Keep the output under 80 words."
  ),
  "final": (
    "You are a final decision-maker.\n\n"
    "Your job:\n"
    "- Analyze the full discussion between teacher, parent, and friend\n"
    "- Identify the most agreed-upon or best overall college\n\n"
    "Rules:\n"
    "- Choose ONLY ONE college\n"
    "- Consider trade-offs (placements, fees, campus life, admission chances)\n"
    "- Prefer realistic options (not impossible cutoffs)\n\n"
    "Output format:\n"
    "Final Answer: <college name>\n"
    "Reason: <short explanation>\n"
    "Confidence: <Low / Medium / High>\n\n"
    "Keep it under 100 words."
  ),
}

async def _stream_agent(role: str, messages: list) -> AIMessage:
  """Stream tokens from the LLM for one agent role and return the completed AIMessage."""
  full_content = ""
  print(f"\n---- {role.upper()} (streaming) ----\n", flush=True)
  async for chunk in groq_llm.astream([
    {"role": "system", "content": SYSTEM_PROMPTS[role]},
    *messages,
  ]):
    if chunk.content:
      print(chunk.content, end="", flush=True)
      full_content += chunk.content
  print()
  return AIMessage(content=full_content, name=role)


async def _stream_final(messages: list) -> str:
  """Stream the final decision agent and return the raw text."""
  full_content = ""
  print("\n---- FINAL DECISION (streaming) ----\n", flush=True)
  async for chunk in groq_llm.astream([
    {"role": "system", "content": SYSTEM_PROMPTS["final"]},
    *messages,
  ]):
    if chunk.content:
      print(chunk.content, end="", flush=True)
      full_content += chunk.content
  print()
  return full_content


@router.post("/discussion")
async def llm_discussion(colleges_list: str):
  """
  Two-round sequential discussion streamed via SSE.
  Agents speak one at a time: teacher → parent → friend, repeated twice.
  Each agent sees everything said before it, so the conversation builds naturally.
  """
  from fastapi.responses import StreamingResponse

  async def event_generator():
    # ctx grows as each agent speaks — everyone hears what came before them
    ctx = [{"role": "user", "content": colleges_list}]

    for round_num in (1, 2):
      print(f"\n===== ROUND {round_num} (sequential SSE) =====")
      for role in ("teacher", "parent", "friend"):
        msg = await _stream_agent(role, ctx)
        ctx.append(msg)                                    # next agent sees this
        payload = json.dumps({"agent": role, "content": msg.content, "round": round_num})
        yield f"data: {payload}\n\n"

    # ── Final decision ──────────────────────────────────────────────────────
    final_raw = await _stream_final(ctx)

    college_match = re.search(r"Final Answer[:\s]+(.+)",           final_raw, re.IGNORECASE)
    reason_match  = re.search(r"Reason[:\s]+(.+)",                 final_raw, re.IGNORECASE)
    conf_match    = re.search(r"Confidence[:\s]+(Low|Medium|High)", final_raw, re.IGNORECASE)

    final_decision = {
      "college":    college_match.group(1).strip()   if college_match else "See discussion",
      "reason":     reason_match.group(1).strip()    if reason_match  else final_raw.strip(),
      "confidence": conf_match.group(1).capitalize() if conf_match    else "Medium",
    }
    yield f"data: {json.dumps({'agent': 'final', 'final': final_decision})}\n\n"
    yield "data: [DONE]\n\n"

  return StreamingResponse(event_generator(), media_type="text/event-stream")
