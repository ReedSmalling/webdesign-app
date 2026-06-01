const express = require('express');
const router = express.Router();
const { generateWebsite, extractHtml, ensurePreviewHtml } = require('../services/claude');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.post('/generate', async (req, res) => {
  const { clientId, businessInfo } = req.body;
  try {
    const rawHtml = await generateWebsite(businessInfo);
    const html = ensurePreviewHtml(rawHtml);
    const { data, error } = await supabase.from('websites').insert({
      client_id: clientId,
      business_name: businessInfo.business_name,
      business_type: businessInfo.business_type,
      html_content: html,
      status: 'draft'
    }).select().single();
    if (error) throw error;
    res.json({ success: true, website: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/client/:clientId', async (req, res) => {
  const { data, error } = await supabase.from('websites').select('*')
    .eq('client_id', req.params.clientId).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id/preview', async (req, res) => {
  const { data, error } = await supabase
    .from('websites')
    .select('html_content')
    .eq('id', req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).send('Website not found');
  }

  const html = ensurePreviewHtml(data.html_content);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase.from('websites').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
