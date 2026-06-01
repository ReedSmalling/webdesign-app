const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const normalizePhone = (phone) => {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.length ? `+${digits}` : null;
};

const sendSMS = async (to, message) => {
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) throw new Error('Invalid phone number');

  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: normalizedTo,
    statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || undefined,
  });

  return {
    success: true,
    sid: result.sid,
    status: result.status,
    to: normalizedTo,
  };
};

module.exports = { sendSMS, normalizePhone };
