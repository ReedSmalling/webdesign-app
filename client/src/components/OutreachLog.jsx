const typeIcons = { email: '✉️', sms: '📱', email_followup: '🔁' };
const typeLabels = { email: 'Email', sms: 'SMS', email_followup: 'Follow-up' };
const statusColors = {
  sent: 'text-green-600',
  opened: 'text-blue-600',
  replied: 'text-purple-600',
  failed: 'text-red-600',
};

export default function OutreachLog({ logs = [], loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading outreach log...
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        No outreach sent yet. Send your first email or SMS from the Leads page.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold text-slate-900">Outreach Log</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50">
            <span className="text-xl" title={typeLabels[log.type] || log.type}>
              {typeIcons[log.type] || '📋'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">
                  {log.leads?.business_name || 'Unknown business'}
                </span>
                <span className={`text-xs font-medium uppercase ${statusColors[log.status] || 'text-slate-500'}`}>
                  {log.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{log.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(log.sent_at).toLocaleString()}
                {log.leads?.city && ` · ${log.leads.city}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
