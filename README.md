# DocuRAG - Universal Document Intelligence Assistant

> An AI-powered document intelligence assistant that lets you upload your documents and ask questions using natural language.

DocuRAG uses Retrieval-Augmented Generation (RAG) to retrieve relevant information from uploaded documents and generate grounded answers using an LLM.

## ✨ Features

- 📄 Upload PDF, DOCX, TXT, and CSV documents
- 🔎 Hybrid semantic + keyword retrieval
- 🧠 Local BGE embeddings
- 🎯 CrossEncoder reranking
- 💬 Conversational follow-up questions
- 🤗 Hugging Face LLM integration
- 🛡️ Context-grounded answers
- 📚 Source and page references
- 🆕 New Chat functionality
- 🖱️ Drag & drop document upload
- 💾 Persistent ChromaDB vector storage
- ⚡ Modern responsive React UI

## Architecture

```text
User
 │
 ▼
React Frontend
 │
 ▼
FastAPI Backend
 │
 ├── Document Ingestion
 │      ├── Load Document
 │      ├── Chunk Text
 │      ├── Generate Embeddings
 │      └── Store in ChromaDB
 │
 └── Query Pipeline
        ├── Question Rewriting
        ├── Hybrid Retrieval
        │      ├── Chroma MMR
        │      └── BM25
        ├── CrossEncoder Reranking
        ├── Context Construction
        └── Hugging Face LLM
                │
                ▼
          Grounded Answer
```
##  RAG Pipeline

```text
Document Upload
      ↓
Document Loading
      ↓
Text Chunking
      ↓
Embedding Generation
      ↓
ChromaDB Storage
      ↓
User Query
      ↓
Question Rewriting
      ↓
Hybrid Retrieval
      ↓
CrossEncoder Reranking
      ↓
Top Relevant Chunks
      ↓
Context Construction
      ↓
Hugging Face LLM
      ↓
Grounded Answer
      ↓
Sources
```
## 🔎 Retrieval System

DocuRAG uses a multi-stage retrieval pipeline that combines semantic search, keyword search, and neural reranking to improve the relevance of retrieved document context.

### Semantic Retrieval

DocuRAG uses the embedding model `BAAI/bge-small-en-v1.5`.

Semantic retrieval is performed using ChromaDB with MMR (Maximal Marginal Relevance) to retrieve relevant and diverse document chunks.

    User Query
         ↓
    BGE Embedding
         ↓
    ChromaDB MMR
         ↓
    Semantic Candidates

### Keyword Retrieval

DocuRAG uses BM25 for keyword-based retrieval.

BM25 is useful for exact technical terms, names, keywords, identifiers, and specific phrases.

    User Query
         ↓
       BM25
         ↓
    Keyword Candidates

### Hybrid Retrieval

Semantic and keyword retrieval are combined using weighted ensemble retrieval.

    Semantic Retrieval → 70%
    BM25 Retrieval     → 30%
              ↓
       Hybrid Results

### Neural Reranking

The retrieved candidates are reranked using the CrossEncoder model:

`cross-encoder/ms-marco-MiniLM-L-6-v2`

    Hybrid Results
          ↓
      CrossEncoder
          ↓
    Relevance Ranking
          ↓
       Top 3 Chunks

This multi-stage retrieval strategy helps DocuRAG select the most relevant information before passing the final context to the LLM.

## 🛡️ Grounded Generation

DocuRAG is designed to generate answers using only the information retrieved from the uploaded documents.

The LLM is instructed to:

- Use only information supported by the retrieved context
- Avoid outside knowledge
- Avoid unsupported assumptions
- Avoid inventing information
- Avoid hallucinating document-specific facts

The generation flow is:

    Retrieved Chunks
          ↓
    Context Construction
          ↓
    Grounded Prompt
          ↓
    Hugging Face LLM
          ↓
    Document-Based Answer

If the retrieved context does not contain enough information to answer the question, DocuRAG returns the following fallback response:

    I don't have enough information in the provided context.

This approach keeps the generated answers focused on the information available in the user's uploaded documents.

## 💬 Conversational Retrieval

