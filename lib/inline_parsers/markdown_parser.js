const markdownStyleClass = "markdown-render";

//used for indention. One tab = 1 indent
export let tabSize = 2;
export let maxListDepth = 10;
export let headerPrefixId = 'markdown-header'

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
    (full, alt, src, title) => `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''}>`);

  //anchor links [text](#anchor) //Note: could merge with links, but would need to check the href for #
  text = text.replace(/\[([^\]]*)\]\(#([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (full, label, anchor, title) => `<a href="#${headerPrefixId}-${anchor}"${title ? ` title="${title}"` : ''} target="_self">${label}</a>`);

  // links [text](href)
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (full, label, href, title) => `<a href="${href}"${title ? ` title="${title}"` : ''} target="_blank" rel="noopener">${label}</a>`);

  // bold+italic ***text*** or ___text___
  text = text.replace(/(\*\*\*|___)(.+?)\1/g, '<strong><em>$2</em></strong>');

  // bold **text** or __text__
  text = text.replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>');

  // italic *text* or _text_
  text = text.replace(/(\*|_)(.+?)\1/g, '<em>$2</em>');

  // strikethrough ~~text~~
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // subscript ~text~
  text = text.replace(/~(.+?)~/g, '<sub>$1</sub>');

  //superscript ^text^
  text = text.replace(/\^(.+?)\^/g, '<sup>$1</sup>');

  // inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  //currently do not support checkbox lists
  //inline checkbox uncheck
  text = text.replace(/\[\s\]/g, '<input type="checkbox">');
  //inline checkbox check
  text = text.replace(/\[x\]/gi, '<input type="checkbox" checked>');

  return text;
}

export function lineIndentDepth(line, offset = 0, maxDepth = 3, indentSize = tabSize) {
  const spaces = line.match(/^\s*/)[0].length + (offset * indentSize);
  return Math.min(Math.floor(spaces / indentSize), maxDepth);
}

//isolated text render functions so the markdown to html could be rebuild with custom cases if needed

export function renderTable(lines) {
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


export function parseFencedCode(rawLines, results) {
  if (/^```/.test(results.line.trim())) {
    const lang = results.line.trim().slice(3).trim();
    const codeLines = [];
    results.i++;
    while (results.i < rawLines.length && !/^```/.test(rawLines[results.i].trim())) {
      codeLines.push(rawLines[results.i]);
      results.i++;
    }
    results.i++; // skip closing fence
    results.out.push(`<pre><code${lang ? ` class="lang-${escapeHtml(lang)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    return true
  }
}

export function parseHorizontalRule(rawLines, results) {
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(results.line.trim())) {
    results.out.push('<hr>');
    results.i++;
    return true;
  }
}

export function parseTable(rawLines, results) {
  if (/^\|?.+\|.+\|?$/.test(results.line) && rawLines[results.i + 1] && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(rawLines[results.i + 1])) {
    const tableLines = [results.line, rawLines[results.i + 1]];
    results.i += 2;
    while (results.i < rawLines.length && rawLines[results.i].includes('|') && rawLines[results.i].trim() !== '') {
      tableLines.push(rawLines[results.i]);
      results.i++;
    }
    results.out.push(renderTable(tableLines));
    return true;
  }
}

