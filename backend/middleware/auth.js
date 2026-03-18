const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'lampejo_secret_dev';

// Gera token JWT
function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Middleware: verifica se está autenticado
function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded; // { id, tipo: 'tecnico'|'empresa', nome }
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Middleware: só empresas
function somenteEmpresa(req, res, next) {
  if (req.usuario?.tipo !== 'empresa') {
    return res.status(403).json({ erro: 'Acesso restrito a empresas' });
  }
  next();
}

// Middleware: só técnicos
function somenteTecnico(req, res, next) {
  if (req.usuario?.tipo !== 'tecnico') {
    return res.status(403).json({ erro: 'Acesso restrito a técnicos' });
  }
  next();
}

module.exports = { gerarToken, autenticar, somenteEmpresa, somenteTecnico };
