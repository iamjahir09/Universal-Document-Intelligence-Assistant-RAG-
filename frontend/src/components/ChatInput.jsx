import { useRef, useState } from "react"

function ChatInput({ onSend, disabled, onAttach }) {
  const [query, setQuery] = useState("")
  const fileInputRef = useRef(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedQuery = query.trim()
    if (!trimmedQuery || disabled) return
    onSend(trimmedQuery)
    setQuery("")
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  const handleAttachClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (onAttach) {
      await onAttach(file)
    }
    event.target.value = ""
  }

  const canSend = !disabled && query.trim()

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[680px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.csv,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className={`flex h-[52px] items-center rounded-2xl border border-white/10 bg-[#0a0a0a] px-2 transition-all duration-200 ${
          disabled
            ? "opacity-60"
            : "hover:border-white/20 focus-within:border-white/30"
        }`}
      >
        <button
          type="button"
          onClick={handleAttachClick}
          disabled={disabled}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            disabled
              ? "cursor-not-allowed text-white/20"
              : "text-white/50 hover:bg-white/5 hover:text-white/80 active:scale-95"
          }`}
          aria-label="Attach document"
          title="Attach document"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <textarea
          rows={1}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled}
          className="h-[36px] min-h-[36px] max-h-[36px] min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent px-2 py-2 text-[15px] leading-5 text-white outline-none ring-0 placeholder:text-white/30 focus:border-0 focus:outline-none focus:ring-0"
        />

        <button
          type="submit"
          disabled={!canSend}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            canSend
              ? "bg-gradient-to-br from-white to-white/80 text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95"
              : "bg-white/5 text-white/20"
          }`}
          aria-label="Send message"
          title="Send message"
        >
          {disabled ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="animate-spin"
            >
              <circle cx="12" cy="12" r="8" className="opacity-25" />
              <path d="M20 12a8 8 0 0 1-8 8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:rotate-12"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-center">
        <span className="text-[8px] text-white/20">
          ⏎ Send · ⇧ + ⏎ New line
        </span>
      </div>
    </form>
  )
}

export default ChatInput