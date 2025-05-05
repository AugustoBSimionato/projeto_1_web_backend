const apiUrl = 'http://localhost:3000/auth';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgElement = document.getElementById('registerMsg');
  
  try {
    const nome = document.getElementById('regNome').value;
    const email = document.getElementById('regEmail').value;
    const senha = document.getElementById('regSenha').value;

    msgElement.textContent = 'Enviando...';
    
    console.log('Enviando para:', `${apiUrl}/register`);
    console.log('Dados:', { nome, email, senha });
    
    const res = await fetch(`${apiUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });
    
    const responseText = await res.text();
    console.log('Status da resposta:', res.status);
    console.log('Headers:', [...res.headers.entries()]);
    console.log('Texto da resposta:', responseText);
    
    if (!responseText) {
      throw new Error('Resposta vazia do servidor');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('Erro ao analisar JSON:', responseText);
      throw new Error('Resposta inválida do servidor');
    }
    
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao registrar');
    }
    
    msgElement.textContent = data.message || 'Usuário registrado com sucesso!';
    msgElement.style.color = 'green';
    
    if (data.message) {
      setTimeout(() => window.location.href = 'login.html', 1500);
    }
  } catch (error) {
    console.error('Erro:', error);
    msgElement.textContent = error.message || 'Ocorreu um erro ao registrar';
    msgElement.style.color = 'red';
  }
});