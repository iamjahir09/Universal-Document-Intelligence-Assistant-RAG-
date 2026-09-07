from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException
)

from pydantic import BaseModel

from .ingestion import (
    ingest_file,
    UPLOAD_DIR
)

from .retrieval import RAGEngine


app = FastAPI(
    title="DocuRAG API",
    description="Universal Document RAG Assistant API",
    version="1.0.0"
)


rag_engine = RAGEngine()

chat_histories = {}


class ChatRequest(BaseModel):

    query: str
    session_id: str = "default"


@app.get("/")
def root():

    return {
        "message": "DocuRAG API is running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.post("/upload")
def upload_file(
    file: UploadFile = File(...)
):

    allowed_extensions = {
        ".pdf",
        ".txt",
        ".csv",
        ".docx"
    }

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    extension = Path(
        file.filename
    ).suffix.lower()

    if extension not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: {extension}. "
                f"Allowed types: PDF, TXT, CSV, DOCX."
            )
        )

    safe_filename = Path(
        file.filename
    ).name

    stored_filename = (
        f"{uuid4().hex}_{safe_filename}"
    )

    file_path = (
        UPLOAD_DIR / stored_filename
    )

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        result = ingest_file(
            file_path
        )

        # Refresh retrieval so newly uploaded
        # documents become available to BM25.
        rag_engine.refresh()

        return {
            "message": (
                "File uploaded and indexed successfully."
            ),
            "filename": safe_filename,
            "documents": result["documents"],
            "chunks": result["chunks"],
            "new_chunks": result["new_chunks"]
        }

    except ValueError as error:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {str(error)}"
        )

    finally:

        file.file.close()


@app.post("/chat")
def chat(request: ChatRequest):

    query = request.query.strip()

    if not query:

        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty."
        )

    session_id = request.session_id

    if session_id not in chat_histories:
        chat_histories[session_id] = []

    try:

        result = rag_engine.ask(
            query=query,
            chat_history=chat_histories[session_id]
        )

        return {
            "session_id": session_id,
            "query": query,
            "standalone_query": (
                result["standalone_query"]
            ),
            "answer": result["answer"],
            "sources": result["sources"]
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"RAG pipeline failed: {str(error)}"
        )