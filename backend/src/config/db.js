const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, '../../data/db.json'));
const db = low(adapter);

// Initialize schema
db.defaults({
  users: [],
  companies: [],
  candidates: [],
  jobfairs: [],
  attendance: [],
  batches: [],
  chat: [],
  followups: [],
  placements: [],
  _counters: { user: 10, company: 100, candidate: 1000, jobfair: 10, attendance: 10, batch: 10, chat: 10, followup: 10, placement: 10 }
}).write();

module.exports = db;
