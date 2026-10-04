/**
 * Generates banking-fraud-testing.side (the Selenium IDE project file).
 *
 * You do NOT need to run this to use the tests - the generated .side file is
 * already included. It is kept so the test cases are easy to read and change:
 *
 *     node selenium/build-side.js
 *
 * Each command is written as [command, target, value, comment].
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
const uuid = () => crypto.randomUUID();
const WAIT = '10000'; // ms used by waitFor* commands
// Optional delay after browser actions, useful when presenting the demo.
const DEMO_PAUSE_MS = Math.max(0, Number(process.env.DEMO_PAUSE_MS) || 0);

// ------------------------------------------------------------------ helpers
const H = {
  RESET: 'Helper - Reset Demo Data',
  LOGIN: 'Helper - Login User',
  ADMIN: 'Helper - Login Admin',
  OPEN_TRANSFER: 'Helper - Open Transfer Page',
  TRANSFER: 'Helper - Submit Transfer'
};

const reset = () => [['run', H.RESET, '', 'Start every test from the same known data']];
const loginAs = (user, pass) => [
  ['store', user, 'loginUser'],
  ['store', pass, 'loginPass'],
  ['run', H.LOGIN, '']
];
/** Fills and submits the transfer form using a custom (simulated) time. */
const transfer = (receiver, amount, time = '10:00') => [
  ['store', receiver, 'receiver'],
  ['store', amount, 'amount'],
  ['store', time, 'testTime'],
  ['run', H.TRANSFER, '']
];
const waitVisible = (id) => ['waitForElementVisible', `id=${id}`, WAIT];

const helperTests = {
  [H.RESET]: [
    ['open', '/reset.html', '', 'Reloads the demo data and logs out (TEST_MODE only)'],
    waitVisible('resetStatus'),
    ['assertText', 'id=resetStatus', 'Demo data has been reset.']
  ],
  [H.LOGIN]: [
    ['open', '/login.html', '', 'Uses variables ${loginUser} and ${loginPass}'],
    ['assertTitle', 'Login - FraudGuard Bank', ''],
    ['type', 'id=loginUsername', '${loginUser}'],
    ['type', 'id=loginPassword', '${loginPass}'],
    ['click', 'id=loginButton', ''],
    waitVisible('dashboardContent')
  ],
  [H.ADMIN]: [
    ['open', '/admin-login.html', ''],
    ['type', 'id=adminUsername', 'admin'],
    ['type', 'id=adminPassword', 'Admin@123'],
    ['click', 'id=adminLoginButton', ''],
    waitVisible('adminContent')
  ],
  [H.OPEN_TRANSFER]: [
    ['open', '/transfer.html', ''],
    waitVisible('testTimeSection', 'The test-time option appears only in TEST_MODE')
  ],
  [H.TRANSFER]: [
    ['type', 'id=receiverAccount', '${receiver}', 'Uses variables ${receiver}, ${amount}, ${testTime}'],
    ['type', 'id=transferAmount', '${amount}'],
    ['select', 'id=timeMode', 'label=Custom Test Time'],
    ['type', 'id=customTime', '${testTime}'],
    ['click', 'id=transferButton', ''],
    waitVisible('transferResult')
  ]
};

// ------------------------------------------------------------------ suite 1: registration
function registration(overrides) {
  const f = {
    regName: 'Demo Student', regUsername: 'demostudent', regEmail: 'demo@student.test', regPhone: '9876543210',
    regPassword: 'Demo@123', regConfirmPassword: 'Demo@123', regInitialBalance: '10000', ...overrides
  };
  const cmds = [['open', '/register.html', ''], ['assertTitle', 'Register - FraudGuard Bank', '']];
  for (const [id, value] of Object.entries(f)) cmds.push(['type', `id=${id}`, value]);
  cmds.push(['click', 'id=registerButton', ''], waitVisible('registerMessage'));
  return cmds;
}
const regError = (overrides, message) => [...registration(overrides), ['assertText', 'id=registerMessage', message]];

