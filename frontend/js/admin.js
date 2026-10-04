// Admin dashboard
setupLogout('admin-login.html');

let transactions = [];

async function loadAll() {
  const [stats, txns, alerts, users] = await Promise.all([
    api('GET', '/admin/stats'),
    api('GET', '/admin/transactions'),
    api('GET', '/admin/alerts'),
    api('GET', '/admin/users')
  ]);
  if (stats.httpStatus === 403 || stats.httpStatus === 401) { window.location.href = 'admin-login.html'; return false; }
  if (!stats.success) { showMessage('adminMessage', stats.message, 'error'); return false; }

  const s = stats.stats;
  document.getElementById('statTotalTransactions').textContent = s.totalTransactions;
  document.getElementById('statApproved').textContent = s.approvedTransactions;
  document.getElementById('statSuspicious').textContent = s.suspiciousTransactions;
  document.getElementById('statBlocked').textContent = s.blockedTransactions;
  document.getElementById('statTotalUsers').textContent = s.totalUsers;
  document.getElementById('statOpenAlerts').textContent = s.openAlerts;

  transactions = txns.transactions;
  renderTransactions();
  renderAlerts(alerts.alerts);
  renderUsers(users.users);
  document.getElementById('adminContent').classList.remove('hidden');
  return true;
}

function renderTransactions() {
  const risk = document.getElementById('adminRiskFilter').value;
  const search = document.getElementById('adminSearch').value.trim().toLowerCase();
  const rows = transactions.filter((t) => {
    if (risk !== 'ALL' && t.riskLevel !== risk) return false;
    if (!search) return true;
    return [t.transactionId, t.senderUsername, t.senderAccount, t.receiverAccount, t.amount, t.status]
      .join(' ').toLowerCase().includes(search);
  });

  const body = document.getElementById('adminTransactionBody');
  body.innerHTML = rows.length === 0
    ? '<tr id="adminNoTransactions"><td colspan="9">No transactions found.</td></tr>'
    : rows.map((t) => {
      const id = esc(t.transactionId);
      return `<tr id="admin-txn-${id}">
        <td id="admin-${id}-id">${id}</td>
        <td id="admin-${id}-user">${esc(t.senderUsername)}</td>
        <td>${esc(t.receiverAccount)}</td>
        <td id="admin-${id}-amount">${formatINR(t.amount)}</td>
        <td id="admin-${id}-riskScore">${t.riskScore}</td>
        <td id="admin-${id}-riskLevel" class="badge risk-${t.riskLevel}">${t.riskLevel}</td>
        <td id="admin-${id}-status" class="badge status-${t.status}">${t.status}</td>
        <td>${formatDate(t.transactionTime)}</td>
        <td><button type="button" class="btn small" id="viewBtn-${id}" onclick="showDetails('${id}')">View</button></td>
      </tr>`;
    }).join('');
  document.getElementById('adminTransactionCount').textContent = `Showing ${rows.length} of ${transactions.length} transactions`;
}

function showDetails(transactionId) {
  const t = transactions.find((x) => x.transactionId === transactionId);
  if (!t) return;
  document.getElementById('detailTransactionId').textContent = t.transactionId;
  document.getElementById('detailSender').textContent = `${t.senderUsername} (${t.senderAccount})`;
  document.getElementById('detailReceiver').textContent = t.receiverAccount;
  document.getElementById('detailAmount').textContent = formatINR(t.amount);
  document.getElementById('detailDescription').textContent = t.description || '-';
  document.getElementById('detailRiskScore').textContent = t.riskScore;
  document.getElementById('detailRiskLevel').textContent = t.riskLevel;
  document.getElementById('detailStatus').textContent = t.status;
  document.getElementById('detailReasons').innerHTML = t.fraudReasons.length
    ? t.fraudReasons.map((r) => `<li>${esc(r)}</li>`).join('')
    : '<li>No risk factors found</li>';
  document.getElementById('transactionDetails').classList.remove('hidden');
}

function renderAlerts(alerts) {
  const body = document.getElementById('fraudAlertBody');
  body.innerHTML = alerts.length === 0
    ? '<tr id="noAlerts"><td colspan="8">No fraud alerts.</td></tr>'
    : alerts.map((a) => {
      const id = esc(a.transactionId);
      const reviewed = a.status === 'REVIEWED';
      return `<tr id="alert-${id}">
        <td id="alert-${id}-user">${esc(a.username)}</td>
        <td>${id}</td>
        <td id="alert-${id}-riskScore">${a.riskScore}</td>
        <td class="badge risk-${a.riskLevel}">${a.riskLevel}</td>
        <td id="alert-${id}-reasons">${esc(reasonsText(a.reasons))}</td>
        <td>${formatDate(a.createdAt)}</td>
        <td id="alert-${id}-status">${a.status}</td>
        <td>
          <button type="button" class="btn small green" id="reviewBtn-${id}" ${reviewed ? 'disabled' : ''}
            onclick="adminAction('/admin/alerts/${id}/review')">Mark Reviewed</button>
          <button type="button" class="btn small" id="alertViewBtn-${id}" onclick="showDetails('${id}')">View</button>
        </td>
      </tr>`;
    }).join('');
}

function renderUsers(users) {
  document.getElementById('userTableBody').innerHTML = users.map((u) => {
    const name = esc(u.username);
    const status = u.isBlocked ? 'Blocked' : (u.isLocked ? 'Locked' : 'Active');
    return `<tr id="user-${name}">
      <td>${name}</td>
      <td>${esc(u.name)}</td>
      <td>${esc(u.accountNumber)}</td>
      <td>${formatINR(u.balance)}</td>
      <td id="failed-${name}">${u.failedLoginAttempts}</td>
      <td id="status-${name}" class="badge user-${status}">${status}</td>
      <td>
        <button type="button" class="btn small red" id="blockBtn-${name}" ${u.isBlocked ? 'disabled' : ''}
          onclick="adminAction('/admin/users/${name}/block')">Block</button>
        <button type="button" class="btn small green" id="unblockBtn-${name}" ${status === 'Active' ? 'disabled' : ''}
          onclick="adminAction('/admin/users/${name}/unblock')">Unblock</button>
      </td>
    </tr>`;
  }).join('');
}

/** Runs an admin action, reloads the data, then shows the result message. */
async function adminAction(url) {
  hideMessage('adminMessage');
  const data = await api('POST', url);
  await loadAll();
  showMessage('adminMessage', data.message, data.success ? 'success' : 'error');
}

document.getElementById('adminRiskFilter').addEventListener('change', renderTransactions);
document.getElementById('adminSearchButton').addEventListener('click', renderTransactions);
document.getElementById('adminSearch').addEventListener('keyup', (e) => { if (e.key === 'Enter') renderTransactions(); });
document.getElementById('adminClearButton').addEventListener('click', () => {
  document.getElementById('adminSearch').value = '';
  document.getElementById('adminRiskFilter').value = 'ALL';
  renderTransactions();
});
document.getElementById('closeDetailsButton').addEventListener('click', () => {
  document.getElementById('transactionDetails').classList.add('hidden');
});

loadAll();
