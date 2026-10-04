// Transaction history page with status filter and search (filtering is done in the browser)
setupLogout();

let allTransactions = [];
let myAccount = '';

async function load() {
  const data = await api('GET', '/transactions');
  if (data.httpStatus === 401) { window.location.href = 'login.html'; return; }
  if (!data.success) { showMessage('pageError', data.message, 'error'); return; }
  allTransactions = data.transactions;
  myAccount = data.accountNumber;
  render();
}

function render() {
  const status = document.getElementById('filterStatus').value;
  const search = document.getElementById('searchTransaction').value.trim().toLowerCase();

  const rows = allTransactions.filter((t) => {
    if (status !== 'ALL' && t.status !== status) return false;
    if (!search) return true;
    const text = [t.transactionId, t.senderAccount, t.receiverAccount, t.amount, t.status, t.riskLevel, t.description]
      .join(' ').toLowerCase();
    return text.includes(search);
  });

  const body = document.getElementById('transactionTableBody');
  if (rows.length === 0) {
    body.innerHTML = '<tr id="noTransactions"><td colspan="9">No transactions found.</td></tr>';
  } else {
    body.innerHTML = rows.map((t) => {
      const id = esc(t.transactionId);
      const sender = t.senderAccount === myAccount ? `${esc(t.senderAccount)} (You)` : esc(t.senderAccount);
      const receiver = t.receiverAccount === myAccount ? `${esc(t.receiverAccount)} (You)` : esc(t.receiverAccount);
      return `<tr id="txn-${id}">
        <td id="${id}-id">${id}</td>
        <td id="${id}-date">${formatDate(t.transactionTime)}</td>
        <td id="${id}-sender">${sender}</td>
        <td id="${id}-receiver">${receiver}</td>
        <td id="${id}-amount">${formatINR(t.amount)}</td>
        <td id="${id}-riskScore">${t.riskScore}</td>
        <td id="${id}-riskLevel" class="badge risk-${t.riskLevel}">${t.riskLevel}</td>
        <td id="${id}-status" class="badge status-${t.status}">${t.status}</td>
        <td id="${id}-reasons">${esc(reasonsText(t.fraudReasons))}</td>
      </tr>`;
    }).join('');
  }
  document.getElementById('transactionCount').textContent = `Showing ${rows.length} of ${allTransactions.length} transactions`;
}

document.getElementById('filterStatus').addEventListener('change', render);
document.getElementById('searchButton').addEventListener('click', render);
document.getElementById('searchTransaction').addEventListener('keyup', (e) => { if (e.key === 'Enter') render(); });
document.getElementById('clearSearchButton').addEventListener('click', () => {
  document.getElementById('searchTransaction').value = '';
  document.getElementById('filterStatus').value = 'ALL';
  render();
});

load();
