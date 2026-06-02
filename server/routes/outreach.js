const express = require('express');
const router = express.Router();
const { generateEmail, generateFollowUpEmail, generateSMS } = require('../services/claude');
const { sendEmail, isSenderConfigError } = require('../services/sendgrid');
const { sendSMS } = require('../services/twilio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const logFailedOutreach = async (leadId, type, message, errorMessage) => {
  await supabase.from('outreach_log').insert({
    lead_id: leadId,
    type,
    message: errorMessage ? `${message}\n\nError: ${errorMessage}` : message,
    status: 'failed',
  });
};

const DEFAULT_LIMITS = { daily_email_limit: 100, daily_sms_limit: 100 };

const checkDailyLimit = async (type) => {
  const { data: settings } = await supabase.from('settings').select('*').single();
  const limit = type === 'email'
    ? (settings?.daily_email_limit ?? DEFAULT_LIMITS.daily_email_limit)
    : (settings?.daily_sms_limit ?? DEFAULT_LIMITS.daily_sms_limit);

  const today = new Date().toISOString().split('T')[0];
  let query = supabase
    .from('outreach_log')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', today);

  if (type === 'email') {
    query = query.in('type', ['email', 'email_followup']);
  } else {
    query = query.eq('type', 'sms');
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) < limit;
};

router.post('/send/:leadId', async (req, res) => {
  const { leadId } = req.params;
  const { type } = req.body;

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if ((type === 'email' || type === 'both') && !lead.email) {
      return res.status(400).json({ error: 'This lead has no email address.' });
    }

    if ((type === 'sms' || type === 'both') && !lead.phone) {
      return res.status(400).json({ error: 'This lead has no phone number.' });
    }

    const results = {};

    if ((type === 'email' || type === 'both') && lead.email) {
      const allowed = await checkDailyLimit('email');
      if (!allowed) return res.status(429).json({ error: 'Daily email limit reached' });

      const emailContent = await generateEmail(lead);
      const subject = emailContent.match(/Subject: (.+)/)?.[1] || 'Professional Website for Your Business';
      const body = emailContent.replace(/Subject: .+\n/, '');
      await sendEmail(lead.email, subject, body);
      await supabase.from('outreach_log').insert({
        lead_id: leadId,
        type: 'email',
        message: emailContent,
        status: 'sent',
      });
      results.email = 'sent';
    }

    if ((type === 'sms' || type === 'both') && lead.phone) {
      const allowed = await checkDailyLimit('sms');
      if (!allowed) return res.status(429).json({ error: 'Daily SMS limit reached' });

      const smsContent = await generateSMS(lead);
      const twilioResult = await sendSMS(lead.phone, smsContent);
      await supabase.from('outreach_log').insert({
        lead_id: leadId,
        type: 'sms',
        message: smsContent,
        status: twilioResult.status === 'failed' ? 'failed' : 'sent',
      });
      results.sms = 'sent';
      results.twilioSid = twilioResult.sid;
      results.twilioStatus = twilioResult.status;
    }

    if (!Object.keys(results).length) {
      return res.status(400).json({ error: 'Nothing was sent. Check lead contact info and request type.' });
    }

    await supabase.from('leads').update({ status: 'contacted' }).eq('id', leadId);
    res.json({ success: true, results });
  } catch (err) {
    let message = err.message || 'Failed to send outreach';
    if (message.includes('not_found_error') || message.includes('model:')) {
      message = 'Claude AI model error. Restart the backend server (npm run dev) and try again.';
    }
    console.error('Outreach send error:', message);
    res.status(500).json({ error: message });
  }
});

