from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from core.rag import router as rag_router
from core.web_search import router as web_search_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello"}

app.include_router(rag_router)
app.include_router(web_search_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="[0.0.0.0]", port=8000)