DocuRAG supports conversational question answering by using the previous chat history to understand follow-up questions.

For example:

    User:
    What is virtual memory?

    Assistant:
    Virtual memory is ...

    User:
    How does it work?

The second question depends on the previous conversation, so DocuRAG rewrites it into a standalone question before performing retrieval.

    Conversation History
            +
    Current Question
            ↓
    Question Rewriting
            ↓
    Standalone Question
            ↓
    Hybrid Retrieval
            ↓
    Reranking
            ↓
    Grounded Answer

This allows users to ask natural follow-up questions without repeating the complete context in every message.

Simple conversational messages such as `hi`, `hello`, `thanks`, and `how are you` are handled separately and do not trigger the document retrieval pipeline.

## 🧠 Embedding Model

DocuRAG uses `BAAI/bge-small-en-v1.5` to convert document chunks and user queries into numerical vector representations.

These embeddings allow the system to compare the semantic similarity between a user's question and the content stored in the vector database.

    Document Text
         ↓
    Text Chunk
         ↓
    BGE Embedding Model
         ↓
    Vector Representation
         ↓
       ChromaDB

For a user query, the same embedding model converts the question into a vector:

    User Query
         ↓
    BGE Embedding Model
         ↓
    Query Vector
         ↓
    Similarity Search

Embeddings are generated locally using CPU and normalized before being stored and searched.

This enables semantic retrieval, allowing DocuRAG to find relevant information even when the wording of the query does not exactly match the wording in the document.

## 🗄️ Vector Database

DocuRAG uses ChromaDB as its persistent vector database for storing document embeddings and their associated content.

During document ingestion, each document is split into smaller chunks and converted into vector representations using the BGE embedding model.

    Document Chunks
          ↓
    BGE Embeddings
          ↓
       ChromaDB
          ↓
    Persistent Storage

ChromaDB stores the indexed document chunks so that they can be retrieved efficiently when the user asks a question.

The vector database is persisted locally, allowing previously indexed documents to remain available even after restarting the backend server.

The stored data is organized using a dedicated ChromaDB collection:

    docurag

This persistent storage prevents the system from needing to re-embed documents every time the application is restarted.

## 📄 Document Ingestion

DocuRAG supports multiple document formats and processes uploaded files through a unified ingestion pipeline.

Supported formats:

- PDF
- DOCX
- TXT
- CSV

The ingestion pipeline converts uploaded documents into searchable chunks before storing them in ChromaDB.

    Document Upload
          ↓
    File Type Detection
          ↓
    Document Loading
          ↓
    Text Extraction
          ↓
    Text Chunking
          ↓
    Chunk ID Generation
          ↓
    Embedding Generation
          ↓
    ChromaDB Storage

### Document Loaders

Different document formats use dedicated LangChain document loaders:

    PDF   → PyPDFLoader
    DOCX  → Docx2txtLoader
    TXT   → TextLoader
    CSV   → CSVLoader

### Text Chunking

Extracted document content is divided into smaller chunks using `RecursiveCharacterTextSplitter`.

Current configuration:

    Chunk Size    → 500 characters
    Chunk Overlap → 50 characters

Chunking makes long documents easier to retrieve and provides the LLM with focused and relevant context.

### Duplicate Prevention

Each chunk receives a deterministic ID generated from its source filename and content.

This allows DocuRAG to identify existing chunks and avoid storing duplicate content during repeated uploads.

### Persistent Processing

Processed chunks are stored locally in:

    backend/notebook/processed/chunks.pkl

The corresponding vector embeddings are stored in the persistent ChromaDB directory:

    backend/notebook/chromadb/

This provides a persistent ingestion layer for the document retrieval system.

## 🤗 Hugging Face LLM Integration

DocuRAG uses Hugging Face for text generation and does not depend on a fixed LLM model.

The backend dynamically discovers currently available text-to-text models through the Hugging Face inference endpoint.

    Hugging Face API
          ↓
    Available Models
          ↓
    Live Provider Detection
          ↓
    Provider Selection
          ↓
    LLM Inference

### Dynamic Model Selection

Instead of hardcoding a specific model, DocuRAG:

