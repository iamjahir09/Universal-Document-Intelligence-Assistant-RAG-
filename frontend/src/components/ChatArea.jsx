import { useEffect, useRef, useState } from "react"
import MessageBubble from "./MessageBubble"
import ChatInput from "./ChatInput"

function ChatArea({
  messages,
  onSend,
  loading,
  onUpload,
  documents = [],
  onToggleSidebar,
  uploading = false
}) {
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const dragCounterRef = useRef(0)
  const successTimerRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

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

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(
      (file) => isValidFile(file)
    )

    if (
      validFiles.length === 0 ||
      !onUpload ||
      uploading
    ) {
      return
    }

    setUploadSuccess(false)

    try {
      await onUpload(validFiles)

      setUploadSuccess(true)

      if (successTimerRef.current) {
        clearTimeout(
          successTimerRef.current
        )
      }

      successTimerRef.current = setTimeout(() => {
        setUploadSuccess(false)
      }, 2500)
    } catch {
      setUploadSuccess(false)
    }
  }

  const handleAttach = async (file) => {
    if (!file) {
      return
    }

    await handleFiles([file])
  }

  const handleDragEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current += 1

    if (
      event.dataTransfer.types?.includes("Files") &&
      !loading &&
      !uploading
    ) {
      setIsDragging(true)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (
      event.dataTransfer.types?.includes("Files") &&
      !loading &&
      !uploading
    ) {
      event.dataTransfer.dropEffect = "copy"
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current -= 1

    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current = 0
    setIsDragging(false)

    if (
      loading ||
      uploading
    ) {
      return
    }

    handleFiles(
      event.dataTransfer.files
    )
  }

  const handleFileChange = (event) => {
    handleFiles(
      event.target.files
    )

    event.target.value = ""
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    })
  }, [messages, loading])

  useEffect(() => {
    const handleWindowDragLeave = (event) => {
      if (
        event.clientX <= 0 ||
        event.clientY <= 0 ||
        event.clientX >= window.innerWidth ||
        event.clientY >= window.innerHeight
      ) {
        dragCounterRef.current = 0
        setIsDragging(false)
      }
    }

    window.addEventListener(
      "dragleave",
      handleWindowDragLeave
    )

    return () => {
      window.removeEventListener(
        "dragleave",
        handleWindowDragLeave
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(
          successTimerRef.current
        )
      }
    }
  }, [])

  const suggestions = [
    "Summarize this document",
    "What are the main topics?",
    "Explain this in simple terms"
  ]

  const hasMessages = messages.length > 0

  return (
    <section
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#070707]"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.csv,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      {isDragging &&
        !loading &&
        !uploading && (
          <div className="pointer-events-none absolute inset-3 z-50 flex items-center justify-center rounded-2xl border border-dashed border-white/30 bg-white/[0.04] backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.08]">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="text-white"
                >
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                </svg>
              </div>

              <p className="mt-4 text-sm font-medium text-white">
                Drop your document here
              </p>

              <p className="mt-1 text-xs text-white/40">
                PDF, DOCX, TXT or CSV
              </p>
            </div>
          </div>
        )}

      {hasMessages && (
        <>
          {uploading && (
            <div className="pointer-events-none absolute left-1/2 top-5 z-40 w-[min(420px,calc(100%-32px))] -translate-x-1/2">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="animate-spin text-white"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="8"
                        className="opacity-20"
                      />

                      <path
                        d="M20 12a8 8 0 0 1-8 8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-white">
                      Uploading document...
                    </p>

                    <p className="mt-0.5 text-[10px] text-white/40">
                      Processing and indexing your document
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full w-1/3 animate-[uploadProgress_1.4s_ease-in-out_infinite] rounded-full bg-white/70" />
                </div>
              </div>
            </div>
          )}

          {!uploading &&
            uploadSuccess && (
              <div className="pointer-events-none absolute left-1/2 top-5 z-40 w-[min(420px,calc(100%-32px))] -translate-x-1/2">
                <div className="animate-[uploadSuccess_0.45s_ease-out] rounded-2xl border border-white/10 bg-[#111111]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-white">
                        Document ready
                      </p>

                      <p className="mt-0.5 text-[10px] text-white/40">
                        Document indexed successfully
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {!hasMessages ? (
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/20">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-white"
                >
                  <path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                  <path d="M14 2v5h6" />
                  <path d="M8 13h8" />
                  <path d="M8 17h6" />
                </svg>
              </div>

              <h1 className="text-center text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">
                Chat with your documents
              </h1>

              <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-white/60">
                Upload your files and ask questions. DocuRAG will retrieve the relevant information and answer from your documents.
              </p>

              <div
                onClick={() => {
                  if (!uploading) {
                    fileInputRef.current?.click()
                  }
                }}
                className={`group relative mx-auto mt-5 w-full max-w-2xl overflow-hidden rounded-xl border border-dashed p-6 text-center transition-all duration-300 ${
                  uploading
                    ? "cursor-wait border-white/20 bg-white/[0.07]"
                    : uploadSuccess
                      ? "cursor-default border-white/25 bg-white/[0.06]"
                      : isDragging
                        ? "scale-[1.01] border-white/40 bg-white/10"
                        : "cursor-pointer border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {uploading && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-y-0 -left-1/2 w-1/2 animate-[uploadSweep_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                  </div>
                )}

                <div className="relative">
                  {uploading ? (
                    <>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="animate-spin text-white"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="8"
                            className="opacity-20"
                          />

                          <path
                            d="M20 12a8 8 0 0 1-8 8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      <p className="mt-3 text-sm font-medium text-white">
                        Uploading & indexing...
                      </p>

                      <p className="mt-0.5 text-xs text-white/40">
                        Processing your document
                      </p>

                      <div className="mx-auto mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full w-1/3 animate-[uploadProgress_1.4s_ease-in-out_infinite] rounded-full bg-white/60" />
                      </div>
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <div className="mx-auto flex h-12 w-12 animate-[uploadSuccess_0.45s_ease-out] items-center justify-center rounded-full bg-white text-black">
                        <svg
                          width="23"
                          height="23"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      </div>

                      <p className="mt-3 text-sm font-medium text-white">
                        Document ready
                      </p>

                      <p className="mt-0.5 text-xs text-white/40">
                        Your document has been indexed successfully
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 transition-transform duration-300 group-hover:-translate-y-1">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="text-white/70"
                        >
                          <path d="M12 16V4" />
                          <path d="m7 9 5-5 5 5" />
                          <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
                        </svg>
                      </div>

                      <p className="mt-3 text-sm font-medium text-white/80">
                        {isDragging
                          ? "Drop your documents here"
                          : "Drag & drop your documents here"}
                      </p>

                      <p className="mt-0.5 text-xs text-white/40">
                        or click to browse from your computer
                      </p>

                      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                        {[
                          "PDF",
                          "DOCX",
                          "TXT",
                          "CSV"
                        ].map((type) => (
                          <span
                            key={type}
                            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-medium tracking-wide text-white/40"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() =>
                        onSend(suggestion)
                      }
                      disabled={
                        uploading ||
                        loading
                      }
                      className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] text-white/50 transition hover:border-white/30 hover:bg-white/10 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="no-scrollbar flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6">
                <div className="space-y-4">
                  {messages.map(
                    (message, index) => (
                      <MessageBubble
                        key={index}
                        message={message}
                      />
                    )
                  )}

                  {loading && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          className="text-white"
                        >
                          <path d="M12 3v18" />
                          <path d="M3 12h18" />
                          <path d="m5.5 5.5 13 13" />
                          <path d="m18.5 5.5-13 13" />
                        </svg>
                      </div>

                      <div className="rounded-2xl rounded-tl-md border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[#070707]/95 px-3 pb-3 pt-2 backdrop-blur-xl sm:px-5">
        <div className="mx-auto w-full max-w-4xl">
          <ChatInput
            onSend={onSend}
            onAttach={handleAttach}
            disabled={
              loading ||
              uploading
            }
          />
        </div>
      </div>

      <style>{`
        @keyframes uploadSweep {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(400%);
          }
        }

        @keyframes uploadProgress {
          0% {
            transform: translateX(-150%);
          }

          100% {
            transform: translateX(450%);
          }
        }

        @keyframes uploadSuccess {
          0% {
            transform: scale(0.65);
            opacity: 0;
          }

          70% {
            transform: scale(1.08);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  )
}

export default ChatArea