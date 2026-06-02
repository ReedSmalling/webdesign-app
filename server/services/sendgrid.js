const sgMail = require('@sendgrid/mail');

const getFromEmail = () =>
  process.env.SENDGRID_FROM_EMAIL || 'reed@monroewebdesign.org';

const getFromName = (override) =>
  override || process.env.SENDGRID_FROM_NAME || 'Monroe Web Design';

const getReplyToEmail = () =>
  process.env.SENDGRID_REPLY_TO || getFromEmail();

const parseSendGridError = (err) => {
  const sgErrors = err.response?.body?.errors;
  if (sgErrors?.length) {
    return sgErrors.map((e) => e.message).filter(Boolean).join('; ');
  }
  return err.message || 'Unknown SendGrid error';
};

const formatSendGridError = (details) => {
  const fromEmail = getFromEmail();

  if (/verified Sender Identity|not authorized to send from that email/i.test(details)) {
    return (
      `SendGrid rejected the sender address "${fromEmail}". ` +
      'In SendGrid go to Settings → Sender Authentication → authenticate monroewebdesign.org, ' +
      'then set SENDGRID_FROM_EMAIL=reed@monroewebdesign.org on Render. ' +
      `(SendGrid: ${details})`
    );
  }

  if (/Maximum credits|credit limit|exceeded.*limit/i.test(details)) {
    return `SendGrid sending limit reached. ${details}`;
  }

  if (/Access forbidden|Forbidden|permission|scope/i.test(details)) {
    return (
      'SendGrid API key lacks Mail Send permission. In SendGrid go to Settings → API Keys, ' +
      'edit your key, and enable Mail Send (Full Access). ' +
      `(SendGrid: ${details})`
    );
  }

  if (/Invalid API key|authorization|401/i.test(details)) {
    return (
      'SendGrid API key is invalid or missing on Render. Check SENDGRID_API_KEY in your Render environment variables. ' +
      `(SendGrid: ${details})`
    );
  }

  return `SendGrid error: ${details}`;
};

const isSenderConfigError = (message) =>
  /SendGrid rejected the sender|API key is not configured|API key lacks Mail Send|API key is invalid/i.test(
    message
  );

const sendEmail = async (to, subject, body, fromName) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error(
      'SendGrid API key is not configured. Add SENDGRID_API_KEY in Render environment variables.'
    );
  }

  sgMail.setApiKey(apiKey);

  const fromEmail = getFromEmail();
  const msg = {
    to,
    from: { email: fromEmail, name: getFromName(fromName) },
    replyTo: { email: getReplyToEmail(), name: getFromName(fromName) },
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (err) {
    const details = parseSendGridError(err);
    const message = formatSendGridError(details);
    console.error('SendGrid send failed:', { to, from: fromEmail, subject, details });
    const error = new Error(message);
    error.isSenderConfigError = isSenderConfigError(message);
    throw error;
  }
};

module.exports = { sendEmail, isSenderConfigError, getFromEmail };
