import React from 'react';
import ConfidenceBar from './ConfidenceBar';

interface LandingPageProps {
  onSignIn: () => void;
}

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_INPUT = `{
  "amount": 5000,
  "currency": "USD",
  "type": "wire"
}`;

const DEMO_OUTPUT = `{
  "fee": 25.00,
  "fee_type": "flat",
  "currency": "USD",
  "status": "approved"
}`;

const DEMO_SUMMARY =
  'A payment processing API that calculates transaction fees based on transfer type, amount, and currency. Wire transfers use flat-rate pricing; ACH transfers use percentage-based fees.';

const DEMO_RULES = [
  {
    id: 'rule_1',
    label: 'Flat Fee Threshold',
    description: 'Wire transfers above $2,500 incur a flat $25 fee regardless of amount.',
    confidence: 85,
    evidence: 'Observed consistently across all high-value wire transfer examples.',
    supporting_examples: ['Example 1', 'Example 3'],
  },
  {
    id: 'rule_2',
    label: 'Currency Passthrough',
    description: 'Fees are returned in the same currency as the input transaction.',
    confidence: 80,
    evidence: 'Output currency matches input currency in every example pair.',
    supporting_examples: ['Example 1', 'Example 2'],
  },
];

const ASSISTANT_QUICK_ACTIONS = [
  'Validate an input',
  'Diagnose a failure',
  'Explain the rules',
  'Find edge cases',
];

const FEATURES = [
  {
    icon: 'psychology',
    title: 'Infer rules automatically',
    description: 'Paste input/output pairs and let AI reverse-engineer the hidden logic, constraints, and edge cases.',
    color: 'text-aiPurple',
    bg: 'bg-aiPurple/10',
  },
  {
    icon: 'verified',
    title: 'Validate new inputs',
    description: 'Test any new input against the discovered protocol and instantly know whether it will pass or fail.',
    color: 'text-aiBlue',
    bg: 'bg-aiBlue/10',
  },
  {
    icon: 'description',
    title: 'Export documentation',
    description: 'Generate TypeScript types, Zod schemas, OpenAPI specs, and human-readable docs in one click.',
    color: 'text-aiTeal',
    bg: 'bg-aiTeal/10',
  },
];

