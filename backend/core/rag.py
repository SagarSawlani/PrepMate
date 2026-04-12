from fastapi import APIRouter, UploadFile, File
from typing import List
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
import fitz
from sentence_transformers import SentenceTransformer
import chromadb
from unstructured.partition.auto import partition
from unstructured.documents.elements import Title, NarrativeText
from langchain_text_splitters import RecursiveCharacterTextSplitter
from io import BytesIO
import os

load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
groq_client = Groq()

async def extract_content(file):
  content = await file.read()
  elements = partition(
    file=BytesIO(content),
    file_filename=file.filename,
    strategy="hi_res"
  )
  
  results = []
  for el in elements:
    results.append({
        "text": el.text,
        "type": el.category,
        "source": file.filename
    })

  return results

def chunking(content, file):
  chunks = []
  current_chunk = None

  for el in content:
      text = el["text"].strip()
      el_type = el["type"]

      if not text:
          continue

      # -------------------------
      # Title starts new section
      # -------------------------
      if el_type == "Title":
          if current_chunk:
              chunks.append(current_chunk)

          current_chunk = f"Title: {text}"

      # -------------------------
      # Normal text
      # -------------------------
      else:
          if current_chunk is None:
              current_chunk = f"{el_type}: {text}"
          else:
              current_chunk += "\n" + f"{el_type}: {text}"

  if current_chunk:
      chunks.append(current_chunk)

  # -------------------------
  # Text splitting
  # -------------------------
  splitter = RecursiveCharacterTextSplitter(
      chunk_size=500,
      chunk_overlap=100
  )

  final_chunks = []

  for chunk in chunks:
      splits = splitter.split_text(chunk)

      for s in splits:
          final_chunks.append(s)

  return final_chunks

def embed(chunks):
  embeddings = model.encode(chunks)
  return embeddings

def add_to_chroma(chunks, embeddings, exam, filename):
  collection = chroma_client.get_or_create_collection(name=exam)
  collection.add(
    embeddings=embeddings.tolist(),
    documents=chunks,
    metadatas=[{"source": filename} for _ in chunks],
    ids=[str(i) for i in range(len(chunks))]
  )

def store_memory(query, answer):
    memory_collection = chroma_client.get_or_create_collection(name="conversational_memory")

    text = f"User: {query}\nAssistant: {answer}"
    embedding = model.encode([text])[0]

    memory_collection.add(
        embeddings=[embedding.tolist()],
        documents=[text],
        metadatas=[{"type": "conversation"}],
        ids=[str(hash(text))]
    )

def retrieve_memory(query, k=5):
    memory_collection = chroma_client.get_or_create_collection(name="conversational_memory")

    query_embedding = model.encode([query])[0]

    results = memory_collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=k
    )
    print(f"Memory: {results['documents'][0]}")
    return "\n\n".join(results["documents"][0])

def llm_call(system_prompt, query, context):
  completion = groq_client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": f"Question: {query}"
        }
    ]
)
  return completion.choices[0].message.content

router = APIRouter()

@router.post("/upload-documents")
async def upload_documents(exam: str, file: UploadFile = File(...)):
  print(exam)
  content = await extract_content(file)
  chunks = chunking(content, file)
  embeddings = embed(chunks)
  add_to_chroma(chunks, embeddings, exam, file.filename)

  return {"message": "Processing Successful"}

class QueryRequest(BaseModel):
    query: str
    exam: str

@router.post("/query")
async def ask_question(request: QueryRequest):
  query = request.query
  exam = request.exam
  query_embedding = embed([query])[0]
  collection = chroma_client.get_collection(name=exam)
  results = collection.query(
    query_embeddings=query_embedding.tolist(),
    n_results=5
  )

  memory = retrieve_memory(query)
  context = "\n\n".join(results["documents"][0])
  print(f"Context: {context}")

  system_prompt = f"""
    You are a exam guide strategy maker and you assist users with their confusions regarding their exam preparation.
    Exam: {exam}
    Context: {context}
    
    Strictly refer to the context and answer the query.
    If the answer is not in the context, say "I don't know".
    Answer in the language in which the question is asked.
  """
  print(f"query: {query}")
  print(f"Context: {context}")
  print(f"Memory: {memory}")
  print(f"System Prompt: {system_prompt}")
  answer = llm_call(system_prompt, query, context)
  store_memory(query, answer)
  print(f"answer: {answer}")
  return {"answer": answer}