- Fetches available Hugging Face models
- Filters for text-to-text models
- Checks for live inference providers
- Selects providers based on available throughput
- Uses the Hugging Face `InferenceClient`
- Retries with other available models if inference fails

This makes the LLM layer more flexible and reduces dependency on a single model or provider.

### Generation

The final retrieved context is passed to the selected Hugging Face model along with the user's question.

    Retrieved Context
          +
    User Question
          ↓
    Grounded Prompt
          ↓
    Hugging Face Inference
          ↓
    Generated Answer

The LLM is configured for deterministic document question answering using a low-temperature generation setting.

## ⚙️ Backend Architecture

The backend of DocuRAG is built using FastAPI and provides the API layer between the React frontend and the RAG pipeline.

The backend is responsible for:

- Handling document uploads
- Processing and indexing documents
- Managing the RAG retrieval pipeline
- Maintaining conversation history
- Generating document-grounded answers
- Returning source references to the frontend

### API Structure

    React Frontend
          ↓
       FastAPI
          ↓
    ┌───────────────┐
    │   /upload     │
    │   /chat       │
    │   /health     │
    └───────────────┘
          ↓
    RAG Pipeline

### Upload Endpoint

The `/upload` endpoint accepts supported documents and sends them through the ingestion pipeline.

    File Upload
        ↓
    Validation
        ↓
    Document Ingestion
        ↓
    Chunking
        ↓
    Embeddings
        ↓
    ChromaDB

### Chat Endpoint

The `/chat` endpoint receives the user's question and session ID.

    User Question
          ↓
       /chat
          ↓
    Chat History
          ↓
    RAG Engine
          ↓
    Retrieved Context
          ↓
    Hugging Face LLM
          ↓
    Answer + Sources

### Health Endpoint

The `/health` endpoint provides a simple way for the frontend to check whether the backend API is available.

    Frontend
       ↓
    /health
       ↓
    Backend Status
       ↓
    Connected / Disconnected

FastAPI also handles CORS configuration so that the React development server can communicate with the backend during local development.

## 🖥️ Frontend Architecture

The DocuRAG frontend is built using React and provides the user interface for document upload, chat interaction, source display, and application status.

The frontend is responsible for:

- Uploading documents
- Supporting drag-and-drop uploads
- Sending user questions to the backend
- Displaying AI-generated answers
- Displaying document sources and page references
- Managing chat sessions
- Creating new chats
- Showing upload and processing states
- Monitoring backend connectivity

### Frontend Structure

    React Application
          ↓
    ┌─────────────────────────┐
    │        Sidebar          │
    │                         │
    │  Documents              │
    │  Upload                 │
    │  New Chat               │
    │  API Status             │
    └─────────────────────────┘
          │
          ↓
    ┌─────────────────────────┐
    │        Chat Area         │
    │                         │
    │  Messages               │
    │  AI Responses           │
    │  Sources                │
    │  Chat Input             │
    └─────────────────────────┘
          │
          ↓
       FastAPI
          │
          ↓
      RAG Pipeline

### Main Components

    App.jsx
       ↓
    Application State
       ↓
    ├── Sidebar
    └── ChatArea
           ├── MessageBubble
           └── ChatInput

### API Communication

The frontend communicates with the FastAPI backend using HTTP requests.

Document uploads are sent using `multipart/form-data`, while chat requests use JSON payloads.

    Document
       ↓
    React Frontend
       ↓
    POST /upload
       ↓
    FastAPI Backend

    User Question
       ↓
    React Frontend
       ↓
    POST /chat
       ↓
    FastAPI Backend
       ↓
    Answer + Sources

### Chat Sessions

Each chat is associated with a unique session ID.

The session ID allows the backend to maintain conversation history for follow-up questions.

    New Chat
       ↓
    Generate Session ID
       ↓
    User Questions
       ↓
    Same Session
       ↓
    Conversation History

## 📁 Project Structure

