import React, { useState, useRef } from 'react';
import { ExtractedExample } from '../../types';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (examples: ExtractedExample[]) => void;
}

const CsvModal: React.FC<CsvModalProps> = ({ isOpen, onClose, onImport }) => {
  const [csvPreview, setCsvPreview] = useState<ExtractedExample[] | null>(null);
  const [selectedCsvIndices, setSelectedCsvIndices] = useState<Set<number>>(new Set());
  const [rawCsvInput, setRawCsvInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): ExtractedExample[] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++; 
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c)) rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c)) rows.push(currentRow);
    }
    
    if (rows.length < 2) return [];
    
    const headers = rows[0].map(h => h.toLowerCase().replace(/^"|"$/g, ''));
    const inputIdx = headers.findIndex(h => h.includes('input'));
    const outputIdx = headers.findIndex(h => h.includes('output'));
    
    if (inputIdx === -1 || outputIdx === -1) return [];
    
    return rows.slice(1).map(row => ({
      input: row[inputIdx]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
      output: row[outputIdx]?.replace(/^"|"$/g, '').replace(/""/g, '"') || ''
    })).filter(r => r.input && r.output);
  };

  const handleCsvFileUpload = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const results = parseCSV(text);
      if (results.length === 0) {
        setError("Could not parse CSV or missing input/output columns");
        return;
      }
      setCsvPreview(results);
      setSelectedCsvIndices(new Set(results.map((_, i) => i)));
    };
    reader.readAsText(file);
  };
  
  const handleCsvTextParse = () => {
    if (!rawCsvInput.trim()) return;
    setError(null);
    const results = parseCSV(rawCsvInput);
    if (results.length === 0) {
       setError("Invalid CSV format. Header row required.");
       return;
    }
    setCsvPreview(results);
    setSelectedCsvIndices(new Set(results.map((_, i) => i)));
  };

  const handleImportSelectedCsv = () => {
    if (!csvPreview) return;
    const selected = csvPreview.filter((_, i) => selectedCsvIndices.has(i));
    onImport(selected);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setCsvPreview(null);
    setRawCsvInput('');
    setSelectedCsvIndices(new Set());
    setError(null);
  };

  const toggleCsvSelection = (index: number) => {
    const newSet = new Set(selectedCsvIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedCsvIndices(newSet);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCsvFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-5xl h-[85vh] flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500">
        <button 
          onClick={() => { handleReset(); onClose(); }} 
          className="absolute top-4 right-4 lg:top-8 lg:right-8 text-on-surface-variant hover:text-primary transition-colors z-[210]"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="p-6 lg:p-10 pb-0">
          <h2 className="text-2xl lg:text-3xl font-medium tracking-tight mb-2">Import from CSV</h2>
          <p className="text-on-surface-variant text-base opacity-60">Upload a CSV file containing <strong>input</strong> and <strong>output</strong> columns.</p>
        </div>

        <div className="flex-1 p-6 lg:p-10 pt-4 overflow-hidden flex flex-col">
          {!csvPreview ? (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto lg:overflow-visible">
              <div 
                onDragOver={onDragOver} 
                onDragLeave={onDragLeave} 
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 min-h-[200px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-surface-variant/30 hover:bg-surface-container'}`}
              >
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleCsvFileUpload(e.target.files[0])} accept=".csv" className="hidden" />
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/50">upload_file</span>
                <div className="text-center">
                    <p className="text-lg font-bold">Click to upload or drag and drop</p>
                    <p className="text-base text-on-surface-variant">CSV files only</p>
                </div>
              </div>
              
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-surface-variant/30"></div>
                <span className="text-base font-bold text-on-surface-variant/50 uppercase">OR</span>
                <div className="flex-1 h-px bg-surface-variant/30"></div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                  <textarea 
                    value={rawCsvInput}
                    onChange={(e) => setRawCsvInput(e.target.value)}
                    placeholder={`input,output\n"{ \"item\": \"book\" }","{ \"total\": 40 }"`}
                    className="flex-1 bg-surface-container border border-surface-variant/10 rounded-2xl p-4 text-base font-mono focus:outline-none focus:border-primary/30 min-h-[150px] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    {error && <span className="text-error text-sm font-bold">{error}</span>}
                    <button 
                      onClick={handleCsvTextParse} 
                      disabled={!rawCsvInput.trim()}
                      className="self-end px-8 py-3 bg-surface-variant text-on-surface rounded-full font-bold text-base hover:bg-on-surface hover:text-background transition-all disabled:opacity-50"
                    >
                      Parse Text
                    </button>
                  </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden gap-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-on-surface-variant">{csvPreview.length} examples found</span>
                <button onClick={handleReset} className="text-primary font-bold text-base hover:underline">Reset</button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar border border-surface-variant/20 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container sticky top-0 z-10">
                    <tr>
                      <th className="p-4 w-12 border-b border-surface-variant/20">
                        <input 
                          type="checkbox" 
                          checked={selectedCsvIndices.size === csvPreview.length}
                          onChange={() => {
                            if (selectedCsvIndices.size === csvPreview.length) setSelectedCsvIndices(new Set());
                            else setSelectedCsvIndices(new Set(csvPreview.map((_, i) => i)));
                          }}
                          className="w-5 h-5 rounded border-surface-variant/50 bg-surface accent-primary cursor-pointer" 
                        />
                      </th>
                      <th className="p-4 font-bold text-base text-on-surface-variant border-b border-surface-variant/20">Input</th>
                      <th className="p-4 font-bold text-base text-on-surface-variant border-b border-surface-variant/20">Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/10">
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} onClick={() => toggleCsvSelection(idx)} className={`group hover:bg-surface-container cursor-pointer transition-colors ${selectedCsvIndices.has(idx) ? 'bg-primary/5' : ''}`}>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedCsvIndices.has(idx)}
                              onChange={() => toggleCsvSelection(idx)}
                              className="w-5 h-5 rounded border-surface-variant/50 bg-surface accent-primary cursor-pointer"
                            />
                        </td>
                        <td className="p-4 font-mono text-sm text-on-surface/80 max-w-[300px] truncate">{row.input}</td>
                        <td className="p-4 font-mono text-sm text-on-surface/80 max-w-[300px] truncate">{row.output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 lg:p-10 pt-4 border-t border-surface-variant/10 bg-surface flex justify-end gap-4">
            <button onClick={() => { handleReset(); onClose(); }} className="px-8 py-4 rounded-full font-bold text-base bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-all">Cancel</button>
            <button 
              onClick={handleImportSelectedCsv} 
              disabled={!csvPreview || selectedCsvIndices.size === 0} 
              className="px-10 py-4 rounded-full font-bold text-base bg-primary text-background shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed transition-all"
            >
              Import Selected ({selectedCsvIndices.size})
            </button>
        </div>
      </div>
    </div>
  );
};

export default CsvModal;