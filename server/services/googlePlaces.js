const axios = require('axios');

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const IGNORE_EMAIL_PATTERNS = [
  /^(noreply|no-reply|donotreply|mailer-daemon|postmaster|sentry|webmaster)@/i,
  /\.(png|jpg|jpeg|gif|svg|webp|woff|woff2)$/i,
  /@example\.(com|org|net)$/i,
  /@sentry\./i,
  /@wixpress\.com$/i,
  /@(facebook|instagram|twitter|linkedin)\./i,
  /^(your|name|email|user|username|test)@/i,
];

const PREFERRED_LOCAL_PARTS = ['contact', 'info', 'hello', 'office', 'sales', 'support', 'admin'];

const extractEmails = (html) => {
  if (typeof html !== 'string') return [];

  const mailtoMatches = [...html.matchAll(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi)]
    .map((match) => match[1].toLowerCase());
  const textMatches = (html.match(EMAIL_REGEX) || []).map((email) => email.toLowerCase());

  return [...new Set([...mailtoMatches, ...textMatches])].filter(
    (email) => !IGNORE_EMAIL_PATTERNS.some((pattern) => pattern.test(email))
  );
};

const pickBestEmail = (emails) => {
  if (!emails.length) return null;

  for (const prefix of PREFERRED_LOCAL_PARTS) {
    const match = emails.find((email) => email.startsWith(`${prefix}@`));
    if (match) return match;
  }

  return emails[0];
};

const fetchPageHtml = async (url) => {
  const response = await axios.get(url, {
    timeout: 10000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WebDesignBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
    responseType: 'text',
    validateStatus: (status) => status >= 200 && status < 400,
  });

  return response.data;
};

const buildCandidateUrls = (websiteUrl) => {
  const parsed = new URL(websiteUrl);
  const origin = parsed.origin;
  const paths = ['', '/contact', '/contact-us', '/about', '/about-us'];

  return [...new Set(paths.map((path) => `${origin}${path}`))];
};

const scrapeEmailsFromWebsite = async (websiteUrl) => {
  const urls = buildCandidateUrls(websiteUrl);
  const found = new Set();

  for (const url of urls) {
    try {
      const html = await fetchPageHtml(url);
      extractEmails(html).forEach((email) => found.add(email));
      if (found.size) break;
    } catch {
      // Try the next likely page.
    }
  }

  return pickBestEmail([...found]);
};

const mapWithLimit = async (items, limit, mapper) => {
  const results = new Array(items.length);
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current], current);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const placeToLead = async (place, city, businessType) => {
  const websiteUrl = place.websiteUri || null;
  let email = null;

  if (websiteUrl) {
    try {
      email = await scrapeEmailsFromWebsite(websiteUrl);
    } catch (err) {
      console.warn(`Email scrape failed for ${websiteUrl}:`, err.message);
    }
  }

  const notes = [place.formattedAddress, websiteUrl].filter(Boolean).join(' | ');

  return {
    business_name: place.displayName?.text || 'Unknown Business',
    city,
    business_type: businessType,
    phone: place.nationalPhoneNumber || null,
    email,
    has_website: !!websiteUrl,
    source: 'google_places',
    notes: notes || null,
  };
};

const findBusinesses = async (city, businessType) => {
  if (!process.env.GOOGLE_PLACES_API_KEY?.trim()) {
    throw new Error(
      'Google Places API key is missing on the server. In Render open webdesign-app → Environment → paste GOOGLE_PLACES_API_KEY from server/render-env-paste.txt, then redeploy.'
    );
  }

  const textQuery = `${businessType} in ${city}`;

  let response;
  try {
    response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery,
        maxResultCount: 20,
        languageCode: 'en',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY.trim(),
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri',
        },
      }
    );
  } catch (err) {
    const status = err.response?.status;
    const googleMessage =
      err.response?.data?.error?.message ||
      err.response?.data?.error_message ||
      err.message;

    console.error('Google Places API error:', status, googleMessage);

    if (status === 401 || status === 403) {
      throw new Error(
        `Google Places API unauthorized (${status}). Enable "Places API (New)" in Google Cloud Console and confirm GOOGLE_PLACES_API_KEY on Render matches your key. Google: ${googleMessage}`
      );
    }

    throw new Error(googleMessage || 'Google Places search failed');
  }

  const places = response.data.places || [];

  const leads = await mapWithLimit(places, 5, (place) =>
    placeToLead(place, city, businessType)
  );

  return leads.filter((lead) => !lead.has_website || lead.email);
};

module.exports = {
  findBusinesses,
  scrapeEmailsFromWebsite,
  extractEmails,
};
