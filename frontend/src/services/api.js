import axios from "axios"

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
})

export const uploadDocument = async (file) => {
  const formData = new FormData()

  formData.append("file", file)

  const response = await api.post(
    "/upload",
    formData
  )

  return response.data
}

export const sendMessage = async (
  query,
  sessionId
) => {
  const response = await api.post(
    "/chat",
    {
      query,
      session_id: sessionId,
    }
  )

  return response.data
}

export const checkHealth = async () => {
  const response = await api.get("/health")

  return response.data
}