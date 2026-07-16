/**
 * Safe date formatting utility - always returns a string, never crashes
 * Replaces toLocaleDateString which can return objects in some browsers
 */

export function safeDateStr(dateValue, format = 'default') {
  if (!dateValue) return '';
  
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) {
      // Invalid date - try to extract date part from string
      if (typeof dateValue === 'string') {
        return dateValue.split('T')[0];
      }
      return '';
    }
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const shortMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    const fullMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()];
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
    const shortWeekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    
    switch (format) {
      case 'short':        return `${day} ${shortMonth}`;
      case 'monthYear':    return `${shortMonth} ${year}`;
      case 'full':         return `${weekday}, ${day} ${fullMonth} ${year}`;
      case 'shortFull':    return `${shortWeekday}, ${day} ${shortMonth}`;
      case 'numeric':      return `${day}/${month}/${year}`;
      case 'iso':          return `${year}-${month}-${day}`;
      case 'time':         return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      default:             return `${day}/${month}/${year}`;
    }
  } catch {
    if (typeof dateValue === 'string') return dateValue.split('T')[0];
    return '';
  }
}

export function safeTimeStr(dateValue) {
  return safeDateStr(dateValue, 'time');
}

export function nowStr(format = 'full') {
  return safeDateStr(new Date(), format);
}

export default { safeDateStr, safeTimeStr, nowStr };
