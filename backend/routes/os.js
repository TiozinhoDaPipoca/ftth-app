const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { autenticar, somenteEmpresa, somenteTecnico } = require('../middleware/auth');
const IXCService = require('../services/ixcService');

// Status permitidos
const STATUS_PERMITIDOS = [
  'disponivel', 'em_execucao', 'executada',
  'impedimento_cto_cheia', 'impedimento_cliente_ausente'
];
const STATUS_COM_OBSERVACAO = ['impedimento_cto_cheia', 'impedimento_cliente_ausente'];

// ═══════════════════════════════════════
// GET /os — listar ordens de serviço
// ═══════════════════════════════════════
router.get('/', autenticar, async (req, res) => {
  try {
    const { status, cidade, tipo, empresa_id } = req.query;

    let query = `
      SELECT os.*,
             e.nome AS empresa_nome,
             t.nome AS tecnico_nome,
             tp.valor_bruto,
             (SELECT valor::numeric FROM configuracoes WHERE chave = 'taxa_tecnico') AS taxa
      FROM ordens_servico os
      LEFT JOIN empresas e ON os.empresa_id = e.id
      LEFT JOIN tecnicos t ON os.tecnico_id = t.id
      LEFT JOIN tabela_precos tp ON tp.empresa_id = os.empresa_id
        AND tp.cidade = os.cidade AND tp.tipo = os.tipo
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    // Filtros
    if (status) { query += ` AND os.status = $${idx++}`; params.push(status); }
    if (cidade) { query += ` AND os.cidade ILIKE $${idx++}`; params.push(`%${cidade}%`); }
    if (tipo) { query += ` AND os.tipo = $${idx++}`; params.push(tipo); }
    if (empresa_id) { query += ` AND os.empresa_id = $${idx++}`; params.push(empresa_id); }

    // Se é técnico, mostra todas disponíveis + as dele
    if (req.usuario.tipo === 'tecnico') {
      query += ` AND (os.status = 'disponivel' OR os.tecnico_id = $${idx++})`;
      params.push(req.usuario.id);
    }

    // Se é empresa, mostra só as dela
    if (req.usuario.tipo === 'empresa') {
      query += ` AND os.empresa_id = $${idx++}`;
      params.push(req.usuario.id);
    }

    query += ' ORDER BY os.data_criacao DESC';

    const result = await pool.query(query, params);

    // Calcula valor líquido
    const ordens = result.rows.map(os => ({
      ...os,
      valor_liquido: os.valor_bruto ? Number(os.valor_bruto) - Number(os.taxa || 5) : null,
      // Compatibilidade com frontend anterior
      valorPagamento: os.valor_bruto ? Number(os.valor_bruto) - Number(os.taxa || 5) : null,
      tipoServico: os.tipo_servico,
      tecnicoId: os.tecnico_id,
      empresaId: os.empresa_id,
      clienteCpf: os.cliente_cpf,
      dataAtualizacao: os.data_atualizacao,
    }));

    res.json(ordens);
  } catch (err) {
    console.error('Erro ao listar OS:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// POST /os — criar nova OS (só empresa)
// ═══════════════════════════════════════
router.post('/', autenticar, somenteEmpresa, async (req, res) => {
  const {
    cliente_cpf, cliente_nome, cliente_telefone,
    cidade, endereco, latitude, longitude,
    tipo, tipo_servico, cto, observacao
  } = req.body;

  if (!cidade || !tipo || !tipo_servico) {
    return res.status(400).json({ erro: 'Cidade, tipo e tipo_servico são obrigatórios' });
  }

  try {
    // Busca preço
    const preco = await pool.query(
      'SELECT valor_bruto FROM tabela_precos WHERE empresa_id = $1 AND cidade = $2 AND tipo = $3 LIMIT 1',
      [req.usuario.id, cidade, tipo]
    );

    const taxa = await pool.query("SELECT valor::numeric FROM configuracoes WHERE chave = 'taxa_tecnico'");
    const valorBruto = preco.rows[0]?.valor_bruto || null;
    const taxaVal = taxa.rows[0]?.valor || 5;

    const result = await pool.query(`
      INSERT INTO ordens_servico
        (empresa_id, cliente_cpf, cliente_nome, cliente_telefone, cidade, endereco,
         latitude, longitude, tipo, tipo_servico, cto, observacao, valor_bruto, valor_liquido)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
    `, [
      req.usuario.id, cliente_cpf, cliente_nome, cliente_telefone,
      cidade, endereco, latitude, longitude,
      tipo, tipo_servico, cto, observacao,
      valorBruto, valorBruto ? valorBruto - taxaVal : null
    ]);

    const novaOS = result.rows[0];

    // Emite notificação via Socket.IO se disponível
    if (req.app.io) {
      req.app.io.emit('nova_os', novaOS);
    }

    res.status(201).json({ mensagem: 'OS criada com sucesso', os: novaOS });
  } catch (err) {
    console.error('Erro ao criar OS:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// POST /os/:id/pegar — técnico aceita OS
// ═══════════════════════════════════════
router.post('/:id/pegar', autenticar, somenteTecnico, async (req, res) => {
  const osId = Number(req.params.id);
  const tecnicoId = req.usuario.id;

  try {
    // Verifica OS
    const osResult = await pool.query('SELECT * FROM ordens_servico WHERE id = $1', [osId]);
    if (osResult.rows.length === 0) {
      return res.status(404).json({ erro: 'OS não encontrada' });
    }

    const os = osResult.rows[0];
    if (os.tecnico_id) {
      return res.status(400).json({ erro: 'OS já atribuída a um técnico' });
    }
    if (os.status !== 'disponivel') {
      return res.status(400).json({ erro: 'OS não está disponível' });
    }

    // Atualiza
    const result = await pool.query(`
      UPDATE ordens_servico
      SET tecnico_id = $1, status = 'em_execucao', data_aceite = NOW(), data_atualizacao = NOW()
      WHERE id = $2
      RETURNING *
    `, [tecnicoId, osId]);

    // Notificação para a empresa
    await pool.query(`
      INSERT INTO notificacoes (usuario_tipo, usuario_id, titulo, mensagem, tipo, os_id)
      VALUES ('empresa', $1, 'OS Aceita', $2, 'os_aceita', $3)
    `, [os.empresa_id, `Técnico ${req.usuario.nome} aceitou a OS #${osId}`, osId]);

    if (req.app.io) {
      req.app.io.to(`empresa_${os.empresa_id}`).emit('os_aceita', result.rows[0]);
    }

    res.json({
      mensagem: 'OS atribuída ao técnico',
      os: result.rows[0],
      tecnico: req.usuario.nome,
    });
  } catch (err) {
    console.error('Erro ao pegar OS:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// PUT /os/:id — atualizar status da OS
// ═══════════════════════════════════════
router.put('/:id', autenticar, async (req, res) => {
  const osId = Number(req.params.id);
  const { status, observacao } = req.body;
  const tecnicoId = req.usuario.tipo === 'tecnico' ? req.usuario.id : req.body.tecnicoId;

  if (!STATUS_PERMITIDOS.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  // Impedimento exige observação
  if (STATUS_COM_OBSERVACAO.includes(status) && (!observacao || !observacao.trim())) {
    return res.status(400).json({ erro: 'Observação obrigatória para impedimento' });
  }

  try {
    const osResult = await pool.query('SELECT * FROM ordens_servico WHERE id = $1', [osId]);
    if (osResult.rows.length === 0) {
      return res.status(404).json({ erro: 'OS não encontrada' });
    }

    const updates = {
      status,
      observacao: observacao || null,
      data_atualizacao: 'NOW()',
    };

    if (status === 'executada') {
      updates.data_execucao = 'NOW()';
    }

    const result = await pool.query(`
      UPDATE ordens_servico
      SET status = $1, observacao = $2, data_atualizacao = NOW(),
          data_execucao = CASE WHEN $1 = 'executada' THEN NOW() ELSE data_execucao END
      WHERE id = $3
      RETURNING *
    `, [status, observacao || null, osId]);

    // Notifica
    const os = osResult.rows[0];
    if (req.app.io) {
      req.app.io.to(`empresa_${os.empresa_id}`).emit('os_atualizada', result.rows[0]);
    }

    res.json({
      mensagem: 'OS atualizada com sucesso',
      os: result.rows[0],
    });
  } catch (err) {
    console.error('Erro ao atualizar OS:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// GET /os/estatisticas/tecnico/:id
// ═══════════════════════════════════════
router.get('/estatisticas/tecnico/:tecnicoId', autenticar, async (req, res) => {
  const tecnicoId = Number(req.params.tecnicoId);

  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'executada') AS executadas,
        COUNT(*) FILTER (WHERE status LIKE 'impedimento%') AS impedidas,
        COUNT(*) FILTER (WHERE status = 'em_execucao') AS em_execucao,
        COALESCE(SUM(valor_liquido) FILTER (WHERE status = 'executada'), 0) AS ganho_total
      FROM ordens_servico
      WHERE tecnico_id = $1
    `, [tecnicoId]);

    const stats = result.rows[0];
    const total = Number(stats.total);
    const executadas = Number(stats.executadas);
    const taxaSucesso = total > 0 ? ((executadas / total) * 100).toFixed(2) : '0.00';

    res.json({
      tecnicoId,
      totalOS: total,
      executadas,
      emExecucao: Number(stats.em_execucao),
      impedidas: Number(stats.impedidas),
      ganhoTotal: Number(stats.ganho_total),
      taxaSucesso: `${taxaSucesso}%`,
    });
  } catch (err) {
    console.error('Erro nas estatísticas:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// POST /os/sincronizar-ixc — sync com IXC
// ═══════════════════════════════════════
router.post('/sincronizar-ixc', autenticar, somenteEmpresa, async (req, res) => {
  try {
    const empresa = await pool.query(
      'SELECT ixc_api_url, ixc_api_token FROM empresas WHERE id = $1',
      [req.usuario.id]
    );

    const { ixc_api_url, ixc_api_token } = empresa.rows[0];

    if (!ixc_api_url || !ixc_api_token) {
      return res.status(400).json({
        erro: 'Configure a URL e token do IXC nas configurações da empresa'
      });
    }

    const ixc = new IXCService(ixc_api_url, ixc_api_token);
    const resultado = await ixc.sincronizar(req.usuario.id);

    res.json({ mensagem: 'Sincronização concluída', ...resultado });
  } catch (err) {
    console.error('Erro na sincronização IXC:', err);
    res.status(500).json({ erro: 'Erro na sincronização' });
  }
});

module.exports = router;
