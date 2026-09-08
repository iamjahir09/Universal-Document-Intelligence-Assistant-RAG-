import { useRef, useState } from "react"

function UploadBox({
  onUpload,
  uploading
}) {
  const inputRef = useRef(null)

  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  const allowedExtensions = [
    ".pdf",
    ".txt",
    ".csv",
    ".docx"
  ]

  const isValidFile = (file) => {
    if (!file) {
      return false
    }

    return allowedExtensions.some(
      (extension) =>
        file.name
          .toLowerCase()
          .endsWith(extension)
    )
  }

  const uploadFile = async (file) => {
    if (!file) {
      return
    }

    setError("")

    if (!isValidFile(file)) {
      setError(
        "Unsupported file. Use PDF, DOCX, TXT or CSV."
      )
      return
    }

    try {
      await onUpload(file)
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Failed to upload document."
      )
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    await uploadFile(file)

    event.target.value = ""
  }

  const handleDrop = async (event) => {
    event.preventDefault()

    setIsDragging(false)

    if (uploading) {
      return
    }

    const file = event.dataTransfer.files?.[0]

    await uploadFile(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()

    if (!uploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event) => {
    if (
      event.currentTarget.contains(
        event.relatedTarget
      )
    ) {
      return
    }

    setIsDragging(false)
  }

  const handleClick = () => {
    if (!uploading) {
      inputRef.current?.click()
    }
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

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border border-dashed p-4 text-center transition-all duration-300 ${
          uploading
            ? "cursor-not-allowed border-white/[0.06] bg-white/[0.02]"
            : isDragging
              ? "scale-[1.01] border-white/30 bg-white/[0.07] shadow-lg shadow-black/20"
              : "border-white/[0.09] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.035]"
        }`}
      >

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative">

          <div
            className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
              isDragging
                ? "border-white/20 bg-white/[0.08]"
                : "border-white/[0.06] bg-white/[0.025] group-hover:-translate-y-0.5 group-hover:border-white/15 group-hover:bg-white/[0.06]"
            }`}
          >

            {uploading ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="animate-spin text-slate-300"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  className="opacity-25"
                />

                <path
                  d="M20 12a8 8 0 0 1-8 8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className={`transition-colors ${
                  isDragging
                    ? "text-slate-200"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              >
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
              </svg>
            )}

          </div>

          <p className="text-[11px] font-medium text-slate-300">
            {uploading
              ? "Uploading document..."
              : isDragging
                ? "Drop document here"
                : "Upload a document"}
          </p>

          <p className="mt-1 text-[9px] leading-4 text-slate-600">
            {uploading
              ? "Please wait while it is being indexed"
              : "Drag & drop or click to browse"}
          </p>

          {!uploading && (
            <div className="mt-3 flex justify-center gap-1.5">

              {["PDF", "DOCX", "TXT", "CSV"].map(
                (type) => (
                  <span
                    key={type}
                    className="rounded-md border border-white/[0.05] bg-white/[0.025] px-1.5 py-0.5 text-[8px] font-medium tracking-wide text-slate-600"
                  >
                    {type}
                  </span>
                )
              )}

            </div>
          )}

        </div>

      </div>

      {error && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2">

          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="mt-0.5 shrink-0 text-slate-400"
          >
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
            <circle
              cx="12"
              cy="12"
              r="9"
            />
          </svg>

          <p className="min-w-0 text-[10px] leading-4 text-slate-400">
            {error}
          </p>

        </div>
      )}

    </div>
  )
}

export default UploadBox