const suite1 = {
  name: 'Suite 1 - Registration',
  tests: {
    'TC-REG-001 Valid registration': [
      ['executeScript', "return 'student' + (Date.now() % 1000000);", 'newUsername', 'Unique username for every run'],
      ['echo', 'Registering ${newUsername}', ''],
      ...registration({ regUsername: '${newUsername}' }),
      ['assertText', 'id=registerMessage', 'Registration successful.'],
      ['verifyElementPresent', 'id=registerAccountNumber', ''],
      ['storeText', 'id=registerAccountNumber', 'newAccount'],
      ['echo', 'New account number: ${newAccount}', ''],
      ['click', 'id=goToLoginLink', ''],
      ['waitForElementPresent', 'id=loginButton', WAIT],
      ['type', 'id=loginUsername', '${newUsername}'],
      ['type', 'id=loginPassword', 'Demo@123'],
      ['click', 'id=loginButton', ''],
      waitVisible('dashboardContent'),
      ['assertText', 'id=accountNumber', '${newAccount}'],
      ['assertText', 'id=currentBalance', '₹10,000.00']
    ],
    'TC-REG-002 Empty name': regError({ regName: '' }, 'Full name is required.'),
    'TC-REG-003 Empty username': regError({ regUsername: '' }, 'Username is required.'),
    'TC-REG-004 Invalid email': regError({ regEmail: 'student.test.com' }, 'Please enter a valid email address.'),
    'TC-REG-005 Weak password': regError({ regPassword: 'abc', regConfirmPassword: 'abc' }, 'Password must be at least 6 characters long and contain a number.'),
    'TC-REG-006 Password mismatch': regError({ regConfirmPassword: 'Other@123' }, 'Passwords do not match.'),
    'TC-REG-007 Duplicate username': [...reset(), ...regError({ regUsername: 'testuser' }, 'Username already exists.')],
    'TC-REG-008 Invalid initial balance': [
      ...regError({ regInitialBalance: 'ten thousand' }, 'Initial balance must be a number between 0 and 10,00,000.'),
      ['type', 'id=regInitialBalance', '-500', 'Negative value must also fail'],
      ['click', 'id=registerButton', ''],
      waitVisible('registerMessage'),
      ['verifyText', 'id=registerMessage', 'Initial balance must be a number between 0 and 10,00,000.']
    ]
  }
};

// ------------------------------------------------------------------ suite 2: login
function loginAttempt(user, pass) {
  return [
    ['type', 'id=loginUsername', user],
    ['type', 'id=loginPassword', pass],
    ['click', 'id=loginButton', ''],
    waitVisible('loginMessage')
  ];
}
const LOCK_MSG = 'Account temporarily locked due to multiple failed login attempts.';

const suite2 = {
  name: 'Suite 2 - Login',
  tests: {
    'TC-LOG-001 Valid login': [
      ...reset(),
      ['open', '/login.html', ''],
      ['type', 'id=loginUsername', 'testuser'],
      ['type', 'id=loginPassword', 'Test@123'],
      ['click', 'id=loginButton', ''],
      waitVisible('dashboardContent'),
      ['assertTitle', 'Dashboard - FraudGuard Bank', ''],
      ['assertText', 'id=welcomeMessage', 'Welcome, Test User!']
    ],
    'TC-LOG-002 Invalid username': [
      ...reset(), ['open', '/login.html', ''],
      ...loginAttempt('nosuchuser', 'Test@123'),
      ['assertText', 'id=loginMessage', 'Invalid username or password.']
    ],
    'TC-LOG-003 Invalid password': [
      ...reset(), ['open', '/login.html', ''],
      ...loginAttempt('testuser', 'Wrong@123'),
      ['assertText', 'id=loginMessage', 'Invalid username or password. 2 attempt(s) left.']
    ],
    'TC-LOG-004 Empty username': [
      ['open', '/login.html', ''],
      ...loginAttempt('', 'Test@123'),
      ['assertText', 'id=loginMessage', 'Username is required.']
    ],
    'TC-LOG-005 Empty password': [
      ['open', '/login.html', ''],
      ...loginAttempt('testuser', ''),
      ['assertText', 'id=loginMessage', 'Password is required.']
    ],
    'TC-LOG-006 Multiple failed login attempts lock the account': [
      ...reset(), ['open', '/login.html', ''],
      ['times', '3', '', 'Enter a wrong password 3 times'],
      ...loginAttempt('testuser', 'Wrong@123'),
      ['end', '', ''],
      ['assertText', 'id=loginMessage', LOCK_MSG],
      ['echo', 'Even the correct password is now rejected', ''],
      ...loginAttempt('testuser', 'Test@123'),
      ['assertText', 'id=loginMessage', LOCK_MSG]
    ],
    'TC-LOG-007 Locked account cannot login': [
      ...reset(), ['open', '/login.html', ''],
      ...loginAttempt('lockeduser', 'Locked@123'),
      ['assertText', 'id=loginMessage', LOCK_MSG],
      ['assertElementNotPresent', 'id=dashboardContent', '']
    ],
    'TC-LOG-008 Successful logout': [
      ...reset(), ...loginAs('testuser', 'Test@123'),
      ['click', 'id=logoutButton', ''],
      waitVisible('loginMessage'),
      ['assertTitle', 'Login - FraudGuard Bank', ''],
      ['assertText', 'id=loginMessage', 'You have been logged out.'],
      ['echo', 'Protected page must redirect to login after logout', ''],
      ['open', '/dashboard.html', ''],
      ['waitForElementPresent', 'id=loginButton', WAIT],
      ['assertTitle', 'Login - FraudGuard Bank', '']
    ]
  }
};

