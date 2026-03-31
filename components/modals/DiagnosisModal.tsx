import React, { useState } from 'react';
import { AnalysisResult } from '../../types';
import { diagnoseFailure } from '../../services/geminiService';

interface DiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  onDiagnosisComplete: (response: string, request: string, error: string) => void;
}

const DiagnosisModal: React.FC<DiagnosisModalProps> = ({ isOpen, onClose, result, onDiagnosisComplete }) => {
  const [diagRequest, setDiagRequest] = useState('');
  const [diagError, setDiagError] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const handleRunDiagnosis = async () => {
    if (!diagRequest.trim() || !diagError.trim() || !result) return;
    
    setIsDiagnosing(true);
    
    try {
      const response = await diagnoseFailure(diagRequest, diagError, result);
      onDiagnosisComplete(response, diagRequest, diagError);
      handleClose();
    } catch (e) {
      // Handle error
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleClose = () => {
      setDiagRequest('');
      setDiagError('');
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-2xl flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500">
        <button onClick={handleClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors z-20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="p-6 lg:p-10 pb-0">
          <h2 className="text-2xl font-medium tracking-tight mb-2">Diagnose Failure</h2>
          <p className="text-on-surface-variant text-base opacity-60">Explain a failed request using the inferred rules.</p>
        </div>
        <div className="p-6 lg:p-10 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface/60">Failed Request</label>
            <textarea value={diagRequest} onChange={(e) => setDiagRequest(e.target.value)} className="w-full bg-surface-container border border-surface-variant/10 rounded-xl p-3 font-mono text-sm" placeholder="Request payload..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface/60">Error Response</label>
            <textarea value={diagError} onChange={(e) => setDiagError(e.target.value)} className="w-full bg-surface-container border border-surface-variant/10 rounded-xl p-3 font-mono text-sm" placeholder="Error message..." />
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={handleClose} className="flex-1 py-4 rounded-full font-bold text-base bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-all">Cancel</button>
             <button onClick={handleRunDiagnosis} disabled={isDiagnosing || !diagRequest.trim() || !diagError.trim()} className="flex-1 py-4 rounded-full font-bold text-base bg-primary text-background hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-2">
                {isDiagnosing ? <><div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"/><span>Analyzing...</span></> : 'Diagnose'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisModal;