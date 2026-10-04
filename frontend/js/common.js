/* Common helper functions used by every page */

const API_BASE = '/api';

/** Small wrapper around fetch that always returns the JSON body. */
async function api(method, url, body) {
  const options = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
  if (body !== undefined) options.body = JSON.stringify(body);
  try {
    const res = await fetch(API_BASE + url, options);
    const data = await res.json();
    data.httpStatus = res.status;
    return data;
  } catch (err) {
    return { success: false, message: 'Cannot reach the server. Is the backend running?' };
  }
}

/** Formats a number as Indian Rupees, e.g. 150000 -> "₹1,50,000.00" */
function formatINR(amount) {
  const n = Number(amount);
  const fixed = Math.abs(n).toFixed(2);
  let [whole, dec] = fixed.split('.');
  // Indian grouping: last 3 digits, then groups of 2
  if (whole.length > 3) {
    const last3 = whole.slice(-3);
    const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    whole = rest + ',' + last3;
  }
  return (n < 0 ? '-' : '') + '₹' + whole + '.' + dec;
}

/** Formats a date as DD/MM/YYYY HH:MM (24 hour) */
function formatDate(value) {
  const d = new Date(value);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Escapes text before putting it into innerHTML */
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

/** Shows a message box. type = success | error | warning */
function showMessage(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'message ' + type;
  el.style.display = 'block';
}

function hideMessage(id) {
  const el = document.getElementById(id);
  el.textContent = '';
  el.style.display = 'none';
}

/** Redirects to the login page if nobody is logged in. Returns the user. */
async function requireLogin(role) {
  const data = await api('GET', '/auth/me');
  if (!data.success || (role && data.user.role !== role)) {
    window.location.href = role === 'admin' ? 'admin-login.html' : 'login.html';
    return null;
  }
  return data.user;
}

/** Connects the Logout button found in the header. */
function setupLogout(redirectTo) {
  const btn = document.getElementById('logoutButton');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await api('POST', '/auth/logout');
    window.location.href = (redirectTo || 'login.html') + '?loggedOut=1';
  });
}

/** Text shown in the "Fraud Reason" columns */
function reasonsText(reasons) {
  return reasons && reasons.length ? reasons.join('; ') : '-';
}
