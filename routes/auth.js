const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Rota de teste para verificar se está funcionando
router.get('/test', (req, res) => {
  res.json({ message: 'Rota de autenticação funcionando!' });
});

// Rota de registro
router.post('/register', async (req, res) => {
  console.log('Rota /register acessada');
  console.log('Dados recebidos:', req.body);
  
  try {
    const { nome, email, senha } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }
    
    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);
    
    // Criar novo usuário
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

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Encontrar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email ou senha incorretos.' });
    }
    
    // Gerar token JWT
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

module.exports = router;