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

  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const payload = {
    body: message,
    to: normalizedTo,
    statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || undefined,
  };

  // A2P 10DLC requires sending via the approved Messaging Service, not directly from the number.
  if (messagingServiceSid) {
    payload.messagingServiceSid = messagingServiceSid;
  } else {
    payload.from = process.env.TWILIO_PHONE_NUMBER;
  }

  const result = await client.messages.create(payload);

  return {
    success: true,
    sid: result.sid,
    status: result.status,
    to: normalizedTo,
  };
};

module.exports = { sendSMS, normalizePhone };
