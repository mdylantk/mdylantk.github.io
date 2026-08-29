export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderInline(text, handleEscChar = true) {
  if (handleEscChar) {
    text = escapeHtml(text);
  }
  // images ![alt](src)
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (m, alt, src, title) => `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''}>`);
  // links [text](href)
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (m, label, href, title) => `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener">${label}</a>`);
  // bold+italic ***text*** or ___text___
  text = text.replace(/(\*\*\*|___)(.+?)\1/g, '<strong><em>$2</em></strong>');
  // bold **text** or __text__
  text = text.replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>');
  // italic *text* or _text_
  text = text.replace(/(\*|_)(.+?)\1/g, '<em>$2</em>');
  // strikethrough ~~text~~
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  return text;
}

function renderTable(lines) {
  // lines[0] = header, lines[1] = separator, rest = rows
  const header = lines[0].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  const rows = lines.slice(2).map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  let html = '<table><thead><tr>';
  header.forEach(h => html += `<th>${renderInline(escapeHtml(h))}</th>`);
  html += '</tr></thead><tbody>';
  rows.forEach(r => {
    html += '<tr>';
    r.forEach(c => html += `<td>${renderInline(escapeHtml(c))}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

//planing to rename the to html function
export function markdownToHtml(src){
  return toHtml(src)
}

export function toHtml(src) {
  if (!src || !src.trim()) {
    return '';
  //  return '<p class="md-empty">Your rendered markdown will show up here…</p>';
  }

  const rawLines = src.replace(/\r\n/g, '\n').split('\n');
  let out = [];
  let i = 0;

  while (i < rawLines.length) {
    let line = rawLines[i];

    // blank line
    if (line.trim() === '') { i++; continue; }

    // fenced code block ```
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i++;
      while (i < rawLines.length && !/^```/.test(rawLines[i].trim())) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(`<pre><code${lang ? ` class="lang-${escapeHtml(lang)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push('<hr>');
      i++;
      continue;
    }

    // headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      out.push(`<h${level}>${renderInline(headerMatch[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // table (header row + separator row like |---|---|)
    if (/^\|?.+\|.+\|?$/.test(line) && rawLines[i + 1] && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(rawLines[i + 1])) {
      const tableLines = [line, rawLines[i + 1]];
      i += 2;
      while (i < rawLines.length && rawLines[i].includes('|') && rawLines[i].trim() !== '') {
        tableLines.push(rawLines[i]);
        i++;
      }
      out.push(renderTable(tableLines));
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < rawLines.length && /^>\s?/.test(rawLines[i])) {
        quoteLines.push(rawLines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${toHtml(quoteLines.join('\n'))}</blockquote>`);
      continue;
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < rawLines.length && /^\s*[-*+]\s+/.test(rawLines[i])) {
        items.push(renderInline(rawLines[i].replace(/^\s*[-*+]\s+/, '')));
        i++;
      }
      out.push(`<ul>${items.map(it => `<li>${it}</li>`).join('')}</ul>`);
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i])) {
        items.push(renderInline(rawLines[i].replace(/^\s*\d+\.\s+/, '')));
        i++;
      }
      out.push(`<ol>${items.map(it => `<li>${it}</li>`).join('')}</ol>`);
      continue;
    }

    // paragraph: gather consecutive non-blank, non-special lines
    const paraLines = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() !== '' &&
      !/^```/.test(rawLines[i].trim()) &&
      !/^(#{1,6})\s+/.test(rawLines[i]) &&
      !/^>\s?/.test(rawLines[i]) &&
      !/^\s*[-*+]\s+/.test(rawLines[i]) &&
      !/^\s*\d+\.\s+/.test(rawLines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(rawLines[i].trim())
    ) {
      paraLines.push(rawLines[i]);
      i++;
    }
    out.push(`<p>${paraLines.map(l => renderInline(l)).join('<br>')}</p>`);
  }

  return out.join('\n');
}
