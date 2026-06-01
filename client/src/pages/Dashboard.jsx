import { useEffect, useState } from 'react';
import { api } from '../api';

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, newLeads: 0, clients: 0, unread: 0, revenue: 0, liveSites: 0 });
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [leads, clients, inbox, payments] = await Promise.all([
          api.leads.list().catch(() => []),
          api.clients.list().catch(() => []),
          api.inbox.list('unread').catch(() => []),
          api.payments.list().catch(() => []),
        ]);

        const paid = payments.filter((p) => p.status === 'paid');
        const revenue = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        setStats({
          leads: leads.length,
          newLeads: leads.filter((l) => l.status === 'new').length,
          clients: clients.length,
          unread: inbox.length,
          revenue,
          liveSites: clients.filter((c) => c.website_url).length,
        });
        setRecentLeads(leads.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your web design business</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Leads" value={stats.leads} color="text-slate-900" />
        <StatCard label="New Leads" value={stats.newLeads} color="text-blue-600" sub="Ready to contact" />
        <StatCard label="Active Clients" value={stats.clients} color="text-green-600" />
        <StatCard label="Unread Replies" value={stats.unread} color="text-purple-600" />
        <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} color="text-brand-600" sub="Paid invoices" />
        <StatCard label="Live Sites" value={stats.liveSites} color="text-slate-900" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent Leads</h2>
        </div>
        {recentLeads.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No leads yet. Find businesses on the Leads page.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{lead.business_name}</p>
                  <p className="text-sm text-slate-500">{lead.business_type} · {lead.city}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