The project is organized into separate backend and frontend layers to keep the application modular and maintainable.

    DocuRAG Universal Document Intelligence Assistant/
    │
    ├── backend/
    │   ├── api/
    │   │   ├── main.py
    │   │   ├── ingestion.py
    │   │   └── retrieval.py
    │   │
    │   └── notebook/
    │       ├── app/
    │       │   ├── ingestion.ipynb
    │       │   └── retrival.ipynb
    │       │
    │       ├── chromadb/
    │       │   └── chroma.sqlite3
    │       │
    │       ├── data/
    │       │   └── uploads/
    │       │
    │       └── processed/
    │           └── chunks.pkl
    │
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── ChatArea.jsx
    │   │   │   ├── ChatInput.jsx
    │   │   │   └── MessageBubble.jsx
    │   │   │
    │   │   ├── services/
    │   │   │   └── api.js
    │   │   │
    │   │   ├── App.jsx
    │   │   ├── main.jsx
    │   │   └── index.css
    │   │
    │   ├── public/
    │   ├── index.html
    │   ├── package.json
    │   └── vite.config.js
    │
    ├── .env
    ├── .gitignore
    ├── pyproject.toml
    └── requirements.txt

### Backend

The backend contains the FastAPI application and the complete RAG pipeline.

`main.py` handles API endpoints and application-level request processing.

`ingestion.py` handles document loading, chunking, embeddings, and vector database storage.

`retrieval.py` handles hybrid retrieval, reranking, question rewriting, and LLM-based answer generation.

### Frontend

The frontend contains the React user interface.

`App.jsx` manages application state, chat sessions, document uploads, and communication with the backend.

`Sidebar.jsx` provides document management, upload controls, new chat functionality, and backend status.

`ChatArea.jsx` manages the main conversation interface and document drag-and-drop functionality.

`ChatInput.jsx` handles user questions and document attachments.

`MessageBubble.jsx` displays user messages, AI responses, and document sources.

### Data Storage

Uploaded documents are stored in:

    backend/notebook/data/uploads/

Processed document chunks are stored in:

    backend/notebook/processed/chunks.pkl

Vector embeddings and metadata are stored persistently in:

    backend/notebook/chromadb/

This separation keeps application code, uploaded data, processed chunks, and vector storage organized independently.

## 🧰 Technology Stack

DocuRAG is built using a combination of modern AI, backend, retrieval, vector database, and frontend technologies.

### Programming Language

- **Python** - Core backend and RAG pipeline implementation
- **JavaScript** - Frontend application development
- **JSX** - React component development

### AI & Machine Learning

- **LangChain** - RAG pipeline orchestration
- **Hugging Face** - LLM inference and model integration
- **Sentence Transformers** - Neural reranking
- **BAAI/bge-small-en-v1.5** - Document and query embeddings
- **CrossEncoder** - Retrieval result reranking

### Retrieval

- **ChromaDB** - Vector storage and semantic retrieval
- **BM25** - Keyword-based retrieval
- **MMR** - Diverse semantic retrieval
- **EnsembleRetriever** - Hybrid retrieval
- **CrossEncoder Reranking** - Final relevance ranking

### Backend

- **FastAPI** - REST API framework
- **Uvicorn** - ASGI server
- **Pydantic** - Request validation
- **python-multipart** - Multipart file upload handling

### Document Processing

- **PyPDFLoader** - PDF processing
- **Docx2txtLoader** - DOCX processing
- **TextLoader** - TXT processing
- **CSVLoader** - CSV processing
- **RecursiveCharacterTextSplitter** - Document chunking

### Frontend

- **React** - User interface
- **Vite** - Frontend build tool and development server
- **Tailwind CSS** - UI styling

### Storage

- **ChromaDB** - Persistent vector database
- **Pickle** - Processed chunk persistence
- **Local File Storage** - Uploaded document storage

### Development Tools

- **uv** - Python dependency and environment management
- **npm** - JavaScript package management
- **Git** - Version control
- **GitHub** - Source code hosting

## 🚀 Installation & Setup

Follow the steps below to run DocuRAG locally.

### 1. Clone the Repository

Clone the project from GitHub and move into the project directory.

    git clone <your-repository-url>
    cd "DocuRAG Universal Document Intelligence Assistant"

### 2. Create Python Environment

