import { useEffect, useState } from 'react';
import { api } from '../api';
import LeadCard from '../components/LeadCard';

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'salon', label: 'Salon' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'auto repair', label: 'Auto Repair' },
  { value: 'gym', label: 'Gym' },
  { value: 'lawyer', label: 'Lawyer' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'coffee shop', label: 'Coffee Shop' },
  { value: 'real estate agent', label: 'Real Estate Agent' },
  { value: 'chiropractor', label: 'Chiropractor' },
  { value: 'veterinarian', label: 'Veterinarian' },
  { value: 'cleaning service', label: 'Cleaning Service' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'barber shop', label: 'Barber Shop' },
  { value: 'nail salon', label: 'Nail Salon' },
  { value: 'pest control', label: 'Pest Control' },
  { value: 'moving company', label: 'Moving Company' },
  { value: 'tire shop', label: 'Tire Shop' },
  { value: 'florist', label: 'Florist' },
];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [findForm, setFindForm] = useState({ city: '', businessType: 'restaurant' });
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  const fetchLeads = async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (cityFilter) params.city = cityFilter;
      const data = await api.leads.list(params);
      setLeads(data);
    } catch (err) {
      if (showLoading) setMessage(err.message || 'Failed to load leads');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, cityFilter]);

  const handleFind = async (e) => {
    e.preventDefault();
    setFinding(true);
    setMessage('');
    try {
      const result = await api.leads.find(findForm.city, findForm.businessType);
      setMessage(
        `Found ${result.count} businesses without websites. ${result.inserted ?? result.count} new leads added.`
      );
      fetchLeads();
    } catch (err) {
      setMessage(err.message || 'Search failed');
    } finally {
      setFinding(false);
    }
  };

  const sendOutreach = async (lead, type) => {
    setSendingId(lead.id);
    setFeedback(null);
    try {
      const result = await api.outreach.send(lead.id, type);
      if (type === 'sms' && result.results?.sms !== 'sent') {
        throw new Error('SMS was not sent. Check that this lead has a valid phone number.');
      }
      if (type === 'email' && result.results?.email !== 'sent') {
        throw new Error('Email was not sent. Check that this lead has a valid email address.');
      }
      const channel = type === 'sms' ? 'SMS' : type === 'email' ? 'Email' : 'Outreach';
      setFeedback({
        type: 'success',
        text: `${channel} sent to ${lead.business_name}. Lead marked as contacted — switch filter to "All statuses" to see it.`,
      });
      await fetchLeads({ showLoading: false });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to send. Restart the backend with: npm run dev',
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <p className="text-slate-500">Find local businesses and manage your pipeline</p>
      </div>

      <form onSubmit={handleFind} className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Find New Leads</h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="City (e.g. Austin, TX)"
            value={findForm.city}
            onChange={(e) => setFindForm({ ...findForm, city: e.target.value })}
            required
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <select
            value={findForm.businessType}
            onChange={(e) => setFindForm({ ...findForm, businessType: e.target.value })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {BUSINESS_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={finding}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {finding ? 'Searching...' : 'Find Businesses'}
          </button>
        </div>
      </form>

      {message && (
        <div className="mb-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</div>
      )}

      {feedback && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-800'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="responded">Responded</option>
          <option value="converted">Converted</option>
          <option value="rejected">Rejected</option>
        </select>
        <input
          type="text"
          placeholder="Filter by city"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading leads...</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
          No leads found. Use the form above to search Google Places.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              sendingId={sendingId}
              onSendEmail={(l) => sendOutreach(l, 'email')}
              onSendSMS={(l) => sendOutreach(l, 'sms')}
              onSendBoth={(l) => sendOutreach(l, 'both')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
