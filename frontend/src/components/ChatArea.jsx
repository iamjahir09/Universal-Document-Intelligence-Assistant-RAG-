import MessageBubble from "./MessageBubble"
import ChatInput from "./ChatInput"

function ChatArea({
  messages,
  onSend,
  loading
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-950">

      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-white">
          Document Chat
        </h1>

        <p className="text-xs text-slate-500">
          Ask questions about your uploaded documents
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">

          {messages.length === 0 && (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-5xl">
                  ◈
                </div>

                <h2 className="text-2xl font-semibold text-white">
                  Welcome to DocuRAG
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Upload a document and start asking questions.
                </p>
              </div>
            </div>
          )}

          {messages.map(
            (message, index) => (
              <MessageBubble
                key={index}
                message={message}
              />
            )
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400">
                Thinking...
              </div>
            </div>
          )}

        </div>
      </div>

      <ChatInput
        onSend={onSend}
        disabled={loading}
      />

    </section>
  )
}

export default ChatArea