// ------------------------------------------------------------------ suite 3: dashboard
const loggedIn = () => [...reset(), ...loginAs('testuser', 'Test@123')];
const suite3 = {
  name: 'Suite 3 - Dashboard',
  tests: {
    'TC-DB-001 Dashboard loads': [
      ...loggedIn(),
      ['assertTitle', 'Dashboard - FraudGuard Bank', ''],
      ['assertElementPresent', 'id=dashboardContent', ''],
      ['assertText', 'id=welcomeMessage', 'Welcome, Test User!'],
      ['assertElementPresent', 'id=recentTransactionsTable', '']
    ],
    'TC-DB-002 Username displayed': [
      ...loggedIn(),
      ['assertText', 'id=userName', 'Test User'],
      ['verifyText', 'id=userUsername', 'testuser']
    ],
    'TC-DB-003 Account number displayed': [
      ...loggedIn(),
      ['assertText', 'id=accountNumber', '10000001']
    ],
    'TC-DB-004 Balance displayed': [
      ...loggedIn(),
      ['assertText', 'id=currentBalance', '₹50,000.00']
    ],
    'TC-DB-005 Transaction count displayed': [
      ...loggedIn(),
      ['assertText', 'id=totalTransactions', '5'],
      ['storeText', 'id=suspiciousCount', 'suspicious'],
      ['if', '${suspicious} > 0', '', 'Fraud warning box must match the count'],
      ['verifyElementPresent', 'id=dashboardAlert', ''],
      ['else', '', ''],
      ['echo', 'No suspicious transactions for this user', ''],
      ['assertText', 'id=suspiciousCount', '0'],
      ['end', '', ''],
      ['assertElementPresent', 'id=recent-TXN1005', '']
    ],
    'TC-DB-006 Navigation links work': [
      ...loggedIn(),
      ['click', 'id=navTransfer', ''],
      ['waitForElementPresent', 'id=transferButton', WAIT],
      ['assertTitle', 'Transfer Money - FraudGuard Bank', ''],
      ['click', 'id=navTransactions', ''],
      ['waitForElementPresent', 'id=transactionTable', WAIT],
      ['assertTitle', 'Transactions - FraudGuard Bank', ''],
      ['click', 'id=navProfile', ''],
      waitVisible('profileCard'),
      ['assertTitle', 'Profile - FraudGuard Bank', ''],
      ['assertText', 'id=profileAccountNumber', '10000001'],
      ['click', 'id=navDashboard', ''],
      waitVisible('dashboardContent'),
      ['assertTitle', 'Dashboard - FraudGuard Bank', '']
    ]
  }
};

