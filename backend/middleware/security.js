const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');

// ═══════════════════════════════════════
// Rate Limiters
// ═══════════════════════════════════════

// Geral: 100 requests por minuto por IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { erro: 'Muitas requisições. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login: 10 tentativas por 15 minutos (proteção brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registro: 5 por hora por IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { erro: 'Muitos registros deste IP. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sync IXC: 3 por minuto (evita sobrecarregar IXC)
const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { erro: 'Aguarde antes de sincronizar novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ═══════════════════════════════════════
// Validações
// ═══════════════════════════════════════

function validarEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function validarCPF(cpf) {
  if (!cpf) return true; // opcional
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(clean.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(clean.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(clean.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(clean.charAt(10));
}

function validarCNPJ(cnpj) {
  if (!cnpj) return true; // opcional
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;
  return true; // validação simplificada
}

function sanitizar(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function validarSenha(senha) {
  if (!senha || senha.length < 6) return false;
  return true;
}

// Middleware que sanitiza todos os campos do body
function sanitizarBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizar(req.body[key]);
      }
    }
  }
  next();
}

// ═══════════════════════════════════════
// Aplicar segurança ao app
// ═══════════════════════════════════════

function aplicarSeguranca(app) {
  // Helmet: headers de segurança HTTP
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite carregar uploads
    contentSecurityPolicy: false, // desabilita CSP pra não quebrar o frontend
  }));

  // HPP: proteção contra HTTP Parameter Pollution
  app.use(hpp());

  // Sanitiza inputs
  app.use(sanitizarBody);

  // Rate limiter geral
  app.use('/api', generalLimiter);

  // Rate limiters específicos
  app.use('/auth/login', loginLimiter);
  app.use('/auth/registro', registerLimiter);
  app.use('/os/sincronizar-ixc', syncLimiter);

  console.log('🔒 Segurança aplicada (Helmet, Rate Limiting, HPP, Sanitização)');
}

module.exports = {
  aplicarSeguranca,
  generalLimiter,
  loginLimiter,
  registerLimiter,
  syncLimiter,
  validarEmail,
  validarCPF,
  validarCNPJ,
  validarSenha,
  sanitizar,
  sanitizarBody,
};
