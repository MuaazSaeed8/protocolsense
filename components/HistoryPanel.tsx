import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ExamplePair, AnalysisResult } from '../types';

interface SavedProtocol {
  id: string;
  name: string;
  examples: ExamplePair[];
  result: AnalysisResult;
  created_at: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLoad: (name: string, examples: ExamplePair[], result: AnalysisResult) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, user, onLoad }) => {
  const [protocols, setProtocols] = useState<SavedProtocol[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    supabase
      .from('protocols')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProtocols((data as SavedProtocol[]) ?? []);
        setLoading(false);
      });
  }, [isOpen, user.id]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from('protocols').delete().eq('id', id);
    setProtocols(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[290] bg-background/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-[300] bg-surface border-l border-surface-variant/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-variant/10 shrink-0">
          <h2 className="text-xl font-medium tracking-tight">Saved Protocols</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-surface-container rounded-md3-item p-4 space-y-3 animate-pulse">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-surface-container-high rounded-full w-3/4" />
                      <div className="h-3 bg-surface-container-high rounded-full w-1/2" />
                    </div>
                    <div className="h-6 w-6 bg-surface-container-high rounded-full shrink-0" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 bg-surface-container-high rounded-full w-full" />
                    <div className="h-3 bg-surface-container-high rounded-full w-4/5" />
                  </div>
                  <div className="h-9 bg-surface-container-high rounded-full w-full" />
                </div>
              ))}
            </div>
          )}

          {!loading && protocols.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-30">folder_open</span>
              <p className="text-sm">No saved protocols yet.</p>
            </div>
          )}

          {!loading && protocols.map(p => (
            <div
              key={p.id}
              className="bg-surface-container rounded-md3-item p-4 space-y-3 border border-transparent hover:border-surface-variant/20 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-base truncate">{p.name}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{formatDate(p.created_at)} · {p.examples.length} example{p.examples.length !== 1 ? 's' : ''} · {p.result.rules.length} rule{p.result.rules.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="shrink-0 text-on-surface-variant hover:text-error transition-colors disabled:opacity-40 p-1"
                >
                  <span className="material-symbols-outlined text-xl">{deletingId === p.id ? 'hourglass_empty' : 'delete'}</span>
                </button>
              </div>
              <p className="text-sm text-on-surface-variant/70 line-clamp-2 leading-relaxed">{p.result.system_summary}</p>
              <button
                onClick={() => { onLoad(p.name, p.examples, p.result); onClose(); }}
                className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Load
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;