// ------------------------------------------------------------------ suite 4: transfer
const onTransfer = () => [...loggedIn(), ['run', H.OPEN_TRANSFER, '']];
function transferError(receiver, amount, message) {
  return [
    ...onTransfer(),
    ['type', 'id=receiverAccount', receiver],
    ['type', 'id=transferAmount', amount],
    ['click', 'id=transferButton', ''],
    waitVisible('transferMessage'),
    ['assertText', 'id=transferMessage', message],
    ['assertText', 'id=transferBalance', '₹50,000.00']
  ];
}
const suite4 = {
  name: 'Suite 4 - Money Transfer',
  tests: {
    'TC-TR-001 Valid transfer': [
      ...onTransfer(),
      ['type', 'id=transferDescription', 'Lunch money'],
      ...transfer('10000002', '2000'),
      ['assertText', 'id=transferSuccess', 'Transaction successful.'],
      ['assertText', 'id=resultStatus', 'APPROVED']
    ],
    'TC-TR-002 Empty receiver': transferError('', '1000', 'Receiver account number is required.'),
    'TC-TR-003 Invalid receiver': [
      ...transferError('99999999', '1000', 'Receiver account not found.'),
      ['type', 'id=receiverAccount', '12AB', 'Wrong format'],
      ['type', 'id=transferAmount', '1000'],
      ['click', 'id=transferButton', ''],
      waitVisible('transferMessage'),
      ['verifyText', 'id=transferMessage', 'Invalid receiver account number. It must be 8 digits.']
    ],
    'TC-TR-004 Zero amount': transferError('10000002', '0', 'Amount must be greater than zero.'),
    'TC-TR-005 Negative amount': transferError('10000002', '-500', 'Amount cannot be negative.'),
    'TC-TR-006 Non-numeric amount': transferError('10000002', 'abc', 'Amount must be a valid number.'),
    'TC-TR-007 Insufficient balance': transferError('10000002', '60000', 'Insufficient balance.'),
    'TC-TR-008 Successful transaction confirmation': [
      ...onTransfer(),
      ...transfer('10000002', '2000'),
      ['storeText', 'id=resultTransactionId', 'txnId'],
      ['echo', 'Created ${txnId}', ''],
      ['assertText', 'id=resultTransactionId', 'TXN1011'],
      ['assertText', 'id=resultAmount', '₹2,000.00'],
      ['assertText', 'id=resultReceiver', '10000002 (Ravi Kumar)'],
      ['verifyElementPresent', 'id=resultDateTime', ''],
      ['assertText', 'id=resultStatus', 'APPROVED'],
      ['assertText', 'id=resultRiskScore', '0'],
      ['assertText', 'id=resultRiskLevel', 'LOW']
    ],
    'TC-TR-009 Balance updated correctly': [
      ...loggedIn(),
      ['store', '2000', 'transferAmount'],
      ['executeScript', "return String(document.getElementById('currentBalance').dataset.value);", 'balanceBefore'],
      ['echo', 'Balance before: ${balanceBefore}', ''],
      ['run', H.OPEN_TRANSFER, ''],
      ...transfer('10000002', '${transferAmount}'),
      ['assertText', 'id=resultNewBalance', '₹48,000.00'],
      ['open', '/dashboard.html', ''],
      waitVisible('dashboardContent'),
      ['executeScript', 'return String(${balanceBefore} - ${transferAmount});', 'expectedBalance'],
      ['executeScript', "return String(document.getElementById('currentBalance').dataset.value);", 'balanceAfter'],
      ['assert', 'balanceAfter', '${expectedBalance}'],
      ['assertText', 'id=currentBalance', '₹48,000.00'],
      ['assertText', 'id=totalTransactions', '6']
    ]
  }
};

// ------------------------------------------------------------------ suite 5: fraud detection
const MEDIUM_MSG = 'Suspicious activity detected. Transaction approved with warning.';
const HIGH_MSG = 'Fraud alert! Transaction blocked due to high risk.';
const richOnTransfer = () => [...reset(), ...loginAs('richuser', 'Rich@123'), ['run', H.OPEN_TRANSFER, '']];

