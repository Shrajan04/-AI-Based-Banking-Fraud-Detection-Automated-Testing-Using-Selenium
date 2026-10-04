// Money transfer page
setupLogout();

const timeMode = document.getElementById('timeMode');
const customTime = document.getElementById('customTime');

function setBalance(value) {
  const el = document.getElementById('transferBalance');
  el.textContent = formatINR(value);
  el.dataset.value = value;
}

async function init() {
  const user = await requireLogin('user');
  if (!user) return;
  setBalance(user.balance);
  document.getElementById('transferFromAccount').textContent = user.accountNumber;

  // The custom test time option is only shown when the backend runs in TEST_MODE
  const test = await api('GET', '/test/status');
  if (test.success && test.testMode) document.getElementById('testTimeSection').classList.remove('hidden');
}

timeMode.addEventListener('change', () => {
  customTime.classList.toggle('hidden', timeMode.value !== 'custom');
});

document.getElementById('transferForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage('transferMessage');
  document.getElementById('transferResult').style.display = 'none';
  const btn = document.getElementById('transferButton');
  btn.disabled = true;

  const data = await api('POST', '/transactions/transfer', {
    receiverAccount: document.getElementById('receiverAccount').value,
    amount: document.getElementById('transferAmount').value,
    description: document.getElementById('transferDescription').value,
    timeMode: timeMode.value,
    customTime: customTime.value
  });
  btn.disabled = false;

  if (!data.success) {
    if (data.httpStatus === 401) { window.location.href = 'login.html'; return; }
    showMessage('transferMessage', data.message, 'error');
    return;
  }
  showResult(data);
});

function showResult(data) {
  const t = data.transaction;
  document.getElementById('resultTransactionId').textContent = t.transactionId;
  document.getElementById('resultAmount').textContent = formatINR(t.amount);
  document.getElementById('resultReceiver').textContent = `${t.receiverAccount} (${data.receiverName})`;
  document.getElementById('resultDateTime').textContent = formatDate(t.transactionTime);
  const status = document.getElementById('resultStatus');
  status.textContent = t.status;
  status.className = 'badge status-' + t.status;
  document.getElementById('resultRiskScore').textContent = t.riskScore;
  const level = document.getElementById('resultRiskLevel');
  level.textContent = t.riskLevel;
  level.className = 'badge risk-' + t.riskLevel;

  const list = document.getElementById('resultReasons');
  list.innerHTML = t.fraudReasons.length
    ? t.fraudReasons.map((r) => `<li>${esc(r)}</li>`).join('')
    : '<li>No risk factors found</li>';
  document.getElementById('resultNewBalance').textContent = formatINR(data.newBalance);
  setBalance(data.newBalance);

  // Fraud alert box (MEDIUM = orange warning, HIGH = red blocked)
  const alertBox = document.getElementById('fraudAlert');
  const success = document.getElementById('transferSuccess');
  alertBox.style.display = 'none';
  success.style.display = 'none';
  if (t.riskLevel === 'LOW') {
    showMessage('transferSuccess', data.message, 'success');
  } else {
    alertBox.textContent = data.message;
    alertBox.className = 'fraud-box ' + (t.riskLevel === 'HIGH' ? 'high' : 'medium');
    alertBox.style.display = 'block';
  }

  document.getElementById('transferResult').style.display = 'block';
  document.getElementById('transferForm').reset();
  customTime.classList.add('hidden');
}

init();
