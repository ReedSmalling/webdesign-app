const express = require('express');
const router = express.Router();
const { findBusinesses } = require('../services/googlePlaces');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.post('/find', async (req, res) => {
  const { city, businessType } = req.body;
  try {
    const leads = await findBusinesses(city, businessType);
    const emailsFound = leads.filter((lead) => lead.email).length;

    const { data: existingLeads, error: fetchError } = await supabase
      .from('leads')
      .select('business_name, city')
      .eq('city', city);
    if (fetchError) throw fetchError;

    const existing = new Set(
      (existingLeads || []).map((l) => `${l.business_name}||${l.city}`)
    );
    const newLeads = leads.filter(
      (l) => !existing.has(`${l.business_name}||${l.city}`)
    );

    if (newLeads.length) {
      const { error: insertError } = await supabase.from('leads').insert(newLeads);
      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      count: leads.length,
      inserted: newLeads.length,
      emailsFound,
      leads,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { status, city } = req.query;
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (city) query = query.eq('city', city);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('leads').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
