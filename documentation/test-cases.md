# Selected Test Cases (30 active scenarios)

Project: **AI-Based Banking Fraud Detection & Automated Testing Using Selenium**
Automation tool: **Selenium IDE** (`selenium/banking-fraud-testing.side`)
Base URL: `http://localhost:3000`

## Common preconditions

1. MongoDB is running and the backend is started with `npm start` (TEST_MODE=true).
2. Tests that change account or transaction state begin with **Helper - Reset Demo Data**, which
   opens `/reset.html` and reloads the seed data. The selected scenarios can be run alone or in
   any order.
3. Transfers inside the tests use the **Custom Test Time** option (usually `10:00`, or `02:30`
   for the night-time rule) so the results never depend on the real clock.

## Helper tests (called with the `run` command)

| Helper | What it does |
|---|---|
| Helper - Reset Demo Data | Opens `/reset.html`, waits for "Demo data has been reset." |
| Helper - Login User | Logs in with variables `${loginUser}` / `${loginPass}`, waits for the dashboard |
| Helper - Login Admin | Logs in as `admin / Admin@123`, waits for the admin dashboard |
| Helper - Open Transfer Page | Opens `/transfer.html`, waits for the test-time option |
| Helper - Submit Transfer | Fills receiver `${receiver}`, amount `${amount}`, custom time `${testTime}` and submits |

---

## Suite 1 - Registration

| ID | Scenario | Test data | Steps | Expected result |
|---|---|---|---|---|
| TC-REG-001 | Valid registration | Unique username generated with `executeScript`, password `Demo@123`, balance 10000 | 1. Open Register 2. Fill all fields 3. Click Register 4. Click "Go to Login" 5. Login with new user | "Registration successful." and an account number is shown; the new user can login and sees ₹10,000.00 |
| TC-REG-004 | Invalid email | `student.test.com` | Fill form with invalid email, click Register | "Please enter a valid email address." |
| TC-REG-005 | Weak password | `abc` / `abc` | Fill form with short password, click Register | "Password must be at least 6 characters long and contain a number." |
| TC-REG-007 | Duplicate username | `testuser` | Reset data, fill form with existing username, click Register | "Username already exists." |

## Suite 2 - Login

| ID | Scenario | Test data | Steps | Expected result |
|---|---|---|---|---|
| TC-LOG-001 | Valid login | testuser / Test@123 | Open Login, enter credentials, click Login | Dashboard opens, title "Dashboard - FraudGuard Bank", "Welcome, Test User!" |
| TC-LOG-003 | Invalid password | testuser / Wrong@123 | Enter credentials, click Login | "Invalid username or password. 2 attempt(s) left." |
| TC-LOG-006 | Multiple failed logins | testuser / Wrong@123 ×3 | Loop 3 times (`times` command), then try the correct password | "Account temporarily locked due to multiple failed login attempts." - even for the correct password |
| TC-LOG-007 | Locked account | lockeduser / Locked@123 | Login with correct password | Lock message shown, dashboard not opened |

## Suite 3 - Dashboard

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| TC-DB-001 | Dashboard loads | Login as testuser | Title "Dashboard - FraudGuard Bank", welcome message, recent transactions table present |
| TC-DB-004 | Balance displayed | Login as testuser | "₹50,000.00" |
| TC-DB-006 | Navigation links work | Click Transfer Money, Transactions, Profile, Dashboard | Each page opens with the correct title; profile shows account 10000001 |

## Suite 4 - Money Transfer

Precondition: logged in as testuser (balance ₹50,000.00) on the Transfer page.

