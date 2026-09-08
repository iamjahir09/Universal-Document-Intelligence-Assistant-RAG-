import { useState } from "react"

function MessageBubble({ message }) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        message.content
      )

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className={`group flex w-full ${
        isUser
          ? "justify-end"
          : "justify-start"
      }`}
    >

      <div
        className={`flex max-w-[92%] items-start gap-2.5 sm:max-w-[82%] sm:gap-3 ${
          isUser
            ? "flex-row-reverse"
            : "flex-row"
        }`}
      >

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
            isUser
              ? "border-white/[0.08] bg-white/[0.05] text-white/80"
              : "border-white/[0.08] bg-white/[0.04] text-white/80"
          }`}
        >

          {isUser ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle
                cx="12"
                cy="7"
                r="4"
              />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
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
          )}

        </div>

        <div
          className={`min-w-0 ${
            isUser
              ? "items-end"
              : "items-start"
          }`}
        >

          <div
            className={`relative rounded-2xl px-4 py-3 ${
              isUser
                ? "rounded-tr-md bg-white text-black shadow-lg shadow-black/20"
                : "rounded-tl-md border border-white/[0.07] bg-[#101010] text-white shadow-lg shadow-black/10"
            }`}
          >

            <p
              className={`whitespace-pre-wrap break-words text-[13px] leading-6 sm:text-sm ${
                isUser
                  ? "text-black"
                  : "text-white/85"
              }`}
            >
              {message.content}
            </p>

            {!isUser &&
              message.sources?.length > 0 && (

                <div className="mt-4 border-t border-white/[0.07] pt-3">

                  <div className="mb-2 flex items-center gap-2">

                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">
                      Sources
                    </span>

                    <span className="text-[8px] text-white/25">
                      {message.sources.length}
                    </span>

                  </div>

                  <div className="space-y-0.5">

                    {message.sources.map(
                      (source, index) => (

                        <div
                          key={`${source}-${index}`}
                          className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-white/[0.04]"
                        >

                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-white/45"
                          >
                            <path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                            <path d="M14 2v5h6" />
                            <path d="M8 13h8" />
                            <path d="M8 17h6" />
                          </svg>

                          <span className="min-w-0 truncate text-[10px] text-white/65">
                            {source}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                </div>
              )}

          </div>

          {!isUser && (
            <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] text-white/35 transition hover:bg-white/[0.04] hover:text-white/70"
              >

                {copied ? (
                  <>

                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>

                    Copied

                  </>
                ) : (
                  <>

                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="11"
                        height="11"
                        rx="2"
                      />

                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>

                    Copy

                  </>
                )}

              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default MessageBubble