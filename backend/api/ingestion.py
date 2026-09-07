from pathlib import Path
import os
import pickle
import hashlib

from dotenv import load_dotenv

from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    CSVLoader,
    Docx2txtLoader
)

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = BASE_DIR / "notebook" / "data" / "uploads"
PROCESSED_DIR = BASE_DIR / "notebook" / "processed"
CHROMA_DIR = BASE_DIR / "notebook" / "chromadb"

CHUNKS_FILE = PROCESSED_DIR / "chunks.pkl"


UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file"
    )


def load_documents(file_path: Path):
    """
    Load documents based on file extension.
    """

    file_type = file_path.suffix.lower()

    if file_type == ".pdf":
        loader = PyPDFLoader(str(file_path))

    elif file_type == ".txt":
        loader = TextLoader(
            str(file_path),
            encoding="utf-8"
        )

    elif file_type == ".csv":
        loader = CSVLoader(str(file_path))

    elif file_type == ".docx":
        loader = Docx2txtLoader(str(file_path))

    else:
        raise ValueError(
            f"Unsupported file type: {file_type}"
        )

    return loader.load()


def chunk_documents(documents):
    """
    Split documents into smaller chunks.
    """

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_documents(documents)

    return chunks


def generate_chunk_id(chunk):
    """
    Generate deterministic ID for a chunk.
    """

    content = chunk.page_content
    source = chunk.metadata.get("source", "")

    return hashlib.md5(
        f"{source}:{content}".encode("utf-8")
    ).hexdigest()


def load_existing_chunks():
    """
    Load previously stored chunks.
    """

    if not CHUNKS_FILE.exists():
        return []

    with open(CHUNKS_FILE, "rb") as file:
        return pickle.load(file)


def save_chunks(chunks):
    """
    Append new chunks to existing chunk storage
    while avoiding duplicates.
    """

    existing_chunks = load_existing_chunks()

    existing_ids = {
        generate_chunk_id(chunk)
        for chunk in existing_chunks
    }

    new_chunks = []

    for chunk in chunks:

        chunk_id = generate_chunk_id(chunk)

        if chunk_id not in existing_ids:
            new_chunks.append(chunk)
            existing_ids.add(chunk_id)

    all_chunks = existing_chunks + new_chunks

    with open(CHUNKS_FILE, "wb") as file:
        pickle.dump(all_chunks, file)

    return new_chunks

def get_vectorstore():
    """
    Create or load the persistent Chroma vector store.
    """

    embedding = HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5",
        model_kwargs={
            "device": "cpu"
        },
        encode_kwargs={
            "normalize_embeddings": True
        }
    )
    CHROMA_COLLECTION_NAME = os.getenv(
        "CHROMA_COLLECTION_NAME",
        "docurag"
    )
    vectorstore = Chroma(
        collection_name=CHROMA_COLLECTION_NAME,
        embedding_function=embedding,
        persist_directory=str(CHROMA_DIR)
    )

    return vectorstore

def add_chunks_to_vectorstore(chunks):
    """
    Add new chunks to Chroma using deterministic IDs.
    """

    vectorstore = get_vectorstore()

    if not chunks:
        return vectorstore

    ids = [
        generate_chunk_id(chunk)
        for chunk in chunks
    ]

    existing = vectorstore.get(
        ids=ids,
        include=[]
    )

    existing_ids = set(existing["ids"])

    new_chunks = []
    new_ids = []

    for chunk, chunk_id in zip(chunks, ids):

        if chunk_id not in existing_ids:
            new_chunks.append(chunk)
            new_ids.append(chunk_id)

    if new_chunks:

        vectorstore.add_documents(
            documents=new_chunks,
            ids=new_ids
        )

    return vectorstore


def ingest_file(file_path: Path):
    """
    Complete ingestion pipeline:

    File
      ↓
    Load
      ↓
    Chunk
      ↓
    Save chunks
      ↓
    Embed
      ↓
    Chroma
    """

    documents = load_documents(file_path)

    chunks = chunk_documents(documents)

    new_chunks = save_chunks(chunks)

    vectorstore = add_chunks_to_vectorstore(
        new_chunks
    )

    return {
        "documents": len(documents),
        "chunks": len(chunks),
        "new_chunks": len(new_chunks),
        "vectorstore": vectorstore
    }