import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ExamplePair, AnalysisResult, AnalysisStatus, ExtractedExample, ChatMessage, Scenario } from './types';
import ExampleInput from './components/ExampleInput';
import ConfidenceBar from './components/ConfidenceBar';
import FormattedMessage from './components/FormattedMessage';
import WithTooltip from './components/WithTooltip';
import SectionHeader from './components/SectionHeader';
import { analyzeProtocol, generateDocumentation, extractDataFromText, askAiAboutProtocol } from './services/geminiService';

// Modals
import DemoModal from './components/modals/DemoModal';
import CurlModal from './components/modals/CurlModal';
import CsvModal from './components/modals/CsvModal';
import ExportModal from './components/modals/ExportModal';
import CiCdModal from './components/modals/CiCdModal';
import CompareModal from './components/modals/CompareModal';
import ValidationModal from './components/modals/ValidationModal';
import DiagnosisModal from './components/modals/DiagnosisModal';
import ResetConfirmationModal from './components/modals/ResetConfirmationModal';

const ONBOARDING_KEY = 'protocolsense_onboarded';

const TOUR_STEPS = [
  { title: "Training set", content: "Collect your input/output pairs. The more examples you provide, the sharper the patterns become.", targetId: "tour-examples" },
  { title: "Analyze", content: "Let AI reverse-engineer the protocols hidden within your data examples.", targetId: "tour-discover" },
  { title: "Results", content: "View the discovered rules and system context in a clean, high-level summary.", targetId: "tour-analysis-area" },
  { title: "Validation", content: "Verify findings by testing new, unseen inputs against the inferred logic.", targetId: "tour-assistant" }
];

const INFERENCE_PIPELINE = [
  { step: "Feature Extraction", description: "Decomposing raw I/O pairs into primitive data structures and identifying recurring schema properties." },
  { step: "Pattern Correlation", description: "Establishing statistical mappings between specific input mutations and resulting variations in output payloads." },
  { step: "Conflict Resolution", description: "Iteratively testing hypotheses against the training set to identify and eliminate logic-violating assumptions." },
  { step: "Boundary Definition", description: "Determining the logical predicates and environmental constraints that govern individual rule activation." },
  { step: "Evidence Weighting", description: "Assigning confidence scores based on the quantity and diversity of supporting examples relative to total sample size." }
];

const LOADING_STEPS = [
  "Parsing input/output pairs...",
  "Identifying patterns...",
  "Inferring business rules...",
  "Calculating confidence scores...",
  "Validating against examples...",
  "Generating documentation..."
];

const LOADING_TIPS = [
  "Tip: More examples = more accurate rules",
  "Did you know? ProtocolSense can detect edge cases automatically",
  "Tip: Use the AI assistant to explore discovered rules",
  "Tip: Try extracting examples from natural language text",
  "Tip: You can export the inferred protocol as TypeScript types"
];

const ASSISTANT_QUICK_ACTIONS = [
  "Validate an input",
  "Diagnose a failure",
  "Explain the rules",
  "Find edge cases",
  "What could break?"
];

