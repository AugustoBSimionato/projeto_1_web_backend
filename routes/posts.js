const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');
const { logError } = require('../utils/logger');

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

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('autor', 'nome email seguidores')
      .sort({ dataCriacao: -1 });
    res.json(posts);
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao buscar posts.' });
  }
});

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
    logError(err);
    res.status(500).json({ error: 'Erro ao criar post.' });
  }
});

router.get('/search', async (req, res) => {
  try {
      const query = req.query.query;
      console.log('Query de busca:', query);
      const posts = await Post.find({ 
          conteudo: { $regex: query, $options: 'i' }
      }).populate('autor', 'nome email');
      res.json(posts);
  } catch (err) {
      console.error(err);
      logError(err);
      res.status(500).json({ error: 'Erro na busca de posts.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    
    if (post.autor.toString() !== req.userId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este post.' });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post excluído com sucesso!' });
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao excluir post.' });
  }
});

router.patch('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    
    const index = post.curtidas.findIndex(id => id.toString() === req.userId);
    if (index === -1) {
      post.curtidas.push(req.userId);
    } else {
      post.curtidas = post.curtidas.filter(id => id.toString() !== req.userId);
    }
    
    await post.save();
    res.json({ message: 'Ação realizada com sucesso!', curtidas: post.curtidas.length });
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao processar a ação.' });
  }
});

module.exports = router;