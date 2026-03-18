const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { gerarToken, autenticar } = require('../middleware/auth');

// ═══════════════════════════════════════
// POST /auth/login/tecnico
// ═══════════════════════════════════════
router.post('/login/tecnico', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM tecnicos WHERE email = $1 AND ativo = TRUE',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const tecnico = result.rows[0];
    const senhaOk = await bcrypt.compare(senha, tecnico.senha);

    if (!senhaOk) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const token = gerarToken({
      id: tecnico.id,
      tipo: 'tecnico',
      nome: tecnico.nome,
    });

    res.json({
      token,
      usuario: {
        id: tecnico.id,
        nome: tecnico.nome,
        email: tecnico.email,
        cidade: tecnico.cidade,
        tipo: 'tecnico',
        tipoTecnico: tecnico.tipo,
        nivel: tecnico.nivel,
        rating: tecnico.rating,
      },
    });
  } catch (err) {
    console.error('Erro no login técnico:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// POST /auth/login/empresa
// ═══════════════════════════════════════
router.post('/login/empresa', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM empresas WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const empresa = result.rows[0];
    const senhaOk = await bcrypt.compare(senha, empresa.senha);

    if (!senhaOk) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const token = gerarToken({
      id: empresa.id,
      tipo: 'empresa',
      nome: empresa.nome,
    });

    res.json({
      token,
      usuario: {
        id: empresa.id,
        nome: empresa.nome,
        email: empresa.email,
        cnpj: empresa.cnpj,
        cidade: empresa.cidade,
        tipo: 'empresa',
        ixcConfigurado: !!(empresa.ixc_api_url && empresa.ixc_api_token),
      },
    });
  } catch (err) {
    console.error('Erro no login empresa:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// POST /auth/registro/tecnico
// ═══════════════════════════════════════
router.post('/registro/tecnico', async (req, res) => {
  const { nome, cpf, email, senha, telefone, cidade } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const existe = await pool.query('SELECT id FROM tecnicos WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await pool.query(`
      INSERT INTO tecnicos (nome, cpf, email, senha, telefone, cidade)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nome, email, cidade
    `, [nome, cpf || null, email, senhaHash, telefone || null, cidade || null]);

    const tecnico = result.rows[0];
    const token = gerarToken({ id: tecnico.id, tipo: 'tecnico', nome: tecnico.nome });

    res.status(201).json({
      token,
      usuario: { ...tecnico, tipo: 'tecnico' },
    });
  } catch (err) {
    console.error('Erro no registro técnico:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// POST /auth/registro/empresa
// ═══════════════════════════════════════
router.post('/registro/empresa', async (req, res) => {
  const { nome, cnpj, email, senha, telefone, cidade } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const existe = await pool.query('SELECT id FROM empresas WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ erro: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await pool.query(`
      INSERT INTO empresas (nome, cnpj, email, senha, telefone, cidade)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nome, email, cnpj, cidade
    `, [nome, cnpj || null, email, senhaHash, telefone || null, cidade || null]);

    const empresa = result.rows[0];
    const token = gerarToken({ id: empresa.id, tipo: 'empresa', nome: empresa.nome });

    res.status(201).json({
      token,
      usuario: { ...empresa, tipo: 'empresa' },
    });
  } catch (err) {
    console.error('Erro no registro empresa:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ═══════════════════════════════════════
// GET /auth/me — retorna usuário logado
// ═══════════════════════════════════════
router.get('/me', autenticar, async (req, res) => {
  try {
    const tabela = req.usuario.tipo === 'empresa' ? 'empresas' : 'tecnicos';
    const result = await pool.query(
      `SELECT * FROM ${tabela} WHERE id = $1`,
      [req.usuario.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    delete user.senha; // nunca retorna senha

    res.json({ ...user, tipo: req.usuario.tipo });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
