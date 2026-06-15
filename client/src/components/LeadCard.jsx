import { useState } from 'react';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  responded: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function LeadCard({ lead, onSendEmail, onSendSMS, onSendBoth, onUpdateContact, sendingId, savingId }) {
  const isSending = sendingId === lead.id;
  const isSaving = savingId === lead.id;
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(lead.email || '');
  const [phone, setPhone] = useState(lead.phone || '');

  const startEditing = () => {
    setEmail(lead.email || '');
    setPhone(lead.phone || '');
    setEditing(true);
  };

  const handleSave = async () => {
    await onUpdateContact?.(lead, { email: email.trim() || null, phone: phone.trim() || null });
    setEditing(false);
  };

  const canSendOutreach = ['new', 'contacted', 'responded'].includes(lead.status);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{lead.business_name}</h3>
          <p className="text-sm text-slate-500">{lead.business_type} · {lead.city}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status] || 'bg-slate-100 text-slate-700'}`}>
          {lead.status}
        </span>
      </div>

      <div className="mb-4 space-y-2 text-sm text-slate-600">
        {lead.owner_name && <p>Owner: {lead.owner_name}</p>}
        {editing ? (
          <>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Phone</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(734) 555-1234"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p>{lead.email ? `✉️ ${lead.email}` : '✉️ No email'}</p>
            <p>{lead.phone ? `📱 ${lead.phone}` : '📱 No phone'}</p>
            {lead.notes && <p className="truncate">📍 {lead.notes}</p>}
            <button
              type="button"
              onClick={startEditing}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Edit contact info
            </button>
          </>
        )}
      </div>

      {canSendOutreach && (
        <div className="flex flex-wrap gap-2">
          {lead.email && (
            <button
              onClick={() => onSendEmail?.(lead)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              Send Email
            </button>
          )}
          {lead.phone && (
            <button
              type="button"
              disabled={isSending}
              onClick={() => onSendSMS?.(lead)}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send SMS'}
            </button>
          )}
          {lead.email && lead.phone && (
            <button
              onClick={() => onSendBoth?.(lead)}
              className="rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
            >
              Send Both
            </button>
          )}
        </div>
      )}
    </div>
  );
}
