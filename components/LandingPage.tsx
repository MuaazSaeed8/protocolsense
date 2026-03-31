import React from 'react';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onSignIn: () => void;
}

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

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-24 min-h-0 overflow-y-auto custom-scrollbar">
      {/* Hero */}
      <div className="max-w-2xl w-full text-center space-y-6">
        <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant/60">AI-powered protocol discovery</p>

        <h1 className="text-display ai-gradient-text leading-tight">
          Decode any system.<br />No docs required.
        </h1>

        <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto">
          Give ProtocolSense a handful of input/output examples and it will infer the business rules, constraints, and edge cases hidden inside — even when you don't have access to the source code.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
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
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-3xl w-full mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map(f => (
          <div
            key={f.title}
            className="bg-surface-container rounded-md3-item p-5 space-y-3 border border-surface-variant/10"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.bg}`}>
              <span className={`material-symbols-outlined text-xl ${f.color}`}>{f.icon}</span>
            </div>
            <p className="font-medium text-base">{f.title}</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>

      {/* Subtle footer note */}
      <p className="mt-12 text-xs text-on-surface-variant/40">No credit card required &middot; Sign in to save and load your protocols</p>
    </div>
  );
};

export default LandingPage;
