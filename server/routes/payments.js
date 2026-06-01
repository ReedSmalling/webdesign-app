const express = require('express');
const router = express.Router();
const { createCustomer, createOneTimePayment, createSubscription } = require('../services/stripe');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, clients(business_name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/invoice/:clientId', async (req, res) => {
  const { type, amount, description } = req.body;
  const { data: client } = await supabase.from('clients').select('*').eq('id', req.params.clientId).single();
  if (!client) return res.status(404).json({ error: 'Client not found' });

  try {
    let stripeCustomerId = client.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await createCustomer(client);
      stripeCustomerId = customer.id;
      await supabase.from('clients').update({ stripe_customer_id: stripeCustomerId }).eq('id', client.id);
    }

    const session = type === 'one_time'
      ? await createOneTimePayment(stripeCustomerId, amount, description)
      : await createSubscription(stripeCustomerId, amount, description);

    await supabase.from('payments').insert({
      client_id: client.id, amount, type, status: 'pending', stripe_payment_id: session.id
    });

    res.json({ success: true, paymentUrl: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
