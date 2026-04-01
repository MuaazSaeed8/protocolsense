import React, { useState, useEffect } from 'react';
import { ExamplePair, ComparisonResult } from '../../types';
import ExampleInput from '../ExampleInput';
import { analyzeProtocol, compareProtocols } from '../../services/geminiService';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseExamples: ExamplePair[];
}

const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, baseExamples }) => {
  const [examplesA, setExamplesA] = useState<ExamplePair[]>([]);
  const [examplesB, setExamplesB] = useState<ExamplePair[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [compResult, setCompResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const seedA = baseExamples.some(e => e.input.trim() || e.output.trim())
        ? baseExamples.map(e => ({ ...e, id: `copy_${e.id}_${Date.now()}` }))
        : [{ id: 'a_new', input: '', output: '' }];

      setExamplesA(seedA);
      // Match right-side count to left side — all empty
      setExamplesB(seedA.map((_, i) => ({ id: `b_${i}_${Date.now()}`, input: '', output: '' })));
      setCompResult(null);
      setError(null);
    }
  }, [isOpen, baseExamples]);

  const handleRunComparison = async () => {
    setIsComparing(true);
    setError(null);
    try {
      const resA = await analyzeProtocol(examplesA.filter(e => e.input && e.output));
      const resB = await analyzeProtocol(examplesB.filter(e => e.input && e.output));
      const diff = await compareProtocols(resA, resB);
      setCompResult(diff);
    } catch (e) {
      console.error(e);
      setError('Comparison failed. Make sure both sides have at least one complete example.');
    } finally {
      setIsComparing(false);
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'LOW': return 'text-success bg-success/10 border-success/30';
      case 'MEDIUM': return 'text-warning bg-warning/10 border-warning/30';
      case 'HIGH': return 'text-error bg-error/10 border-error/30';
      default: return 'text-on-surface-variant bg-surface-variant/10 border-surface-variant/30';
    }
  };

  const newDiffs = compResult?.diffs.filter(d => d.type === 'NEW') ?? [];
  const changedDiffs = compResult?.diffs.filter(d => d.type === 'CHANGED') ?? [];
  const removedDiffs = compResult?.diffs.filter(d => d.type === 'REMOVED') ?? [];
  const unchangedDiffs = compResult?.diffs.filter(d => d.type === 'UNCHANGED') ?? [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-7xl h-full flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:top-8 lg:right-8 text-on-surface-variant hover:text-primary transition-colors z-[210]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6 lg:p-12 pb-4">
          <h2 className="text-2xl lg:text-4xl font-medium tracking-tight mb-2">Semantic comparison</h2>
          <p className="text-on-surface-variant text-base lg:text-lg">
            {compResult
              ? 'Rules that changed between the two versions are highlighted below.'
              : 'Paste examples from the new version of your API on the right to see exactly which rules changed, appeared, or disappeared.'}
          </p>
        </div>

        <div className="flex-1 p-6 lg:p-12 pt-4 flex flex-col lg:flex-row gap-6 lg:gap-12 overflow-y-auto lg:overflow-hidden">
          {!compResult ? (
            <>
              {/* Left — Original */}
              <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold">Original / Current</h3>
                    <p className="text-sm text-on-surface-variant mt-0.5">Examples from the version you already analyzed</p>
                  </div>
                  <button
                    onClick={() => setExamplesA([{ id: Date.now().toString(), input: '', output: '' }, ...examplesA])}
                    className="text-sm font-bold text-primary hover:underline shrink-0"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 lg:pr-4 space-y-3 min-h-[200px]">
                  {examplesA.map(ex => (
                    <ExampleInput
                      key={ex.id}
                      example={ex}
                      isRemovable={examplesA.length > 1}
                      onUpdate={(id, f, v) => setExamplesA(examplesA.map(e => e.id === id ? { ...e, [f]: v } : e))}
                      onRemove={(id) => setExamplesA(examplesA.filter(e => e.id !== id))}
                    />
                  ))}
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-center justify-center gap-2 shrink-0">
                <div className="w-px flex-1 bg-surface-variant/10" />
                <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl">arrow_forward</span>
                <div className="w-px flex-1 bg-surface-variant/10" />
              </div>

              {/* Right — New/Updated */}
              <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold">New / Updated</h3>
                    <p className="text-sm text-on-surface-variant mt-0.5">Paste examples from the updated version here</p>
                  </div>
                  <button
                    onClick={() => setExamplesB([{ id: Date.now().toString(), input: '', output: '' }, ...examplesB])}
                    className="text-sm font-bold text-primary hover:underline shrink-0"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 lg:pr-4 space-y-3 min-h-[200px]">
                  {examplesB.map(ex => (
                    <ExampleInput
                      key={ex.id}
                      example={ex}
                      isRemovable={examplesB.length > 1}
                      onUpdate={(id, f, v) => setExamplesB(examplesB.map(e => e.id === id ? { ...e, [f]: v } : e))}
                      onRemove={(id) => setExamplesB(examplesB.filter(e => e.id !== id))}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ── Result: diff view ── */
            <div className="w-full flex flex-col gap-8 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700 pr-2">
              {/* Header row */}
              <div className="flex flex-wrap items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getImpactColor(compResult.backward_compatibility_impact)}`}>
                  {compResult.backward_compatibility_impact} impact
                </div>
                <p className="text-on-surface/80 leading-relaxed text-base flex-1">{compResult.summary}</p>
              </div>

              {/* Diff sections */}
              <div className="space-y-6">
                {newDiffs.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-success text-base">add_circle</span>
                      <h4 className="text-sm font-bold text-success uppercase tracking-wider">New rules ({newDiffs.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {newDiffs.map((d, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-success/8 border border-success/20 rounded-2xl">
                          <span className="text-success font-bold text-base select-none shrink-0 mt-0.5">+</span>
                          <div className="space-y-1 min-w-0">
                            <p className="text-base font-medium text-on-surface">{d.description}</p>
                            {d.breakingImpact && <p className="text-sm text-success/80">{d.breakingImpact}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {changedDiffs.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-warning text-base">change_circle</span>
                      <h4 className="text-sm font-bold text-warning uppercase tracking-wider">Changed rules ({changedDiffs.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {changedDiffs.map((d, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-warning/8 border border-warning/20 rounded-2xl">
                          <span className="text-warning font-bold text-base select-none shrink-0 mt-0.5">~</span>
                          <div className="space-y-2 min-w-0">
                            {d.oldDescription && (
                              <p className="text-base text-on-surface-variant line-through opacity-50">{d.oldDescription}</p>
                            )}
                            <p className="text-base font-medium text-on-surface">{d.description}</p>
                            {d.breakingImpact && <p className="text-sm text-warning/80">{d.breakingImpact}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {removedDiffs.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-error text-base">remove_circle</span>
                      <h4 className="text-sm font-bold text-error uppercase tracking-wider">Removed rules ({removedDiffs.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {removedDiffs.map((d, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-error/8 border border-error/20 rounded-2xl">
                          <span className="text-error font-bold text-base select-none shrink-0 mt-0.5">−</span>
                          <div className="space-y-1 min-w-0">
                            <p className="text-base font-medium text-on-surface line-through opacity-60">{d.description}</p>
                            {d.breakingImpact && <p className="text-sm text-error/80">{d.breakingImpact}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {unchangedDiffs.length > 0 && (
                  <section className="space-y-3">
                    <h4 className="text-sm font-bold text-on-surface-variant/50 uppercase tracking-wider">Unchanged ({unchangedDiffs.length})</h4>
                    <div className="space-y-2">
                      {unchangedDiffs.map((d, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-2xl opacity-40">
                          <span className="font-bold text-base select-none shrink-0 mt-0.5 text-on-surface-variant">=</span>
                          <p className="text-base text-on-surface-variant">{d.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {newDiffs.length === 0 && changedDiffs.length === 0 && removedDiffs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant/50">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                    <p className="text-base font-medium">No behavioral differences detected.</p>
                  </div>
                )}
              </div>

              {/* Breaking example */}
              {compResult.concrete_break_example && (
                <div className="p-6 bg-error/5 rounded-3xl border border-error/20 flex gap-4 items-start">
                  <span className="material-symbols-outlined text-error text-2xl shrink-0">warning</span>
                  <div>
                    <p className="text-sm font-bold text-error mb-1 uppercase tracking-wider">Potential breaking scenario</p>
                    <p className="text-base font-medium italic text-error/90 leading-relaxed">{compResult.concrete_break_example}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 lg:p-10 pt-4 border-t border-surface-variant/10 bg-surface flex justify-end items-center gap-3 shrink-0">
          {error && <p className="text-sm text-error mr-auto">{error}</p>}
          {compResult ? (
            <button
              onClick={() => setCompResult(null)}
              className="px-8 py-3 bg-surface-variant text-on-surface rounded-full font-bold text-base hover:bg-on-surface hover:text-background transition-all"
            >
              Edit inputs
            </button>
          ) : (
            <button
              onClick={handleRunComparison}
              disabled={isComparing}
              className="bg-primary text-background px-8 py-3 rounded-full font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isComparing ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Analyzing shifts...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">difference</span>
                  Compare versions
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
