import { useEffect, useState } from 'react';
import { api } from '../api';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.clients.list()
      .then(setClients)
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-500">Manage your active clients and projects</p>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading clients...</p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
          No clients yet. Convert a lead from the Inbox when they respond.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">Business</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Contact</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Fees</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{client.business_name}</p>
                    {client.owner_name && <p className="text-slate-500">{client.owner_name}</p>}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {client.email && <p>{client.email}</p>}
                    {client.phone && <p>{client.phone}</p>}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <p>Build: ${client.one_time_fee || 0}</p>
                    <p>Monthly: ${client.monthly_fee || 0}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[client.status] || 'bg-slate-100'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {client.website_url ? (
                      <a href={client.website_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                        View site
                      </a>
                    ) : (
                      <span className="text-slate-400">Not live</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
