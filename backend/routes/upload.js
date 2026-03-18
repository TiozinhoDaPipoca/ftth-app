const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { autenticar, somenteTecnico } = require('../middleware/auth');

// Configura upload
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `os_${req.params.osId}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    if (tipos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens JPEG, PNG ou WebP'));
    }
  },
});

// POST /upload/os/:osId — envia foto da OS
router.post('/os/:osId', autenticar, somenteTecnico, upload.array('fotos', 5), async (req, res) => {
  const osId = Number(req.params.osId);
  const tipo = req.body.tipo || 'execucao'; // 'execucao', 'antes', 'depois', 'impedimento'

  try {
    // Verifica se a OS é do técnico
    const os = await pool.query(
      'SELECT * FROM ordens_servico WHERE id = $1 AND tecnico_id = $2',
      [osId, req.usuario.id]
    );

    if (os.rows.length === 0) {
      return res.status(403).json({ erro: 'Você não tem acesso a esta OS' });
    }

    const fotos = [];

    for (const file of req.files) {
      const url = `/uploads/${file.filename}`;
      const result = await pool.query(`
        INSERT INTO os_fotos (os_id, tecnico_id, url, tipo)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [osId, req.usuario.id, url, tipo]);

      fotos.push(result.rows[0]);
    }

    res.status(201).json({
      mensagem: `${fotos.length} foto(s) enviada(s)`,
      fotos,
    });
  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ erro: 'Erro no upload' });
  }
});

// GET /upload/os/:osId — listar fotos da OS
router.get('/os/:osId', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM os_fotos WHERE os_id = $1 ORDER BY criado_em DESC',
      [req.params.osId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

module.exports = router;
