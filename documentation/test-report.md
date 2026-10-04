# Previous Test Execution Report (56-case suite)

This report records an earlier execution of the original 56-case suite. The active Selenium
project has since been reduced to 30 selected cases across the same seven suites. Re-run the
current suite before using execution counts or pass results as a report of the reduced suite.

| Item | Value |
|---|---|
| Project | AI-Based Banking Fraud Detection & Automated Testing Using Selenium |
| Test file | selenium/banking-fraud-testing.side |
| Application URL | http://localhost:3000 (TEST_MODE=true) |
| Browser | Chromium (headless) |
| Execution date | 30/09/2026 |
| Total test cases | 56 |
| Passed | 54 |
| Failed | 2 |
| Pass rate | 96% |

> **Before submitting:** re-run the `.side` file in your own Selenium IDE (Chrome or Firefox), then update the date, browser and Actual/Result columns if anything differs, and add your screenshots of the Selenium IDE log.

## Summary by suite

| Suite | Tests | Passed | Failed |
|---|---|---|---|
| Suite 1 - Registration | 8 | 7 | 1 |
| Suite 2 - Login | 8 | 8 | 0 |
| Suite 3 - Dashboard | 6 | 6 | 0 |
| Suite 4 - Money Transfer | 9 | 8 | 1 |
| Suite 5 - Fraud Detection | 8 | 8 | 0 |
| Suite 6 - Transaction History | 8 | 8 | 0 |
| Suite 7 - Admin | 9 | 9 | 0 |

## Unit tests of the fraud engine

Command: `cd backend && npm test` (Node.js built-in test runner)

Result: **10 passed, 0 failed** (scenarios A-E, boundaries of risk levels, 05:00 time boundary, score cap at 100, determinism).

## Detailed results

| Test Case ID | Scenario | Expected Result | Actual Result | Result |
|---|---|---|---|---|
| TC-REG-001 | Valid registration | "Registration successful.", account number shown, new user can login with ₹10,000.00 | As expected | **PASS** |
| TC-REG-002 | Empty name | "Full name is required." | As expected | **PASS** |
| TC-REG-003 | Empty username | "Username is required." | As expected | **PASS** |
| TC-REG-004 | Invalid email | "Please enter a valid email address." | As expected | **PASS** |
| TC-REG-005 | Weak password | "Password must be at least 6 characters long and contain a number." | As expected | **PASS** |
| TC-REG-006 | Password mismatch | "Passwords do not match." | As expected | **PASS** |
| TC-REG-007 | Duplicate username | "Username already exists." | [assertText | id=registerMessage | Wrong text] expected "Wrong text" but got "Username already exists." | **FAIL** |
| TC-REG-008 | Invalid initial balance | "Initial balance must be a number between 0 and 10,00,000." | As expected | **PASS** |
| TC-LOG-001 | Valid login | Dashboard opens, "Welcome, Test User!" | As expected | **PASS** |
| TC-LOG-002 | Invalid username | "Invalid username or password." | As expected | **PASS** |
| TC-LOG-003 | Invalid password | "Invalid username or password. 2 attempt(s) left." | As expected | **PASS** |
| TC-LOG-004 | Empty username | "Username is required." | As expected | **PASS** |
| TC-LOG-005 | Empty password | "Password is required." | As expected | **PASS** |
| TC-LOG-006 | 3 failed logins | Account locked message, correct password also rejected | As expected | **PASS** |
| TC-LOG-007 | Locked account | Account locked message, no dashboard | As expected | **PASS** |
| TC-LOG-008 | Logout | "You have been logged out.", protected page redirects to login | As expected | **PASS** |
| TC-DB-001 | Dashboard loads | Correct title, welcome message, recent table | As expected | **PASS** |
| TC-DB-002 | Username displayed | "Test User" / "testuser" | As expected | **PASS** |
| TC-DB-003 | Account number displayed | "10000001" | As expected | **PASS** |
| TC-DB-004 | Balance displayed | "₹50,000.00" | As expected | **PASS** |
| TC-DB-005 | Transaction count displayed | Total 5, suspicious 0 | As expected | **PASS** |
| TC-DB-006 | Navigation links | All 4 pages open with correct titles | As expected | **PASS** |
| TC-TR-001 | Valid transfer | "Transaction successful.", APPROVED | As expected | **PASS** |
| TC-TR-002 | Empty receiver | "Receiver account number is required." | As expected | **PASS** |
| TC-TR-003 | Invalid receiver | "Receiver account not found." / 8-digit format message | As expected | **PASS** |
| TC-TR-004 | Zero amount | "Amount must be greater than zero." | As expected | **PASS** |
| TC-TR-005 | Negative amount | "Amount cannot be negative." | As expected | **PASS** |
| TC-TR-006 | Non-numeric amount | "Amount must be a valid number." | As expected | **PASS** |
| TC-TR-007 | Insufficient balance | "Insufficient balance.", balance unchanged | As expected | **PASS** |
| TC-TR-008 | Transaction confirmation | TXN1011, ₹2,000.00, Ravi Kumar, APPROVED, 0, LOW | As expected | **PASS** |
| TC-TR-009 | Balance updated | ₹50,000.00 → ₹48,000.00 | [assertText | id=resultNewBalance | ₹47,000.00] expected "₹47,000.00" but got "₹48,000.00" | **FAIL** |
| TC-FD-001 | Normal transaction | Score 0, LOW, APPROVED | As expected | **PASS** |
| TC-FD-002 | Large transaction | Score 60, HIGH | As expected | **PASS** |
| TC-FD-003 | Rapid transactions | 4th transfer: score 30, SUSPICIOUS, warning shown | As expected | **PASS** |
| TC-FD-004 | Unusual time (02:30) | Score 30, MEDIUM, SUSPICIOUS | As expected | **PASS** |
| TC-FD-005 | Multiple risk factors | Score 60, HIGH, 3 reasons | As expected | **PASS** |
| TC-FD-006 | High risk blocked | BLOCKED, balance stays ₹5,00,000.00 | As expected | **PASS** |
| TC-FD-007 | Fraud alert appears | Red fraud alert box, dashboard warning | As expected | **PASS** |
| TC-FD-008 | Fraud reason displayed | "Unusual transaction time (between 12 AM and 5 AM)" | As expected | **PASS** |
| TC-TH-001 | Transaction appears | New row present, 6 of 6 | As expected | **PASS** |
| TC-TH-002 | Correct amount | TXN1004 ₹3,000.00 | As expected | **PASS** |
| TC-TH-003 | Correct status | SUSPICIOUS / APPROVED | As expected | **PASS** |
| TC-TH-004 | Correct risk score | 30 / MEDIUM | As expected | **PASS** |
| TC-TH-005 | Fraud reason | Unusual-time reason shown | As expected | **PASS** |
| TC-TH-006 | Search | 1 of 5, no-match message, clear restores 5 of 5 | As expected | **PASS** |
| TC-TH-007 | Filter approved | 5 of 6, only APPROVED rows | As expected | **PASS** |
| TC-TH-008 | Filter blocked | 1 of 6, TXN1011 BLOCKED | As expected | **PASS** |
| TC-AD-001 | Admin login | Error messages, then admin dashboard | As expected | **PASS** |
| TC-AD-002 | Admin statistics | 10 / 8 / 1 / 1 / 6 users / 2 open alerts | As expected | **PASS** |
| TC-AD-003 | Transaction list + details | 10 of 10, TXN1009 details with reasons | As expected | **PASS** |
| TC-AD-004 | Fraud alerts + review | TXN1009 alert OPEN → REVIEWED | As expected | **PASS** |
| TC-AD-005 | Search | 2 of 10 for riskyuser | As expected | **PASS** |
| TC-AD-006 | Filter high risk | 1 of 10 (TXN1009) | As expected | **PASS** |
| TC-AD-007 | Block user | riskyuser Blocked, cannot login | As expected | **PASS** |
| TC-AD-008 | Unblock user | lockeduser Active, can login | As expected | **PASS** |
| TC-AD-009 | Admin logout | Logged out, admin page protected | As expected | **PASS** |

