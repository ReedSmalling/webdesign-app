const express = require('express');
const router = express.Router();
const { generateEmail, generateSMS } = require('../services/claude');
const { sendEmail } = require('../services/sendgrid');
const { sendSMS } = require('../services/twilio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Get all inbox messages
router.get('/', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('inbox').select('*, leads(*)').order('received_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Catch incoming email reply (SendGrid Inbound Parse webhook)
router.post('/webhook/email', async (req, res) => {
  const { from, text } = req.body;
  const { data: lead } = await supabase.from('leads').select('*').eq('email', from).single();
  let aiReply = null;
  if (lead) {
    aiReply = await generateEmail({ ...lead, context: `They replied: "${text}". Write a friendly follow up to close the deal.` });
  }
  await supabase.from('inbox').insert({
    lead_id: lead?.id || null,
    type: 'email',
    from_name: lead?.business_name || from,
    from_contact: from,
    message: text,
    status: 'unread',
    ai_suggested_reply: aiReply
  });
  if (lead) await supabase.from('leads').update({ status: 'responded' }).eq('id', lead.id);
  res.sendStatus(200);
});

// Catch incoming SMS reply (Twilio webhook)
router.post('/webhook/sms', async (req, res) => {
  const { From, Body } = req.body;
  const { data: lead } = await supabase.from('leads').select('*').eq('phone', From).single();
  let aiReply = null;
  if (lead) {
    aiReply = await generateSMS({ ...lead, context: `They replied: "${Body}". Write a short friendly follow up SMS.` });
  }
  await supabase.from('inbox').insert({
    lead_id: lead?.id || null,
    type: 'sms',
    from_name: lead?.business_name || From,
    from_contact: From,
    message: Body,
    status: 'unread',
    ai_suggested_reply: aiReply
  });
  if (lead) await supabase.from('leads').update({ status: 'responded' }).eq('id', lead.id);
  res.sendStatus(200);
});

// Approve and send AI suggested reply
router.post('/:id/approve', async (req, res) => {
  const { data: message } = await supabase.from('inbox').select('*, leads(*)').eq('id', req.params.id).single();
  if (!message) return res.status(404).json({ error: 'Message not found' });
  try {
    if (message.type === 'email') {
      await sendEmail(message.from_contact, 'Re: Your Website', message.ai_suggested_reply);
    } else {
      await sendSMS(message.from_contact, message.ai_suggested_reply);
    }
    await supabase.from('inbox').update({ status: 'approved', follow_up_sent: true }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit and send custom reply
router.post('/:id/reply', async (req, res) => {
  const { customMessage } = req.body;
  const { data: message } = await supabase.from('inbox').select('*').eq('id', req.params.id).single();
  if (!message) return res.status(404).json({ error: 'Message not found' });
  try {
    if (message.type === 'email') {
      await sendEmail(message.from_contact, 'Re: Your Website', customMessage);
    } else {
      await sendSMS(message.from_contact, customMessage);
    }
    await supabase.from('inbox').update({ status: 'approved', follow_up_sent: true }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Convert lead to client
router.post('/:id/convert', async (req, res) => {
  const { data: message } = await supabase.from('inbox').select('*').eq('id', req.params.id).single();
  if (!message?.lead_id) return res.status(404).json({ error: 'Message or lead not found' });

  const { data: lead } = await supabase.from('leads').select('*').eq('id', message.lead_id).single();
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { data: client, error } = await supabase.from('clients').insert({
    lead_id: lead.id,
    business_name: lead.business_name,
    owner_name: lead.owner_name,
    email: lead.email,
    phone: lead.phone,
    status: 'active'
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('leads').update({ status: 'converted' }).eq('id', lead.id);
  await supabase.from('inbox').update({ status: 'converted' }).eq('id', req.params.id);
  res.json({ success: true, client });
});

// Dismiss a message
router.patch('/:id/dismiss', async (req, res) => {
  await supabase.from('inbox').update({ status: 'dismissed' }).eq('id', req.params.id);
  res.json({ success: true });
});

module.exports = router;
