# 🔌 Lampejo v2.0 — Marketplace FTTH

Aplicativo estilo iFood para empresas disponibilizarem serviços FTTH
e técnicos autônomos aceitarem e executarem.

## Novidades v2.0

- ✅ **PostgreSQL** — banco de dados real
- ✅ **Autenticação JWT** — login para técnicos e empresas
- ✅ **Integração IXC Provedor** — sincroniza OS automaticamente
- ✅ **Upload de fotos** — técnico envia fotos da execução
- ✅ **Notificações** — tempo real via Socket.IO
- ✅ **Cadastro de OS** — empresa cria OS pelo app

---

## 📁 Estrutura

```
lampejo/
├── backend/
│   ├── index.js                 ← Servidor Express + Socket.IO
│   ├── .env                     ← Suas configurações (criar do .env.example)
│   ├── config/
│   │   ├── database.js          ← Conexão PostgreSQL
│   │   └── initDb.js            ← Cria tabelas e dados de exemplo
│   ├── middleware/
│   │   └── auth.js              ← Autenticação JWT
│   ├── routes/
│   │   ├── auth.js              ← Login/registro técnico e empresa
│   │   ├── os.js                ← CRUD de ordens de serviço
│   │   ├── indicadores.js       ← Ranking de técnicos
│   │   ├── notificacoes.js      ← Notificações
│   │   └── upload.js            ← Upload de fotos
│   └── services/
│       └── ixcService.js        ← Integração com IXC Provedor
│
└── frontend/                    ← React + Vite (mesma estrutura)
```

---

## 🚀 Como Rodar

### 1. Instalar PostgreSQL

Baixe e instale: https://www.postgresql.org/download/windows/

Durante a instalação:
- Defina a senha do usuário `postgres` (anote!)
- Mantenha a porta padrão `5432`

### 2. Configurar o Backend

```bash
cd lampejo/backend

# Crie o arquivo .env (copie do exemplo)
copy .env.example .env
```

Edite o `.env` e coloque sua senha do PostgreSQL:
```
DB_PASSWORD=sua_senha_aqui
```

### 3. Instalar dependências e criar o banco

```bash
npm install
node config/initDb.js
```

Deve aparecer:
```
✅ Banco "lampejo" criado
✅ Tabelas criadas com sucesso
✅ Dados de exemplo inseridos
```

### 4. Iniciar o backend

```bash
node index.js
```

### 5. Iniciar o frontend (outro terminal)

```bash
cd lampejo/frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

---

## 🔐 Logins de Teste

| Tipo     | Email               | Senha  |
|----------|---------------------|--------|
| Técnico  | joao@email.com      | 123456 |
| Técnico  | carlos@email.com    | 123456 |
| Empresa  | admin@fibralink.com | 123456 |

---

## 🔗 API — Rotas Principais

### Auth
| Método | Rota                    | Descrição              |
|--------|-------------------------|------------------------|
| POST   | /auth/login/tecnico     | Login do técnico       |
| POST   | /auth/login/empresa     | Login da empresa       |
| POST   | /auth/registro/tecnico  | Cadastro técnico       |
| POST   | /auth/registro/empresa  | Cadastro empresa       |
| GET    | /auth/me                | Dados do usuário logado|

### Ordens de Serviço
| Método | Rota                        | Descrição                |
|--------|-----------------------------|--------------------------|
| GET    | /os                         | Listar OS (com filtros)  |
| POST   | /os                         | Criar OS (empresa)       |
| POST   | /os/:id/pegar               | Aceitar OS (técnico)     |
| PUT    | /os/:id                     | Atualizar status         |
| GET    | /os/estatisticas/tecnico/:id| Estatísticas técnico     |
| POST   | /os/sincronizar-ixc         | Sincronizar com IXC      |

### Upload
| Método | Rota              | Descrição          |
|--------|--------------------|--------------------|
| POST   | /upload/os/:osId   | Enviar fotos       |
| GET    | /upload/os/:osId   | Listar fotos da OS |

---

## 🔄 Integração IXC Provedor

Para sincronizar OS do IXC:

1. No IXC, vá em **Sistema > Usuários** e crie um usuário com "Permite acesso a API"
2. Copie o **token** gerado
3. Na empresa (pelo app ou banco), configure:
   - `ixc_api_url`: ex: `https://seudominio.com/webservice/v1`
   - `ixc_api_token`: token copiado do IXC
4. Use a rota `POST /os/sincronizar-ixc` para importar as OS

---

## 📱 Socket.IO — Eventos

| Evento      | Direção       | Descrição                      |
|-------------|---------------|--------------------------------|
| nova_os     | server→client | Nova OS criada pela empresa    |
| os_aceita   | server→client | Técnico aceitou uma OS         |
| os_atualizada| server→client| OS teve status alterado        |
| entrar_sala | client→server | Entra na sala de notificações  |
