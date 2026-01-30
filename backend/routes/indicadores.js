const express = require('express');
const router = express.Router();

const { ordensDeServico } = require('./osStore');

// Técnicos (simulando banco)
const tecnicos = [
  { id: 1, nome: 'João', tipo: 'executor' },
  { id: 2, nome: 'Carlos', tipo: 'autorizado' }
];

// Função auxiliar
function calcularIndicadores(ordens, tecnicos) {
  const resultado = {};

  tecnicos.forEach(t => {
    resultado[t.id] = {
      tecnico: t.nome,
      totalOS: 0,
      executadas: 0,
      impedimentos: 0,
      percentualImpedimento: 0
    };
  });

  ordens.forEach(os => {
    if (!os.tecnicoId) return;

    const r = resultado[os.tecnicoId];
    if (!r) return;

    r.totalOS++;

    if (os.status === 'executada') {
      r.executadas++;
    }

    if (os.status.startsWith('impedimento')) {
      r.impedimentos++;
    }
  });

  Object.values(resultado).forEach(r => {
    if (r.totalOS > 0) {
      r.percentualImpedimento =
        ((r.impedimentos / r.totalOS) * 100).toFixed(2);
    }
  });

  return Object.values(resultado);
}

// GET - indicadores
router.get('/', (req, res) => {
  const indicadores = calcularIndicadores(ordensDeServico, tecnicos);
  res.json(indicadores);
});

module.exports = router;