const HOW_IT_WORKS = [
  {
    title: 'Paste examples',
    description: 'Drop in raw input/output pairs from your API, logs, or documentation.',
  },
  {
    title: 'Run analysis',
    description: 'AI identifies patterns, infers constraints, and assigns confidence scores.',
  },
  {
    title: 'Get rules + evidence',
    description: 'Review human-readable rules backed by direct citations from your examples.',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  return (
    <div className="flex-1 flex flex-col items-center min-h-0 overflow-y-auto custom-scrollbar relative">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative w-full flex flex-col items-center justify-center min-h-screen pt-16 pb-24 overflow-hidden">
        {/* Video background */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/hero.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Bottom fade into page background */}
        <div className="absolute bottom-0 left-0 right-0 h-48 z-[1] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #0e0e0f)' }} />

        <div className="max-w-2xl w-full text-center space-y-6 relative z-10">
          <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant/60">AI-powered protocol discovery</p>

          <h1 className="text-display ai-gradient-text leading-tight">
            Decode any system.<br />No docs required.
          </h1>

          <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto">
            Give ProtocolSense a handful of input/output examples and it will infer the business rules, constraints, and edge cases hidden inside — even when you don't have access to the source code.
          </p>

          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              onClick={onSignIn}
              className="flex items-center gap-3 bg-surface-container border border-surface-variant/30 text-on-surface px-6 py-3 rounded-full text-base font-bold hover:bg-surface-container-high transition-all shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
            <p className="text-sm text-on-surface-variant/50">Free to start · No credit card required</p>
          </div>
        </div>
      </div>

      {/* ── Feature cards ───────────────────────────────────────────────── */}
      <div className="max-w-3xl w-full mt-24 px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map(f => (
          <div key={f.title} className="bg-surface-container rounded-md3-item p-5 space-y-3 border border-surface-variant/10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.bg}`}>
              <span className={`material-symbols-outlined text-xl ${f.color}`}>{f.icon}</span>
            </div>
            <p className="font-medium text-base">{f.title}</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <div className="max-w-3xl w-full mt-28 px-6 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl lg:text-3xl font-medium tracking-tight">How it works</h2>
          <p className="text-sm text-on-surface-variant/60">Three steps from examples to production-ready rules.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start gap-0 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-surface-variant/20">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="flex-1 flex gap-4 px-0 sm:px-8 py-6 sm:py-0 first:pl-0 last:pr-0">
              <span className="text-3xl font-bold text-primary/30 leading-none shrink-0 mt-0.5 w-7">{i + 1}</span>
              <div className="space-y-1">
                <p className="font-semibold text-base text-on-surface">{step.title}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bento grid — See it in action ───────────────────────────────── */}
      <div className="max-w-5xl w-full mt-28 px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl lg:text-3xl font-medium tracking-tight">See it in action</h2>
          <p className="text-sm text-on-surface-variant/60">A live look at what ProtocolSense surfaces from raw examples.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Training example — left col, spans 2 rows */}
          <div className="md:row-span-2 bg-surface-container rounded-md3-card border border-surface-variant/10 p-5 flex flex-col gap-4">
            <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-wider shrink-0">Training example</p>
            <div className="space-y-3 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface/50 ml-1 block uppercase tracking-wider">Input</label>
                <pre className="w-full bg-background/60 rounded-xl p-3 text-sm font-mono text-on-surface/80 whitespace-pre leading-relaxed overflow-x-auto">{DEMO_INPUT}</pre>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface/50 ml-1 block uppercase tracking-wider">Output</label>
                <pre className="w-full bg-background/60 rounded-xl p-3 text-sm font-mono text-on-surface/80 whitespace-pre leading-relaxed overflow-x-auto">{DEMO_OUTPUT}</pre>
              </div>
            </div>
          </div>

          {/* System summary */}
          <div className="md:col-span-2 bg-surface-container rounded-md3-card border border-surface-variant/10 p-6 flex flex-col justify-center space-y-3">
            <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-wider">System summary</p>
            <h3 className="text-lg lg:text-xl tracking-tight text-on-surface/90 leading-snug font-medium">{DEMO_SUMMARY}</h3>
          </div>

          {/* Rule cards */}
          {DEMO_RULES.map(rule => (
            <div key={rule.id} className="bg-surface rounded-md3-card border border-surface-variant/10 p-5 flex flex-col gap-3 min-w-0">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-full border border-primary/10 whitespace-nowrap">{rule.label}</span>
                <ConfidenceBar confidence={rule.confidence} />
              </div>
              <p className="text-sm font-medium leading-snug">{rule.description}</p>
              <div className="pt-2 border-t border-surface-variant/10 space-y-1.5">
                <p className="text-xs text-on-surface-variant leading-relaxed">{rule.evidence}</p>
                <div className="flex flex-wrap gap-1.5">
                  {rule.supporting_examples.map((ex, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-surface-variant/40 rounded text-xs text-on-surface-variant font-mono">{ex}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Protocol Assistant — full width */}
          <div className="md:col-span-3">
            <div className="relative rounded-2xl p-5 space-y-3 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(208,188,255,0.85) 0%, rgba(138,180,248,0.85) 50%, rgba(129,201,149,0.85) 100%)' }}>
              <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #D0BCFF, #8AB4F8, #81C995)', filter: 'blur(30px)', opacity: 0.12, top: '-10px', left: '-10px', right: '-10px', bottom: '-10px' }} />
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-neutral-800/70">smart_toy</span>
                <h3 className="text-sm font-bold tracking-tight text-neutral-900">Protocol Assistant</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ASSISTANT_QUICK_ACTIONS.map(a => (
                  <span key={a} className="px-2.5 py-1 bg-black/10 border border-black/10 rounded-full text-xs font-semibold text-neutral-900 select-none">{a}</span>
                ))}
              </div>
              <div className="relative pointer-events-none">
                <div className="w-full bg-white/40 border border-white/50 rounded-full px-4 py-2.5 text-neutral-900/40 text-sm">
                  Ask anything about this protocol...
                </div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-neutral-900/15 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-neutral-900/40 text-sm">send</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <p className="mt-24 mb-10 px-6 text-xs text-on-surface-variant/40">No credit card required &middot; Sign in to save and load your protocols</p>

    </div>
  );
};

export default LandingPage;