## Fraud detection test cases in detail

```text
TC-FD-001
Scenario:      Test normal transaction
Preconditions: Demo data reset; logged in as testuser (balance Rs. 50,000)
Steps:         1. Login  2. Open Transfer  3. Enter receiver 10000002 (known)
               4. Enter Rs. 1,000  5. Choose Custom Test Time 10:00  6. Submit
Expected:      Transaction approved, Risk score 0, Risk level LOW
Actual:        Transaction approved, Risk score 0, Risk level LOW
Result:        PASS
```

```text
TC-FD-002
Scenario:      Test large transaction
Preconditions: Demo data reset; logged in as richuser (balance Rs. 5,00,000, usual amount Rs. 5,000)
Steps:         1. Login  2. Open Transfer  3. Receiver 10000002  4. Amount Rs. 1,50,000
               5. Custom Test Time 10:00  6. Submit
Expected:      Risk score 60 (40 very large amount + 20 deviation), HIGH, BLOCKED
Actual:        Risk score 60, HIGH, BLOCKED
Result:        PASS
```

```text
TC-FD-003
Scenario:      Test rapid transactions
Preconditions: Demo data reset; logged in as testuser
Steps:         1. Make 3 transfers of Rs. 500 to 10000002 at 10:00 (Selenium "times" loop)
               2. Make a 4th transfer of Rs. 500 immediately
Expected:      First 3 APPROVED; 4th scores 30, MEDIUM, SUSPICIOUS,
               "Suspicious activity detected. Transaction approved with warning."
Actual:        As expected
Result:        PASS
```

```text
TC-FD-004
Scenario:      Test unusual transaction time
Preconditions: Demo data reset; logged in as testuser
Steps:         1. Receiver 10000002  2. Amount Rs. 1,000  3. Custom Test Time 02:30  4. Submit
Expected:      Score 30, MEDIUM, SUSPICIOUS, balance becomes Rs. 49,000
Actual:        As expected
Result:        PASS
```

```text
TC-FD-005
Scenario:      Test multiple risk factors
Preconditions: Demo data reset; logged in as testuser
Steps:         1. Receiver 10000003 (never paid before)  2. Amount Rs. 10,000 (> 3 x average 2,250)
               3. Custom Test Time 02:30  4. Submit
Expected:      Score 60 (30 time + 10 new receiver + 20 deviation), HIGH, 3 reasons listed
Actual:        As expected
Result:        PASS
```

## Observations

1. All validation messages come from the backend, so the same message is shown to the user
   and checked by Selenium.
2. Because every test resets the data and uses a simulated transaction time, the suite gave
   the same result on repeated runs, independent of the time of day.
3. Blocked transactions never change any balance; suspicious ones do (approved with warning).

## Design decisions that keep the tests reliable

| Decision | Why |
|---|---|
| Inputs use `type="text"` and forms use `novalidate` | Browser HTML5 validation would block invalid values before the app's own validation could be tested. |
| "Custom Test Time" option on the transfer page (TEST_MODE only) | Tests run at 1 AM would otherwise be flagged by the night-time rule. |
| `/reset.html` reloads fixed seed data | Balances, counts and new transaction IDs (TXN1011) are always the same, so exact values can be asserted. |
| Result/message boxes are hidden until the server answers | `waitForElementVisible` then reliably waits for the API response. |
