const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

const extractHtml = (text) => {
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
};

const ensurePreviewHtml = (text) => {
  let html = extractHtml(text);
  if (!html) return '';

  if (!/<\/html>/i.test(html)) {
    if (!/<\/body>/i.test(html)) html += '\n</body>';
    html += '\n</html>';
  }

  return html;
};

const generateEmail = async (lead) => {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Write a short cold email selling a professional website.
        Business: ${lead.business_name}
        Type: ${lead.business_type}
        City: ${lead.city}
        Owner: ${lead.owner_name || 'Business Owner'}
        Context: ${lead.context || ''}
        Include subject line starting with "Subject: "
        Keep under 150 words. Personal, not generic. No placeholders.
        Mention one-time build fee plus affordable monthly hosting.`
    }]
  });
  return message.content[0].text;
};

const generateSMS = async (lead) => {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Write an SMS under 160 chars for ${lead.business_name} in ${lead.city}.
        Context: ${lead.context || ''}
        Sell a professional website. Include call to action.
        Return only the message text.`
    }]
  });
  return message.content[0].text;
};

const generateWebsite = async (businessInfo) => {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 16384,
    messages: [{
      role: 'user',
      content: `Create a complete modern professional single-page HTML website for:
        Business: ${businessInfo.business_name}
        Type: ${businessInfo.business_type || 'local business'}
        City: ${businessInfo.city || 'Local area'}
        Colors: ${businessInfo.colors || 'professional blue and white'}
        Services: ${businessInfo.services || 'General services'}
        Phone: ${businessInfo.phone || '(555) 000-0000'}
        Requirements:
        - Start with <!DOCTYPE html> and include full <html>, <head>, and <body>
        - Full HTML with embedded CSS and JS in one file
        - Mobile responsive
        - Hero section, services, about, contact form, footer
        - Professional and modern design
        Return only raw HTML code. No markdown fences, no explanation.`
    }]
  });
  return extractHtml(message.content[0].text);
};

module.exports = { generateEmail, generateSMS, generateWebsite, extractHtml, ensurePreviewHtml };