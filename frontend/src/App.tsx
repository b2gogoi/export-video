import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Braces, Check, CircleAlert, LoaderCircle, Send, Sparkles, Terminal } from 'lucide-react'
import RequestsTable, { type RequestRecord } from './RequestsTable'

type ApiResponse = {
  message?: string
  greeting?: string
  error?: string
}

type RequestsResponse = {
  items?: RequestRecord[]
  nextToken?: string | null
  message?: string
}

const apiUrl = import.meta.env.VITE_API_URL?.trim()
const requestsApiUrl = import.meta.env.VITE_REQUESTS_API_URL?.trim()
  || apiUrl?.replace(/\/hello\/?$/, '/requests')

const clientIdStorageKey = 'export-video.client-id'
const fingerprintLogKey = 'export-video.fingerprint-logged'

function getOrCreateClientId() {
  try {
    const existing = localStorage.getItem(clientIdStorageKey)
    if (existing) return existing

    const id = crypto.randomUUID()
    localStorage.setItem(clientIdStorageKey, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const browserIdentity = {
  clientId: getOrCreateClientId(),
  userAgent: navigator.userAgent,
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

try {
  if (!sessionStorage.getItem(fingerprintLogKey)) {
    console.info('[export-video] browser identity (pseudonymous):', browserIdentity)
    sessionStorage.setItem(fingerprintLogKey, 'true')
  }
} catch {
  console.info('[export-video] browser identity (pseudonymous):', browserIdentity)
}

function App() {
  const [name, setName] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState('')
  const [nextToken, setNextToken] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadRequests = useCallback(async (append = false, token?: string) => {
    if (!requestsApiUrl) {
      setRequestsError('Requests API URL is missing. Set VITE_REQUESTS_API_URL or VITE_API_URL.')
      setRequestsLoading(false)
      setLoadingMore(false)
      return
    }

    if (append) setLoadingMore(true)
    else setRequestsLoading(true)
    setRequestsError('')

    try {
      const url = new URL(requestsApiUrl)
      url.searchParams.set('type', 'greeting')
      url.searchParams.set('limit', '50')
      if (token) url.searchParams.set('nextToken', token)
      else url.searchParams.delete('nextToken')

      const result = await fetch(url)
      const payload = (await result.json().catch(() => ({}))) as RequestsResponse
      if (!result.ok) {
        throw new Error(payload.message || `Request lookup failed with status ${result.status}`)
      }

      const pageItems = payload.items ?? []
      setRequests((current) => append ? [...current, ...pageItems] : pageItems)
      setNextToken(payload.nextToken ?? null)
    } catch (caught) {
      setRequestsError(caught instanceof Error ? caught.message : 'Could not load requests.')
    } finally {
      setRequestsLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return

    setLoading(true)
    setFormError('')
    setResponse(null)
    setStatus('idle')

    try {
      if (!apiUrl) throw new Error('API URL is missing. Set VITE_API_URL in frontend/.env.local.')

      const result = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': browserIdentity.clientId,
          'X-Request-Id': crypto.randomUUID(),
          'X-Client-Sent-At': new Date().toISOString(),
          'X-Client-Language': browserIdentity.language,
          'X-Client-Timezone': browserIdentity.timezone,
        },
        body: JSON.stringify({ name: cleanName }),
      })

      const payload = (await result.json().catch(() => ({}))) as ApiResponse
      if (!result.ok) {
        throw new Error(payload.message || payload.error || `Request failed with status ${result.status}`)
      }

      setResponse(payload)
      setStatus('success')
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
      setStatus('error')
    } finally {
      setLoading(false)
      // Refresh after every valid submission, including failed POSTs.
      await loadRequests()
    }
  }

  const outputMessage = response?.message ?? response?.greeting

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900 selection:bg-violet-200 selection:text-violet-950">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-violet-200/35 blur-3xl" />
        <div className="absolute -right-40 top-24 h-[32rem] w-[32rem] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-[-20rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-fuchsia-100/55 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-5 sm:px-8">
        <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200/70">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Export Video home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
              <Braces size={18} strokeWidth={2.2} />
            </span>
            <span>export<span className="text-violet-600">.</span>video</span>
          </a>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm shadow-slate-900/[0.02]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Local playground
          </div>
        </header>

        <section id="top" className="pb-9 pt-12 sm:pb-12 sm:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/75 px-3.5 py-2 text-xs font-semibold text-violet-700 shadow-sm shadow-violet-900/[0.03]">
            <Sparkles size={14} />
            Your serverless request workspace
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.48fr)] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl">
                A little hello,
                <span className="ml-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">from the cloud.</span>
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Send a greeting to Lambda, then inspect the request metadata recorded in DynamoDB and the JSON object saved to S3.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500">React + TypeScript</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500">API Gateway</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500">Lambda · S3 · DynamoDB</span>
            </div>
          </div>
        </section>

        <section className="grid flex-1 items-start gap-6 pb-10 lg:grid-cols-[minmax(320px,2fr)_minmax(0,3fr)] xl:gap-8">
          <div className="space-y-5 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_24px_70px_-36px_rgba(42,48,78,0.28)] ring-1 ring-slate-200/60 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Send size={16} /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Create a greeting</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">POST /hello</p>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-emerald-700">POST</span>
              </div>

              <div className="p-5 sm:p-6">
                <form onSubmit={handleSubmit}>
                  <label htmlFor="name" className="mb-2 block text-xs font-semibold text-slate-700">Your name</label>
                  <div className="flex rounded-xl border border-slate-200 bg-white transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100/80">
                    <input
                      id="name"
                      name="name"
                      autoComplete="given-name"
                      maxLength={80}
                      placeholder="e.g. Bhaskar"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="m-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-300 sm:px-5"
                    >
                      {loading ? <><LoaderCircle size={15} className="animate-spin" /> Sending</> : <>Send <ArrowRight size={14} /></>}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">The body stays simple; browser identifiers travel in headers.</p>
                </form>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/80">
                  <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-2.5">
                    <span className="text-[11px] font-semibold text-slate-600">Latest response</span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-rose-500' : loading ? 'animate-pulse bg-amber-400' : 'bg-slate-300'}`} />{loading ? 'sending' : status === 'success' ? '200 OK' : status === 'error' ? 'error' : 'ready'}</span>
                  </div>
                  <div className="flex min-h-[112px] items-center px-4 py-4">
                    {loading ? (
                      <div className="flex items-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
                        <LoaderCircle className="animate-spin text-violet-600" size={18} />
                        <span>Waiting for Lambda…</span>
                      </div>
                    ) : formError ? (
                      <div className="flex items-start gap-3 text-sm text-rose-700" role="alert">
                        <CircleAlert size={18} className="mt-0.5 shrink-0" />
                        <span className="leading-6">{formError}</span>
                      </div>
                    ) : outputMessage ? (
                      <div className="w-full animate-[fade-in_240ms_ease-out]">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-emerald-700"><Check size={14} /> API responded</div>
                        <div className="rounded-lg border border-emerald-100 bg-white px-4 py-3 text-base font-medium tracking-tight text-slate-900 shadow-sm">{outputMessage}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Your response will appear here.</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-violet-50/70 px-3.5 py-2.5 text-[11px] text-violet-800">
                  <Terminal size={14} className="shrink-0 text-violet-600" />
                  <code className="font-mono">&#123; name: &quot;{name.trim() || '...'}&quot; &#125;</code>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-slate-400">Repeat visits use a random ID saved in this browser. Clearing site data resets it.</p>
              </div>
            </div>

            {requestsError && requests.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800" role="status">
                The request was submitted, but the table could not refresh: {requestsError}
              </div>
            )}
          </div>

          <RequestsTable
            requests={requests}
            loading={requestsLoading}
            loadingMore={loadingMore}
            error={requestsError}
            nextToken={nextToken}
            onRefresh={() => void loadRequests()}
            onLoadMore={() => void loadRequests(true, nextToken ?? undefined)}
          />
        </section>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-200/70 py-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Every submission refreshes the greeting request table.</span>
          <span className="font-mono">export-video · local dev</span>
        </footer>
      </div>
    </main>
  )
}

export default App
