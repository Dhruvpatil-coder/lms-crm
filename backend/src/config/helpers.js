const db = require('./db');

function nextId(type) {
  const counters = db.get('_counters');
  const val = counters.get(type).value() + 1;
  counters.set(type, val).write();
  return val;
}

function now() { return new Date().toISOString(); }

module.exports = { nextId, now };
