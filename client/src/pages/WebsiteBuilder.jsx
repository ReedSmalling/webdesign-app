import { useEffect, useState } from 'react';
import { api } from '../api';
import { ensurePreviewHtml } from '../utils/extractHtml';

export default function WebsiteBuilder() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [form, setForm] = useState({
    business_name: '',
    business_type: '',
    city: '',
    colors: 'professional blue and white',
    services: '',
    phone: '',
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewVersion, setPreviewVersion] = useState(0);
  const [htmlSize, setHtmlSize] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.clients.list().then(setClients).catch(() => setClients([]));
  }, []);

  useEffect(() => {
    if (!selectedClient) return;

    const client = clients.find((c) => c.id === selectedClient);
    if (!client) return;

    setForm({
      business_name: client.business_name || '',
      business_type: '',
      city: '',
      colors: 'professional blue and white',
      services: '',
      phone: client.phone || '',
    });

    api.websites.getByClient(selectedClient).then((sites) => {
      if (sites[0]?.id) {
        const html = ensurePreviewHtml(sites[0].html_content || '');
        setPreviewHtml(html);
        setHtmlSize(html.length);
        setPreviewVersion((v) => v + 1);
      }
    }).catch(() => {});
  }, [selectedClient, clients]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      setError('Please select a client first');
      return;
    }
    setGenerating(true);
    setMessage('');
    setError('');
    try {
      const result = await api.websites.generate(selectedClient, form);
      const website = result.website;
      if (!website?.id || !website?.html_content?.includes('<html')) {
        throw new Error('Generated content was not valid HTML. Please try again.');
      }
      const html = ensurePreviewHtml(website.html_content);
      setPreviewHtml(html);
      setHtmlSize(html.length);
      setPreviewVersion((v) => v + 1);
      setMessage('Website generated! Full preview below.');
    } catch (err) {
      setError(err.message || 'Failed to generate website');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Website Builder</h1>
        <p className="text-slate-500">Generate custom AI-built websites for your clients</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleGenerate} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Business Info</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Client</label>
              <select
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  setPreviewHtml('');
                  setHtmlSize(0);
                  setMessage('');
                  setError('');
                }}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
            </div>
            {['business_name', 'business_type', 'city', 'colors', 'services', 'phone'].map((field) => (
              <div key={field}>
                <label className="text-sm font-medium capitalize text-slate-700">
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={generating}
            className="mt-6 w-full rounded-lg bg-brand-600 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {generating ? 'Generating with Claude AI (30–60 sec)...' : 'Generate Website'}
          </button>

          {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Preview</h2>
            {htmlSize > 0 && (
              <span className="text-xs text-slate-500">{Math.round(htmlSize / 1024)} KB</span>
            )}
          </div>
          {previewHtml ? (
            <iframe
              key={previewVersion}
              title="Website preview"
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin"
              className="h-[600px] w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-[600px] items-center justify-center text-slate-400">
              Generate a website to see preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