export function parseHeader(rawLines, results) {
  const headerMatch = results.line.match(/^(#{1,6})\s+(.*)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    let headerId = results.line.replace(/^#{1,6}\s*/, "");
    headerId = headerId.replace(/\s+/g, "-");
    results.out.push(`<h${level} id='${headerPrefixId}-${headerId}'>${renderInline(headerMatch[2].trim())}</h${level}>`);
    results.i++;
    return true;
  }
}

export function parseBlockquote(rawLines, results) {
  if (/^>\s?/.test(results.line)) {
    const quoteLines = [];
    while (results.i < rawLines.length && /^>\s?/.test(rawLines[results.i])) {
      quoteLines.push(rawLines[results.i].replace(/^>\s?/, ''));
      results.i++;
    }
    results.out.push(`<blockquote>${markdownToHtml(quoteLines.join('\n'))}</blockquote>`);
    return true
  }
}

export function parseLists(rawLines, results) {
  if (/^\s*[-*+]\s+/.test(results.line) || /^\s*\d+\.\s+/.test(results.line)) {
    const items = [];
    while (results.i < rawLines.length && /^\s*[-*+]\s+/.test(rawLines[results.i]) || /^\s*\d+\.\s+/.test(rawLines[results.i])) {
      const listId = /^\s*\d+\.\s+/.test(rawLines[results.i]) ? 'ol' : 'ul'
      const lineDepth = lineIndentDepth(rawLines[results.i], 1, maxListDepth)
      const lineDiff = lineDepth - results.depths[listId]
      let listItem = ''

      //close other lists as well as format the list item correctly
      if (listId === 'ol') {
        if (results.depths.ul > 0) {
          items.push("</ul>".repeat(Math.abs(results.depths.ul)));
          results.depths.ul = 0
        }
        listItem = `<li>${renderInline(rawLines[results.i].replace(/^\s*\d+\.\s+/, ''))}</li>`;
      }
      else {
        if (results.depths.ol > 0) {
          items.push("</ol>".repeat(Math.abs(results.depths.ol)));
          results.depths.ol = 0
        }
        listItem = `<li>${renderInline(rawLines[results.i].replace(/^\s*[-*+]\s+/, ''))}</li>`;
      }

      if (lineDiff > 0) {
        items.push(`<${listId}>`.repeat(lineDiff));
      }
      else if (lineDiff < 0) {
        items.push(`</${listId}>`.repeat(Math.abs(lineDiff)));
      }

      items.push(listItem);

      results.depths[listId] = lineDepth
      results.i++;
    }

    //making sure the lists are closed
    if (results.depths.ul > 0) {
      items.push("</ul>".repeat(Math.abs(results.depths.ul)));
      results.depths.ul = 0
    }
    if (results.depths.ol > 0) {
      items.push("</ol>".repeat(Math.abs(results.depths.ol)));
      results.depths.ol = 0
    }
    results.out.push(items.join(''));
    return true
  }
}

//planing to rename the to html function
export function markdownToHtml(src, encapsulate = true, style = markdownStyleClass) {
  if (!src || !src.trim()) {
    return '';
  }

  const rawLines = src.replace(/\r\n/g, '\n').split('\n');
  const results = {
    out: [],
    i: 0,
    depths: { ul: 0, ol: 0 },
    line: ''
  }
  while (results.i < rawLines.length) {
    results.line = rawLines[results.i];

    // blank line
    if (results.line.trim() === '') { results.i++; continue; }

    if (parseFencedCode(rawLines, results)) { continue; }

    if (parseHorizontalRule(rawLines, results)) { continue; }

    if (parseHeader(rawLines, results)) { continue; }

    if (parseTable(rawLines, results)) { continue; }

    if (parseBlockquote(rawLines, results)) { continue; }

    if (parseLists(rawLines, results)) { continue; }

    // paragraph: gather consecutive non-blank, non-special lines
    const paraLines = [];
    while (
      results.i < rawLines.length &&
      rawLines[results.i].trim() !== '' &&
      !/^```/.test(rawLines[results.i].trim()) &&
      !/^(#{1,6})\s+/.test(rawLines[results.i]) &&
      !/^>\s?/.test(rawLines[results.i]) &&
      !/^\s*[-*+]\s+/.test(rawLines[results.i]) &&
      !/^\s*\d+\.\s+/.test(rawLines[results.i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(rawLines[results.i].trim())
    ) {
      paraLines.push(rawLines[results.i]);
      results.i++;
    }
    results.out.push(`<p>${paraLines.map(l => renderInline(l)).join('<br>')}</p>`);
  }
  if (encapsulate) {
    if (style) {
      return `<span class="${style}">${results.out.join('\n')}</span>`;
    }
    return `<span>${results.out.join('\n')}</span>`;
  }
  return results.results.out.join('\n');
}
