import { Clock3, Database, FileJson2, Globe2, LoaderCircle, RefreshCw } from 'lucide-react'

export type RequestRecord = {
  clientId: string
  requestId: string
  timezone?: string
  type: string
  sentAt?: string
  receivedAt?: string
  userAgent?: string
  language?: string
  s3Key?: string
  requestBody?: { name?: string }
}

type RequestsTableProps = {
  requests: RequestRecord[]
  loading: boolean
  loadingMore: boolean
  error: string
  nextToken: string | null
  onRefresh: () => void
  onLoadMore: () => void
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function RequestsTable({ requests, loading, loadingMore, error, nextToken, onRefresh, onLoadMore }: RequestsTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_24px_70px_-36px_rgba(42,48,78,0.28)] ring-1 ring-slate-200/60 backdrop-blur-xl" aria-labelledby="requests-heading" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><Database size={18} /></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="requests-heading" className="text-sm font-semibold text-slate-900">Stored requests</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">{requests.length}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">GET /requests?type=greeting</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loading && requests.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-600" role="status">
              <LoaderCircle size={13} className="animate-spin" /> Updating
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-wait disabled:opacity-60"
            aria-label="Refresh requests"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && requests.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
          {loading ? (
            <>
              <LoaderCircle size={26} className="animate-spin text-violet-600" />
              <p className="mt-4 text-sm font-medium text-slate-700">Loading request history</p>
              <p className="mt-1 text-xs text-slate-400">Querying DynamoDB by request type…</p>
            </>
          ) : (
            <>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-600"><Globe2 size={19} /></div>
              <p className="mt-4 text-sm font-semibold text-slate-800">Couldn’t load request history</p>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">{error}</p>
              <button type="button" onClick={onRefresh} className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700">Try again</button>
            </>
          )}
        </div>
      ) : loading && requests.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center" role="status" aria-live="polite">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600">
            <LoaderCircle size={25} className="animate-spin" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-700">Loading request history</p>
          <p className="mt-1 text-xs text-slate-400">Querying DynamoDB by request type…</p>
          <div className="mt-8 w-full max-w-md space-y-2.5">
            <div className="h-3 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-3/5 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200"><FileJson2 size={20} /></div>
          <p className="mt-4 text-sm font-semibold text-slate-800">No greeting requests yet</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">Submit the form to save a request to S3 and see its metadata here.</p>
        </div>
      ) : (
        <>
          <div className="max-h-[min(68vh,760px)] overflow-auto">
            <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-left">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th scope="col" className="border-b border-slate-200 px-4 py-3 pl-6">Request</th>
                  <th scope="col" className="border-b border-slate-200 px-4 py-3">Client ID</th>
                  <th scope="col" className="border-b border-slate-200 px-4 py-3">Timezone</th>
                  <th scope="col" className="border-b border-slate-200 px-4 py-3">Sent at</th>
                  <th scope="col" className="border-b border-slate-200 px-4 py-3">Browser</th>
                  <th scope="col" className="border-b border-slate-200 px-4 py-3">Language</th>
                  <th scope="col" className="border-b border-slate-200 px-4 py-3 pr-6">S3 object</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((item) => (
                  <tr key={`${item.clientId}:${item.requestId}`} className="group transition hover:bg-violet-50/35">
                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 pl-6">
                      <div className="font-medium text-slate-800">{item.requestBody?.name ?? '—'}</div>
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-slate-400"><Clock3 size={11} />{item.type}</div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <code className="block max-w-[138px] truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600" title={item.clientId}>{item.clientId}</code>
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 text-xs text-slate-600">{item.timezone || '—'}</td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 text-xs tabular-nums text-slate-600">{formatDate(item.sentAt)}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <span className="block max-w-[170px] truncate text-xs text-slate-600" title={item.userAgent}>{item.userAgent || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 text-xs text-slate-600">{item.language || '—'}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5 pr-6">
                      <code className="block max-w-[180px] truncate rounded-md bg-sky-50 px-2 py-1 font-mono text-[10px] text-sky-800" title={item.s3Key}>{item.s3Key || '—'}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:px-6">
            <p className="text-[11px] text-slate-400">Showing <span className="font-semibold tabular-nums text-slate-600">{requests.length}</span> request{requests.length === 1 ? '' : 's'}{nextToken ? ' · more available' : ''}</p>
            {nextToken && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore && <LoaderCircle size={13} className="animate-spin" />}
                Load more
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default RequestsTable
