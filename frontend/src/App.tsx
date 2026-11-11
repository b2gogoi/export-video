import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowRight, Braces, Check, CircleAlert, Code2, LoaderCircle, Send, Sparkles, Terminal } from 'lucide-react'

type ApiResponse = {
  message?: string
  greeting?: string
  error?: string
}

const apiUrl = import.meta.env.VITE_API_URL?.trim()

function App() {
  const [name, setName] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return

    setLoading(true)
    setError('')
    setResponse(null)
    setStatus('idle')

    try {
      if (!apiUrl) throw new Error('API URL is missing. Set VITE_API_URL in frontend/.env.local.')

      const result = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
      })

      const payload = (await result.json().catch(() => ({}))) as ApiResponse
      if (!result.ok) {
        throw new Error(payload.message || payload.error || `Request failed with status ${result.status}`)
      }

      setResponse(payload)
      setStatus('success')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const outputMessage = response?.message ?? response?.greeting

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-900 selection:bg-violet-200 selection:text-violet-950">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-violet-200/35 blur-3xl" />
        <div className="absolute -right-40 top-24 h-[32rem] w-[32rem] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-[-20rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-fuchsia-100/55 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200/70">
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

        <section id="top" className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20 lg:py-20">
          <div className="mx-auto max-w-xl lg:mx-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/75 px-3.5 py-2 text-xs font-semibold text-violet-700 shadow-sm shadow-violet-900/[0.03]">
              <Sparkles size={14} />
              Your first serverless round trip
            </div>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
              A little hello,
              <span className="mt-1 block bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 bg-clip-text pb-2 text-transparent">from the cloud.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Send a name to your AWS Lambda API and see the response come back. A tiny, real-world loop from React to the cloud and back.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> React + TypeScript</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> API Gateway</span>
              <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Lambda</span>
            </div>

            <div className="mt-12 hidden items-center gap-3 text-xs text-slate-400 lg:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white/70"><ArrowDown size={14} /></span>
              <span>Make a request to get started</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[520px]">
            <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/85 shadow-[0_30px_100px_-38px_rgba(42,48,78,0.28)] ring-1 ring-slate-200/60 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Send size={16} /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Try the greeting API</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">Send a POST request</p>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-emerald-700">POST</span>
              </div>

              <div className="p-6 sm:p-7">
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
                  <p className="mt-2 text-[11px] text-slate-400">We’ll send your name as JSON in the request body.</p>
                </form>

                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/80">
                  <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-2.5">
                    <span className="text-[11px] font-semibold text-slate-600">Response</span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-rose-500' : loading ? 'animate-pulse bg-amber-400' : 'bg-slate-300'}`} />{loading ? 'waiting' : status === 'success' ? '200 OK' : status === 'error' ? 'error' : 'ready'}</span>
                  </div>
                  <div className="flex min-h-[144px] items-center px-4 py-4">
                    {loading ? (
                      <div className="flex items-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
                        <LoaderCircle className="animate-spin text-violet-600" size={18} />
                        <span>Waiting for your Lambda response…</span>
                      </div>
                    ) : error ? (
                      <div className="flex items-start gap-3 text-sm text-rose-700" role="alert">
                        <CircleAlert size={18} className="mt-0.5 shrink-0" />
                        <span className="leading-6">{error}</span>
                      </div>
                    ) : outputMessage ? (
                      <div className="w-full animate-[fade-in_240ms_ease-out]">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-emerald-700"><Check size={14} /> API responded</div>
                        <div className="rounded-lg border border-emerald-100 bg-white px-4 py-3.5 text-lg font-medium tracking-tight text-slate-900 shadow-sm">{outputMessage}</div>
                        <pre className="mt-3 overflow-x-auto font-mono text-[10px] leading-5 text-slate-400">{JSON.stringify(response, null, 2)}</pre>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/70"><Code2 size={15} /></span>
                        <span>Your API response will appear here.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-lg bg-violet-50/70 px-3.5 py-2.5 text-[11px] text-violet-800">
                  <Terminal size={14} className="shrink-0 text-violet-600" />
                  <code className="font-mono">&#123; name: &quot;{name.trim() || '...'}&quot; &#125;</code>
                  <ArrowRight size={12} className="ml-auto shrink-0 text-violet-400" />
                  <code className="font-mono">{loading ? '…' : outputMessage ? '200' : 'Lambda'}</code>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-slate-400">A local frontend connected to your deployed API Gateway endpoint.</p>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200/70 py-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Built to make serverless feel a little more tangible.</span>
          <span className="font-mono">export-video · local dev</span>
        </footer>
      </div>
    </main>
  )
}

export default App
