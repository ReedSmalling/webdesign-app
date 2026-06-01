import { useEffect, useState } from 'react';
import { api } from '../api';
import InboxCard from '../components/InboxCard';

const tabs = [
  { id: '', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'dismissed', label: 'Dismissed' },
];

export default function Inbox({ onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [tab, setTab] = useState('unread');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadInbox = async (status) => {
    setLoading(true);
    try {
      const data = await api.inbox.list(status || undefined);
      setMessages(data);
      if (status === 'unread' || !status) {
        const unread = status === 'unread' ? data.length : data.filter((m) => m.status === 'unread').length;
        onUnreadChange?.(unread);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox(tab);
  }, [tab]);

  const handleAction = async (action, id, extra) => {
    try {
      if (extra !== undefined) {
        await action(id, extra);
      } else {
        await action(id);
      }
      setMessage('Action completed successfully');
      loadInbox(tab);
      const unread = await api.inbox.list('unread');
      onUnreadChange?.(unread.length);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
        <p className="text-slate-500">Review replies before anything sends automatically</p>
      </div>

      <div className="mb-6 flex gap-2">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading inbox...</p>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
          No messages in this view. Replies from email and SMS will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <InboxCard
              key={msg.id}
              message={msg}
              onApprove={(id) => handleAction(api.inbox.approve, id)}
              onReply={(id, text) => handleAction((i, t) => api.inbox.reply(i, t), id, text)}
              onDismiss={(id) => handleAction(api.inbox.dismiss, id)}
              onConvert={(id) => handleAction(api.inbox.convert, id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
