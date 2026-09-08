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
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = BASE_DIR / "notebook" / "data" / "uploads"
PROCESSED_DIR = BASE_DIR / "notebook" / "processed"
CHROMA_DIR = BASE_DIR / "notebook" / "chromadb"

CHUNKS_FILE = PROCESSED_DIR / "chunks.pkl"


UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)


load_dotenv()


def load_documents(file_path: Path):

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

    documents = loader.load()

    for document in documents:
        document.metadata["source"] = file_path.name

    return documents


def chunk_documents(documents):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    return splitter.split_documents(documents)


def generate_chunk_id(chunk):

    content = chunk.page_content
    source = chunk.metadata.get(
        "source",
        ""
    )

    return hashlib.md5(
        f"{source}:{content}".encode(
            "utf-8"
        )
    ).hexdigest()


def load_existing_chunks():

    if not CHUNKS_FILE.exists():
        return []

    try:
        with open(
            CHUNKS_FILE,
            "rb"
        ) as file:

            data = pickle.load(file)

        if not isinstance(data, list):
            return []

        return data

    except Exception:
        return []


def save_chunks(chunks):

    existing_chunks = load_existing_chunks()

    existing_ids = {
        generate_chunk_id(chunk)
        for chunk in existing_chunks
    }

    new_chunks = []

    for chunk in chunks:

        chunk_id = generate_chunk_id(
            chunk
        )

        if chunk_id not in existing_ids:

            new_chunks.append(chunk)
            existing_ids.add(chunk_id)

    all_chunks = (
        existing_chunks +
        new_chunks
    )

    with open(
        CHUNKS_FILE,
        "wb"
    ) as file:

        pickle.dump(
            all_chunks,
            file
        )

    return new_chunks


def get_embedding():

    return HuggingFaceEmbeddings(
        model_name="BAAI/bge-small-en-v1.5",
        model_kwargs={
            "device": "cpu"
        },
        encode_kwargs={
            "normalize_embeddings": True
        }
    )


def get_vectorstore():

    collection_name = os.getenv(
        "CHROMA_COLLECTION_NAME",
        "docurag"
    )

    return Chroma(
        collection_name=collection_name,
        embedding_function=get_embedding(),
        persist_directory=str(
            CHROMA_DIR
        )
    )


def sync_vectorstore():

    vectorstore = get_vectorstore()

    chunks = load_existing_chunks()

    valid_ids = {
        generate_chunk_id(chunk)
        for chunk in chunks
    }

    existing_data = vectorstore.get(
        include=[]
    )

    existing_ids = set(
        existing_data.get(
            "ids",
            []
        )
    )

    stale_ids = (
        existing_ids -
        valid_ids
    )

    if stale_ids:

        vectorstore.delete(
            ids=list(stale_ids)
        )

    if chunks:

        chunk_map = {
            generate_chunk_id(chunk): chunk
            for chunk in chunks
        }

        missing_ids = (
            valid_ids -
            existing_ids
        )

        if missing_ids:

            missing_chunks = [
                chunk_map[chunk_id]
                for chunk_id in missing_ids
            ]

            vectorstore.add_documents(
                documents=missing_chunks,
                ids=list(missing_ids)
            )

    return vectorstore


def add_chunks_to_vectorstore(
    chunks
):

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

    existing_ids = set(
        existing.get(
            "ids",
            []
        )
    )

    new_chunks = []
    new_ids = []

    for chunk, chunk_id in zip(
        chunks,
        ids
    ):

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

    documents = load_documents(
        file_path
    )

    chunks = chunk_documents(
        documents
    )

    new_chunks = save_chunks(
        chunks
    )

    vectorstore = add_chunks_to_vectorstore(
        new_chunks
    )

    sync_vectorstore()

    return {
        "documents": len(documents),
        "chunks": len(chunks),
        "new_chunks": len(new_chunks),
        "vectorstore": vectorstore
    }