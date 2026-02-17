'use client';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function renderMarkdown(text: string): string {
  // Strip any raw HTML tags for safety
  let safe = text.replace(/<[^>]*>/g, '');

  // Escape HTML entities
  safe = safe
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');

  // Bold: **text** → <strong>text</strong>
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Process lines for bullet lists and paragraphs
  const lines = safe.split('\n');
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        result.push('<ul class="list-disc list-inside space-y-1 my-1">');
        inList = true;
      }
      result.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      if (trimmed === '') {
        result.push('<br />');
      } else {
        result.push(`<p>${trimmed}</p>`);
      }
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('');
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const html = renderMarkdown(content);

  return (
    <div
      className={`text-sm text-text-primary leading-relaxed [&_strong]:font-semibold [&_ul]:text-text-secondary [&_p]:mb-1 last:[&_p]:mb-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