DocuRAG uses `uv` for Python environment and dependency management.

    uv venv

Activate the virtual environment on Windows:

    .venv\Scripts\activate

### 3. Install Backend Dependencies

Install the required Python dependencies using `uv`.

    uv sync

If dependencies are managed through `requirements.txt`, they can also be installed using:

    uv pip install -r requirements.txt

### 4. Configure Environment Variables

Create a `.env` file in the project root.

    HF_TOKEN=your_huggingface_token
    CHROMA_COLLECTION_NAME=docurag

The Hugging Face token is required for LLM inference through the Hugging Face API.

### 5. Start the Backend

Run the FastAPI backend from the project root:

    uv run uvicorn backend.api.main:app --reload

The backend will be available at:

    http://127.0.0.1:8000

### 6. Install Frontend Dependencies

Open another terminal and move into the frontend directory.

    cd frontend
    npm install

### 7. Start the Frontend

Start the Vite development server:

    npm run dev

The frontend will be available at:

    http://localhost:5173

### 8. Open the Application

Open the frontend URL in your browser:

    http://localhost:5173

Upload a supported document and start asking questions about its content.

### Requirements

Before running the project, make sure the following are installed:

- Python 3.10+
- Node.js
- npm
- uv
- Git
- A Hugging Face account and API token

## 🔐 Environment Variables

DocuRAG uses environment variables to keep configuration values and API credentials separate from the application source code.

Create a `.env` file in the project root:

    HF_TOKEN=your_huggingface_token
    CHROMA_COLLECTION_NAME=docurag

### Hugging Face Token

`HF_TOKEN` is used to authenticate requests to Hugging Face for LLM inference.

Never commit your actual Hugging Face token to GitHub.

The `.env` file should be included in `.gitignore`:

    .env

### ChromaDB Collection

`CHROMA_COLLECTION_NAME` defines the ChromaDB collection used by DocuRAG.

The default collection name is:

    docurag

Using an environment variable makes the collection name configurable without modifying the backend source code.

### Example

    .env
    ├── HF_TOKEN
    └── CHROMA_COLLECTION_NAME

The application loads these values at runtime using `python-dotenv`.

## 🔒 Security & Best Practices

DocuRAG follows several practices to keep the application secure, reliable, and maintainable.

### API Credentials

Hugging Face credentials are stored in environment variables instead of being hardcoded in the source code.

    HF_TOKEN=your_huggingface_token

The `.env` file should never be committed to the repository.

### Git Ignore

Sensitive files and generated application data should be excluded from version control.

    .env
    .venv/
    __pycache__/
    *.pyc

### File Validation

The backend validates uploaded file extensions before processing them.

Supported file types:

    .pdf
    .docx
    .txt
    .csv

Unsupported file types are rejected by the API.

### Safe File Storage

Uploaded filenames are sanitized using `Path(file.filename).name`.

A unique UUID is also added to the stored filename to reduce filename collisions.

    UUID + Original Filename
              ↓
    Unique Stored Filename

### Duplicate Prevention

Document chunks receive deterministic IDs based on their source and content.

This prevents the same chunk from being repeatedly inserted into the vector database.

### Grounded Generation

The LLM is explicitly instructed to answer document questions only from retrieved context.

If the available context does not support an answer, DocuRAG returns:

    I don't have enough information in the provided context.

This reduces unsupported document-specific answers and helps keep the system grounded.

## 🧪 Testing the Application

After starting both the backend and frontend, the main functionality of DocuRAG can be tested through the web interface.

### Backend Health Check

Verify that the FastAPI backend is running by opening:

    http://127.0.0.1:8000/health

A healthy backend returns:

    {
        "status": "healthy"
    }

### Document Upload Test

Upload a supported document through the frontend.

    PDF
    DOCX
    TXT
    CSV

The document should be:

    Uploaded
       ↓
    Processed
       ↓
    Chunked
       ↓
    Embedded
       ↓
    Stored in ChromaDB

The frontend should display a successful document indexing state after processing is complete.

### Question Answering Test