const suite5 = {
  name: 'Suite 5 - Fraud Detection',
  tests: {
    'TC-FD-001 Normal transaction is LOW risk': [
      ...onTransfer(),
      ...transfer('10000002', '1000', '10:00'),
      ['assertText', 'id=resultRiskScore', '0'],
      ['assertText', 'id=resultRiskLevel', 'LOW'],
      ['assertText', 'id=resultStatus', 'APPROVED'],
      ['waitForElementNotVisible', 'id=fraudAlert', '3000']
    ],
    'TC-FD-002 Large transaction is HIGH risk': [
      ...richOnTransfer(),
      ...transfer('10000002', '150000', '10:00'),
      ['assertText', 'id=resultRiskScore', '60'],
      ['assertText', 'id=resultRiskLevel', 'HIGH'],
      ['assertElementPresent', "xpath=//ul[@id='resultReasons']/li[contains(.,'Very large transaction amount')]", '']
    ],
    'TC-FD-003 Rapid transactions are suspicious': [
      ...onTransfer(),
      ['times', '3', '', 'Three quick normal transfers'],
      ...transfer('10000002', '500', '10:00'),
      ['assertText', 'id=resultStatus', 'APPROVED'],
      ['end', '', ''],
      ['echo', 'The 4th transfer within 5 minutes is flagged', ''],
      ...transfer('10000002', '500', '10:00'),
      ['assertText', 'id=resultRiskScore', '30'],
      ['assertText', 'id=resultStatus', 'SUSPICIOUS'],
      ['assertText', 'id=fraudAlert', MEDIUM_MSG],
      ['assertElementPresent', "xpath=//ul[@id='resultReasons']/li[contains(.,'Multiple transactions within a short period')]", '']
    ],
    'TC-FD-004 Unusual transaction time is suspicious': [
      ...onTransfer(),
      ...transfer('10000002', '1000', '02:30'),
      ['assertText', 'id=resultRiskScore', '30'],
      ['assertText', 'id=resultRiskLevel', 'MEDIUM'],
      ['assertText', 'id=resultStatus', 'SUSPICIOUS'],
      ['assertText', 'id=resultNewBalance', '₹49,000.00']
    ],
    'TC-FD-005 Multiple risk factors give HIGH risk': [
      ...onTransfer(),
      ['echo', 'Night time + new receiver + amount far above the usual pattern', ''],
      ...transfer('10000003', '10000', '02:30'),
      ['assertText', 'id=resultRiskScore', '60'],
      ['assertText', 'id=resultRiskLevel', 'HIGH'],
      ['executeScript', "return String(document.querySelectorAll('#resultReasons li').length);", 'reasonCount'],
      ['assert', 'reasonCount', '3']
    ],
    'TC-FD-006 High-risk transaction is blocked': [
      ...richOnTransfer(),
      ...transfer('10000002', '150000', '10:00'),
      ['storeText', 'id=resultRiskLevel', 'riskLevel'],
      ['if', '${riskLevel} === "HIGH"', ''],
      ['assertText', 'id=resultStatus', 'BLOCKED'],
      ['echo', 'Money must NOT leave the account', ''],
      ['assertText', 'id=transferBalance', '₹5,00,000.00'],
      ['else', '', ''],
      ['echo', 'Unexpected risk level ${riskLevel}', ''],
      ['assertText', 'id=resultRiskLevel', 'HIGH'],
      ['end', '', '']
    ],
    'TC-FD-007 Fraud alert appears': [
      ...richOnTransfer(),
      ...transfer('10000002', '150000', '10:00'),
      ['waitForElementVisible', 'id=fraudAlert', '3000'],
      ['assertText', 'id=fraudAlert', HIGH_MSG],
      ['open', '/dashboard.html', ''],
      waitVisible('dashboardContent'),
      ['assertText', 'id=suspiciousCount', '1'],
      ['waitForElementVisible', 'id=dashboardAlert', '3000']
    ],
    'TC-FD-008 Fraud reason is displayed': [
      ...onTransfer(),
      ...transfer('10000002', '1000', '02:30'),
      ['assertElementPresent', "xpath=//ul[@id='resultReasons']/li[contains(.,'Unusual transaction time')]", ''],
      ['assertText', "xpath=//ul[@id='resultReasons']/li[1]", 'Unusual transaction time (between 12 AM and 5 AM)']
    ]
  }
};

// ------------------------------------------------------------------ suite 6: history
const toHistory = () => [
  ['click', 'id=navTransactions', ''],
  ['waitForElementPresent', 'id=transactionTable', WAIT],
  ['waitForElementPresent', 'css=#transactionTableBody tr', WAIT]
];
const nightTxn = () => [...onTransfer(), ...transfer('10000002', '1000', '02:30'), ['storeText', 'id=resultTransactionId', 'txnId'], ...toHistory()];

