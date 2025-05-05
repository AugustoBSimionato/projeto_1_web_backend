const apiUrl = '/api/posts';

document.addEventListener('DOMContentLoaded', () => {

  async function carregarFeed() {
    const res = await fetch(apiUrl, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    const posts = await res.json();
    const feedDiv = document.getElementById('feed');
    feedDiv.innerHTML = '';
    posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'post';
      postDiv.innerHTML = `
        <p><strong>${post.autor.nome}</strong>: ${post.conteudo}</p>
        <button onclick="abrirPost('${post._id}')">Ver detalhes</button>
      `;
      feedDiv.appendChild(postDiv);
    });
  }

  window.abrirPost = function(id) {
    window.location.href = `post.html?id=${id}`;
  };

  const postForm = document.getElementById('postForm');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const conteudo = document.getElementById('conteudo').value;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ conteudo })
      });
      const data = await res.json();
      document.getElementById('postMsg').textContent = data.message || data.error;
      if (data.message) {
        document.getElementById('conteudo').value = '';
        carregarFeed();
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }

  carregarFeed();
});