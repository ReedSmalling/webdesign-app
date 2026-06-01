const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { lead_id, business_name, owner_name, email, phone, one_time_fee, monthly_fee } = req.body;
  const { data, error } = await supabase.from('clients').insert({
    lead_id,
    business_name,
    owner_name,
    email,
    phone,
    one_time_fee: one_time_fee || 500,
    monthly_fee: monthly_fee || 50,
    status: 'active'
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  if (lead_id) await supabase.from('leads').update({ status: 'converted' }).eq('id', lead_id);
  res.json({ success: true, client: data });
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase.from('clients').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
