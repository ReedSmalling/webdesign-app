const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, body, fromName = 'Your Web Design Co') => {
  const msg = {
    to,
    from: { email: 'reed.smalling@gmail.com', name: fromName },
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>')
  };
  await sgMail.send(msg);
  return { success: true };
};

module.exports = { sendEmail };
