/**
 * Input validation helpers. All validation happens on the server so the
 * error messages are the same no matter how the request is sent. The frontend
 * simply displays the "message" returned by the API.
 */

const MESSAGES = {
  NAME_REQUIRED: 'Full name is required.',
  USERNAME_REQUIRED: 'Username is required.',
  USERNAME_FORMAT: 'Username must be 4-20 characters (letters, numbers, underscore).',
  EMAIL_INVALID: 'Please enter a valid email address.',
  PHONE_INVALID: 'Please enter a valid 10-digit phone number.',
  PASSWORD_REQUIRED: 'Password is required.',
  PASSWORD_WEAK: 'Password must be at least 6 characters long and contain a number.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  USERNAME_TAKEN: 'Username already exists.',
  BALANCE_INVALID: 'Initial balance must be a number between 0 and 10,00,000.',

  RECEIVER_REQUIRED: 'Receiver account number is required.',
  RECEIVER_FORMAT: 'Invalid receiver account number. It must be 8 digits.',
  RECEIVER_NOT_FOUND: 'Receiver account not found.',
  RECEIVER_SELF: 'You cannot transfer money to your own account.',
  AMOUNT_REQUIRED: 'Amount is required.',
  AMOUNT_NOT_NUMBER: 'Amount must be a valid number.',
  AMOUNT_NEGATIVE: 'Amount cannot be negative.',
  AMOUNT_ZERO: 'Amount must be greater than zero.',
  INSUFFICIENT_BALANCE: 'Insufficient balance.',
  CUSTOM_TIME_INVALID: 'Custom test time must be in HH:MM format (00:00 to 23:59).'
};

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const isNumeric = (v) => /^-?\d+(\.\d{1,2})?$/.test(String(v).trim());

function validateRegistration(body) {
  const { name, username, email, phone, password, confirmPassword, initialBalance } = body;
  if (isBlank(name)) return MESSAGES.NAME_REQUIRED;
  if (isBlank(username)) return MESSAGES.USERNAME_REQUIRED;
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(String(username).trim())) return MESSAGES.USERNAME_FORMAT;
  if (isBlank(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())) return MESSAGES.EMAIL_INVALID;
  if (isBlank(phone) || !/^\d{10}$/.test(String(phone).trim())) return MESSAGES.PHONE_INVALID;
  if (isBlank(password)) return MESSAGES.PASSWORD_REQUIRED;
  if (String(password).length < 6 || !/\d/.test(password)) return MESSAGES.PASSWORD_WEAK;
  if (password !== confirmPassword) return MESSAGES.PASSWORD_MISMATCH;
  if (isBlank(initialBalance) || !isNumeric(initialBalance)) return MESSAGES.BALANCE_INVALID;
  const bal = Number(initialBalance);
  if (bal < 0 || bal > 1000000) return MESSAGES.BALANCE_INVALID;
  return null;
}

/** Basic transfer checks that do not need the database. */
function validateTransferInput(body) {
  const receiver = isBlank(body.receiverAccount) ? '' : String(body.receiverAccount).trim();
  if (!receiver) return MESSAGES.RECEIVER_REQUIRED;
  if (!/^\d{8}$/.test(receiver)) return MESSAGES.RECEIVER_FORMAT;

  if (isBlank(body.amount)) return MESSAGES.AMOUNT_REQUIRED;
  if (!isNumeric(body.amount)) return MESSAGES.AMOUNT_NOT_NUMBER;
  const amount = Number(body.amount);
  if (amount < 0) return MESSAGES.AMOUNT_NEGATIVE;
  if (amount === 0) return MESSAGES.AMOUNT_ZERO;

  if (body.timeMode === 'custom') {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.customTime || '').trim())) {
      return MESSAGES.CUSTOM_TIME_INVALID;
    }
  }
  return null;
}

module.exports = { MESSAGES, validateRegistration, validateTransferInput, isBlank };
