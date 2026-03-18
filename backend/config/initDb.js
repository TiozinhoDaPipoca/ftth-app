/**
 * Inicializa o banco de dados PostgreSQL
 * Rode: node config/initDb.js
 */

const { Pool } = require('pg');
require('dotenv').config();

async function initDatabase() {
  // Primeiro conecta ao postgres padrão pra criar o DB
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  const dbName = process.env.DB_NAME || 'lampejo';

  try {
    // Cria o banco se não existir
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1", [dbName]
    );
    if (dbCheck.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Banco "${dbName}" criado`);
    } else {
      console.log(`ℹ️  Banco "${dbName}" já existe`);
    }
  } catch (err) {
    console.error('Erro ao criar banco:', err.message);
  } finally {
    await adminPool.end();
  }

  // Agora conecta ao banco lampejo pra criar as tabelas
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: dbName,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await pool.query(`

      -- ═══════════════════════════════════════
      -- EMPRESAS (provedores que usam o app)
      -- ═══════════════════════════════════════
      CREATE TABLE IF NOT EXISTS empresas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        cnpj VARCHAR(18) UNIQUE,
        email VARCHAR(200) UNIQUE NOT NULL,
        senha VARCHAR(200) NOT NULL,
        telefone VARCHAR(20),
        cidade VARCHAR(100),
        estado VARCHAR(2) DEFAULT 'RJ',
        logo_url TEXT,
        -- Config IXC (opcional)
        ixc_api_url TEXT,
        ixc_api_token TEXT,
        ixc_sincronizado BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );

      -- ═══════════════════════════════════════
      -- TÉCNICOS (autônomos que executam OS)
      -- ═══════════════════════════════════════
      CREATE TABLE IF NOT EXISTS tecnicos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        cpf VARCHAR(14) UNIQUE,
        email VARCHAR(200) UNIQUE NOT NULL,
        senha VARCHAR(200) NOT NULL,
        telefone VARCHAR(20),
        cidade VARCHAR(100),
        estado VARCHAR(2) DEFAULT 'RJ',
        foto_url TEXT,
        tipo VARCHAR(20) DEFAULT 'executor',
        nivel VARCHAR(20) DEFAULT 'bronze',
        rating DECIMAL(2,1) DEFAULT 0,
        total_avaliacoes INTEGER DEFAULT 0,
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );

      -- ═══════════════════════════════════════
      -- TABELA DE PREÇOS
      -- ═══════════════════════════════════════
      CREATE TABLE IF NOT EXISTS tabela_precos (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        cidade VARCHAR(100) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        tipo_servico VARCHAR(100),
        valor_bruto DECIMAL(10,2) NOT NULL,
        criado_em TIMESTAMP DEFAULT NOW()
      );

      -- ═══════════════════════════════════════
      -- ORDENS DE SERVIÇO
      -- ═══════════════════════════════════════
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id SERIAL PRIMARY KEY,
        empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        tecnico_id INTEGER REFERENCES tecnicos(id) ON DELETE SET NULL,
        cliente_cpf VARCHAR(14),
        cliente_nome VARCHAR(200),
        cliente_telefone VARCHAR(20),
        cidade VARCHAR(100) NOT NULL,
        endereco TEXT,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        tipo VARCHAR(50) NOT NULL,
        tipo_servico VARCHAR(100) NOT NULL,
        cto VARCHAR(50),
        status VARCHAR(50) DEFAULT 'disponivel',
        observacao TEXT,
        valor_bruto DECIMAL(10,2),
        valor_liquido DECIMAL(10,2),
        -- Campos IXC
        ixc_os_id INTEGER,
        ixc_contrato_id INTEGER,
        -- Controle
        data_criacao TIMESTAMP DEFAULT NOW(),
        data_aceite TIMESTAMP,
        data_execucao TIMESTAMP,
        data_atualizacao TIMESTAMP DEFAULT NOW()
      );

      -- ═══════════════════════════════════════
      -- FOTOS DA OS (upload pelo técnico)
      -- ═══════════════════════════════════════
      CREATE TABLE IF NOT EXISTS os_fotos (
        id SERIAL PRIMARY KEY,
        os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
        tecnico_id INTEGER REFERENCES tecnicos(id),
        url TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'execucao',
        criado_em TIMESTAMP DEFAULT NOW()
      );

      -- ═══════════════════════════════════════
      -- NOTIFICAÇÕES
      -- ═══════════════════════════════════════
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        usuario_tipo VARCHAR(20) NOT NULL,
        usuario_id INTEGER NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        mensagem TEXT,
        tipo VARCHAR(50) DEFAULT 'info',
        lida BOOLEAN DEFAULT FALSE,
        os_id INTEGER REFERENCES ordens_servico(id) ON DELETE CASCADE,
        criado_em TIMESTAMP DEFAULT NOW()
      );

      -- ═══════════════════════════════════════
      -- CONFIG GERAL
      -- ═══════════════════════════════════════
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave VARCHAR(100) PRIMARY KEY,
        valor TEXT NOT NULL
      );

      -- Taxa padrão do técnico
      INSERT INTO configuracoes (chave, valor)
      VALUES ('taxa_tecnico', '5')
      ON CONFLICT (chave) DO NOTHING;

      -- ═══════════════════════════════════════
      -- ÍNDICES para performance
      -- ═══════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
      CREATE INDEX IF NOT EXISTS idx_os_empresa ON ordens_servico(empresa_id);
      CREATE INDEX IF NOT EXISTS idx_os_tecnico ON ordens_servico(tecnico_id);
      CREATE INDEX IF NOT EXISTS idx_os_cidade ON ordens_servico(cidade);
      CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificacoes(usuario_tipo, usuario_id);

    `);

    console.log('✅ Tabelas criadas com sucesso');

    // ═══ Dados de exemplo ═══
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash('123456', 10);

    // Empresa de exemplo
    await pool.query(`
      INSERT INTO empresas (nome, cnpj, email, senha, telefone, cidade)
      VALUES ('FibraLink Telecom', '12.345.678/0001-90', 'admin@fibralink.com', $1, '(24) 99999-0001', 'Magé')
      ON CONFLICT (email) DO NOTHING
    `, [senhaHash]);

    // Técnicos de exemplo
    await pool.query(`
      INSERT INTO tecnicos (nome, cpf, email, senha, telefone, cidade, tipo)
      VALUES
        ('João Silva', '111.222.333-44', 'joao@email.com', $1, '(24) 99999-1001', 'Magé', 'executor'),
        ('Carlos Souza', '555.666.777-88', 'carlos@email.com', $1, '(24) 99999-1002', 'Petrópolis', 'autorizado')
      ON CONFLICT (email) DO NOTHING
    `, [senhaHash]);

    // Tabela de preços
    await pool.query(`
      INSERT INTO tabela_precos (empresa_id, cidade, tipo, tipo_servico, valor_bruto)
      VALUES
        (1, 'Magé', 'instalacao', 'instalacao', 50.00),
        (1, 'Petrópolis', 'instalacao', 'instalacao', 60.00),
        (1, 'Petrópolis', 'reparo', 'reparo_sem_conexao', 45.00),
        (1, 'Magé', 'reparo', 'reparo_sem_conexao', 40.00),
        (1, 'Magé', 'instalacao', 'migracao', 55.00),
        (1, 'Petrópolis', 'instalacao', 'migracao', 65.00)
      ON CONFLICT DO NOTHING
    `);

    // OS de exemplo
    await pool.query(`
      INSERT INTO ordens_servico (empresa_id, tecnico_id, cliente_cpf, cliente_nome, cidade, endereco, tipo, tipo_servico, cto, status, latitude, longitude, data_atualizacao)
      VALUES
        (1, 1, '11122233344', 'Maria Santos', 'Petrópolis', 'Rua das Flores, 123 - Centro', 'instalacao', 'instalacao', 'F09-C01', 'executada', -22.5047, -43.1823, '2026-01-10'),
        (1, NULL, '11122233344', 'Maria Santos', 'Petrópolis', 'Rua das Flores, 123 - Centro', 'reparo', 'reparo_sem_conexao', 'F09-C01', 'disponivel', -22.5047, -43.1823, NULL),
        (1, 2, '55566677788', 'José Oliveira', 'Magé', 'Av. Simão da Motta, 456 - Piabetá', 'instalacao', 'instalacao', 'F03-C02', 'executada', -22.6569, -43.3707, '2025-12-01'),
        (1, NULL, '99988877766', 'Ana Costa', 'Magé', 'Rua Rio Branco, 789 - Centro', 'instalacao', 'instalacao', 'F03-C05', 'disponivel', -22.6530, -43.3650, NULL),
        (1, NULL, '33344455566', 'Pedro Lima', 'Petrópolis', 'Rua do Imperador, 321 - Centro', 'reparo', 'reparo_sem_conexao', 'F12-C03', 'disponivel', -22.5120, -43.1780, NULL),
        (1, 1, '77788899900', 'Lucia Ferreira', 'Magé', 'Rua Getúlio Vargas, 654 - Fragoso', 'reparo', 'reparo_sem_conexao', 'F07-C01', 'em_execucao', -22.6610, -43.3780, '2026-03-15')
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Dados de exemplo inseridos');
    console.log('\n🚀 Banco pronto! Rode "node index.js" para iniciar o servidor.\n');

  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  } finally {
    await pool.end();
  }
}

initDatabase();
