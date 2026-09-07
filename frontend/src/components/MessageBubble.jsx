function MessageBubble({ message }) {
  const isUser = message.role === "user"

  return (
    <div
      className={`flex ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-slate-700 bg-slate-900 text-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-6">
          {message.content}
        </p>

        {!isUser &&
          message.sources?.length > 0 && (
            <div className="mt-3 border-t border-slate-700 pt-3">
              <p className="mb-2 text-xs font-semibold text-slate-400">
                Sources
              </p>

              {message.sources.map(
                (source, index) => (
                  <p
                    key={index}
                    className="truncate text-xs text-slate-500"
                  >
                    {source}
                  </p>
                )
              )}
            </div>
          )}
      </div>
    </div>
  )
}

export default MessageBubble