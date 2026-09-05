const markdownStyleClass = "markdown-render";

//used for indention. One tab = 1 indent
let tabSize = 2;
let maxListDepth = 10;
let headerPrefixId = 'markdown-header'

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
    (full, label, anchor, title) =>  `<a href="#${headerPrefixId}-${anchor}"${title ? ` title="${title}"` : ''} target="_self">${label}</a>`);

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

function lineIndentDepth(line, offset = 0, maxDepth = 3, indentSize = tabSize) {
  const spaces = line.match(/^\s*/)[0].length + (offset * indentSize);
  return Math.min(Math.floor(spaces / indentSize), maxDepth);
}

//planing to rename the to html function
export function markdownToHtml(src, encapsulate = true, style = markdownStyleClass) {
  if (!src || !src.trim()) {
    return '';
    //  return '<p class="md-empty">Your rendered markdown will show up here…</p>';
  }

  const rawLines = src.replace(/\r\n/g, '\n').split('\n');
  const depths = { ul: 0, ol: 0 }
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
      let headerId = line.replace(/^#{1,6}\s*/, "");
      headerId = headerId.replace(/\s+/g, "-");
      out.push(`<h${level} id='${headerPrefixId}-${headerId}'>${renderInline(headerMatch[2].trim())}</h${level}>`);
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
      out.push(`<blockquote>${markdownToHtml(quoteLines.join('\n'))}</blockquote>`);
      continue;
    }


    //lists
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < rawLines.length && /^\s*[-*+]\s+/.test(rawLines[i]) || /^\s*\d+\.\s+/.test(rawLines[i])) {
        const listId = /^\s*\d+\.\s+/.test(rawLines[i]) ? 'ol' : 'ul'
        const lineDepth = lineIndentDepth(rawLines[i], 1, maxListDepth)
        const lineDiff = lineDepth - depths[listId]
        let listItem = ''

        //close other lists as well as format the list item correctly
        if (listId === 'ol') {
          if (depths.ul > 0) {
            items.push("</ul>".repeat(Math.abs(depths.ul)));
            depths.ul = 0
          }
          listItem = `<li>${renderInline(rawLines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`;
        }
        else {
          if (depths.ol > 0) {
            items.push("</ol>".repeat(Math.abs(depths.ol)));
            depths.ol = 0
          }
          listItem = `<li>${renderInline(rawLines[i].replace(/^\s*[-*+]\s+/, ''))}</li>`;
        }

        if (lineDiff > 0) {
          items.push(`<${listId}>`.repeat(lineDiff));
        }
        else if (lineDiff < 0) {
          items.push(`</${listId}>`.repeat(Math.abs(lineDiff)));
        }

        items.push(listItem);

        depths[listId] = lineDepth
        i++;
      }

      //making sure the lists are closed
      if (depths.ul > 0) {
        items.push("</ul>".repeat(Math.abs(depths.ul)));
        depths.ul = 0
      }
      if (depths.ol > 0) {
        items.push("</ol>".repeat(Math.abs(depths.ol)));
        depths.ol = 0
      }
      out.push(items.join(''));
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
  if (encapsulate) {
    if (style) {
      return `<span class="${style}">${out.join('\n')}</span>`;
    }
    return `<span>${out.join('\n')}</span>`;
  }
  return out.join('\n');
}
