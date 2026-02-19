import React from 'react'
import { Terminal, Zap, Shield, CreditCard, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: Shield,     title: 'Real Auth',         desc: 'bcrypt passwords, JWT tokens, PostgreSQL — production-grade from day one.' },
  { icon: Zap,        title: 'AI Code Review',    desc: 'GPT-4o-mini reviews your code instantly. Bugs, security, performance.' },
  { icon: CreditCard, title: 'Stripe Payments',   desc: 'Subscription checkout, webhook handling, plan management. Full SaaS billing.' },
  { icon: Terminal,   title: 'Docker + CI/CD',    desc: 'One command local dev. GitHub Actions deploys to Railway + Vercel automatically.' },
]

const PLANS = [
  {
    name: 'Free', price: '$0', color: 'border-slate-700',
    features: ['5 AI reviews/day', 'Health monitoring', 'API access', 'Docker setup'],
    cta: 'Get Started', ctaStyle: 'bg-slate-700 hover:bg-slate-600 text-white',
  },
  {
    name: 'Pro', price: '$12/mo', color: 'border-emerald-500', badge: 'Most Popular',
    features: ['Unlimited AI reviews', 'Priority support', 'Stripe integration', 'Everything in Free'],
    cta: 'Upgrade to Pro', ctaStyle: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold',
  },
  {
    name: 'Enterprise', price: '$49/mo', color: 'border-slate-600',
    features: ['Team seats', 'Custom AI prompts', 'SLA guarantee', 'Everything in Pro'],
    cta: 'Contact Sales', ctaStyle: 'bg-slate-700 hover:bg-slate-600 text-white',
  },
]

export default function Landing({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#0b1120]">

      {/* Nav */}
      <nav className="border-b border-slate-800 bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Terminal size={15} strokeWidth={2.5} className="text-slate-950" />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>DevStarter</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button onClick={() => onNavigate('login')}
                  className="text-slate-400 hover:text-white text-sm transition-colors">Sign In</button>
                <button onClick={() => onNavigate('register')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          v2.0 — Auth + AI + Payments
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-5 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
          DevStarter:<br />
          <span className="text-emerald-400">Ship Faster.</span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          Production-ready SaaS boilerplate with real authentication, AI-powered code review,
          Stripe payments, and automated deployment. Everything you need, nothing you don't.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={() => onNavigate('register')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
            Start Building Free <ArrowRight size={16} />
          </button>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-3 rounded-xl text-sm transition-colors">
            <Terminal size={15} /> View API Docs
          </a>
        </div>

        {/* Stack badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
          {['React + Vite', 'FastAPI', 'PostgreSQL', 'OpenAI', 'Stripe', 'Docker', 'GitHub Actions'].map(t => (
            <span key={t} className="px-3 py-1 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs font-mono text-slate-400">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white text-center mb-10" style={{ fontFamily: 'Syne, sans-serif' }}>
          Everything a SaaS needs
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Icon size={16} className="text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold text-sm">{title}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-slate-800">
        <h2 className="text-2xl font-bold text-white text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Simple, transparent pricing
        </h2>
        <p className="text-slate-500 text-center text-sm mb-10">Start free. Upgrade when you're ready.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <div key={plan.name} className={`bg-slate-900/60 border-2 ${plan.color} rounded-xl p-6 relative`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <p className="text-slate-400 text-xs font-mono mb-1">{plan.name}</p>
              <p className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={13} className="text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => onNavigate(plan.name === 'Free' ? 'register' : 'dashboard')}
                className={`w-full py-2.5 rounded-lg text-sm transition-colors ${plan.ctaStyle}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center">
        <p className="text-slate-600 text-xs font-mono">
          DevStarter © {new Date().getFullYear()} — MIT License · React · FastAPI · PostgreSQL · Docker
        </p>
      </footer>
    </div>
  )
}