export const App: React.FC = () => {
  const [projectName, setProjectName] = useState('Untitled protocol');
  const [examples, setExamples] = useState<ExamplePair[]>([{ id: '1', input: '', output: '' }]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [tourIndex, setTourIndex] = useState(-1);
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [toast, setToast] = useState<string | null>(null);
  
  const [expandContext, setExpandContext] = useState(true);
  const [expandRules, setExpandRules] = useState(true);
  const [expandPipeline, setExpandPipeline] = useState(false);
  
  const [deletedSnapshot, setDeletedSnapshot] = useState<{ item: ExamplePair, index: number } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Modal states
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showCiCdModal, setShowCiCdModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const [inputMode, setInputMode] = useState<'json' | 'nl'>('json');
  const [nlInputText, setNlInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<ExtractedExample | null>(null);

  const projectIdPlaceholder = useRef(Math.random().toString(36).substr(2, 6).toUpperCase());
  const webhookUrl = `https://api.protocolsense.dev/validate/${projectIdPlaceholder.current}`;

  // Docs state
  const [docsMarkdown, setDocsMarkdown] = useState<string | null>(null);

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!onboarded) setTimeout(() => setTourIndex(0), 1000);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    if (status === AnalysisStatus.LOADING) {
      setLoadingStep(0);
      setLoadingTipIndex(0);
      setProgress(0);

      const stepInterval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 5000);

      const tipInterval = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 5000);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
            const next = prev + (100 / 300); // ~30s for 100%
            return next >= 100 ? 100 : next;
        });
      }, 100);

      return () => {
        clearInterval(stepInterval);
        clearInterval(tipInterval);
        clearInterval(progressInterval);
      };
    }
  }, [status]);

  useEffect(() => {
    if (tourIndex >= 0 && tourIndex < TOUR_STEPS.length) {
      const step = TOUR_STEPS[tourIndex];
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightStyle({ 
          '--mask-x': `${rect.left + rect.width / 2}px`, 
          '--mask-y': `${rect.top + rect.height / 2}px`, 
          '--mask-size': `${Math.max(rect.width, rect.height) / 2 + 30}px` 
        } as React.CSSProperties);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setSpotlightStyle({ '--mask-size': '0px' } as React.CSSProperties);
    }
  }, [tourIndex]);
  
  const completeOnboarding = () => { localStorage.setItem(ONBOARDING_KEY, 'true'); setTourIndex(-1); };

  const performReset = () => {
    setProjectName('Untitled protocol');
    setExamples([{ id: '1', input: '', output: '' }]);
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    setError(null);
    setShowDocsModal(false);
    setDocsMarkdown(null);
    setToast(null);
    setExtractedPreview(null);
    setNlInputText('');
    setShowCodeModal(false);
    setShowCompareModal(false);
    setShowCurlModal(false);
    setShowCiCdModal(false);
    setShowDemoModal(false);
    setShowValidationModal(false);
    setShowDiagnosisModal(false);
    setShowResetConfirmation(false);
    setChatMessages([]);
    setExpandPipeline(false);
  };

  const handleReset = () => {
    const hasData = result !== null || 
                    chatMessages.length > 0 || 
                    examples.length > 1 || 
                    (examples.length === 1 && (examples[0].input.trim() || examples[0].output.trim()));

    if (hasData) {
      setShowResetConfirmation(true);
    } else {
      performReset();
    }
  };

  const addExtractedExample = () => {
    if (!extractedPreview) return;
    const newEx: ExamplePair = { 
      id: Math.random().toString(36).substring(2, 9), 
      input: extractedPreview.input, 
      output: extractedPreview.output 
    };
    setExamples([newEx, ...examples]);
    setExtractedPreview(null);
    setNlInputText('');
    setToast("Example added");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDiscardExtraction = () => {
    setExtractedPreview(null);
    setNlInputText('');
  };
  
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast("Copied to clipboard");
    setTimeout(() => setToast(null), 3000);
  };
  
  const handleAiChat = async (input?: string) => {
    const text = input || chatInput;
    if (!text.trim()) return;
    
    if (text === "Diagnose a failure") {
      if (!result) {
        setToast("Analyze examples first before diagnosing failures");
        return;
      }
      setShowDiagnosisModal(true);
      return;
    }

    if (!result) return;

    if (text.toLowerCase().includes("validate")) {
      setShowValidationModal(true);
      return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await askAiAboutProtocol(text, result, history);
      const assistantMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: Date.now() };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setToast("AI response failed.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDiagnosisComplete = (response: string, request: string, error: string) => {
      const userMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: `**Diagnose Failure:**\nRequest: ${request}\nError: ${error}`, 
        timestamp: Date.now() 
      };
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, userMsg, aiMsg]);
  };

  const loadScenario = async (scenario: Scenario) => {
    setShowDemoModal(false);
    setExamples(scenario.examples);
    setProjectName(scenario.title);
    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const data = await analyzeProtocol(scenario.examples);
      setResult(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (e) {
      console.error(e);
      setError("The protocol analysis engine encountered an issue. Please check your training set and try again.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleAnalyze = async () => {
    const valid = examples.filter(e => e.input.trim() && e.output.trim());
    if (valid.length === 0) {
      setToast("Please add at least one example to analyze.");
      return;
    }
    
    const prevResult = result;

    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const data = await analyzeProtocol(valid);
      setResult(data);
      setStatus(AnalysisStatus.SUCCESS);

      if (prevResult) {
        const prevRulesJson = JSON.stringify(prevResult.rules);
        const newRulesJson = JSON.stringify(data.rules);
        
        if (prevRulesJson === newRulesJson) {
           setToast("No changes detected");
        } else {
           setToast("Analysis updated");
        }
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to decipher system logic. Ensure your examples are sufficiently diverse and formatted correctly.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleSmartExtract = async () => {
    if (!nlInputText.trim()) return;
    setIsExtracting(true);
    try {
      const extracted = await extractDataFromText(nlInputText);
      setExtractedPreview(extracted);
    } catch (e) {
      setToast("Couldn't extract input/output pair. Try rephrasing.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImportCurl = (example: ExtractedExample) => {
      setExamples([{ id: Date.now().toString(), ...example }, ...examples]);
      setToast("Example imported from cURL");
      setTimeout(() => setToast(null), 3000);
  };

  const handleImportCsv = (newExamples: ExtractedExample[]) => {
    const examplesToAdd = newExamples.map(ex => ({
        id: Math.random().toString(36).substring(2, 9),
        input: ex.input,
        output: ex.output
    }));
    setExamples([...examplesToAdd, ...examples]);
    setToast(`${newExamples.length} examples imported from CSV`);
  };

  const handleGenerateDocs = async () => {
    if (!result) return;
    setDocsMarkdown(null);
    setShowDocsModal(true);
    try {
      const md = await generateDocumentation(result, examples);
      setDocsMarkdown(md);
    } catch (e) {
      setDocsMarkdown("Failed to generate documentation.");
    }
  };

  const handleRemoveExample = (id: string) => {
    const index = examples.findIndex(e => e.id === id);
    if (index === -1) return;
    
    const item = examples[index];
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    setDeletedSnapshot({ item, index });
    setExamples(prev => prev.filter(e => e.id !== id));
    
    undoTimeoutRef.current = setTimeout(() => {
      setDeletedSnapshot(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleUndoExample = () => {
    if (!deletedSnapshot) return;
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    setExamples(prev => {
      const newArr = [...prev];
      newArr.splice(deletedSnapshot.index, 0, deletedSnapshot.item);
      return newArr;
    });
    setDeletedSnapshot(null);
  };

  const formatRuleId = (id: string) => {
    return id.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div className="flex flex-col bg-background text-on-surface font-sans min-h-screen lg:h-screen lg:overflow-hidden relative">
      <header className="relative shrink-0 bg-background flex flex-col lg:flex-row items-center justify-between px-4 lg:px-10 py-4 lg:py-0 lg:h-20 z-[170] gap-4 lg:gap-0 border-b lg:border-none border-surface-variant/10">
        <div className="flex items-center cursor-pointer select-none group" onClick={handleReset}>
          <h1 className="text-xl lg:text-2xl font-medium text-on-surface tracking-tight group-hover:text-primary transition-colors">ProtocolSense</h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-4 w-full lg:w-auto">
          <WithTooltip text="Set up automated validation webhooks">
            <button onClick={() => setShowCiCdModal(true)} className="group cursor-pointer flex items-center gap-2 text-base font-bold text-on-surface/60 px-2 lg:px-3 py-2 hover:text-primary transition-all rounded-full hover:bg-surface-variant/30">
              <span className="material-symbols-outlined text-2xl">integration_instructions</span>
              <span className="hidden lg:block max-w-0 overflow-hidden lg:group-hover:max-w-xs transition-all duration-500 ease-in-out">CI/CD</span>
            </button>
          </WithTooltip>
          
          <WithTooltip text="Compare behavior between two system versions">
            <button onClick={() => setShowCompareModal(true)} className="group cursor-pointer flex items-center gap-2 text-base font-bold text-on-surface/60 px-2 lg:px-3 py-2 hover:text-primary transition-all rounded-full hover:bg-surface-variant/30">
              <span className="material-symbols-outlined text-2xl">difference</span>
              <span className="hidden lg:block max-w-0 overflow-hidden lg:group-hover:max-w-xs transition-all duration-500 ease-in-out">Diff</span>
            </button>
          </WithTooltip>

          {status === AnalysisStatus.SUCCESS && (
            <WithTooltip text="Export as TypeScript, Python, Zod, or OpenAPI">
              <button onClick={() => setShowCodeModal(true)} className="group cursor-pointer flex items-center gap-2 text-base font-bold text-primary px-3 lg:px-4 py-2 border border-primary/20 rounded-full hover:bg-primary/10 transition-all">
                  <span className="lg:hidden material-symbols-outlined text-xl">code</span>
                  <span className="hidden lg:inline">Export</span>
              </button>
            </WithTooltip>
          )}

          <WithTooltip text="Restart onboarding tour">
             <button onClick={() => setTourIndex(0)} className="group cursor-pointer flex items-center justify-center w-10 h-10 text-on-surface/60 hover:text-primary transition-all rounded-full hover:bg-surface-variant/30">
                <span className="material-symbols-outlined text-xl">help</span>
             </button>
          </WithTooltip>

          <div className="w-px h-6 bg-surface-variant/20 hidden lg:block mx-1"></div>

          <WithTooltip text="Load sample data to explore features">
            <button 
              onClick={() => setShowDemoModal(true)} 
              className="bg-primary text-background px-5 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-sm"
            >
              Try Demo
            </button>
          </WithTooltip>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        <aside id="tour-examples" className="w-full lg:w-[400px] flex flex-col shrink-0 bg-background px-4 lg:px-8 py-4 border-b lg:border-b-0 lg:border-r border-surface-variant/5 h-auto lg:h-full lg:overflow-hidden">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl lg:text-2xl font-medium tracking-tight">Training set</h2>
              {examples.length > 0 && (
                <span className="text-sm font-bold text-on-surface-variant/80 bg-surface-container-high border border-surface-variant/20 px-2.5 py-0.5 rounded-full tabular-nums">
                  {examples.length}
                </span>
              )}
            </div>
            <div className="flex bg-surface-container rounded-full p-1 border border-surface-variant/20">
              <button onClick={() => setInputMode('json')} className={`text-sm lg:text-base font-bold px-3 lg:px-4 py-1 rounded-full transition-all ${inputMode === 'json' ? 'bg-primary text-background' : 'text-on-surface-variant'}`}>JSON</button>
              <button onClick={() => setInputMode('nl')} className={`text-sm lg:text-base font-bold px-3 lg:px-4 py-1 rounded-full transition-all ${inputMode === 'nl' ? 'bg-primary text-background' : 'text-on-surface-variant'}`}>Smart</button>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2 shrink-0">
            {inputMode === 'json' ? (
              <>
                <button onClick={() => setExamples([{ id: Date.now().toString(), input: '', output: '' }, ...examples])} className="flex flex-col items-center justify-center gap-1 py-2 border border-dashed border-primary/20 rounded-md3-item text-xs lg:text-base font-bold text-primary hover:bg-primary/5 transition-all"><span className="material-symbols-outlined text-xl lg:text-2xl">add</span>Manual</button>
                <button onClick={() => setShowCurlModal(true)} className="flex flex-col items-center justify-center gap-1 py-2 border border-dashed border-secondary/20 rounded-md3-item text-xs lg:text-base font-bold text-secondary hover:bg-secondary/5 transition-all"><span className="material-symbols-outlined text-xl lg:text-2xl">terminal</span>cURL</button>
                <button onClick={() => setShowCsvModal(true)} className="flex flex-col items-center justify-center gap-1 py-2 border border-dashed border-warning/20 rounded-md3-item text-xs lg:text-base font-bold text-warning hover:bg-warning/5 transition-all"><span className="material-symbols-outlined text-xl lg:text-2xl">table_chart</span>CSV</button>
              </>
            ) : (
              <div className="col-span-3">
                {!extractedPreview ? (
                  <div className="bg-surface-container rounded-md3-item p-4 space-y-3 border border-transparent focus-within:border-primary/20 transition-all">
                     <textarea 
                       value={nlInputText} 
                       onChange={e => setNlInputText(e.target.value)} 
                       placeholder='e.g. A wire transfer of 5000 USD charges 0.5% fee...' 
                       className="w-full bg-background/40 border border-transparent rounded-xl p-3 text-base focus:bg-background focus:outline-none min-h-[100px] resize-none placeholder:text-on-surface-variant/30" 
                     />
                     <button 
                       onClick={handleSmartExtract} 
                       disabled={isExtracting || !nlInputText.trim()} 
                       className="w-full bg-primary/10 text-primary hover:bg-primary/20 py-3 rounded-full text-base font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                     >
                       {isExtracting ? (
                         <>
                           <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                           <span>Extracting...</span>
                         </>
                       ) : (
                         <>
                           <span className="material-symbols-outlined text-lg">auto_awesome</span>
                           <span>Extract JSON Pair</span>
                         </>
                       )}
                     </button>
                  </div>
                ) : (
                  <div className="bg-surface-container rounded-md3-item p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-primary flex items-center gap-1">
                         <span className="material-symbols-outlined text-base">check_circle</span>
                         Review Extraction
                      </h3>
                      <button onClick={handleDiscardExtraction} className="text-xs font-bold text-on-surface-variant hover:text-error">Discard</button>
                    </div>
                    
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider ml-1">Input</label>
                       <textarea 
                         value={extractedPreview.input} 
                         onChange={(e) => setExtractedPreview({...extractedPreview, input: e.target.value})}
                         className="w-full bg-background/60 border border-transparent rounded-xl p-3 text-sm font-mono focus:bg-background focus:border-primary/30 focus:outline-none min-h-[120px]" 
                       />
                    </div>

                    <div className="space-y-1">
                       <label className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider ml-1">Output</label>
                       <textarea 
                         value={extractedPreview.output} 
                         onChange={(e) => setExtractedPreview({...extractedPreview, output: e.target.value})}
                         className="w-full bg-background/60 border border-transparent rounded-xl p-3 text-sm font-mono focus:bg-background focus:border-primary/30 focus:outline-none min-h-[120px]" 
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                       <button onClick={handleDiscardExtraction} className="py-2.5 rounded-full font-bold text-sm bg-surface-variant/50 text-on-surface hover:bg-surface-variant transition-colors">Discard</button>
                       <button onClick={addExtractedExample} className="py-2.5 rounded-full font-bold text-sm bg-primary text-background hover:opacity-90 transition-opacity shadow-lg">Accept</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {examples.map(ex => <ExampleInput key={ex.id} example={ex} isRemovable={examples.length > 1} onUpdate={(id, f, v) => setExamples(examples.map(e => e.id === id ? { ...e, [f]: v } : e))} onRemove={handleRemoveExample} />)}
          </div>

          {examples.length > 0 && (
            <div className="pt-4 mt-auto shrink-0 z-10 bg-background">
               <button 
                 id="tour-discover"
                 onClick={handleAnalyze}
                 disabled={status === AnalysisStatus.LOADING}
                 className="w-full bg-primary text-background py-3 lg:py-4 rounded-full font-bold text-base lg:text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
               >
                 {status === AnalysisStatus.LOADING ? (
                    <>
                      <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                 ) : (
                    <>
                      <span className="material-symbols-outlined">{result ? 'refresh' : 'play_arrow'}</span>
                      <span>{result ? 'Re-analyze' : `Analyze (${examples.length} example${examples.length === 1 ? '' : 's'})`}</span>
                    </>
                 )}
               </button>
            </div>
          )}
        </aside>

        <section className="flex-1 overflow-x-hidden bg-surface-container/30 px-4 lg:px-10 py-6 lg:py-10 space-y-8 lg:rounded-tl-[48px] relative lg:overflow-y-auto custom-scrollbar">
          {(status === AnalysisStatus.IDLE || status === AnalysisStatus.ERROR) && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 py-10 lg:py-0">
               <div className="space-y-6">
                 {status === AnalysisStatus.ERROR ? (
                   <>
                     <span className="material-symbols-outlined text-6xl lg:text-8xl text-error opacity-40 mb-4">error</span>
                     <h2 className="text-3xl lg:text-4xl font-medium tracking-tight text-error">Analysis Interrupted</h2>
                     <p className="text-lg lg:text-xl text-on-surface-variant font-light max-w-xl mx-auto">{error}</p>
                   </>
                 ) : (
                   <>
                     <h2 className="text-display">Reverse-engineer complex systems.</h2>
                     <p className="text-lg lg:text-2xl text-on-surface-variant font-light max-w-2xl mx-auto">
                       Designed for undocumented APIs, legacy systems, and brittle third-party integrations.
                     </p>
                   </>
                 )}
               </div>
               <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                 <button onClick={() => setShowDemoModal(true)} className="bg-primary text-background px-5 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-sm">
                   {status === AnalysisStatus.ERROR ? 'Try Scenario' : 'Try Demo'}
                 </button>
                 {status === AnalysisStatus.ERROR && (
                    <button onClick={handleAnalyze} className="bg-surface-variant text-on-surface px-6 py-3 rounded-full font-bold text-base hover:bg-on-surface hover:text-background transition-all shadow-sm w-full sm:w-auto">
                      Retry Analysis
                    </button>
                 )}
               </div>
            </div>
          )}

          {status === AnalysisStatus.LOADING && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-500 py-20 lg:py-0 relative overflow-hidden">
               {/* Decorative background glow */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />

               {/* Spinner */}
               <div className="relative w-32 h-32 mb-8">
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary via-aiPurple to-aiTeal rounded-full blur-xl opacity-20 animate-pulse" />
                 <div className="absolute inset-0 border-4 border-surface-variant/30 rounded-full" />
                 <div className="absolute inset-0 border-4 border-t-primary border-r-aiPurple border-b-transparent border-l-transparent rounded-full animate-spin duration-1000" />
               </div>
               
               <div className="flex flex-col items-center space-y-8 max-w-md w-full px-4">
                 {/* Step Message */}
                 <div className="h-16 flex items-center justify-center w-full">
                    <h2 key={loadingStep} className="text-2xl lg:text-3xl font-medium tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 text-center">
                      {LOADING_STEPS[loadingStep]}
                    </h2>
                 </div>

                 {/* Progress Bar */}
                 <div className="w-full space-y-4">
                    <div className="h-1.5 w-full bg-surface-variant/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-primary to-aiPurple transition-all duration-300 ease-linear rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    
                    {/* Tip */}
                    <div className="min-h-[3rem] flex items-center justify-center w-full">
                        <p key={loadingTipIndex} className="text-sm font-medium text-on-surface-variant/70 animate-in fade-in slide-in-from-bottom-1 duration-500 text-center leading-relaxed px-4">
                           {LOADING_TIPS[loadingTipIndex]}
                        </p>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {status === AnalysisStatus.SUCCESS && result && (
            <div id="tour-analysis-area" className="space-y-10 lg:space-y-16">
              <div className="space-y-4">
                 <SectionHeader title="System summary" isExpanded={expandContext} onToggle={() => setExpandContext(!expandContext)} />
                 {expandContext && <h3 className="text-xl lg:text-4xl tracking-tight text-on-surface/90 leading-tight font-medium">{result.system_summary}</h3>}
              </div>
              <div className="space-y-4">
                <SectionHeader title="Inference Pipeline" isExpanded={expandPipeline} onToggle={() => setExpandPipeline(!expandPipeline)} subtitle="Logic construction stages" />
                {expandPipeline && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {INFERENCE_PIPELINE.map((p, i) => (
                      <div key={i} className="bg-surface p-4 rounded-xl border border-primary/5 space-y-2">
                        <span className="text-base font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{i+1}. {p.step}</span>
                        <p className="text-base text-on-surface-variant">{p.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <SectionHeader title="Discovered Rules" isExpanded={expandRules} onToggle={() => setExpandRules(!expandRules)} />
                {expandRules && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {result.rules.map(rule => (
                      <div key={rule.id} className="bg-surface p-6 lg:p-8 rounded-md3-card border border-surface-variant/10 group hover:bg-surface-container-high transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-sm lg:text-base font-bold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/10">{formatRuleId(rule.id)}</span>
                          <ConfidenceBar confidence={rule.confidence} />
                        </div>
                        <h4 className="text-lg lg:text-2xl font-medium mb-4 leading-tight group-hover:text-primary transition-colors">{rule.description}</h4>
                        
                        <div className="space-y-4 mt-6 pt-6 border-t border-surface-variant/10">
                          
                          <div className="space-y-2">
                            <span className="text-base font-bold text-on-surface block">Observable Evidence</span>
                            <p className="text-base text-on-surface-variant leading-relaxed">{rule.evidence}</p>
                          </div>

                          {rule.supporting_examples && rule.supporting_examples.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {rule.supporting_examples.map((ex, idx) => (
                                <span key={idx} className="px-2 py-1 bg-surface-variant/40 rounded text-sm lg:text-base text-on-surface-variant font-mono">{ex}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div id="tour-assistant" className="mt-12 lg:mt-20 pb-20">
                <div className="ai-assistant-section relative p-6 lg:p-10 space-y-6">
                  <div className="ai-gradient-glow" />
                  <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900">Protocol Assistant</h3>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-4 pr-2">
                    {chatMessages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[95%] lg:max-w-[85%] p-4 rounded-2xl text-base ${m.role === 'user' ? 'bg-black/40 text-white' : 'bg-black/60 text-white'}`}>
                          <FormattedMessage content={m.content} />
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                       <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="bg-black/60 p-4 rounded-2xl rounded-tl-none text-white flex gap-1.5 items-center">
                              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                          </div>
                       </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ASSISTANT_QUICK_ACTIONS.map(a => <button key={a} onClick={() => handleAiChat(a)} className="px-3 py-1.5 bg-black/10 border border-black/15 rounded-full text-sm lg:text-base font-bold text-neutral-900 hover:bg-black/20 transition-all">{a}</button>)}
                  </div>
                  <form onSubmit={e => { e.preventDefault(); handleAiChat(); }} className="relative">
                    <input 
                      type="text" 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      disabled={isChatLoading}
                      placeholder={isChatLoading ? "Thinking..." : "Ask anything about this protocol..."}
                      className={`w-full bg-white/40 border border-white/60 rounded-full px-5 lg:px-8 py-3 lg:py-5 text-neutral-900 placeholder:text-neutral-900/50 focus:outline-none transition-all ${isChatLoading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    />
                    <button 
                      disabled={isChatLoading || !chatInput.trim()}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 lg:w-12 lg:h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-lg transition-all ${isChatLoading || !chatInput.trim() ? 'opacity-50 scale-95' : 'hover:scale-105 active:scale-95'}`}
                    >
                      {isChatLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined">send</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* TOUR OVERLAY */}
      {tourIndex >= 0 && (
        <>
          <div className="spotlight-mask" style={spotlightStyle} />
          <div className="fixed inset-0 z-[250] pointer-events-none flex items-center justify-center">
            <div className="pointer-events-auto bg-surface border border-surface-variant/20 p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 flex flex-col gap-4 animate-in zoom-in-95 fade-in duration-300">
               <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Step {tourIndex + 1} of {TOUR_STEPS.length}</span>
                    <h3 className="text-xl font-bold mt-1">{TOUR_STEPS[tourIndex].title}</h3>
                  </div>
                  <button onClick={() => setTourIndex(-1)} className="text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined">close</span>
                  </button>
               </div>
               <p className="text-on-surface-variant text-base leading-relaxed">{TOUR_STEPS[tourIndex].content}</p>
               <div className="flex justify-between items-center pt-2">
                 <button 
                   onClick={() => setTourIndex(Math.max(0, tourIndex - 1))} 
                   disabled={tourIndex === 0}
                   className="text-sm font-bold text-on-surface-variant hover:text-on-surface disabled:opacity-30 px-3 py-2"
                 >
                   Back
                 </button>
                 <button 
                   onClick={() => {
                     if (tourIndex < TOUR_STEPS.length - 1) setTourIndex(tourIndex + 1);
                     else completeOnboarding();
                   }}
                   className="bg-primary text-background px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-lg"
                 >
                   {tourIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                 </button>
               </div>
            </div>
          </div>
        </>
      )}

      <DemoModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
        onSelectScenario={loadScenario} 
      />

      <CurlModal 
        isOpen={showCurlModal} 
        onClose={() => setShowCurlModal(false)} 
        onImport={handleImportCurl} 
      />

      <CsvModal 
        isOpen={showCsvModal} 
        onClose={() => setShowCsvModal(false)} 
        onImport={handleImportCsv} 
      />

      <ExportModal 
        isOpen={showCodeModal} 
        onClose={() => setShowCodeModal(false)} 
        result={result} 
        projectName={projectName} 
      />

      <CiCdModal 
        isOpen={showCiCdModal} 
        onClose={() => setShowCiCdModal(false)} 
        webhookUrl={webhookUrl} 
      />

      <CompareModal 
        isOpen={showCompareModal} 
        onClose={() => setShowCompareModal(false)} 
        baseExamples={examples} 
      />

      <ValidationModal 
        isOpen={showValidationModal} 
        onClose={() => setShowValidationModal(false)} 
        result={result} 
      />

      <DiagnosisModal 
        isOpen={showDiagnosisModal} 
        onClose={() => setShowDiagnosisModal(false)} 
        result={result} 
        onDiagnosisComplete={handleDiagnosisComplete}
      />

      <ResetConfirmationModal 
        isOpen={showResetConfirmation} 
        onClose={() => setShowResetConfirmation(false)} 
        onConfirm={performReset} 
      />

      {showDocsModal && docsMarkdown && (
         <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-surface w-full max-w-4xl h-[80vh] flex flex-col rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in zoom-in-95 duration-300">
               <button onClick={() => setShowDocsModal(false)} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors z-20">
                 <span className="material-symbols-outlined text-2xl">close</span>
               </button>
               <div className="p-8 pb-4 shrink-0">
                 <h2 className="text-2xl font-medium tracking-tight">Documentation</h2>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
                  <div className="prose prose-invert max-w-none">
                     <FormattedMessage content={docsMarkdown} />
                  </div>
               </div>
             </div>
         </div>
      )}
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] flex flex-col gap-2 items-center w-full max-w-md pointer-events-none">
        {deletedSnapshot && (
          <div className="pointer-events-auto bg-surface border border-surface-variant/20 shadow-2xl rounded-full px-6 py-3 text-base font-bold text-on-surface animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">delete</span>
              <span>Example deleted</span>
            </div>
            <button 
              onClick={handleUndoExample}
              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-bold transition-colors"
            >
              Undo
            </button>
          </div>
        )}

        {toast && (
          <div className="pointer-events-auto bg-surface border border-surface-variant/20 shadow-2xl rounded-full px-6 py-3 text-base font-bold text-on-surface animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">info</span>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};