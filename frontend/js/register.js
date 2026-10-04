// Registration page. Validation is done by the backend, which returns a message.
const val = (id) => document.getElementById(id).value;

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage('registerMessage');
  document.getElementById('registerAccountInfo').classList.add('hidden');

  const data = await api('POST', '/auth/register', {
    name: val('regName'),
    username: val('regUsername'),
    email: val('regEmail'),
    phone: val('regPhone'),
    password: val('regPassword'),
    confirmPassword: val('regConfirmPassword'),
    initialBalance: val('regInitialBalance')
  });

  if (data.success) {
    showMessage('registerMessage', data.message, 'success');
    document.getElementById('registerAccountNumber').textContent = data.accountNumber;
    document.getElementById('registerAccountInfo').classList.remove('hidden');
    document.getElementById('registerForm').reset();
  } else {
    showMessage('registerMessage', data.message, 'error');
  }
});
