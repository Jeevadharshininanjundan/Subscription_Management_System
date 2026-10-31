export function assertUtcDate(value, field = 'date') {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`${field} must be a valid date`);
  }
  return date;
}

export function assertDateRange(start, end, startField = 'startDate', endField = 'endDate') {
  const startDate = assertUtcDate(start, startField);
  const endDate = assertUtcDate(end, endField);
  if (endDate < startDate) {
    throw new RangeError(`${endField} must be on or after ${startField}`);
  }
  return { startDate, endDate };
}

export function startOfUtcDay(value = new Date()) {
  const date = assertUtcDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toUtcIso(value) {
  return assertUtcDate(value).toISOString();
}
