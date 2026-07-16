const DEFAULTS = {
  DISTRICTS: ['Patna','Gaya','Muzaffarpur','Bhagalpur','Darbhanga','Nalanda','Vaishali','Other'],
  BLOCKS: ['Block A','Block B','Block C','Block D','Block E','Other'],
  REGIONS: ['Central Bihar','North Bihar','South Bihar','Other'],
  STATES: ['Bihar','Other'],
  DOMAINS: ['IT','Healthcare','Retail','Manufacturing','Agriculture','Construction','Hospitality','Other'],
  COURSES: ['Computer Basics','Tally ERP','Web Design','Healthcare Assistant','Retail Management','Electrician'],
  STATUSES: ['Interested','Not Interested','Already Working','Self Employed','Not Responded','Interview Scheduled','Selected','Offer Received','Joined','Rejected'],
  QUALS: ['10th','12th','ITI','Diploma','Graduate','Post Graduate'],
};

function getFilter(key) {
  try {
    const stored = localStorage.getItem(`filter_${key}`);
    return stored ? JSON.parse(stored) : DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

function setFilter(key, values) {
  localStorage.setItem(`filter_${key}`, JSON.stringify(values));
}

function resetAll() {
  Object.keys(DEFAULTS).forEach(k => localStorage.removeItem(`filter_${k}`));
}

export default { getFilter, setFilter, resetAll, DEFAULTS };
