from pathlib import Path
import os
import pickle

from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.retrievers import BaseRetriever
from langchain_core.messages import HumanMessage, AIMessage

from langchain_community.retrievers import BM25Retriever

from langchain_classic.retrievers import (
    EnsembleRetriever,
    ContextualCompressionRetriever
)

from langchain_classic.retrievers.document_compressors import (
    LLMChainExtractor
)

from sentence_transformers import CrossEncoder

from langchain_groq import ChatGroq


BASE_DIR = Path(__file__).resolve().parent.parent

PROCESSED_DIR = BASE_DIR / "notebook" / "processed"
CHROMA_DIR = BASE_DIR / "notebook" / "chromadb"

CHUNKS_FILE = PROCESSED_DIR / "chunks.pkl"


load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError(
        "GOOGLE_API_KEY not found in .env file"
    )

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY not found in .env file"
    )


def load_retrieval_data():

    embedding = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        # google_api_key=GOOGLE_API_KEY
    )

    vectorstore = Chroma(
        collection_name="Neural",
        embedding_function=embedding,
        persist_directory=str(CHROMA_DIR)
    )

    if CHUNKS_FILE.exists():

        with open(CHUNKS_FILE, "rb") as file:
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


def create_llm():

    return ChatGroq(
        model="Qwen/Qwen3.6-27B",
        # groq_api_key=GROQ_API_KEY,
        temperature=0
    )


def create_compression_retriever(
    reranker_retriever,
    llm
):

    compressor = LLMChainExtractor.from_llm(
        llm
    )

    return ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=reranker_retriever
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

    response = llm.invoke(
        formatted_prompt
    )

    return response.content.strip()


def create_context(documents):

    return "\n\n".join(
        document.page_content
        for document in documents
    )


def extract_sources(documents):

    sources = []

    for document in documents:

        source = document.metadata.get(
            "source"
        )

        if source and source not in sources:
            sources.append(source)

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

    response = llm.invoke(
        formatted_prompt
    )

    return response.content.strip()


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

        self.compression_retriever = (
            create_compression_retriever(
                self.reranker_retriever,
                self.llm
            )
        )

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

        self.compression_retriever = (
            create_compression_retriever(
                self.reranker_retriever,
                self.llm
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
            self.compression_retriever
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