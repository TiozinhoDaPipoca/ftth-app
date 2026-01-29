const express = require('express');
const router = express.Router();

//Status permitidos
const STATUS_PERMITIDOS = [
    'disponivel',
    'em_execucao',
    'executada',
    'impedimento_cto_cheia',
    'impedimento_cliente_ausente' 
];

//Status que exigem observação
const STATUS_COM_OBSERVACAO_OBRIGATORIA = [
    'impedimento_cto_cheia',
    'impedimento_cliente_ausente'
];

//Banco de dados simulado
let ordensDeServico = [
    {
      id: 1,
      cidade: 'Petrópolis',
      cto: 'F09-C01',
      status: 'disponivel',
      observacao: null
    },
    {
      id: 2,
      cidade: 'Magé',
      cto: 'F03-C02',
      status: 'disponivel',
      observacao: null
    }
];

// GET - listar os
router.get('/', (req, res) => {
    res.json(ordensDeServico);
});

// POST - criar nova os
router.post('/', (req, res) => {
  const { cidade, cto, status, observacao } = req.body;

  if (!STATUS_PERMITIDOS.includes(status)) {
      return res.status(400).json({
          erro: 'Status inválido.'
      });
  }

  if (STATUS_COM_OBSERVACAO_OBRIGATORIA.includes(status) && (!observacao || observacao.trim() === '')) {
      return res.status(400).json({
          erro: 'Observação obrigatória para o status de impedimento.'
      });
  }
    const novaOS = {
        id: ordensDeServico.length + 1,
        cidade,
        cto,
        status,
        observacao: observacao || null
    };

    ordensDeServico.push(novaOS);

    res.json({
        mensagem: 'OS criada com sucesso',
        os: novaOS
    });
});

//PUT - atualizar status da os
router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    const { status, observacao } = req.body;

    if (!STATUS_PERMITIDOS.includes(status)) {
        return res.status(400).json({
            erro: 'Status inválido.'
        });
    }

    if (STATUS_COM_OBSERVACAO_OBRIGATORIA.includes(status) && (!observacao || observacao.trim() === '')
    ) {
        return res.status(400).json({
            erro: 'Observação obrigatória para o status de impedimento.'
        });
    }

    const os = ordensDeServico.find(o => o.id === id);

    if (!os) {
        return res.status(404).json({
            erro: 'OS não encontrada'
        });
    }
    
    
    os.status = status;
    os.observacao = observacao || null;

    res.json({
        mensagem: 'Status atualizado com sucesso',
        os
    });
});

  module.exports = router;
