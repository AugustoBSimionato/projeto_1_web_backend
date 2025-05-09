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

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('autor', 'nome email');
      
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    
    res.json(post);
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao buscar post.' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const postId = req.query.post;
    if (postId) {
      const comments = await Comment.find({ post: postId })
        .populate('autor', 'nome email')
        .sort({ dataCriacao: -1 });
      return res.json(comments);
    }

    const posts = await Post.find()
      .populate('autor', 'nome email seguidores')
      .sort({ dataCriacao: -1 });
    res.json(posts);
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao buscar posts ou comentários.' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { post, conteudo } = req.body;

    if (post) {
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

      return res.status(201).json(comment);
    }

    const newPost = new Post({
      autor: req.userId,
      conteudo
    });
    await newPost.save();
    await newPost.populate('autor', 'nome email');
    res.status(201).json({ message: 'Post criado com sucesso!', post: newPost });
  } catch (err) {
    logError(err);
    res.status(500).json({ error: 'Erro ao criar post ou comentário.' });
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

router.delete('/:id/comment', auth, async (req, res) => {
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