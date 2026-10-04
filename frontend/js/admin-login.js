// Admin login page
if (new URLSearchParams(location.search).get('loggedOut')) {
  showMessage('adminLoginMessage', 'You have been logged out.', 'success');
}

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessage('adminLoginMessage');
  const data = await api('POST', '/auth/admin-login', {
    username: document.getElementById('adminUsername').value,
    password: document.getElementById('adminPassword').value
  });
  if (data.success) {
    window.location.href = 'admin.html';
  } else {
    showMessage('adminLoginMessage', data.message, 'error');
  }
});
