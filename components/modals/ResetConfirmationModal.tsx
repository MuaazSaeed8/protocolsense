import React from 'react';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md flex flex-col rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <h2 className="text-2xl font-medium tracking-tight mb-4">Reset Protocol?</h2>
          <p className="text-on-surface-variant text-base leading-relaxed">
            This will clear all training data, analysis results, and chat history. This action cannot be undone.
          </p>
        </div>
        <div className="p-8 pt-0 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-full font-bold text-base bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-8 py-3 rounded-full font-bold text-base bg-error text-background hover:bg-error/90 transition-all shadow-lg"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmationModal;