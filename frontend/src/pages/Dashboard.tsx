import React, { useState } from 'react'
import {
  Terminal, Activity, Zap, CreditCard,
  LogOut, CheckCircle2, XCircle, Loader2,
  ChevronRight, Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL ?? ''

const PLAN_COLORS: Record<string, string> = {
  free:       'text-slate-400 bg-slate-800 border-slate-700',
  pro:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  enterprise: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
}

const SAMPLE_CODE = `def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    password = result['password']
    return result`

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, token, logout } = useAuth()

  // Health check state
  const [health, setHealth]       = useState<any>(null)
  const [healthLoading, setHL]    = useState(false)

  // AI Review state
  const [code, setCode]           = useState(SAMPLE_CODE)
  const [language, setLanguage]   = useState('python')
  const [review, setReview]       = useState<string | null>(null)
  const [reviewLoading, setRL]    = useState(false)
  const [reviewError, setRE]      = useState<string | null>(null)

  // Stripe checkout state
  const [checkoutLoading, setCL]  = useState(false)

  const checkHealth = async () => {
    setHL(true)
    try {
      const res = await fetch(`${API}/api/health`)
      setHealth(await res.json())
    } catch { setHealth({ status: 'error' }) }
    finally  { setHL(false) }
  }

  const runCodeReview = async () => {
    setRL(true)
    setReview(null)
    setRE(null)
    try {
      const res = await fetch(`${API}/api/ai/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setReview(data.review)
    } catch (e: any) {
      setRE(e.message)
    } finally { setRL(false) }
  }

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    setCL(true)
    try {
      const res = await fetch(`${API}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.checkout_url) window.open(data.checkout_url, '_blank')
      else throw new Error(data.detail)
    } catch (e: any) {
      alert(e.message)
    } finally { setCL(false) }
  }

  return (
    <div className="min-h-screen bg-[#0b1120]">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Terminal size={15} strokeWidth={2.5} className="text-slate-950" />
            </div>
            <span className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>DevStarter</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`font-mono text-xs px-2.5 py-1 rounded-full border capitalize ${PLAN_COLORS[user?.plan ?? 'free']}`}>
              {user?.plan ?? 'free'} plan
            </span>
            <span className="text-slate-400 text-sm">{user?.name}</span>
            <button onClick={logout} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your DevStarter dashboard — all systems operational.</p>
        </div>

        {/* ── 1. System Health ── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center">
                <Activity size={15} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">System Health</p>
                <p className="font-mono text-xs text-slate-500">GET /api/health</p>
              </div>
            </div>
            <button onClick={checkHealth} disabled={healthLoading}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
              {healthLoading ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
              Check Now
            </button>
          </div>

          {health && (
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3">
              {health.status === 'healthy'
                ? <><CheckCircle2 size={15} className="text-emerald-400" /><span className="font-mono text-sm text-emerald-400">System Online</span></>
                : <><XCircle size={15} className="text-red-400" /><span className="font-mono text-sm text-red-400">Offline</span></>
              }
              <span className="ml-auto font-mono text-xs text-slate-600">v{health.version}</span>
            </div>
          )}
        </div>

        {/* ── 2. AI Code Review ── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center">
              <Sparkles size={15} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">AI Code Review</p>
              <p className="font-mono text-xs text-slate-500">Powered by Llama 3.1 · POST /api/ai/review</p>
            </div>
            <span className="ml-auto font-mono text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {user?.plan === 'free' ? '5/day on free' : 'unlimited'}
            </span>
          </div>

          {/* Language picker */}
          <div className="flex gap-2 mb-3">
            {['python', 'javascript', 'typescript', 'go'].map(lang => (
              <button key={lang} onClick={() => setLanguage(lang)}
                className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  language === lang
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}>
                {lang}
              </button>
            ))}
          </div>

          {/* Code input */}
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={8}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mb-3"
            placeholder="Paste your code here..."
          />

          <button onClick={runCodeReview} disabled={reviewLoading || !code.trim()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
            {reviewLoading ? <Loader2 size={14} className="animate-spin text-slate-950" /> : <Zap size={14} />}
            {reviewLoading ? 'Reviewing...' : 'Run AI Review'}
          </button>

          {/* Review output */}
          {reviewError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {reviewError}
            </div>
          )}
          {review && (
            <div className="mt-4 p-5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <p className="font-mono text-xs text-emerald-400/60 mb-3">// AI Review — Llama 3.1 (Groq)</p>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap prose-sm">
                {review}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Upgrade / Stripe ── */}
        {user?.plan === 'free' && (
          <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-800/30 rounded-xl p-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={15} className="text-emerald-400" />
                  <p className="text-white font-semibold text-sm">Upgrade to Pro</p>
                </div>
                <p className="text-slate-400 text-sm">Unlimited AI reviews, priority support, and more.</p>
                <p className="font-mono text-xs text-slate-500 mt-1">Powered by Stripe · Cancel anytime</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => handleUpgrade('pro')} disabled={checkoutLoading}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                  {checkoutLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                  Pro — $12/mo
                </button>
                <button onClick={() => handleUpgrade('enterprise')} disabled={checkoutLoading}
                  className="border border-slate-600 hover:border-slate-500 text-slate-300 px-5 py-2.5 rounded-lg text-sm transition-colors">
                  Enterprise — $49/mo
                </button>
              </div>
            </div>
          </div>
        )}

        {user?.plan !== 'free' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-white text-sm font-medium capitalize">{user?.plan} Plan Active</p>
              <p className="text-slate-500 text-xs font-mono mt-0.5">Managed by Stripe · <a href="https://billing.stripe.com" target="_blank" rel="noreferrer" className="text-emerald-400/70 hover:text-emerald-400">Manage billing ↗</a></p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}