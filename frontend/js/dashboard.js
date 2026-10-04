// User dashboard
setupLogout();

async function loadDashboard() {
  const data = await api('GET', '/user/dashboard');
  if (data.httpStatus === 401) { window.location.href = 'login.html'; return; }
  if (!data.success) { showMessage('pageError', data.message, 'error'); return; }

  const u = data.user;
  document.getElementById('welcomeMessage').textContent = `Welcome, ${u.name}!`;
  document.getElementById('userName').textContent = u.name;
  document.getElementById('userUsername').textContent = u.username;
  document.getElementById('accountNumber').textContent = u.accountNumber;
  const bal = document.getElementById('currentBalance');
  bal.textContent = formatINR(u.balance);
  bal.dataset.value = u.balance;
  document.getElementById('totalTransactions').textContent = data.stats.totalTransactions;
  document.getElementById('suspiciousCount').textContent = data.stats.suspiciousTransactions;

  if (data.stats.suspiciousTransactions > 0) {
    showMessage('dashboardAlert',
      `Fraud warning: ${data.stats.suspiciousTransactions} of your transfers were flagged as suspicious or blocked. Please check your transaction history.`,
      'warning');
  }

  const body = document.getElementById('recentTransactionsBody');
  if (data.recentTransactions.length === 0) {
    body.innerHTML = '<tr><td colspan="7">No transactions yet.</td></tr>';
  } else {
    body.innerHTML = data.recentTransactions.map((t) => {
      const sent = t.senderAccount === u.accountNumber;
      return `<tr id="recent-${esc(t.transactionId)}">
        <td>${esc(t.transactionId)}</td>
        <td>${formatDate(t.transactionTime)}</td>
        <td>${sent ? 'Sent' : 'Received'}</td>
        <td>${esc(sent ? t.receiverAccount : t.senderAccount)}</td>
        <td>${formatINR(t.amount)}</td>
        <td class="badge risk-${t.riskLevel}">${t.riskLevel}</td>
        <td class="badge status-${t.status}">${t.status}</td>
      </tr>`;
    }).join('');
  }

  document.getElementById('dashboardContent').classList.remove('hidden');
}

loadDashboard();
