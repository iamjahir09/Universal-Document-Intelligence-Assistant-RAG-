from pathlib import Path
import os
import pickle
import requests

from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.retrievers import BaseRetriever
from langchain_core.messages import HumanMessage, AIMessage

from langchain_community.retrievers import BM25Retriever

from langchain_classic.retrievers import EnsembleRetriever

from sentence_transformers import CrossEncoder

from huggingface_hub import InferenceClient


BASE_DIR = Path(__file__).resolve().parent.parent

PROCESSED_DIR = BASE_DIR / "notebook" / "processed"
CHROMA_DIR = BASE_DIR / "notebook" / "chromadb"

CHUNKS_FILE = PROCESSED_DIR / "chunks.pkl"


load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise ValueError(
        "HF_TOKEN not found in .env file"
    )


def load_retrieval_data():

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

    if CHUNKS_FILE.exists():

        with open(
            CHUNKS_FILE,
            "rb"
        ) as file:

            documents = pickle.load(file)

    else:

        documents = []

    return vectorstore, documents


def create_hybrid_retriever(
    vectorstore,
    documents
):

    semantic_retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 3,
            "fetch_k": 10
        }
    )

    if documents:

        keyword_retriever = (
            BM25Retriever
            .from_documents(
                documents=documents
            )
        )

        keyword_retriever.k = 3

        hybrid_retriever = EnsembleRetriever(
            retrievers=[
                semantic_retriever,
                keyword_retriever
            ],
            weights=[
                0.7,
                0.3
            ]
        )

        return hybrid_retriever

    return semantic_retriever


class RerankerRetriever(BaseRetriever):

    base_retriever: BaseRetriever
    reranker: CrossEncoder
    top_k: int = 3
    threshold: float = 0

    def _get_relevant_documents(
        self,
        query,
        *,
        run_manager=None
    ):

        candidates = self.base_retriever.invoke(
            query
        )

        if not candidates:
            return []

        pairs = [
            (
                query,
                document.page_content
            )
            for document in candidates
        ]

        scores = self.reranker.predict(
            pairs
        )

        ranked_results = sorted(
            zip(scores, candidates),
            key=lambda x: x[0],
            reverse=True
        )

        best_score = ranked_results[0][0]

        if best_score < self.threshold:
            return []

        return [
            document
            for score, document
            in ranked_results[:self.top_k]
        ]


def create_reranker_retriever(
    hybrid_retriever
):

    reranker = CrossEncoder(
        "cross-encoder/ms-marco-MiniLM-L-6-v2"
    )

    return RerankerRetriever(
        base_retriever=hybrid_retriever,
        reranker=reranker,
        top_k=3,
        threshold=0
    )


