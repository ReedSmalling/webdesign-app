import { useEffect, useState } from 'react';
import { api } from '../api';
import OutreachLog from '../components/OutreachLog';

export default function Outreach() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkForm, setBulkForm] = useState({ type: 'email', city: '', businessType: '' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.outreach.log();
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleBulk = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage('');
    try {
      const result = await api.outreach.bulk(bulkForm);
      const sent = result.sent ?? result.results.filter((r) => r.status === 'sent').length;
      const failed = result.failed ?? result.results.filter((r) => r.status === 'failed').length;
      if (sent === 0 && result.message) {
        setMessage(result.message);
      } else {
        setMessage(
          `Bulk outreach complete: ${sent} sent${failed ? `, ${failed} failed` : ''}`
        );
      }
      loadLogs();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Outreach</h1>
        <p className="text-slate-500">Send personalized emails and texts at scale</p>
      </div>

      <form onSubmit={handleBulk} className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Bulk Send</h2>
        <p className="mb-4 text-sm text-slate-500">
          Sends AI-generated emails to up to 50 new leads that have email addresses. City and business type filters are partial matches. Respects daily limits from Settings.
        </p>
        <div className="flex flex-wrap gap-4">
          <select
            value={bulkForm.type}
            onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            <option value="email">Email only</option>
            <option value="sms">SMS only</option>
          </select>
          <input
            type="text"
            placeholder="City filter (optional)"
            value={bulkForm.city}
            onChange={(e) => setBulkForm({ ...bulkForm, city: e.target.value })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Business type filter (optional)"
            value={bulkForm.businessType}
            onChange={(e) => setBulkForm({ ...bulkForm, businessType: e.target.value })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Start Bulk Send'}
          </button>
        </div>
      </form>

      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>
      )}

      <OutreachLog logs={logs} loading={loading} />
    </div>
  );
}
