const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  conteudo: { type: String, required: true, maxlength: 280 },
  dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);