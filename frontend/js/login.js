// Customer login page
if (new URLSearchParams(location.search).get('loggedOut')) {
  showMessage('loginMessage', 'You have been logged out.', 'success');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage('loginMessage');
  const btn = document.getElementById('loginButton');
  btn.disabled = true;

  const data = await api('POST', '/auth/login', {
    username: document.getElementById('loginUsername').value,
    password: document.getElementById('loginPassword').value
  });

  btn.disabled = false;
  if (data.success) {
    window.location.href = 'dashboard.html';
  } else {
    showMessage('loginMessage', data.message, 'error');
  }
});
