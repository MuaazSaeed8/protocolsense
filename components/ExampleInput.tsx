import React from 'react';
import { ExamplePair } from '../types';

interface ExampleInputProps {
  example: ExamplePair;
  onUpdate: (id: string, field: 'input' | 'output', value: string) => void;
  onRemove: (id: string) => void;
  isRemovable: boolean;
  customInputPlaceholder?: string;
  customOutputPlaceholder?: string;
}

const ExampleInput: React.FC<ExampleInputProps> = ({ 
  example, 
  onUpdate, 
  onRemove, 
  isRemovable, 
  customInputPlaceholder, 
  customOutputPlaceholder 
}) => {
  return (
    <div className="bg-surface-container rounded-md3-item p-4 mb-3 space-y-4 group transition-all hover:bg-surface-container-high relative border border-transparent hover:border-surface-variant/10">
      {isRemovable && (
        <button
          onClick={() => onRemove(example.id)}
          className="absolute top-3 right-3 text-on-surface-variant hover:text-error opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}

      <div className="space-y-1.5">
        <label className="text-base font-bold text-on-surface/60 ml-1 block">Input</label>
        <textarea
          value={example.input}
          onChange={(e) => onUpdate(example.id, 'input', e.target.value)}
          placeholder={customInputPlaceholder || '{ "payload": true }'}
          className="w-full bg-background/40 border border-transparent rounded-xl p-3 text-base code-font focus:bg-background focus:border-primary/10 focus:outline-none min-h-[70px] transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-base font-bold text-on-surface/60 ml-1 block">Output</label>
        <textarea
          value={example.output}
          onChange={(e) => onUpdate(example.id, 'output', e.target.value)}
          placeholder={customOutputPlaceholder || '{ "result": "ok" }'}
          className="w-full bg-background/40 border border-transparent rounded-xl p-3 text-base code-font focus:bg-background focus:border-primary/10 focus:outline-none min-h-[70px] transition-all"
        />
      </div>
    </div>
  );
};

export default ExampleInput;