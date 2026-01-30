const express = require('express');
const router = express.Router();

const { ordensDeServico } = require('./osStore');

// Status permitidos
const STATUS_PERMITIDOS = [
  'disponivel',
  'em_execucao',
  'executada',
  'impedimento_cto_cheia',
  'impedimento_cliente_ausente'
];

// Status que exigem observação
const STATUS_COM_OBSERVACAO_OBRIGATORIA = [
  'impedimento_cto_cheia',
  'impedimento_cliente_ausente'
];

// Técnicos (simulando banco)
const tecnicos = [
  { id: 1, nome: 'João', tipo: 'executor' },
  { id: 2, nome: 'Carlos', tipo: 'autorizado' }
];

// GET - listar OS
router.get('/', (req, res) => {
  res.json(ordensDeServico);
});

// PUT - atualizar status da OS
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { status, observacao, tecnicoId } = req.body;

  if (!STATUS_PERMITIDOS.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  const tecnico = tecnicos.find(t => t.id === tecnicoId);
  if (!tecnico) {
    return res.status(400).json({ erro: 'Técnico inválido' });
  }

  // Regra: só autorizado pode finalizar
  if (status === 'executada' && tecnico.tipo !== 'autorizado') {
    return res.status(403).json({
      erro: 'Técnico não autorizado a finalizar OS'
    });
  }

  // Regra: impedimento exige observação
  if (
    STATUS_COM_OBSERVACAO_OBRIGATORIA.includes(status) &&
    (!observacao || observacao.trim() === '')
  ) {
    return res.status(400).json({
      erro: 'Observação obrigatória para status de impedimento'
    });
  }

  const os = ordensDeServico.find(o => o.id === id);
  if (!os) {
    return res.status(404).json({ erro: 'OS não encontrada' });
  }

  os.status = status;
  os.observacao = observacao || null;
  os.tecnicoId = tecnico.id;
  os.dataAtualizacao = new Date().toISOString();

  res.json({
    mensagem: 'OS atualizada com sucesso',
    os,
    tecnico: tecnico.nome
  });
});

module.exports = router;