After uploading a document, ask a question related to its content.

    Document
       ↓
    User Question
       ↓
    Retrieval
       ↓
    Reranking
       ↓
    LLM
       ↓
    Answer + Sources

The response should contain information supported by the uploaded document.

### Follow-up Question Test

Test conversational retrieval by asking a related follow-up question.

    Question 1
        ↓
    Answer 1
        ↓
    Follow-up Question
        ↓
    Question Rewriting
        ↓
    Retrieval
        ↓
    Answer 2

The system should use the conversation history to resolve references in follow-up questions.

### Out-of-Context Test

Ask a question whose answer is not present in the uploaded document.

DocuRAG should return:

    I don't have enough information in the provided context.

This verifies that the system does not rely on unsupported information for document-specific questions.

### General Conversation Test

Test common conversational messages such as:

    hi
    hello
    thanks
    how are you?

These messages should be handled separately from the document retrieval pipeline.

### Persistence Test

Restart the backend after indexing a document.

The persistent ChromaDB storage should allow the previously indexed document vectors to remain available without requiring the document to be embedded again.

## 📊 Performance & Optimization

DocuRAG uses multiple retrieval and processing techniques to improve answer quality while keeping the RAG pipeline efficient.

### Retrieval Optimization

The retrieval pipeline uses MMR to balance relevance and diversity when selecting semantic candidates.

    ChromaDB
        ↓
    MMR Retrieval
        ↓
    Relevant + Diverse Candidates

BM25 is used alongside semantic retrieval to improve performance for exact keyword and phrase matching.

    Semantic Search → 70%
    BM25 Search     → 30%
            ↓
     Hybrid Retrieval

### Candidate Reranking

Instead of directly passing all retrieved documents to the LLM, DocuRAG uses a CrossEncoder to rerank the retrieved candidates.

    Hybrid Candidates
          ↓
      CrossEncoder
          ↓
    Relevance Scores
          ↓
       Top 3 Chunks
          ↓
         LLM

This reduces the amount of irrelevant information passed to the generation model.

### Local Embeddings

The `BAAI/bge-small-en-v1.5` embedding model runs locally using CPU.

This keeps embedding generation independent of an external embedding API.

### Persistent Storage

ChromaDB stores vectors persistently on disk.

Previously indexed documents therefore do not need to be re-embedded after every backend restart.

### Duplicate Prevention

Deterministic chunk IDs prevent duplicate chunks from being inserted into ChromaDB when the same document content is processed again.

### Lightweight Conversation Handling

Common conversational messages such as greetings and acknowledgements are handled without running the complete document retrieval pipeline.

This avoids unnecessary retrieval and LLM processing for simple interactions.

## 🧩 Key Design Decisions

DocuRAG is designed as a modular RAG system where each stage has a specific responsibility.

### Modular RAG Pipeline

The system separates document ingestion, retrieval, reranking, and generation into independent components.

    Document Ingestion
           ↓
    Vector Storage
           ↓
    Retrieval
           ↓
    Reranking
           ↓
    Generation

This makes individual components easier to maintain, test, and improve.

### Hybrid Retrieval

Using both semantic and keyword retrieval provides complementary search capabilities.

Semantic retrieval is useful when the query and document use different wording but have similar meaning.

BM25 is useful when exact terms, technical keywords, names, or phrases are important.

### Reranking Before Generation

The CrossEncoder is applied after initial retrieval rather than searching the entire document collection directly.

    Large Document Collection
            ↓
      Initial Retrieval
            ↓
       Candidate Chunks
            ↓
       CrossEncoder
            ↓
        Top 3 Chunks
            ↓
           LLM

This allows the system to focus the generation step on the most relevant retrieved content.

### Persistent Architecture

Document files, processed chunks, and vector embeddings are stored separately.

    Uploaded Files
          ↓
    data/uploads/

    Processed Chunks
          ↓
    processed/chunks.pkl

    Vector Database
          ↓
    chromadb/

This separation makes the storage layer easier to manage and maintain.

### Model Flexibility

The LLM layer uses Hugging Face model discovery instead of depending on one hardcoded generation model.

This allows DocuRAG to work with currently available compatible Hugging Face inference models and providers.

