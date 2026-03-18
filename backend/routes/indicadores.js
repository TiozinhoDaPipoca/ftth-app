const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar } = require('../middleware/auth');

// GET /indicadores — ranking de técnicos
router.get('/', autenticar, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.nome AS tecnico,
        t.nivel,
        t.rating,
        COUNT(os.id) AS "totalOS",
        COUNT(os.id) FILTER (WHERE os.status = 'executada') AS executadas,
        COUNT(os.id) FILTER (WHERE os.status LIKE 'impedimento%') AS impedimentos,
        COALESCE(SUM(os.valor_liquido) FILTER (WHERE os.status = 'executada'), 0) AS ganho_total
      FROM tecnicos t
      LEFT JOIN ordens_servico os ON os.tecnico_id = t.id
      WHERE t.ativo = TRUE
      GROUP BY t.id, t.nome, t.nivel, t.rating
      ORDER BY COUNT(os.id) FILTER (WHERE os.status = 'executada') DESC
    `);

    const indicadores = result.rows.map(r => ({
      ...r,
      totalOS: Number(r.totalOS),
      executadas: Number(r.executadas),
      impedimentos: Number(r.impedimentos),
      ganho_total: Number(r.ganho_total),
      percentualImpedimento: Number(r.totalOS) > 0
        ? ((Number(r.impedimentos) / Number(r.totalOS)) * 100).toFixed(2)
        : '0.00',
    }));

    res.json(indicadores);
  } catch (err) {
    console.error('Erro nos indicadores:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
