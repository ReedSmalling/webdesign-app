const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCustomer = async (client) => {
  return await stripe.customers.create({
    name: client.business_name,
    email: client.email,
    metadata: { client_id: client.id }
  });
};

const createOneTimePayment = async (customerId, amount, description) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price_data: { currency: 'usd', product_data: { name: description }, unit_amount: amount * 100 }, quantity: 1 }],
    mode: 'payment',
    success_url: 'https://yourapp.com/payment-success',
    cancel_url: 'https://yourapp.com/payment-cancelled'
  });
};

const createSubscription = async (customerId, monthlyAmount, description) => {
  const price = await stripe.prices.create({
    unit_amount: monthlyAmount * 100,
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: { name: description }
  });
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: price.id, quantity: 1 }],
    mode: 'subscription',
    success_url: 'https://yourapp.com/payment-success',
    cancel_url: 'https://yourapp.com/payment-cancelled'
  });
};

const cancelSubscription = async (subscriptionId) => {
  return await stripe.subscriptions.cancel(subscriptionId);
};

module.exports = { createCustomer, createOneTimePayment, createSubscription, cancelSubscription };
