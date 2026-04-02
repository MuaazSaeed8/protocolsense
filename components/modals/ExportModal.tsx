import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../../types';
import SimpleCodeBlock from '../SimpleCodeBlock';
import { generateImplementationCode } from '../../services/geminiService';

type CodeLanguage = 'typescript' | 'python' | 'zod' | 'openapi';
const CODE_TABS: CodeLanguage[] = ['typescript', 'python', 'zod', 'openapi'];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  projectName: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, result, projectName }) => {
  const [selectedLang, setSelectedLang] = useState<CodeLanguage>('typescript');
  const [generatedCode, setGeneratedCode] = useState<Record<string, string>>({});
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !generatedCode['typescript'] && result) {
      handleTabChange('typescript');
    }
  }, [isOpen]);

  const handleTabChange = async (lang: CodeLanguage) => {
    setSelectedLang(lang);
    if (!generatedCode[lang] && result) {
      setIsGeneratingCode(true);
      setError(null);
      try {
        const code = await generateImplementationCode(result, lang);
        setGeneratedCode(prev => ({...prev, [lang]: code}));
      } catch (e) {
        setError(`Failed to generate ${lang} code`);
      } finally {
        setIsGeneratingCode(false);
      }
    }
  };

  const handleCopyCode = () => {
    const code = generatedCode[selectedLang];
    if (code) {
      navigator.clipboard.writeText(code);
    }
  };

  const FILE_EXT: Record<CodeLanguage, string> = {
    typescript: 'ts',
    python: 'py',
    zod: 'ts',
    openapi: 'yaml',
  };

  const handleDownload = (lang: CodeLanguage) => {
    const code = generatedCode[lang];
    if (!code) return;
    const ext = FILE_EXT[lang];
    const mime = ext === 'yaml' ? 'text/yaml' : 'text/plain';
    const blob = new Blob([code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-6xl h-[90vh] flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors z-20">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="p-6 lg:p-8 pb-0 shrink-0">
            <h2 className="text-2xl font-medium tracking-tight mb-2">Implementation & Export</h2>
            <p className="text-on-surface-variant text-base">Generate production-ready code based on the inferred protocol rules.</p>
        </div>

        <div className="flex px-6 lg:px-8 mt-6 border-b border-surface-variant/10 gap-6 shrink-0 overflow-x-auto">
          {CODE_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`pb-3 text-base font-bold capitalize transition-colors relative whitespace-nowrap ${selectedLang === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {tab}
              {selectedLang === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#0d0e10] relative overflow-hidden">
            {isGeneratingCode ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-mono">Generating {selectedLang} implementation...</span>
              </div>
            ) : generatedCode[selectedLang] ? (
              <SimpleCodeBlock code={generatedCode[selectedLang]!} lang={selectedLang} />
            ) : error ? (
               <div className="h-full flex items-center justify-center text-error font-medium">
                 {error}
               </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant/50 italic">
                No code generated yet.
              </div>
            )}
            
            <div className="absolute top-4 right-4 flex gap-2">
              {generatedCode[selectedLang] && (
                <button
                  onClick={() => handleDownload(selectedLang)}
                  className="bg-surface-container-high hover:bg-surface-variant text-on-surface px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2 border border-surface-variant/20"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  <span className="hidden sm:inline">Download .{FILE_EXT[selectedLang]}</span>
                </button>
              )}
              <button
                onClick={handleCopyCode}
                className="bg-primary text-background px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
                <span className="hidden sm:inline">Copy</span>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;