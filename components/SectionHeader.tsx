import React from 'react';

interface SectionHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, isExpanded, onToggle, subtitle }) => (
  <div onClick={onToggle} className="flex items-center justify-between group cursor-pointer py-4 select-none">
    <div className="flex flex-col">
      <h3 className="text-xl lg:text-2xl font-medium tracking-tight text-on-surface/90 group-hover:text-primary transition-colors">{title}</h3>
      {subtitle && <p className="text-base text-on-surface-variant opacity-60">{subtitle}</p>}
    </div>
    <div className={`transition-transform duration-500 ease-in-out ${isExpanded ? 'rotate-180' : ''}`}>
      <svg className="w-6 h-6 opacity-30 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
    </div>
  </div>
);

export default SectionHeader;