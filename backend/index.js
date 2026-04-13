require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { aplicarSeguranca } = require('./middleware/security');

const app = express();
const server = http.createServer(app);

// ═══ CORS — restrito a origens conhecidas ═══
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',');

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Bloqueado por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ═══ Body parser com limite de tamanho ═══
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ═══ Segurança ═══
aplicarSeguranca(app);

// ═══ Socket.IO ═══
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'] }
});

app.io = io;

io.on('connection', (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id}`);

  socket.on('entrar_sala', ({ tipo, id }) => {
    const sala = `${tipo}_${id}`;
    socket.join(sala);
    console.log(`👤 ${tipo} #${id} entrou na sala ${sala}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket desconectado: ${socket.id}`);
  });
});

// ═══ Servir uploads como arquivos estáticos ═══
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ═══ Servir frontend em produção ═══
const frontendPath = path.join(__dirname, 'public');
if (require('fs').existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log('📦 Frontend estático servido de /frontend/dist');
}

// ═══ Rotas da API ═══
const authRoutes = require('./routes/auth');
const osRoutes = require('./routes/os');
const indicadoresRoutes = require('./routes/indicadores');
const notificacoesRoutes = require('./routes/notificacoes');
const uploadRoutes = require('./routes/upload');

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', versao: '2.1.0', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/os', osRoutes);
app.use('/indicadores', indicadoresRoutes);
app.use('/notificacoes', notificacoesRoutes);
app.use('/upload', uploadRoutes);

// ═══ SPA fallback (produção) ═══
if (require('fs').existsSync(frontendPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ═══ Error handler ═══
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  // Não vaza detalhes do erro em produção
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    erro: isProd ? 'Erro interno do servidor' : err.message,
  });
});

// ═══ Start ═══
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🚀 Lampejo API v2.1                    ║
  ║  📡 http://localhost:${PORT}                ║
  ║  🔌 Socket.IO ativo                      ║
  ║  📦 PostgreSQL                            ║
  ║  🔒 Segurança ativa                      ║
  ╚═══════════════════════════════════════════╝
  `);
});