const suite6 = {
  name: 'Suite 6 - Transaction History',
  tests: {
    'TC-TH-001 New transaction appears in history': [
      ...onTransfer(),
      ...transfer('10000002', '1000', '10:00'),
      ['storeText', 'id=resultTransactionId', 'txnId'],
      ...toHistory(),
      ['assertElementPresent', 'id=txn-${txnId}', ''],
      ['assertText', 'id=transactionCount', 'Showing 6 of 6 transactions']
    ],
    'TC-TH-002 Correct amount shown': [
      ...loggedIn(), ...toHistory(),
      ['assertText', 'id=TXN1004-amount', '₹3,000.00'],
      ['assertText', 'id=TXN1005-amount', '₹1,000.00']
    ],
    'TC-TH-003 Correct transaction status shown': [
      ...nightTxn(),
      ['assertText', 'id=${txnId}-status', 'SUSPICIOUS'],
      ['assertText', 'id=TXN1004-status', 'APPROVED']
    ],
    'TC-TH-004 Correct risk score shown': [
      ...nightTxn(),
      ['assertText', 'id=${txnId}-riskScore', '30'],
      ['verifyText', 'id=${txnId}-riskLevel', 'MEDIUM']
    ],
    'TC-TH-005 Fraud reason shown': [
      ...nightTxn(),
      ['assertText', 'id=${txnId}-reasons', 'Unusual transaction time (between 12 AM and 5 AM)'],
      ['assertText', 'id=TXN1004-reasons', '-']
    ],
    'TC-TH-006 Search transaction': [
      ...loggedIn(), ...toHistory(),
      ['type', 'id=searchTransaction', 'TXN1003'],
      ['click', 'id=searchButton', ''],
      ['assertText', 'id=transactionCount', 'Showing 1 of 5 transactions'],
      ['assertElementPresent', 'id=txn-TXN1003', ''],
      ['assertElementNotPresent', 'id=txn-TXN1002', ''],
      ['type', 'id=searchTransaction', 'NOTHING-MATCHES'],
      ['click', 'id=searchButton', ''],
      ['assertElementPresent', 'id=noTransactions', ''],
      ['click', 'id=clearSearchButton', ''],
      ['assertText', 'id=transactionCount', 'Showing 5 of 5 transactions']
    ],
    'TC-TH-007 Filter approved transactions': [
      ...nightTxn(),
      ['select', 'id=filterStatus', 'label=Approved'],
      ['assertText', 'id=transactionCount', 'Showing 5 of 6 transactions'],
      ['assertElementNotPresent', 'id=txn-${txnId}', ''],
      ['assertElementNotPresent', "xpath=//tbody[@id='transactionTableBody']//td[contains(@id,'-status') and not(text()='APPROVED')]", '']
    ],
    'TC-TH-008 Filter blocked transactions': [
      ...onTransfer(),
      ...transfer('10000003', '10000', '02:30'),
      ['assertText', 'id=resultStatus', 'BLOCKED'],
      ...toHistory(),
      ['select', 'id=filterStatus', 'label=Blocked'],
      ['assertText', 'id=transactionCount', 'Showing 1 of 6 transactions'],
      ['assertText', 'id=TXN1011-status', 'BLOCKED'],
      ['assertText', 'id=TXN1011-riskScore', '60']
    ]
  }
};

