const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar } = require('../middleware/auth');

// GET /notificacoes — listar notificações do usuário
router.get('/', autenticar, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM notificacoes
      WHERE usuario_tipo = $1 AND usuario_id = $2
      ORDER BY criado_em DESC
      LIMIT 50
    `, [req.usuario.tipo, req.usuario.id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar notificações:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /notificacoes/:id/ler
router.put('/:id/ler', autenticar, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notificacoes SET lida = TRUE WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.usuario.id]
    );
    res.json({ mensagem: 'Notificação marcada como lida' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// PUT /notificacoes/ler-todas
router.put('/ler-todas', autenticar, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notificacoes SET lida = TRUE WHERE usuario_tipo = $1 AND usuario_id = $2',
      [req.usuario.tipo, req.usuario.id]
    );
    res.json({ mensagem: 'Todas marcadas como lidas' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
