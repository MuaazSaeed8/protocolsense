import React from 'react';

interface ConfidenceBarProps {
  confidence: number;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const getColorClass = (val: number) => {
    if (val >= 90) return 'bg-primary';
    if (val >= 70) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
        <span className="opacity-60">Confidence</span>
        <span className="text-on-surface">{confidence}%</span>
      </div>
      <div className="h-0.5 w-16 bg-surface-variant/40 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColorClass(confidence)} transition-all duration-1200 ease-in-out rounded-full`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;