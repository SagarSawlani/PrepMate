# PrepMate — System Architecture

## RAG Pipeline (Know Your Exam)

```mermaid
flowchart TD
    A[👤 Student Query] --> B[Next.js Frontend]
    B -->|POST /query\nexam + query| C[FastAPI Backend]

    subgraph RAG ["RAG Pipeline"]
        C --> D[Embed Query\nall-MiniLM-L6-v2]
        D --> E[(ChromaDB\nVector Store)]
        E -->|Top-5 Chunks| F[Context Assembly]
        F --> G[LLM Call\nGroq API]
        G --> H[Answer]
    end

    subgraph Ingestion ["Document Ingestion — Admin Portal"]
        I[📄 PDF / DOCX / TXT] --> J[Extract Text\nunstructured / PyPDF]
        J --> K[Chunking\nFixed-size + Overlap]
        K --> L[Embed Chunks\nall-MiniLM-L6-v2]
        L --> E
    end

    H --> B
```

---

## Web Search Pipeline (Explore College)

```mermaid
flowchart TD
    A[👤 College Query] --> B[Next.js Frontend]

    B -->|POST /college-details| C[FastAPI Backend]
    B -->|POST /ask-college-questions| C

    subgraph WS ["Web-Grounded Search"]
        C --> D[Prompt Construction\nwith Schema Guidelines]
        D --> E[Gemini 2.5 Flash\nwith Google Search Grounding]
        E -->|Live Web Results| F[JSON Response\n+ Grounding Sources]
    end

    subgraph Memory ["Memory / Context"]
        C --> G[Retrieve Past Conversations\nChromaDB]
        G --> D
        F --> H[Store Response\nChromaDB]
    end

    subgraph Frontend ["Frontend Rendering"]
        F -->|__COLLEGE_CARD__ prefix| I{Response Type}
        I -->|Structured JSON| J[CollegeCard\nGeneric JSON Renderer]
        I -->|Plain Text| K[Markdown Text\nFollow-up Answers]
        J --> L[Sources Panel]
        K --> L
    end
```

---

## Tech Stack Summary

| Layer | RAG | Web Search |
|---|---|---|
| **LLM** | Groq (Llama / Mixtral) | Gemini 2.5 Flash |
| **Embedding** | all-MiniLM-L6-v2 | — |
| **Vector DB** | ChromaDB | ChromaDB (memory) |
| **Retrieval** | Top-5 semantic chunks | Google Search Grounding |
| **API** | FastAPI `/query` | FastAPI `/college-details` `/ask-college-questions` |
| **Frontend** | Chat Interface | CollegeCard + Sources |
