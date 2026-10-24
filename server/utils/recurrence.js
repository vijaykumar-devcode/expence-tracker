const addDays = (date, days) => {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

const daysInMonth = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const addMonthsClamped = (date, months, anchorDay) => {
  const source = new Date(`${date}T00:00:00.000Z`);
  const targetIndex = source.getUTCFullYear() * 12 + source.getUTCMonth() + months;
  const year = Math.floor(targetIndex / 12);
  const month = targetIndex % 12;
  const day = Math.min(anchorDay || source.getUTCDate(), daysInMonth(year, month));
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const nextDate = (date, frequency, anchorDay) => {
  if (frequency === 'daily') return addDays(date, 1);
  if (frequency === 'weekly') return addDays(date, 7);
  if (frequency === 'monthly') return addMonthsClamped(date, 1, anchorDay);
  if (frequency === 'yearly') return addMonthsClamped(date, 12, anchorDay);
  throw new Error('Unsupported recurrence frequency');
};

module.exports = { nextDate, addMonthsClamped };
