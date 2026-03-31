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

  useEffect(() => {
    if (isOpen) {
        // Initialize examples
        if (baseExamples.some(e => e.input.trim() || e.output.trim())) {
             setExamplesA(baseExamples.map(e => ({ ...e, id: `copy_${e.id}_${Date.now()}` })));
        } else {
             setExamplesA([{ id: 'a_new', input: '', output: '' }]);
        }
        setExamplesB([{ id: 'b_new', input: '', output: '' }]);
        setCompResult(null);
    }
  }, [isOpen, baseExamples]);

  const handleRunComparison = async () => {
    setIsComparing(true);
    try {
      const resA = await analyzeProtocol(examplesA.filter(e => e.input && e.output));
      const resB = await analyzeProtocol(examplesB.filter(e => e.input && e.output));
      const diff = await compareProtocols(resA, resB);
      setCompResult(diff);
    } catch (e) {
      console.error(e);
      // Could handle error display here
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

  const getDiffColor = (type: string) => {
    switch (type) {
      case 'NEW': return 'bg-success/20 text-success border-success/30';
      case 'REMOVED': return 'bg-error/20 text-error border-error/30';
      case 'CHANGED': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-surface-variant text-on-surface-variant border-transparent';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-7xl h-full flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 lg:top-8 lg:right-8 text-on-surface-variant hover:text-primary transition-colors z-[210]"
        >
          <svg className="w-6 h-6 lg:w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-6 lg:p-12 pb-4">
          <h2 className="text-2xl lg:text-4xl font-medium tracking-tight mb-2">Semantic comparison</h2>
          <p className="text-on-surface-variant text-base lg:text-lg">Analyze behavior changes between two versions of the protocol.</p>
        </div>

        <div className="flex-1 p-6 lg:p-12 pt-4 flex flex-col lg:flex-row gap-6 lg:gap-12 overflow-hidden overflow-y-auto lg:overflow-y-hidden">
            {!compResult ? (
                <>
                <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
                    <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-on-surface-variant">Original / Current</h3>
                    <button onClick={() => setExamplesA([{ id: Date.now().toString(), input: '', output: '' }, ...examplesA])} className="text-base font-bold text-primary hover:underline">Add example</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 lg:pr-4 space-y-3 min-h-[200px]">
                    {examplesA.map(ex => (
                        <ExampleInput 
                        key={ex.id} 
                        example={ex} 
                        isRemovable={examplesA.length > 1} 
                        onUpdate={(id, f, v) => setExamplesA(examplesA.map(e => e.id === id ? { ...e, [f]: v } : e))} 
                        onRemove={(id) => setExamplesA(examplesA.filter(e => e.id !== id))}
                        customInputPlaceholder="Add examples from the original version..."
                        />
                    ))}
                    </div>
                </div>

                <div className="hidden lg:block w-px bg-surface-variant/10 shrink-0" />

                <div className="flex-1 flex flex-col gap-4 lg:gap-6 overflow-hidden">
                    <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-on-surface-variant">New / Updated</h3>
                    <button onClick={() => setExamplesB([{ id: Date.now().toString(), input: '', output: '' }, ...examplesB])} className="text-base font-bold text-primary hover:underline">Add example</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 lg:pr-4 space-y-3 min-h-[200px]">
                    {examplesB.map(ex => (
                        <ExampleInput 
                        key={ex.id} 
                        example={ex} 
                        isRemovable={examplesB.length > 1} 
                        onUpdate={(id, f, v) => setExamplesB(examplesB.map(e => e.id === id ? { ...e, [f]: v } : e))} 
                        onRemove={(id) => setExamplesB(examplesB.filter(e => e.id !== id))}
                        customInputPlaceholder="Add examples from the new version..."
                        />
                    ))}
                    </div>
                </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col lg:flex-row gap-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto lg:overflow-y-hidden">
                {/* Main Analysis Column */}
                <div className="flex-1 flex flex-col gap-10 lg:overflow-y-auto custom-scrollbar pr-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                        <span className="text-base font-bold opacity-60">Backward Compatibility Impact</span>
                        <div className={`px-4 py-1 rounded-full text-base font-bold border ${getImpactColor(compResult.backward_compatibility_impact)}`}>
                            {compResult.backward_compatibility_impact}
                        </div>
                        </div>
                        <div className="p-6 lg:p-10 bg-surface-container rounded-3xl border border-surface-variant/10">
                        <h3 className="text-xl lg:text-3xl font-medium mb-4">Summary of changes</h3>
                        <p className="text-on-surface/80 leading-relaxed text-base lg:text-lg">{compResult.summary}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <span className="text-base font-bold opacity-60">Breaking Example</span>
                        <div className="p-6 lg:p-8 bg-error/5 rounded-3xl border border-error/20 flex gap-6 items-start">
                        <span className="material-symbols-outlined text-error text-3xl shrink-0">warning</span>
                        <p className="text-base font-medium italic text-error/90 leading-relaxed">{compResult.concrete_break_example}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                        <span className="text-base font-bold opacity-60">Behavioral Shifts</span>
                        <div className="space-y-3">
                            {compResult.modified_rules.map((m, i) => (
                                <div key={i} className="p-4 bg-surface rounded-2xl border border-surface-variant/10 space-y-2">
                                <span className="text-base font-bold text-primary">{m.id}</span>
                                <p className="text-base text-on-surface-variant">{m.change_reason}</p>
                                </div>
                            ))}
                        </div>
                        </div>
                        <div className="space-y-4">
                        <span className="text-base font-bold opacity-60">Additions & Removals</span>
                        <div className="space-y-2">
                            {compResult.added_rules.map((a, i) => (
                                <div key={i} className="flex items-center gap-3 text-base text-success">
                                <span className="material-symbols-outlined text-base">add_circle</span>
                                <span>{a}</span>
                                </div>
                            ))}
                            {compResult.removed_rules.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 text-base text-error">
                                <span className="material-symbols-outlined text-base">remove_circle</span>
                                <span>{r}</span>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                </div>

                {/* Side diff column */}
                <div className="w-full lg:w-[400px] bg-surface-container rounded-3xl p-6 lg:p-8 flex flex-col overflow-hidden border border-surface-variant/10 shadow-2xl shrink-0">
                    <h3 className="text-lg lg:text-xl font-medium mb-6">Detailed Semantic Diff</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 min-h-[300px]">
                        {compResult.diffs.map((diff, i) => (
                        <div key={i} className="p-4 bg-surface rounded-2xl border border-surface-variant/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-base font-bold opacity-30">{diff.id}</span>
                                <span className={`text-base font-bold px-2 py-0.5 rounded-full border ${getDiffColor(diff.type)}`}>{diff.type}</span>
                            </div>
                            <p className="text-base font-medium">{diff.description}</p>
                            {diff.oldDescription && (
                                <p className="text-base text-on-surface-variant line-through opacity-40 italic">{diff.oldDescription}</p>
                            )}
                            {diff.breakingImpact && (
                                <div className="pt-2 border-t border-surface-variant/5 text-error font-bold text-base">
                                Impact: {diff.breakingImpact}
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                </div>
                </div>
            )}
        </div>

        <div className="p-6 lg:p-10 pt-4 border-t border-surface-variant/10 bg-surface flex justify-end items-center gap-2 lg:gap-4 shrink-0">
            {compResult ? (
            <button 
                onClick={() => setCompResult(null)}
                className="px-8 lg:px-12 py-3 lg:py-4 bg-surface-variant text-on-surface rounded-full font-bold text-base hover:bg-on-surface hover:text-background transition-all"
            >
                Edit inputs
            </button>
            ) : (
            <button 
                onClick={handleRunComparison}
                disabled={isComparing || examplesA.length < 1 || examplesB.length < 1}
                className="px-10 lg:px-12 py-3 lg:py-4 bg-primary text-background rounded-full font-bold text-base shadow-xl hover:scale-105 active:scale-95 transition-all ripple disabled:opacity-30"
            >
                {isComparing ? 'Analyzing shifts...' : 'Compare semantic versions'}
            </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CompareModal;