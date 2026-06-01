import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Payments() {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ clientId: '', type: 'one_time', amount: 500, description: 'Website build fee' });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([api.clients.list(), api.payments.list()]);
      setClients(c);
      setPayments(p);
    } catch {
      setClients([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleInvoice = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage('');
    try {
      const result = await api.payments.invoice(form.clientId, {
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
      });
      setMessage('Payment link created! Opening in new tab...');
      window.open(result.paymentUrl, '_blank');
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
        <p className="text-slate-500">Send invoices and manage recurring billing via Stripe</p>
      </div>

      <form onSubmit={handleInvoice} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Create Payment Link</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.business_name}</option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="one_time">One-time payment</option>
            <option value="recurring">Monthly subscription</option>
          </select>
          <input
            type="number"
            placeholder="Amount ($)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            min="1"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !form.clientId}
          className="mt-4 rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {sending ? 'Creating...' : 'Send Payment Link'}
        </button>
        {message && <p className="mt-3 text-sm text-brand-700">{message}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Payment History</h2>
        </div>
        {loading ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No payments yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">Client</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Amount</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Type</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 font-medium">{p.clients?.business_name || '—'}</td>
                  <td className="px-6 py-4">${Number(p.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize">{p.type?.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