// ------------------------------------------------------------------ suite 7: admin
const adminIn = () => [...reset(), ['run', H.ADMIN, '']];
const suite7 = {
  name: 'Suite 7 - Admin',
  tests: {
    'TC-AD-001 Admin login': [
      ...reset(),
      ['open', '/admin-login.html', ''],
      ['assertTitle', 'Admin Login - FraudGuard Bank', ''],
      ['echo', 'Wrong password first', ''],
      ['type', 'id=adminUsername', 'admin'],
      ['type', 'id=adminPassword', 'wrong'],
      ['click', 'id=adminLoginButton', ''],
      waitVisible('adminLoginMessage'),
      ['assertText', 'id=adminLoginMessage', 'Invalid username or password.'],
      ['echo', 'A normal user cannot use the admin login', ''],
      ['type', 'id=adminUsername', 'testuser'],
      ['type', 'id=adminPassword', 'Test@123'],
      ['click', 'id=adminLoginButton', ''],
      waitVisible('adminLoginMessage'),
      ['assertText', 'id=adminLoginMessage', 'This account is not an admin account.'],
      ['type', 'id=adminUsername', 'admin'],
      ['type', 'id=adminPassword', 'Admin@123'],
      ['click', 'id=adminLoginButton', ''],
      waitVisible('adminContent'),
      ['assertTitle', 'Admin Dashboard - FraudGuard Bank', '']
    ],
    'TC-AD-002 Admin dashboard statistics load': [
      ...adminIn(),
      ['assertText', 'id=statTotalTransactions', '10'],
      ['assertText', 'id=statApproved', '8'],
      ['assertText', 'id=statSuspicious', '1'],
      ['assertText', 'id=statBlocked', '1'],
      ['assertText', 'id=statTotalUsers', '6'],
      ['verifyText', 'id=statOpenAlerts', '2']
    ],
    'TC-AD-003 Transaction list displayed': [
      ...adminIn(),
      ['assertElementPresent', 'id=adminTransactionTable', ''],
      ['assertText', 'id=adminTransactionCount', 'Showing 10 of 10 transactions'],
      ['assertText', 'id=admin-TXN1001-user', 'testuser'],
      ['assertText', 'id=admin-TXN1009-status', 'BLOCKED'],
      ['click', 'id=viewBtn-TXN1009', ''],
      waitVisible('transactionDetails'),
      ['assertText', 'id=detailTransactionId', 'TXN1009'],
      ['assertText', 'id=detailRiskScore', '60'],
      ['assertElementPresent', "xpath=//ul[@id='detailReasons']/li[contains(.,'Unusual transaction time')]", '']
    ],
    'TC-AD-004 Fraud alerts displayed and reviewed': [
      ...adminIn(),
      ['assertElementPresent', 'id=alert-TXN1009', ''],
      ['assertText', 'id=alert-TXN1009-user', 'riskyuser'],
      ['assertText', 'id=alert-TXN1009-riskScore', '60'],
      ['assertText', 'id=alert-TXN1009-status', 'OPEN'],
      ['click', 'id=reviewBtn-TXN1009', ''],
      waitVisible('adminMessage'),
      ['assertText', 'id=adminMessage', 'Alert for TXN1009 marked as reviewed.'],
      ['assertText', 'id=alert-TXN1009-status', 'REVIEWED'],
      ['assertText', 'id=statOpenAlerts', '1']
    ],
    'TC-AD-005 Search transaction': [
      ...adminIn(),
      ['type', 'id=adminSearch', 'riskyuser'],
      ['click', 'id=adminSearchButton', ''],
      ['assertText', 'id=adminTransactionCount', 'Showing 2 of 10 transactions'],
      ['assertElementPresent', 'id=admin-txn-TXN1010', ''],
      ['assertElementNotPresent', 'id=admin-txn-TXN1001', '']
    ],
    'TC-AD-006 Filter high-risk transactions': [
      ...adminIn(),
      ['select', 'id=adminRiskFilter', 'label=High'],
      ['assertText', 'id=adminTransactionCount', 'Showing 1 of 10 transactions'],
      ['assertText', 'id=admin-TXN1009-riskLevel', 'HIGH'],
      ['select', 'id=adminRiskFilter', 'label=Medium'],
      ['assertText', 'id=adminTransactionCount', 'Showing 1 of 10 transactions'],
      ['assertElementPresent', 'id=admin-txn-TXN1010', '']
    ],
    'TC-AD-007 Block user': [
      ...adminIn(),
      ['assertText', 'id=status-riskyuser', 'Active'],
      ['click', 'id=blockBtn-riskyuser', ''],
      waitVisible('adminMessage'),
      ['assertText', 'id=adminMessage', 'User riskyuser has been blocked.'],
      ['assertText', 'id=status-riskyuser', 'Blocked'],
      ['echo', 'The blocked user can no longer login', ''],
      ['click', 'id=logoutButton', ''],
      waitVisible('adminLoginMessage'),
      ['open', '/login.html', ''],
      ...loginAttempt('riskyuser', 'Risky@123'),
      ['assertText', 'id=loginMessage', 'Your account has been blocked by the administrator.']
    ],
    'TC-AD-008 Unblock user (also clears login lock)': [
      ...adminIn(),
      ['assertText', 'id=status-lockeduser', 'Locked'],
      ['click', 'id=unblockBtn-lockeduser', ''],
      waitVisible('adminMessage'),
      ['assertText', 'id=adminMessage', 'User lockeduser has been unblocked.'],
      ['assertText', 'id=status-lockeduser', 'Active'],
      ['assertText', 'id=failed-lockeduser', '0'],
      ['echo', 'The user can login again', ''],
      ['click', 'id=logoutButton', ''],
      waitVisible('adminLoginMessage'),
      ...loginAs('lockeduser', 'Locked@123'),
      ['assertText', 'id=welcomeMessage', 'Welcome, Locked User!']
    ],
    'TC-AD-009 Admin logout': [
      ...adminIn(),
      ['click', 'id=logoutButton', ''],
      waitVisible('adminLoginMessage'),
      ['assertText', 'id=adminLoginMessage', 'You have been logged out.'],
      ['open', '/admin.html', ''],
      ['waitForElementPresent', 'id=adminLoginButton', WAIT],
      ['assertTitle', 'Admin Login - FraudGuard Bank', '']
    ]
  }
};