router.get('/log', async (req, res) => {
  const { data, error } = await supabase
    .from('outreach_log')
    .select('*, leads(business_name, city)')
    .order('sent_at', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const getEligibleFollowUpLeads = async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: emailLogs, error: logError } = await supabase
    .from('outreach_log')
    .select('lead_id, sent_at')
    .eq('type', 'email')
    .eq('status', 'sent')
    .order('sent_at', { ascending: true });

  if (logError) throw logError;

  const firstEmailByLead = {};
  for (const log of emailLogs || []) {
    if (!firstEmailByLead[log.lead_id]) {
      firstEmailByLead[log.lead_id] = log.sent_at;
    }
  }

  const eligibleLeadIds = Object.entries(firstEmailByLead)
    .filter(([, sentAt]) => new Date(sentAt) <= threeDaysAgo)
    .map(([id]) => id);

  if (!eligibleLeadIds.length) return [];

  const { data: followUpLogs, error: followUpError } = await supabase
    .from('outreach_log')
    .select('lead_id')
    .eq('type', 'email_followup')
    .in('lead_id', eligibleLeadIds);

  if (followUpError) throw followUpError;

  const alreadyFollowedUp = new Set((followUpLogs || []).map((l) => l.lead_id));

  const { data: inboxReplies, error: inboxError } = await supabase
    .from('inbox')
    .select('lead_id')
    .in('lead_id', eligibleLeadIds);

  if (inboxError) throw inboxError;

  const repliedLeadIds = new Set((inboxReplies || []).map((i) => i.lead_id));

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .in('id', eligibleLeadIds)
    .eq('status', 'contacted')
    .not('email', 'is', null)
    .neq('email', '');

  if (leadsError) throw leadsError;

  return (leads || []).filter(
    (lead) => !alreadyFollowedUp.has(lead.id) && !repliedLeadIds.has(lead.id)
  );
};

router.get('/follow-ups/preview', async (req, res) => {
  try {
    const leads = await getEligibleFollowUpLeads();
    res.json({
      eligible: leads.length,
      leads: leads.map((l) => ({ id: l.id, business_name: l.business_name, city: l.city })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/follow-ups', async (req, res) => {
  try {
    const leads = await getEligibleFollowUpLeads();

    if (!leads.length) {
      return res.json({
        success: true,
        sent: 0,
        failed: 0,
        message: 'No leads need a follow-up right now. Follow-ups go to contacted leads emailed 3+ days ago with no reply.',
      });
    }

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const lead of leads) {
      try {
        const allowed = await checkDailyLimit('email');
        if (!allowed) {
          results.push({ id: lead.id, business_name: lead.business_name, status: 'limit_reached' });
          break;
        }

        const emailContent = await generateFollowUpEmail(lead);
        const subject = emailContent.match(/Subject: (.+)/)?.[1] || 'Quick follow-up on your website';
        const body = emailContent.replace(/Subject: .+\n?/, '').trim();
        await sendEmail(lead.email, subject, body);
        await supabase.from('outreach_log').insert({
          lead_id: lead.id,
          type: 'email_followup',
          message: emailContent,
          status: 'sent',
        });
        results.push({ id: lead.id, business_name: lead.business_name, status: 'sent' });
        sent += 1;
      } catch (err) {
        results.push({
          id: lead.id,
          business_name: lead.business_name,
          status: 'failed',
          error: err.message,
        });
        failed += 1;
      }
    }

    res.json({ success: true, results, sent, failed });
  } catch (err) {
    console.error('Follow-up send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/bulk', async (req, res) => {
  const { type, city, businessType } = req.body;

  if (!type || !['email', 'sms'].includes(type)) {
    return res.status(400).json({ error: 'Invalid outreach type' });
  }

  let query = supabase.from('leads').select('*').eq('status', 'new');

  if (type === 'email') {
    query = query.not('email', 'is', null).neq('email', '');
  } else {
    query = query.not('phone', 'is', null).neq('phone', '');
  }

  if (city?.trim()) {
    query = query.ilike('city', `%${city.trim()}%`);
  }
  if (businessType?.trim()) {
    query = query.ilike('business_type', `%${businessType.trim()}%`);
  }

  const { data: leads, error } = await query.limit(50);
  if (error) return res.status(500).json({ error: error.message });

  if (!leads?.length) {
    return res.json({
      success: true,
      results: [],
      sent: 0,
      failed: 0,
      message: `No new leads found with ${type === 'email' ? 'email addresses' : 'phone numbers'} matching your filters.`,
    });
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      if (type === 'email') {
        if (!EMAIL_REGEX.test(lead.email)) {
          throw new Error(`Invalid email address: ${lead.email}`);
        }

        const allowed = await checkDailyLimit('email');
        if (!allowed) {
          results.push({ id: lead.id, business_name: lead.business_name, status: 'limit_reached' });
          break;
        }

        const emailContent = await generateEmail(lead);
        const subject = emailContent.match(/Subject: (.+)/)?.[1] || 'Professional Website for Your Business';
        const body = emailContent.replace(/Subject: .+\n?/, '').trim();
        await sendEmail(lead.email, subject, body);
        await supabase.from('outreach_log').insert({
          lead_id: lead.id,
          type: 'email',
          message: emailContent,
          status: 'sent',
        });
        await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id);
        results.push({ id: lead.id, business_name: lead.business_name, status: 'sent' });
        sent += 1;
      }

      if (type === 'sms') {
        const allowed = await checkDailyLimit('sms');
        if (!allowed) {
          results.push({ id: lead.id, business_name: lead.business_name, status: 'limit_reached' });
          break;
        }

        const smsContent = await generateSMS(lead);
        const twilioResult = await sendSMS(lead.phone, smsContent);
        await supabase.from('outreach_log').insert({
          lead_id: lead.id,
          type: 'sms',
          message: smsContent,
          status: twilioResult.status === 'failed' ? 'failed' : 'sent',
        });
        await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id);
        results.push({ id: lead.id, business_name: lead.business_name, status: 'sent' });
        sent += 1;
      }
    } catch (err) {
      console.error(`Bulk outreach failed for ${lead.business_name} (${lead.email}):`, err.message);
      if (type === 'email') {
        await logFailedOutreach(lead.id, 'email', 'Bulk email failed', err.message);
      }
      results.push({
        id: lead.id,
        business_name: lead.business_name,
        status: 'failed',
        error: err.message,
      });
      failed += 1;
      if (err.isSenderConfigError || isSenderConfigError(err.message)) {
        break;
      }
    }
  }

  const configError = results.find((r) => r.status === 'failed' && isSenderConfigError(r.error || ''))?.error;

  res.json({
    success: true,
    results,
    sent,
    failed,
    ...(configError ? { error: configError } : {}),
  });
});

module.exports = router;
