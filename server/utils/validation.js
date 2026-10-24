const categories = new Set(['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Other']);
const paymentMethods = new Set(['Cash', 'UPI', 'Card', 'Other']);

const validateUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const parseDate = (value) => {
  if (typeof value !== 'string') return null;
  let date = value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsedInput = new Date(value);
    if (Number.isNaN(parsedInput.getTime())) return null;
    date = parsedInput.toISOString().slice(0, 10);
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date;
};

const parseAmount = (value) => {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 && amount <= 9999999999.99 ? amount : null;
};

const parsePage = (value, fallback, max) => {
  if (value !== undefined && !/^\d+$/.test(String(value))) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
};

module.exports = { categories, paymentMethods, validateUuid, parseDate, parseAmount, parsePage };