def get_available_models():

    response = requests.get(
        "https://router.huggingface.co/v1/models",
        headers={
            "Authorization": f"Bearer {HF_TOKEN}"
        },
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    models = data.get(
        "data",
        []
    )

    available_models = []

    for model in models:

        model_id = model.get(
            "id"
        )

        architecture = model.get(
            "architecture",
            {}
        )

        input_modalities = architecture.get(
            "input_modalities",
            []
        )

        output_modalities = architecture.get(
            "output_modalities",
            []
        )

        providers = model.get(
            "providers",
            []
        )

        live_providers = [
            provider
            for provider in providers
            if provider.get("status") == "live"
        ]

        if not model_id:
            continue

        if "text" not in input_modalities:
            continue

        if "text" not in output_modalities:
            continue

        if not live_providers:
            continue

        best_provider = max(
            live_providers,
            key=lambda provider: (
                provider.get(
                    "throughput",
                    0
                )
            )
        )

        available_models.append(
            {
                "id": model_id,
                "provider": best_provider.get(
                    "provider"
                ),
                "throughput": best_provider.get(
                    "throughput",
                    0
                ),
                "context_length": best_provider.get(
                    "context_length",
                    0
                )
            }
        )

    available_models.sort(
        key=lambda model: (
            model["throughput"],
            model["context_length"]
        ),
        reverse=True
    )

    return available_models


def create_llm():

    models = get_available_models()

    if not models:

        raise RuntimeError(
            "No live Hugging Face text-to-text "
            "models are currently available."
        )

    client = InferenceClient(
        token=HF_TOKEN,
        provider="auto"
    )

    return {
        "client": client,
        "models": models
    }


def call_llm(
    llm,
    messages
):

    client = llm["client"]
    models = llm["models"]

    last_error = None

    for model in models:

        try:

            response = (
                client.chat.completions.create(
                    model=model["id"],
                    messages=messages,
                    max_tokens=512,
                    temperature=0
                )
            )

            content = (
                response
                .choices[0]
                .message
                .content
            )

            if content:

                return content.strip()

        except Exception as error:

            last_error = error

            continue

    fresh_models = get_available_models()

    for model in fresh_models:

        try:

            response = (
                client.chat.completions.create(
                    model=model["id"],
                    messages=messages,
                    max_tokens=512,
                    temperature=0
                )
            )

            content = (
                response
                .choices[0]
                .message
                .content
            )

            if content:

                return content.strip()

        except Exception as error:

            last_error = error

            continue

    raise RuntimeError(
        "All available Hugging Face models failed. "
        f"Last error: {last_error}"
    )


rewrite_prompt = ChatPromptTemplate.from_template(
    """
You are a question rewriting assistant for a
document RAG system.

Your task is to rewrite the user's current question
into a standalone question using the conversation history.

Rules:

1. Preserve the original meaning of the question.
2. Resolve references such as "it", "this", "they", "that".
3. If the current question is already standalone,
   return it unchanged.
4. Return ONLY the rewritten question.
5. Do not answer the question.

Conversation History:
{chat_history}

Current Question:
{question}

Standalone Question:
"""
)


def format_chat_history(chat_history):

    history = []

    for message in chat_history:

        if isinstance(
            message,
            HumanMessage
        ):

            history.append(
                f"User: {message.content}"
            )

        elif isinstance(
            message,
            AIMessage
        ):

            history.append(
                f"Assistant: {message.content}"
            )

    return "\n".join(history)


def rewrite_question(
    query,
    chat_history,
    llm
):

    history_text = format_chat_history(
        chat_history
    )

    formatted_prompt = rewrite_prompt.invoke(
        {
            "chat_history": history_text,
            "question": query
        }
    )

    messages = [
        {
            "role": "user",
            "content": formatted_prompt.to_string()
        }
    ]

    return call_llm(
        llm,
        messages
    )


def create_context(documents):

    return "\n\n".join(
        document.page_content
        for document in documents
    )


def extract_sources(documents):

    sources = []
    seen = set()

    for document in documents:

        source = document.metadata.get(
            "source"
        )

        if not source:
            continue

        filename = Path(
            source
        ).name

        if len(filename) > 33:

            prefix = filename[:32]

            if (
                all(
                    character in "0123456789abcdef"
                    for character in prefix.lower()
                )
                and filename[32] == "_"
            ):

                filename = filename[33:]

        page = document.metadata.get(
            "page"
        )

        if page is not None:

            source_label = (
                f"{filename} — Page {int(page) + 1}"
            )

        else:

            source_label = filename

        if source_label not in seen:

            seen.add(
                source_label
            )

            sources.append(
                source_label
            )

    return sources


answer_prompt = ChatPromptTemplate.from_template(
    """
You are a helpful document question-answering assistant.

Answer the user's question using ONLY the information
provided in the context below.

Rules:

1. Do not use outside knowledge.
2. Do not make up or assume information.
3. If the answer is not present in the context, say:

"I don't have enough information in the provided context."

4. Give a clear and concise answer.

Context:
{context}

Question:
{question}

Answer:
"""
)


def generate_answer(
    query,
    context,
    llm
):

    formatted_prompt = answer_prompt.invoke(
        {
            "context": context,
            "question": query
        }
    )

    messages = [
        {
            "role": "user",
            "content": formatted_prompt.to_string()
        }
    ]

    return call_llm(
        llm,
        messages
    )


class RAGEngine:

    def __init__(self):

        self.vectorstore, self.documents = (
            load_retrieval_data()
        )

        self.hybrid_retriever = (
            create_hybrid_retriever(
                self.vectorstore,
                self.documents
            )
        )

        self.reranker_retriever = (
            create_reranker_retriever(
                self.hybrid_retriever
            )
        )

        self.llm = create_llm()

    def refresh(self):

        self.vectorstore, self.documents = (
            load_retrieval_data()
        )

        self.hybrid_retriever = (
            create_hybrid_retriever(
                self.vectorstore,
                self.documents
            )
        )

        self.reranker_retriever = (
            create_reranker_retriever(
                self.hybrid_retriever
            )
        )

    def ask(
        self,
        query,
        chat_history
    ):

        standalone_query = rewrite_question(
            query,
            chat_history,
            self.llm
        )

        documents = (
            self.reranker_retriever
            .invoke(standalone_query)
        )

        if not documents:

            answer = (
                "I don't have enough information "
                "in the provided context."
            )

            chat_history.append(
                HumanMessage(
                    content=query
                )
            )

            chat_history.append(
                AIMessage(
                    content=answer
                )
            )

            return {
                "answer": answer,
                "sources": [],
                "standalone_query": standalone_query
            }

        context = create_context(
            documents
        )

        sources = extract_sources(
            documents
        )

        answer = generate_answer(
            standalone_query,
            context,
            self.llm
        )

        chat_history.append(
            HumanMessage(
                content=query
            )
        )

        chat_history.append(
            AIMessage(
                content=answer
            )
        )

        return {
            "answer": answer,
            "sources": sources,
            "standalone_query": standalone_query
        }