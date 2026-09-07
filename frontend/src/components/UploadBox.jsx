import { useRef, useState } from "react"

function UploadBox({
  onUpload,
  uploading
}) {
  const inputRef = useRef(null)

  const [error, setError] = useState("")

  const handleFileChange = async (
    event
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError("")

    try {
      await onUpload(file)
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Failed to upload document."
      )
    }

    event.target.value = ""
  }

  return (
    <div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.csv,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() =>
          inputRef.current?.click()
        }
        disabled={uploading}
        className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading
          ? "Uploading..."
          : "+ Upload Document"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

    </div>
  )
}

export default UploadBox