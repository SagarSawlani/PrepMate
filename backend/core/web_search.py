
from google import genai
from google.genai import types
from google.genai import errors as genai_errors
from core.rag import store_memory,retrieve_memory
from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import time

load_dotenv()

client = genai.Client()

router = APIRouter()

def web_search(prompt, max_retries=3, retry_delay=2):
  
  grounding_tool = types.Tool(
      google_search=types.GoogleSearch()
  )

  config = types.GenerateContentConfig(
      tools=[grounding_tool]
  )

  response = None
  for attempt in range(1, max_retries + 1):
    try:
      response = client.models.generate_content(
          model="models/gemini-2.5-flash",
          contents=prompt,
          config=config,
      )
      break  # success
    except (genai_errors.ServerError, genai_errors.ClientError) as e:
      status = getattr(e, 'status_code', None)
      if status in (429, 503) and attempt < max_retries:
        print(f"[Gemini] {status} error — retrying in {retry_delay}s (attempt {attempt}/{max_retries})...")
        time.sleep(retry_delay)
      else:
        raise

  result = response.text or ""

  # Extract grounding sources from metadata
  try:
    sources = []
    candidate = response.candidates[0] if response.candidates else None
    if candidate and candidate.grounding_metadata:
      chunks = candidate.grounding_metadata.grounding_chunks or []
      for chunk in chunks:
        if chunk.web and chunk.web.uri:
          title = chunk.web.title or chunk.web.uri
          sources.append(f"- [{title}]({chunk.web.uri})")
    if sources:
      result += "\n\n**Sources:**\n" + "\n".join(sources)
  except Exception as e:
    print(f"Could not extract grounding sources: {e}")

  print(result)
  return result

class CollegeDetailsRequest(BaseModel):
    college_name: str

class CollegeQuestionRequest(BaseModel):
    query: str
    college_name: str

@router.post('/college-details')
async def college_details(request: CollegeDetailsRequest):
  college_name = request.college_name
  prompt = f"""
    You are an expert in Indian higher education.
    Research and provide a comprehensive overview of: {college_name}

    Find the following details:
    1. Official Website URL
    2. Location (City, State, full address)
    3. Year of Establishment
    4. Affiliation (university, regulatory bodies like UGC/AICTE, autonomous status)
    5. Accreditation (NAAC grade, NBA status)
    6. Key Programs Offered (UG, PG, Doctoral — list each as an array of strings)
    7. Fee Structure (approximate fees for major programs)
    8. Admission Process (entrance exams for UG/PG/Doctoral, eligibility)
    9. Rankings (NIRF, India Today, etc.)
    10. Contact Information (phone, email for admissions, placements, alumni)
    11. Campus Life (campus size, extracurricular activities, student reviews)
    12. Hostel and Mess Facilities (availability, fees, facilities list, mess details)
    13. Placement Statistics (placement rate, highest/average/median package, students placed, companies visited, top recruiters list)

    Format the output as a clean JSON object.
    IMPORTANT rules for the JSON:
    - Each of the 13 topics above must be a SEPARATE top-level key (object or array).
    - All leaf values must be plain strings or arrays of strings — do NOT nest objects more than 2 levels deep.
    - For placement statistics, students_placed and companies_visited must be plain strings like "360" or "146", NOT objects.
    - Return ONLY the JSON — no markdown fences, no explanation text.
  """
  result = web_search(prompt)
  store_memory(prompt, result)
  return {"answer": result}


@router.post('/ask-college-questions')
async def college_questions(request: CollegeQuestionRequest):
  query = request.query
  college_name = request.college_name
  memory = retrieve_memory(query)
  system_prompt = f"""
    College Name: {college_name}
    Relevant Past Conversations: {memory}

    IMPORTANT: Answer in plain readable text. Do NOT return JSON or code blocks.
    Use bullet points or paragraphs where appropriate. Do not use markdown code fences.

    Search the web to find the answer to the query.
    Start with college's official website, then platforms like collegedunia, shiksha, careers360, etc.

    If the answer is not found, say "I don't know".
    Provide sources inline using [source name] format at the end.
    Query: """
  result = web_search(system_prompt + query)
  store_memory(query, result)
  return {"answer": result}
