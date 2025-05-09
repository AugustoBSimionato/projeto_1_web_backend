const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Post = require('../models/post');
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
    const postId = req.query.post;
    if (!postId) {
      return res.status(400).json({ error: 'ID do post é obrigatório.' });
    }
    
    const comments = await Comment.find({ post: postId })
      .populate('autor', 'nome email')
      .sort({ dataCriacao: -1 });
      
    res.json(comments);
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { post, conteudo } = req.body;
    
    const postExists = await Post.findById(post);
    if (!postExists) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    
    const comment = new Comment({
      autor: req.userId,
      post,
      conteudo
    });
    
    await comment.save();
    await comment.populate('autor', 'nome email');
    
    res.status(201).json(comment);
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao criar comentário.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado.' });
    }
    
    if (comment.autor.toString() !== req.userId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este comentário.' });
    }
    
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comentário excluído com sucesso!' });
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao excluir comentário.' });
  }
});

module.exports = router;