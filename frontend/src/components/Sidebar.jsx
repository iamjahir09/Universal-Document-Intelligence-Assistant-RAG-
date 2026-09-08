import { useRef } from "react"

function Sidebar({
  documents,
  connected,
  isOpen,
  onToggle,
  onUpload,
  onNewChat,
  uploading = false
}) {
  const inputRef = useRef(null)

  const handleUploadClick = () => {
    if (!uploading) {
      inputRef.current?.click()
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      await onUpload(file)
    } finally {
      event.target.value = ""
    }
  }

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col bg-[#090909] transition-all duration-300 ease-in-out ${
        isOpen ? "w-[280px]" : "w-[60px]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.csv,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className={`flex h-[60px] shrink-0 items-center ${
          isOpen
            ? "justify-between px-4"
            : "justify-center"
        }`}
      >
        {isOpen ? (
          <>
            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-semibold tracking-tight text-white">
                DocuRAG
              </h1>

              <p className="mt-0.5 truncate text-[10px] text-white/45">
                Document Assistant
              </p>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors duration-200 hover:bg-white/[0.05]"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M12 3v18" />
              <path d="M3 12h18" />
              <path d="m5.5 5.5 13 13" />
              <path d="m18.5 5.5-13 13" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onNewChat}
            className="group mb-6 flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors duration-200 hover:bg-white/[0.05]"
            title="New chat"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-white/70 transition-colors group-hover:text-white">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>

            <span className="text-xs font-medium text-white/75 group-hover:text-white">
              New Chat
            </span>
          </button>

          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Documents
            </h2>

            <span className="text-[10px] text-white/30">
              {documents.length}
            </span>
          </div>

          <div className="space-y-1">
            {documents.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto text-white/30"
                >
                  <path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                  <path d="M14 2v5h6" />
                </svg>

                <p className="mt-3 text-[11px] text-white/35">
                  No documents
                </p>
              </div>
            ) : (
              documents.map((document, index) => (
                <div
                  key={index}
                  className="group flex min-w-0 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-white/[0.04]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center text-white/55 group-hover:text-white/75">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                      <path d="M14 2v5h6" />
                      <path d="M8 13h8" />
                      <path d="M8 17h6" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white/70 group-hover:text-white">
                      {document}
                    </p>

                    <p className="mt-0.5 text-[9px] text-white/30">
                      Document
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="flex flex-1 flex-col items-center pt-5">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onNewChat}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white"
              title="New chat"
              aria-label="New chat"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white"
              title="Documents"
              aria-label="Open documents"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                <path d="M14 2v5h6" />
                <path d="M8 13h8" />
                <path d="M8 17h6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white ${
                uploading
                  ? "cursor-not-allowed opacity-40"
                  : ""
              }`}
              title={
                uploading
                  ? "Uploading..."
                  : "Upload document"
              }
              aria-label="Upload document"
            >
              {uploading ? (
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="animate-spin"
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 14v4a2 2 0 0 0 2 2v2h10a2 2 0 0 0 2-2v-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar