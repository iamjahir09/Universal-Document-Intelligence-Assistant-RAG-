import { useEffect, useState } from "react"

import Sidebar from "./components/Sidebar"
import ChatArea from "./components/ChatArea"

import {
  uploadDocument,
  sendMessage,
  checkHealth
} from "./services/api"


function App() {

  const [documents, setDocuments] = useState([])

  const [messages, setMessages] = useState([])

  const [uploading, setUploading] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [connected, setConnected] =
    useState(false)

  const [sessionId] = useState(
    () => crypto.randomUUID()
  )


  useEffect(() => {

    const checkApi = async () => {

      try {

        await checkHealth()

        setConnected(true)

      } catch {

        setConnected(false)

      }

    }

    checkApi()

  }, [])


  const handleUpload = async (file) => {

    setUploading(true)

    try {

      const result =
        await uploadDocument(file)

      setDocuments((current) => [
        ...current,
        result.filename
      ])

    } finally {

      setUploading(false)

    }

  }


  const handleSend = async (query) => {

    const userMessage = {
      role: "user",
      content: query
    }

    setMessages((current) => [
      ...current,
      userMessage
    ])

    setLoading(true)

    try {

      const result = await sendMessage(
        query,
        sessionId
      )

      const assistantMessage = {
        role: "assistant",
        content: result.answer,
        sources: result.sources
      }

      setMessages((current) => [
        ...current,
        assistantMessage
      ])

    } catch (error) {

      const errorMessage = {
        role: "assistant",
        content:
          error.response?.data?.detail ||
          "Something went wrong while processing your question."
      }

      setMessages((current) => [
        ...current,
        errorMessage
      ])

    } finally {

      setLoading(false)

    }

  }


  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      <Sidebar
        documents={documents}
        onUpload={handleUpload}
        uploading={uploading}
        connected={connected}
      />

      <ChatArea
        messages={messages}
        onSend={handleSend}
        loading={loading}
      />

    </div>
  )
}


export default App