### Grounded Answers

The generation layer is intentionally constrained to retrieved document context.

    User Question
          ↓
      Retrieval
          ↓
      Reranking
          ↓
    Relevant Context
          ↓
    Grounded Generation

This design prioritizes document relevance and reduces unsupported answers.

## 📌 Limitations

Although DocuRAG provides a complete document question-answering workflow, the current implementation has some limitations.

### Document Formats

The current version supports:

    PDF
    DOCX
    TXT
    CSV

Other document formats are not currently processed by the ingestion pipeline.

### Local Embedding Performance

The embedding model runs locally on CPU.

For large document collections, embedding generation and retrieval may take longer compared with systems using GPU acceleration.

### LLM Availability

LLM generation depends on currently available Hugging Face inference models and providers.

If compatible live inference providers are unavailable, document question answering may fail until a suitable provider becomes available.

### Runtime Chat History

Chat history is currently maintained in backend memory.

    Backend Restart
          ↓
    Runtime Chat History Cleared

Therefore, conversations are not permanently stored across backend restarts.

### Retrieval Dependency

Document-specific answers depend on the quality of the retrieved chunks.

If relevant information is not retrieved, the system may return:

    I don't have enough information in the provided context.

### Large Documents

Very large document collections may require additional optimization such as:

- Metadata filtering
- Better chunking strategies
- More advanced indexing
- Persistent conversation storage
- Background document processing
- Scalable vector databases

These limitations provide opportunities for future improvements and further experimentation with retrieval and generation techniques.

##

Built with a focus on practical RAG engineering, document intelligence, and modern AI application development.

### Project

**DocuRAG - Universal Document Intelligence Assistant**

### Core Focus

    Document Intelligence
          ↓
    Retrieval-Augmented Generation
          ↓
    Hybrid Search
          ↓
    Neural Reranking
          ↓
    Grounded Generation

The project demonstrates how modern retrieval techniques can be combined with LLMs to build a practical document question-answering system.

### Repository

The complete source code, project documentation, and implementation are available in this GitHub repository.

If you found the project useful, consider giving the repository a ⭐ star and exploring the implementation.

## ⭐ Conclusion

DocuRAG demonstrates a complete end-to-end Retrieval-Augmented Generation system for interacting with user-provided documents through natural language.

The project combines:

- Multi-format document ingestion
- Recursive text chunking
- Local BGE embeddings
- Persistent ChromaDB storage
- Hybrid semantic and keyword retrieval
- CrossEncoder reranking
- Conversational question rewriting
- Hugging Face LLM inference
- Context-grounded answer generation
- Source and page references
- React-based document chat interface

The complete workflow can be summarized as:

    Upload Document
          ↓
    Extract & Chunk
          ↓
    Generate Embeddings
          ↓
       ChromaDB
          ↓
    User Question
          ↓
    Question Rewriting
          ↓
    Hybrid Retrieval
          ↓
    CrossEncoder Reranking
          ↓
    Relevant Context
          ↓
    Hugging Face LLM
          ↓
    Grounded Answer
          ↓
    Sources

DocuRAG serves as a practical implementation of modern RAG architecture and provides a foundation for building more advanced document intelligence applications.

##

This project is intended for educational, experimental, and portfolio purposes.

You are free to explore the source code, understand the implementation, and extend the project for your own learning and development.

If you use or modify this project, please consider giving appropriate credit to the original repository.

---

## 🙌 Acknowledgements

DocuRAG is built using several open-source technologies and models from the AI and developer ecosystem.

Special thanks to the projects and communities behind:

- LangChain
- Hugging Face
- ChromaDB
- Sentence Transformers
- FastAPI
- React
- Vite
- Tailwind CSS

These tools make it possible to build and experiment with modern Retrieval-Augmented Generation applications.

---

## ⭐ Support

If you found DocuRAG useful or interesting:

- ⭐ Star the repository
- 🍴 Fork the project
- 🐛 Report issues
- 💡 Suggest improvements
- 🚀 Build your own extensions

Thank you for checking out **DocuRAG - Universal Document Intelligence Assistant**!
