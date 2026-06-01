import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.settings.get()
      .then(setSettings)
      .catch(() => setSettings({
        id: null,
        daily_email_limit: 100,
        daily_sms_limit: 100,
        daily_api_limit: 200,
        monthly_spend_cap: 50,
        auto_followup: false,
      }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.settings.update(settings);
      setMessage('Settings saved successfully!');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setSettings({ ...settings, [field]: value });

  if (loading) return <p className="text-slate-500">Loading settings...</p>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Control daily limits and spending caps</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-medium text-slate-900">Daily email limit</label>
            <span className="text-sm font-semibold text-brand-600">{settings.daily_email_limit}</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            value={settings.daily_email_limit}
            onChange={(e) => update('daily_email_limit', Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-medium text-slate-900">Daily SMS limit</label>
            <span className="text-sm font-semibold text-brand-600">{settings.daily_sms_limit}</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            value={settings.daily_sms_limit}
            onChange={(e) => update('daily_sms_limit', Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-medium text-slate-900">Claude API daily call limit</label>
            <span className="text-sm font-semibold text-brand-600">{settings.daily_api_limit}</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            value={settings.daily_api_limit}
            onChange={(e) => update('daily_api_limit', Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>

        <div>
          <label className="font-medium text-slate-900">Monthly spend cap ($)</label>
          <input
            type="number"
            min="0"
            value={settings.monthly_spend_cap}
            onChange={(e) => update('monthly_spend_cap', Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
          <div>
            <p className="font-medium text-slate-900">Require approval before follow-ups</p>
            <p className="text-sm text-slate-500">Nothing sends automatically — you approve in Inbox</p>
          </div>
          <button
            type="button"
            onClick={() => update('auto_followup', !settings.auto_followup)}
            className={`relative h-7 w-12 rounded-full transition-colors ${settings.auto_followup ? 'bg-brand-600' : 'bg-slate-300'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${settings.auto_followup ? 'left-5' : 'left-0.5'}`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand-600 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && <p className="text-center text-sm text-brand-700">{message}</p>}
      </form>
    </div>
  );
}
