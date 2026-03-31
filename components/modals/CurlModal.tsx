import React, { useState } from 'react';
import { extractDataFromCurl } from '../../services/geminiService';
import { ExtractedExample } from '../../types';

interface CurlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (example: ExtractedExample) => void;
}

const CurlModal: React.FC<CurlModalProps> = ({ isOpen, onClose, onImport }) => {
  const [curlCommand, setCurlCommand] = useState('');
  const [curlResponse, setCurlResponse] = useState('');
  const [isImportingCurl, setIsImportingCurl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImportCurl = async () => {
    if (!curlCommand.trim()) return;
    setIsImportingCurl(true);
    setError(null);
    try {
      const extracted = await extractDataFromCurl(curlCommand, curlResponse);
      onImport(extracted);
      setCurlCommand('');
      setCurlResponse('');
      onClose();
    } catch (e) {
      setError("Failed to parse cURL command or response.");
    } finally {
      setIsImportingCurl(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-2xl flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500">
        <button onClick={onClose} className="absolute top-4 right-4 lg:top-8 lg:right-8 text-on-surface-variant hover:text-primary transition-colors z-20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="p-6 lg:p-10 pb-0">
          <h2 className="text-2xl lg:text-3xl font-medium tracking-tight mb-2">Import from cURL</h2>
          <p className="text-on-surface-variant text-base opacity-60">Paste a raw cURL command to extract the request payload.</p>
        </div>

        <div className="p-6 lg:p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-base font-bold text-on-surface/60">cURL Command</label>
            <textarea 
              value={curlCommand} 
              onChange={(e) => setCurlCommand(e.target.value)} 
              placeholder={`curl -X POST https://api.example.com/endpoint -d '{"item": "book"}'`}
              className="w-full bg-surface-container border border-surface-variant/10 rounded-2xl p-4 text-base font-mono focus:outline-none focus:border-primary/30 min-h-[120px] resize-none placeholder:text-on-surface-variant/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-bold text-on-surface/60">Response Received</label>
            <textarea 
              value={curlResponse} 
              onChange={(e) => setCurlResponse(e.target.value)} 
              placeholder='Paste the response you received...' 
              className="w-full bg-surface-container border border-surface-variant/10 rounded-2xl p-4 text-base font-mono focus:outline-none focus:border-primary/30 min-h-[120px] resize-none placeholder:text-on-surface-variant/30"
            />
          </div>

          {error && (
            <div className="text-error text-sm font-bold">{error}</div>
          )}

          <div className="flex gap-4 pt-2">
            <button onClick={onClose} className="flex-1 py-4 rounded-full font-bold text-base bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-all">
              Cancel
            </button>
            <button onClick={handleImportCurl} disabled={!curlCommand.trim() || isImportingCurl} className="flex-1 py-4 rounded-full font-bold text-base bg-primary text-background hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl">
              {isImportingCurl ? 'Parsing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurlModal;