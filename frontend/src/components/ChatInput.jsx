import { useState } from "react"

function ChatInput({
  onSend,
  disabled
}) {
  const [query, setQuery] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedQuery = query.trim()

    if (!trimmedQuery || disabled) {
      return
    }

    onSend(trimmedQuery)

    setQuery("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-800 bg-slate-950 p-4"
    >
      <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2">
        <input
          type="text"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Ask something about your documents..."
          disabled={disabled}
          className="flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500"
        />

        <button
          type="submit"
          disabled={
            disabled || !query.trim()
          }
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </form>
  )
}

export default ChatInput