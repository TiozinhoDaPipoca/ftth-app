const express = require('express');
const router = express.Router();

//Status permitidos
const STATUS_PERMITIDOS =[
    'disponivel',
    'em_execucao',
    'executada',
    'impedido_cto_cheia',
    'impedido_cliente_ausente',
];

//Banco de dados simulado
let ordensDeServico = [
    {
      id: 1,
      cidade: 'Petrópolis',
      cto: 'F09-C01',
      status: 'disponivel'
    },
    {
      id: 2,
      cidade: 'Magé',
      cto: 'F03-C02',
      status: 'disponivel'
    }
];

// GET - listar os
router.get('/', (req, res) => {
    res.json(ordensDeServico);
});

// POST - criar nova os
router.post('/', (req, res) => {
  const novaOS = {
    id: ordensDeServico.length + 1,
    cidade: req.body.cidade,
    cto: req.body.cto,
    status: req.body.status
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
    const { status } = req.body;

    if (!STATUS_PERMITIDOS.includes(status)) {
        return res.status(400).json({
            erro: 'Status inválido.'
        });
    }

    const os = ordensDeServico.find(o => o.id === id);

    if (!os) {
        return res.status(404).json({
            erro: 'OS não encontrada'
        });
    }
    
    
    os.status = status;

    res.json({
        mensagem: 'Status atualizado com sucesso',
        os
    });
});

  module.exports = router;
