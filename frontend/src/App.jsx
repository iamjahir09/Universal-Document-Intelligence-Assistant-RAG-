import { useEffect, useState } from "react"
import Sidebar from "./components/Sidebar"
import ChatArea from "./components/ChatArea"

const API_URL = "http://127.0.0.1:8000"

function App() {
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatTitle, setChatTitle] = useState("New Chat")
  const [sessionId, setSessionId] = useState(() =>
    crypto.randomUUID()
  )

  const toggleSidebar = () => {
    setSidebarOpen(
      (current) => !current
    )
  }

  const handleNewChat = () => {
    if (loading) {
      return
    }

    setMessages([])
    setChatTitle("New Chat")
    setSessionId(
      crypto.randomUUID()
    )
  }

  useEffect(() => {
    const handleEsc = (event) => {
      if (
        event.key === "Escape" &&
        sidebarOpen
      ) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener(
      "keydown",
      handleEsc
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleEsc
      )
    }
  }, [sidebarOpen])

  useEffect(() => {
    document.title =
      chatTitle === "New Chat"
        ? "DocuRAG"
        : `${chatTitle} | DocuRAG`
  }, [chatTitle])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(
          `${API_URL}/health`
        )

        setConnected(response.ok)
      } catch {
        setConnected(false)
      }
    }

    checkHealth()

    const interval = setInterval(
      checkHealth,
      10000
    )

    return () => {
      clearInterval(interval)
    }
  }, [])

  const handleUpload = async (file) => {
    if (!file) {
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()

      formData.append(
        "file",
        file
      )

      const response = await fetch(
        `${API_URL}/upload`,
        {
          method: "POST",
          body: formData
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to upload document."
        )
      }

      setDocuments(
        (currentDocuments) => {
          if (
            currentDocuments.includes(
              data.filename
            )
          ) {
            return currentDocuments
          }

          return [
            ...currentDocuments,
            data.filename
          ]
        }
      )

      setConnected(true)

      return data
    } catch (error) {
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleUploadMultiple = async (
    files
  ) => {
    let lastError = null

    for (const file of files) {
      try {
        await handleUpload(file)
      } catch (error) {
        lastError = error
      }
    }

    if (lastError) {
      throw lastError
    }
  }

  const handleSend = async (query) => {
    if (
      !query.trim() ||
      loading ||
      uploading
    ) {
      return
    }

    const trimmedQuery = query.trim()

    if (messages.length === 0) {
      const title =
        trimmedQuery.length > 40
          ? `${trimmedQuery.slice(0, 40)}...`
          : trimmedQuery

      setChatTitle(title)
    }

    const userMessage = {
      role: "user",
      content: trimmedQuery
    }

    setMessages(
      (currentMessages) => [
        ...currentMessages,
        userMessage
      ]
    )

    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query: trimmedQuery,
            session_id: sessionId
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to get response."
        )
      }

      setMessages(
        (currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content: data.answer,
            sources: data.sources || []
          }
        ]
      )

      setConnected(true)
    } catch (error) {
      setMessages(
        (currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content:
              error.message ||
              "Something went wrong while processing your question.",
            sources: []
          }
        ]
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-[#070707]">
      <Sidebar
        documents={documents}
        connected={connected}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onUpload={handleUpload}
        onNewChat={handleNewChat}
        uploading={uploading}
        chatTitle={chatTitle}
      />

      <ChatArea
        messages={messages}
        onSend={handleSend}
        loading={loading}
        uploading={uploading}
        onUpload={handleUploadMultiple}
        documents={documents}
        onToggleSidebar={toggleSidebar}
      />
    </main>
  )
}

export default App