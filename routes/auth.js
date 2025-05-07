const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.get('/test', (req, res) => {
  res.json({ message: 'Rota de autenticação funcionando!' });
});

router.post('/register', async (req, res) => {
  console.log('Rota /register acessada');
  console.log('Dados recebidos:', req.body);
  
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);
    
    const user = new User({
      nome,
      email,
      senha: hashedPassword
    });
    
    await user.save();
    
    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }
    
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }
    
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'sua_chave_secreta',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    const userId = decoded.id;

    const user = await User.findById(userId).select('-senha');
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({
      id: user._id,
      nome: user.nome,
      email: user.email,
      descricao: user.descricao,
      dataCriacao: user.dataCriacao,
      seguidores: user.seguidores,
      seguindo: user.seguindo
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

router.patch('/profile/descricao', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    const userId = decoded.id;

    const { descricao } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { descricao },
      { new: true }
    ).select('-senha');
    res.json({ descricao: user.descricao });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar descrição.' });
  }
});

router.delete('/profile', async (req, res) => { 
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta');
    const userId = decoded.id;

    const { senha } = req.body;
    if (!senha) {
      return res.status(400).json({ error: "Senha é necessária para exclusão da conta." });
    }
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
    
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(400).json({ error: "Senha incorreta." });
    }

    await User.findByIdAndDelete(userId);
    // Opcional: remover posts e comentários relacionados ao usuário.
    res.json({ message: "Conta excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    res.status(500).json({ error: "Erro ao excluir a conta." });
  }
});

module.exports = router;