// ------------------------------------------------------------------ build the .side JSON
const selectedCases = new Set([
  'TC-REG-001', 'TC-REG-004', 'TC-REG-005', 'TC-REG-007',
  'TC-LOG-001', 'TC-LOG-003', 'TC-LOG-006', 'TC-LOG-007',
  'TC-DB-001', 'TC-DB-004', 'TC-DB-006',
  'TC-TR-001', 'TC-TR-003', 'TC-TR-007', 'TC-TR-009',
  'TC-FD-001', 'TC-FD-002', 'TC-FD-003', 'TC-FD-004', 'TC-FD-005', 'TC-FD-006',
  'TC-TH-001', 'TC-TH-006', 'TC-TH-008',
  'TC-AD-001', 'TC-AD-002', 'TC-AD-004', 'TC-AD-006', 'TC-AD-007', 'TC-AD-008'
]);
const SUITES = [suite1, suite2, suite3, suite4, suite5, suite6, suite7].map((suite) => ({
  ...suite,
  tests: Object.fromEntries(Object.entries(suite.tests).filter(([name]) =>
    selectedCases.has(name.match(/^TC-[A-Z]+-\d{3}/)?.[0])
  ))
}));

function makeTest(name, commands) {
  const pacedCommands = [];
  for (const command of commands) {
    pacedCommands.push(command);
    if (DEMO_PAUSE_MS > 0 && ['open', 'type', 'click', 'select'].includes(command[0])) {
      pacedCommands.push(['pause', String(DEMO_PAUSE_MS), '', 'Demo pacing delay']);
    }
  }
  return {
    id: uuid(),
    name,
    commands: pacedCommands.map(([command, target = '', value = '', comment = '']) => ({
      id: uuid(), comment, command, target, targets: [], value
    }))
  };
}

const project = { id: uuid(), version: '2.0', name: 'AI Banking Fraud Detection Testing', url: BASE_URL, tests: [], suites: [], urls: [BASE_URL + '/'], plugins: [] };

const helperIds = [];
for (const [name, cmds] of Object.entries(helperTests)) {
  const t = makeTest(name, cmds);
  project.tests.push(t);
  helperIds.push(t.id);
}
for (const s of SUITES) {
  const ids = [];
  for (const [name, cmds] of Object.entries(s.tests)) {
    const t = makeTest(name, cmds);
    project.tests.push(t);
    ids.push(t.id);
  }
  project.suites.push({ id: uuid(), name: s.name, persistSession: false, parallel: false, timeout: 300, tests: ids });
}
project.suites.push({ id: uuid(), name: 'Helpers (called by other tests)', persistSession: false, parallel: false, timeout: 300, tests: helperIds });

const out = path.join(__dirname, 'banking-fraud-testing.side');
fs.writeFileSync(out, JSON.stringify(project, null, 2));
const total = SUITES.reduce((n, s) => n + Object.keys(s.tests).length, 0);
console.log(`Wrote ${out}\n${SUITES.length} suites, ${total} test cases, ${helperIds.length} helper tests`);

module.exports = { SUITES };
