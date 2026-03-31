import React from 'react';

const SimpleCodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  const highlight = (text: string) => {
    const keywords = /\b(import|export|interface|type|class|const|let|var|function|return|if|else|for|while|from|as|async|await|try|catch|def|class|str|int|bool|float|None|True|False)\b/g;
    const types = /\b(string|number|boolean|any|void|Promise|Array|Record|Object)\b/g;
    const comments = /(\/\/.*$|#.*$)/gm;
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(comments, '<span class="text-on-surface-variant opacity-70 italic">$1</span>');
    html = html.replace(keywords, '<span class="text-primary font-bold">$1</span>');
    html = html.replace(types, '<span class="text-secondary font-bold">$1</span>');

    return html;
  };

  return (
    <pre 
      className="p-4 lg:p-8 text-sm lg:text-base font-mono leading-relaxed h-full overflow-y-auto custom-scrollbar bg-[#0d0e10]"
      dangerouslySetInnerHTML={{ __html: highlight(code) }} 
    />
  );
};

export default SimpleCodeBlock;