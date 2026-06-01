const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/', async (req, res) => {
  const { data, error } = await supabase.from('settings').update(req.body).eq('id', req.body.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
