const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
const apiUrl = `/api/posts/${postId}`;

async function carregarPost() {
  const res = await fetch(apiUrl, {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  });
  const post = await res.json();
  document.getElementById('postDetalhe').innerHTML = `
    <h2>${post.autor.nome}</h2>
    <p>${post.conteudo}</p>
    <p><small>${new Date(post.dataCriacao).toLocaleString()}</small></p>
  `;
  carregarComentarios();
}

async function carregarComentarios() {
  const res = await fetch(`${apiUrl}/comments`, {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  });
  const comentarios = await res.json();
  const comentariosDiv = document.getElementById('comentarios');
  comentariosDiv.innerHTML = '';
  comentarios.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comentario';
    div.innerHTML = `<strong>${c.autor.nome}</strong>: ${c.conteudo}`;
    comentariosDiv.appendChild(div);
  });
}

document.getElementById('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const conteudo = document.getElementById('comentario').value;
  const res = await fetch(`${apiUrl}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ conteudo })
  });
  const data = await res.json();
  document.getElementById('commentMsg').textContent = data.message || data.error;
  if (data.message) {
    document.getElementById('comentario').value = '';
    carregarComentarios();
  }
});

window.onload = carregarPost;