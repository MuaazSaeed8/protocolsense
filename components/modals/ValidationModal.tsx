import React, { useState } from 'react';
import { AnalysisResult, ValidationAttempt } from '../../types';
import { validateProtocolInput } from '../../services/geminiService';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
}

const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, result }) => {
  const [testPayload, setTestPayload] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<Partial<ValidationAttempt> | null>(null);

  const handleRunValidation = async () => {
    if (!testPayload.trim() || !result) return;
    setIsValidating(true);
    setValidationResult(null);
    try {
      const res = await validateProtocolInput(testPayload, result);
      setValidationResult(res);
    } catch (e) {
      // Error handling
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
      setTestPayload('');
      setValidationResult(null);
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
          <h2 className="text-2xl font-medium tracking-tight mb-2">Validate Input</h2>
          <p className="text-on-surface-variant text-base opacity-60">Test a payload against the inferred protocol rules.</p>
        </div>
        <div className="p-6 lg:p-10 space-y-6">
          <textarea
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            placeholder='{ "some": "data" }'
            className="w-full bg-surface-container border border-surface-variant/10 rounded-2xl p-4 text-base font-mono focus:outline-none focus:border-primary/30 min-h-[120px] resize-none"
          />
          {validationResult && (
             <div className={`p-4 rounded-xl border ${validationResult.status === 'VALID' ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'}`}>
               <div className="flex items-center gap-2 font-bold mb-1">
                 <span className="material-symbols-outlined">{validationResult.status === 'VALID' ? 'check_circle' : 'error'}</span>
                 {validationResult.status}
               </div>
               <p className="text-sm text-on-surface/90">{validationResult.explanation}</p>
               {validationResult.violated_rules && validationResult.violated_rules.length > 0 && (
                 <div className="mt-2 text-xs font-mono opacity-80">Violated: {validationResult.violated_rules.join(', ')}</div>
               )}
             </div>
          )}
          <div className="flex gap-4 pt-2">
             <button onClick={handleClose} className="flex-1 py-4 rounded-full font-bold text-base bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-all">Close</button>
             <button onClick={handleRunValidation} disabled={isValidating || !testPayload.trim()} className="flex-1 py-4 rounded-full font-bold text-base bg-primary text-background hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-2">
                {isValidating ? <><div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"/><span>Validating...</span></> : 'Validate'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;