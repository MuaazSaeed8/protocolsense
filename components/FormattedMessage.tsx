import React from 'react';

const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-2.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed && i > 0 && i < lines.length - 1) return <div key={i} className="h-2" />;

        const boldify = (text: string) => {
          const parts = text.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={idx} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        };

        if (trimmed.startsWith('### ')) {
          return <h4 key={i} className="text-base font-bold text-white pt-2 pb-1 tracking-tight">{boldify(trimmed.slice(4))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="text-lg font-bold text-white pt-3 pb-1">{boldify(trimmed.slice(3))}</h3>;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-1 items-start leading-relaxed text-white/90">
              <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{boldify(trimmed.slice(2))}</span>
            </div>
          );
        }

        if (/^\d+\./.test(trimmed)) {
          return (
            <div key={i} className="flex gap-2 ml-1 items-start leading-relaxed text-white/90">
              <span className="text-primary font-bold tabular-nums">{trimmed.split('.')[0]}.</span>
              <span>{boldify(trimmed.split('.').slice(1).join('.').trim())}</span>
            </div>
          );
        }
        
        if (trimmed.startsWith('```')) {
            return null; // Don't render code block markers directly, we want content inside
        }
        
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
             return <div key={i} className="bg-black/30 p-3 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre">{trimmed}</div>
        }

        return <p key={i} className="text-base leading-relaxed text-white/90">{boldify(trimmed)}</p>;
      })}
    </div>
  );
};

export default FormattedMessage;