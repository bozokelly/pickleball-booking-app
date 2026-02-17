'use client';

import { useRef } from 'react';
import { Bold, List } from 'lucide-react';

interface MarkdownEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({ label, value, onChange, placeholder, rows = 4 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (prefix: string, suffix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    if (selected) {
      // Wrap selected text
      const newText = `${before}${prefix}${selected}${suffix}${after}`;
      onChange(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + prefix.length, end + prefix.length);
      });
    } else {
      // Insert placeholder
      const placeholder = `${prefix}text${suffix}`;
      const newText = `${before}${placeholder}${after}`;
      onChange(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + prefix.length, start + prefix.length + 4);
      });
    }
  };

  const insertBullet = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(start);
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const bullet = `${needsNewline ? '\n' : ''}- `;
    const newText = `${before}${bullet}${after}`;
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + bullet.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <div className="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-background border-b border-border">
          <button
            type="button"
            onClick={() => wrapSelection('**', '**')}
            className="p-1.5 rounded-lg hover:bg-white text-text-secondary hover:text-text-primary transition-colors"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={insertBullet}
            className="p-1.5 rounded-lg hover:bg-white text-text-secondary hover:text-text-primary transition-colors"
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none resize-none text-sm"
        />
      </div>
    </div>
  );
}