| ID | Scenario | Receiver / Amount | Expected result |
|---|---|---|---|
| TC-TR-001 | Valid transfer | 10000002 / 2000 at 10:00 | "Transaction successful.", status APPROVED |
| TC-TR-003 | Invalid receiver | 99999999 / 1000, then 12AB / 1000 | "Receiver account not found." then "Invalid receiver account number. It must be 8 digits." |
| TC-TR-007 | Insufficient balance | 10000002 / 60000 | "Insufficient balance." Balance still ₹50,000.00 |
| TC-TR-009 | Balance updated correctly | `store 2000 transferAmount`; balance read with `executeScript` | New balance ₹48,000.00 on result and dashboard; `assert` balanceAfter = balanceBefore - amount; total transactions 6 |

## Suite 5 - Fraud Detection

| ID | Scenario | User / Receiver / Amount / Time | Expected score | Expected result |
|---|---|---|---|---|
| TC-FD-001 | Normal transaction | testuser / 10000002 / 1000 / 10:00 | 0 | LOW, APPROVED, no fraud alert box |
| TC-FD-002 | Large transaction | richuser / 10000002 / 150000 / 10:00 | 60 | HIGH, reason "Very large transaction amount" |
| TC-FD-003 | Rapid transactions | testuser / 10000002 / 500 ×4 / 10:00 | 30 on the 4th | first 3 APPROVED, 4th SUSPICIOUS, warning "Suspicious activity detected. Transaction approved with warning." |
| TC-FD-004 | Unusual time | testuser / 10000002 / 1000 / 02:30 | 30 | MEDIUM, SUSPICIOUS, money still transferred (₹49,000.00) |
| TC-FD-005 | Multiple risk factors | testuser / 10000003 / 10000 / 02:30 | 60 | HIGH with exactly 3 reasons (checked with `executeScript` + `assert`) |
| TC-FD-006 | High-risk is blocked | richuser / 10000002 / 150000 / 10:00 | 60 | `if` level is HIGH → status BLOCKED and balance stays ₹5,00,000.00 |

## Suite 6 - Transaction History

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| TC-TH-001 | Transaction appears | Transfer 1000, store its ID, open Transactions | Row `txn-${txnId}` present, "Showing 6 of 6 transactions" |
| TC-TH-006 | Search | Search TXN1003, then a non-matching text, then Clear | 1 of 5 shown; "No transactions found."; Clear shows 5 of 5 |
| TC-TH-008 | Filter blocked | Blocked transfer (10000003 / 10000 / 02:30), select "Blocked" | 1 of 6 shown, TXN1011 BLOCKED with score 60 |

## Suite 7 - Admin

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| TC-AD-001 | Admin login | Wrong password, then testuser on admin page, then admin / Admin@123 | "Invalid username or password.", "This account is not an admin account.", then admin dashboard |
| TC-AD-002 | Dashboard statistics | Login as admin | Total 10, Approved 8, Suspicious 1, Blocked 1, Users 6, Open alerts 2 |
| TC-AD-004 | Fraud alerts + review | Click "Mark Reviewed" on TXN1009 | Alert row shows riskyuser / 60 / OPEN → REVIEWED; open alerts 1 |
| TC-AD-006 | Filter high risk | Select High, then Medium | 1 of 10 each (TXN1009 HIGH, TXN1010 MEDIUM) |
| TC-AD-007 | Block user | Block riskyuser, logout, try to login as riskyuser | "User riskyuser has been blocked.", status Blocked, login shows "Your account has been blocked by the administrator." |
| TC-AD-008 | Unblock user | Unblock lockeduser, logout, login as lockeduser | "User lockeduser has been unblocked.", status Active, failed logins 0, user can login |

## Selenium IDE commands used

`open`, `click`, `type`, `select`, `assertText`, `verifyText`, `assertTitle`, `assertElementPresent`,
`assertElementNotPresent`, `verifyElementPresent`, `waitForElementPresent`, `waitForElementVisible`,
`waitForElementNotVisible`, `store`, `storeText`, `executeScript`, `assert`, `echo`, `run`,
`if` / `else` / `end`, `times` / `end`.

Locator types used: `id=`, `css=`, `xpath=`.
