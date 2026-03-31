import React from 'react';

const WithTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <div className="group/tooltip relative flex items-center justify-center">
    {children}
    <div className="hidden lg:block absolute top-full mt-2.5 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 w-max max-w-[220px] px-3 py-1.5 bg-surface-container-high border border-surface-variant/30 rounded-lg text-xs font-medium text-on-surface shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 delay-500 pointer-events-none z-[200] text-center whitespace-normal">
      {text}
    </div>
  </div>
);

export default WithTooltip;