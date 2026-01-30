const express = require('express');
const app = express();

app.use(express.json());

const osRoutes = require('./routes/os');

const indicadoresRoutes = require('./routes/indicadores');
app.use('/indicadores', indicadoresRoutes);

app.get('/', (req, res) => {
  res.send('Servidor FTTH rodando');
});

app.use('/os', osRoutes);

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

app.get("/os/:id/impedir", (req, res) => {
  const { id } = req.params;
  const { tecnico, motivo } = req.query;

  return res.json({
    mensagem: "OS marcada como impedida (simulação)",
    osId: id,
    tecnico,
    motivo
  });
});
