const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');

// Middleware de autenticação
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Por favor, faça login para acessar.' });
  }
};

// Obter todos os posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('autor', 'nome email')
      .sort({ dataCriacao: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar posts.' });
  }
});

// Criar um novo post
router.post('/', auth, async (req, res) => {
  try {
    const post = new Post({
      autor: req.userId,
      conteudo: req.body.conteudo
    });
    await post.save();
    await post.populate('autor', 'nome email');
    res.status(201).json({ message: 'Post criado com sucesso!', post });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar post.' });
  }
});

// Obter um post específico
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('autor', 'nome email');
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar post.' });
  }
});

// Excluir um post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    
    // Verificar se o usuário é o autor do post
    if (post.autor.toString() !== req.userId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este post.' });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    // Também excluir comentários associados
    await Comment.deleteMany({ post: req.params.id });
    
    res.json({ message: 'Post excluído com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir post.' });
  }
});

// Curtir ou descurtir um post
router.patch('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    
    const index = post.curtidas.findIndex(id => id.toString() === req.userId);
    if (index === -1) {
      // Usuário ainda não curtiu, adicionar curtida
      post.curtidas.push(req.userId);
    } else {
      // Usuário já curtiu, remover curtida
      post.curtidas = post.curtidas.filter(id => id.toString() !== req.userId);
    }
    
    await post.save();
    res.json({ message: 'Ação realizada com sucesso!', curtidas: post.curtidas.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar a ação.' });
  }
});

// Obter comentários de um post
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const comentarios = await Comment.find({ post: req.params.id })
      .populate('autor', 'nome email')
      .sort({ dataCriacao: -1 });
    res.json(comentarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
});

// Adicionar comentário a um post
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });

    const comentario = new Comment({
      autor: req.userId,
      post: req.params.id,
      conteudo: req.body.conteudo
    });
    
    await comentario.save();
    await comentario.populate('autor', 'nome email');
    
    res.status(201).json({ 
      message: 'Comentário adicionado com sucesso!', 
      comentario 
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar comentário.' });
  }
});

module.exports = router;