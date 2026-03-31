import React from 'react';
import { Scenario } from '../../types';
import { SCENARIOS } from '../../constants/scenarios';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: Scenario) => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onSelectScenario }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-5xl flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors z-20">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        
        <div className="p-8 lg:p-10 pb-4 shrink-0 text-center">
          <h2 className="text-3xl font-medium tracking-tight mb-3">Choose a scenario</h2>
          <p className="text-on-surface-variant text-lg">Select a pre-configured environment to explore ProtocolSense capabilities.</p>
        </div>

        <div className="p-6 lg:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
          {SCENARIOS.map(scenario => (
            <div 
              key={scenario.id} 
              onClick={() => { onSelectScenario(scenario); onClose(); }}
              className="bg-surface-container hover:bg-surface-container-high border border-surface-variant/20 hover:border-primary/50 rounded-3xl p-6 cursor-pointer transition-all group flex flex-col h-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface mb-6 flex items-center justify-center border border-surface-variant/20 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-symbols-outlined text-3xl text-primary">{scenario.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{scenario.title}</h3>
              <p className="text-on-surface-variant/80 text-sm leading-relaxed mb-6 flex-1">{scenario.problem}</p>
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span>Load Scenario</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemoModal;