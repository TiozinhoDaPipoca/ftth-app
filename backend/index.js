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
