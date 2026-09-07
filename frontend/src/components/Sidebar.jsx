import UploadBox from "./UploadBox"

function Sidebar({
  documents,
  onUpload,
  uploading,
  connected
}) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950">

      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            ◈
          </div>

          <div>
            <h1 className="font-semibold text-white">
              DocuRAG
            </h1>

            <p className="text-xs text-slate-500">
              Universal Document Assistant
            </p>
          </div>

        </div>
      </div>

      <div className="p-4">
        <UploadBox
          onUpload={onUpload}
          uploading={uploading}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4">

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Documents
          </h2>

          <span className="text-xs text-slate-600">
            {documents.length}
          </span>
        </div>

        <div className="space-y-2">

          {documents.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-600">
              No documents uploaded
            </p>
          ) : (
            documents.map(
              (document, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-3"
                >
                  <span className="text-lg">
                    📄
                  </span>

                  <span className="truncate text-sm text-slate-300">
                    {document}
                  </span>
                </div>
              )
            )
          )}

        </div>

      </div>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center gap-2 text-xs">

          <span
            className={`h-2 w-2 rounded-full ${
              connected
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          />

          <span className="text-slate-500">
            {connected
              ? "API Connected"
              : "API Offline"}
          </span>

        </div>
      </div>

    </aside>
  )
}

export default Sidebar