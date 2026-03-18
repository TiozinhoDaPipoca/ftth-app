let ordensDeServico = [
  {
    id: 1,
    empresaId: 1,
    clienteCpf: '11122233344',
    cidade: 'Petrópolis',
    tipo: 'instalacao',
    tipoServico: 'instalacao',
    cto: 'F09-C01',
    status: 'executada',
    observacao: null,
    tecnicoId: 1,
    dataAtualizacao: new Date('2026-01-10').toISOString(),
    irr: null
  },
  {
    id: 2,
    empresaId: 1,
    clienteCpf: '11122233344',
    cidade: 'Petrópolis',
    tipo: 'reparo',
    tipoServico: 'reparo_sem_conexao',
    cto: 'F09-C01',
    status: 'disponivel',
    observacao: null,
    tecnicoId: null,
    dataAtualizacao: null,
    irr: null
  },
  {
    id: 3,
    empresaId: 1,
    clienteCpf: '55566677788',
    cidade: 'Magé',
    tipo: 'instalacao',
    tipoServico: 'instalacao',
    cto: 'F03-C02',
    status: 'executada',
    observacao: null,
    tecnicoId: 2,
    dataAtualizacao: new Date('2025-12-01').toISOString(),
    irr: null
  },
  {
    id: 4,
    empresaId: 1,
    clienteCpf: '99988877766',
    cidade: 'Magé',
    tipo: 'instalacao',
    tipoServico: 'instalacao',
    cto: 'F03-C05',
    status: 'disponivel',
    observacao: null,
    tecnicoId: null,
    dataAtualizacao: null,
    irr: null
  },
  {
    id: 5,
    empresaId: 1,
    clienteCpf: '33344455566',
    cidade: 'Petrópolis',
    tipo: 'reparo',
    tipoServico: 'reparo_sem_conexao',
    cto: 'F12-C03',
    status: 'disponivel',
    observacao: null,
    tecnicoId: null,
    dataAtualizacao: null,
    irr: null
  },
  {
    id: 6,
    empresaId: 1,
    clienteCpf: '77788899900',
    cidade: 'Magé',
    tipo: 'reparo',
    tipoServico: 'reparo_sem_conexao',
    cto: 'F07-C01',
    status: 'em_execucao',
    observacao: null,
    tecnicoId: 1,
    dataAtualizacao: new Date('2026-03-15').toISOString(),
    irr: null
  }
];

module.exports = {
  ordensDeServico
};
