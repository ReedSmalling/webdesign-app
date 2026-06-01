export function extractHtml(text) {
  if (!text) return '';

  let content = text.trim();

  if (content.startsWith('```')) {
    content = content.replace(/^```(?:html)?\s*/i, '');
    const closingFence = content.lastIndexOf('```');
    if (closingFence !== -1) {
      content = content.slice(0, closingFence);
    }
  }

  const fullDoc = content.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (fullDoc) return fullDoc[0].trim();

  const htmlBlock = content.match(/<html[\s>][\s\S]*<\/html>/i);
  if (htmlBlock) return htmlBlock[0].trim();

  const docIndex = content.search(/<!DOCTYPE html>/i);
  if (docIndex >= 0) return content.slice(docIndex).trim();

  const htmlIndex = content.search(/<html[\s>]/i);
  if (htmlIndex >= 0) return content.slice(htmlIndex).trim();

  return content.trim();
}

export function ensurePreviewHtml(text) {
  let html = extractHtml(text);
  if (!html) return '';

  if (!/<\/html>/i.test(html)) {
    if (!/<\/body>/i.test(html)) html += '\n</body>';
    html += '\n</html>';
  }

  return html;
}
