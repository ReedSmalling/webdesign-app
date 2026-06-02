export const API_BASE = process.env.REACT_APP_API_URL || '';
const API = API_BASE;

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new Error(
      API
        ? 'Could not reach the server. The backend may be waking up — wait a minute and try again.'
        : 'Could not reach the server. Make sure the backend is running on port 5000.'
    );
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text.slice(0, 200) || 'Unexpected server response' };
  }

  if (!res.ok) {
    let errorMessage = data.error || `Request failed (${res.status})`;
    if (typeof errorMessage === 'string' && errorMessage.includes('<!DOCTYPE')) {
      const jsonMatch = errorMessage.match(/\{[\s\S]*"message"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0].replace(/&quot;/g, '"'));
          errorMessage = parsed.error?.message || parsed.message || errorMessage;
        } catch {
          errorMessage = 'Server error. Restart the backend with npm run dev in the server folder.';
        }
      } else {
        errorMessage = 'Server error. Restart the backend with npm run dev in the server folder.';
      }
    }
    throw new Error(errorMessage);
  }
  return data;
}

export const api = {
  leads: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
      return request(`/api/leads${qs ? `?${qs}` : ''}`);
    },
    find: (city, businessType) =>
      request('/api/leads/find', { method: 'POST', body: JSON.stringify({ city, businessType }) }),
    update: (id, body) =>
      request(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  outreach: {
    send: (leadId, type) =>
      request(`/api/outreach/send/${leadId}`, { method: 'POST', body: JSON.stringify({ type }) }),
    bulk: (body) =>
      request('/api/outreach/bulk', { method: 'POST', body: JSON.stringify(body) }),
    followUpsPreview: () => request('/api/outreach/follow-ups/preview'),
    sendFollowUps: () => request('/api/outreach/follow-ups', { method: 'POST' }),
    log: () => request('/api/outreach/log'),
  },
  inbox: {
    list: (status) => request(`/api/inbox${status ? `?status=${status}` : ''}`),
    approve: (id) => request(`/api/inbox/${id}/approve`, { method: 'POST' }),
    reply: (id, customMessage) =>
      request(`/api/inbox/${id}/reply`, { method: 'POST', body: JSON.stringify({ customMessage }) }),
    dismiss: (id) => request(`/api/inbox/${id}/dismiss`, { method: 'PATCH' }),
    convert: (id) => request(`/api/inbox/${id}/convert`, { method: 'POST' }),
  },
  websites: {
    generate: (clientId, businessInfo) =>
      request('/api/websites/generate', { method: 'POST', body: JSON.stringify({ clientId, businessInfo }) }),
    getByClient: (clientId) => request(`/api/websites/client/${clientId}`),
    update: (id, body) =>
      request(`/api/websites/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  clients: {
    list: () => request('/api/clients'),
    create: (body) => request('/api/clients', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  payments: {
    list: () => request('/api/payments'),
    invoice: (clientId, body) =>
      request(`/api/payments/invoice/${clientId}`, { method: 'POST', body: JSON.stringify(body) }),
  },
  settings: {
    get: () => request('/api/settings'),
    update: (body) => request('/api/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  },
};
