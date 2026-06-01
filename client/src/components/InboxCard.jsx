import { useState } from 'react';

export default function InboxCard({ message, onApprove, onReply, onDismiss, onConvert }) {
  const [replyText, setReplyText] = useState(message.ai_suggested_reply || '');
  const [sending, setSending] = useState(false);

  const handleApprove = async () => {
    setSending(true);
    try {
      await onApprove(message.id);
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    setSending(true);
    try {
      await onReply(message.id, replyText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${message.status === 'unread' ? 'border-brand-500 ring-1 ring-brand-100' : 'border-slate-200'}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{message.from_name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${message.type === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
              {message.type}
            </span>
          </div>
          <p className="text-xs text-slate-500">{message.from_contact}</p>
          <p className="mt-1 text-xs text-slate-400">{new Date(message.received_at).toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
          {message.status}
        </span>
      </div>

      <div className="mb-4 rounded-lg bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Their message</p>
        <p className="mt-1 text-sm text-slate-800">{message.message}</p>
      </div>

      {message.status !== 'dismissed' && message.status !== 'converted' && (
        <>
          <div className="mb-4">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              AI suggested reply (editable)
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleApprove}
              disabled={sending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Approve & Send
            </button>
            <button
              onClick={handleReply}
              disabled={sending || !replyText.trim()}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              Edit & Send
            </button>
            <button
              onClick={() => onConvert(message.id)}
              className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
            >
              Convert to Client
            </button>
            <button
              onClick={() => onDismiss(message.id)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </>
      )}
    </div>
  );
}
