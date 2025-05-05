const apiUrl = 'http://localhost:3000/auth';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const senha = document.getElementById('loginSenha').value;

  const res = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    document.getElementById('loginMsg').style.color = 'green';
    document.getElementById('loginMsg').textContent = 'Login realizado com sucesso!';
    setTimeout(() => window.location.href = 'feed.html', 1500);
  } else {
    document.getElementById('loginMsg').style.color = '#d32f2f';
    document.getElementById('loginMsg').textContent = data.error;
  }
});