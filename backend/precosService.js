const fs = require('fs');
const path = require('path');

// Lê os arquivos JSON
const configPath = path.join(__dirname, 'config.json');
const tabelaPath = path.join(__dirname, 'tabelaPrecos.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const tabelaPrecos = JSON.parse(fs.readFileSync(tabelaPath, 'utf-8'));

// Função principal
function calcularValorLiquido({ empresaId, cidade, tipo }) {
  const preco = tabelaPrecos.find(
    (p) =>
      p.empresaId === empresaId &&
      p.cidade === cidade &&
      p.tipo === tipo
  );

  if (!preco) {
    throw new Error('Preço não encontrado para essa OS');
  }

  const valorLiquido = preco.valorBruto - config.taxaTecnico;

  return {
    valorBruto: preco.valorBruto,
    valorLiquido
  };
}

module.exports = {
  calcularValorLiquido
};
