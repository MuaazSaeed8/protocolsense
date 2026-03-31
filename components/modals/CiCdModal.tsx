import React from 'react';

interface CiCdModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
}

const CiCdModal: React.FC<CiCdModalProps> = ({ isOpen, onClose, webhookUrl }) => {
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-12 overflow-hidden">
      <div className="bg-surface w-full max-w-3xl flex flex-col rounded-t-3xl sm:rounded-md3-card shadow-2xl relative border border-surface-variant/10 overflow-hidden animate-in slide-in-from-bottom duration-500 max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors z-20">
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        
        <div className="p-6 lg:p-8 pb-0 shrink-0">
          <h2 className="text-2xl font-medium tracking-tight mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">integration_instructions</span>
            CI/CD Integration
          </h2>
          <p className="text-on-surface-variant text-base">Automate protocol compliance checks in your deployment pipeline.</p>
        </div>

        <div className="p-6 lg:p-8 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-on-surface/80 uppercase tracking-wider">Webhook URL</label>
              <button onClick={() => handleCopyText(webhookUrl)} className="text-xs font-bold text-primary hover:underline">Copy</button>
            </div>
            <div className="bg-surface-container border border-surface-variant/20 rounded-xl p-4 font-mono text-sm text-on-surface-variant break-all select-all">
              {webhookUrl}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-on-surface/80 uppercase tracking-wider">Example cURL</label>
              <button onClick={() => handleCopyText(`curl -X POST ${webhookUrl} \\\n  -H "Content-Type: application/json" \\\n  -d @payload.json`)} className="text-xs font-bold text-primary hover:underline">Copy</button>
            </div>
            <div className="bg-black/30 border border-surface-variant/20 rounded-xl p-4 font-mono text-sm text-aiBlue overflow-x-auto whitespace-pre">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d @payload.json`}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-on-surface/80 uppercase tracking-wider">Response Format</label>
            </div>
            <div className="bg-black/30 border border-surface-variant/20 rounded-xl p-4 font-mono text-sm text-aiTeal overflow-x-auto whitespace-pre">
{`{
  "status": "VALID",
  "timestamp": 1715421231,
  "checks": {
    "schema_compliance": true,
    "behavioral_consistency": true
  }
}`}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-on-surface/80 uppercase tracking-wider">GitHub Actions Workflow</label>
              <button onClick={() => handleCopyText(`# .github/workflows/protocol-check.yml
name: Protocol Check
on: [push]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Protocol
        run: |
          curl -f -X POST ${webhookUrl} \\
          -H "Content-Type: application/json" \\
          -d @config/protocol.json`)} className="text-xs font-bold text-primary hover:underline">Copy</button>
            </div>
            <div className="bg-black/30 border border-surface-variant/20 rounded-xl p-4 font-mono text-sm text-on-surface-variant/80 overflow-x-auto whitespace-pre">
{`# .github/workflows/protocol-check.yml
name: Protocol Check
on: [push]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Protocol
        run: |
          curl -f -X POST ${webhookUrl} \\
          -H "Content-Type: application/json" \\
          -d @config/protocol.json`}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-surface-variant/10 bg-surface flex justify-end shrink-0">
            <button onClick={onClose} className="px-8 py-3 rounded-full font-bold text-base bg-surface-variant text-on-surface hover:bg-surface-variant/80 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
};

export default CiCdModal;