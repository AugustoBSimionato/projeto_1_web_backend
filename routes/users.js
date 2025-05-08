const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
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

router.patch('/follow/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Não é possível seguir a si mesmo.' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isFollowing = currentUser.seguindo.includes(targetUserId);

    if (isFollowing) {
      currentUser.seguindo.pull(targetUserId);
      targetUser.seguidores.pull(currentUserId);
      await currentUser.save();
      await targetUser.save();
      return res.json({ message: 'Deixou de seguir o usuário.' });
    } else {
      currentUser.seguindo.push(targetUserId);
      targetUser.seguidores.push(currentUserId);
      await currentUser.save();
      await targetUser.save();
      return res.json({ message: 'Agora você está seguindo o usuário.' });
    }
  } catch (err) {
    console.error(err);
    logError(err);
    res.status(500).json({ error: 'Erro ao executar a ação de seguir/desseguir.' });
  }
});

module.exports = router;