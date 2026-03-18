/**
 * Serviço de integração com IXC Provedor
 *
 * A API do IXC usa autenticação via token no header.
 * Endpoints consumidos:
 *   - GET /su_oss_chamado       → Ordens de serviço
 *   - GET /cliente              → Dados do cliente
 *   - GET /cliente_contrato     → Contratos
 *
 * O token é gerado no IXC em:
 *   Sistema > Usuários > editar usuário > marcar "Permite acesso a API"
 *
 * A URL base é: https://SEU_DOMINIO/webservice/v1
 */

const axios = require('axios');
const pool = require('../config/database');

class IXCService {
  constructor(apiUrl, apiToken) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiToken}:`).toString('base64')}`,
        'ixcsoft': 'listar',
      },
      timeout: 30000,
    });
  }

  /**
   * Busca ordens de serviço do IXC
   * Busca OS com status: Aberto, Encaminhada, Em execução, Assumida, Agendado
   */
  async buscarOrdensServico(pagina = 1, limite = 100) {
    try {
      // Primeira tentativa: busca sem filtro de status pra pegar tudo
      const response = await this.client.post('/su_oss_chamado', {
        qtype: 'su_oss_chamado.id',
        query: '',
        rp: String(limite),
        sortname: 'su_oss_chamado.id',
        sortorder: 'desc',
        page: String(pagina),
      });

      console.log('📡 Resposta IXC (tipo):', typeof response.data);
      console.log('📡 Resposta IXC (keys):', response.data ? Object.keys(response.data) : 'null');

      // A API do IXC pode retornar em formatos diferentes
      let registros = [];
      if (Array.isArray(response.data)) {
        registros = response.data;
      } else if (response.data?.registros) {
        registros = response.data.registros;
      } else if (response.data?.type === 'success' && response.data?.registros) {
        registros = response.data.registros;
      } else if (typeof response.data === 'object') {
        // Às vezes a resposta é um objeto com IDs como chaves
        const keys = Object.keys(response.data).filter(k => k !== 'total' && k !== 'page' && k !== 'registros');
        if (keys.length > 0 && typeof response.data[keys[0]] === 'object') {
          registros = keys.map(k => response.data[k]);
        }
      }

      console.log(`📡 OS encontradas no IXC: ${registros.length}`);
      if (registros.length > 0) {
        console.log('📡 Exemplo de OS:', JSON.stringify(registros[0], null, 2).substring(0, 500));
      }

      return registros;
    } catch (err) {
      console.error('❌ Erro ao buscar OS do IXC:', err.message);
      if (err.response) {
        console.error('❌ Status:', err.response.status);
        console.error('❌ Data:', JSON.stringify(err.response.data).substring(0, 500));
      }
      return [];
    }
  }

  /**
   * Busca dados de um cliente pelo ID
   */
  async buscarCliente(clienteId) {
    try {
      const response = await this.client.post('/cliente', {
        qtype: 'cliente.id',
        query: String(clienteId),
        rp: '1',
        sortname: 'cliente.id',
        sortorder: 'asc',
      });
      const registros = response.data?.registros || [];
      return registros.length > 0 ? registros[0] : null;
    } catch (err) {
      console.error(`❌ Erro ao buscar cliente ${clienteId}:`, err.message);
      return null;
    }
  }

  /**
   * Busca nome do assunto pelo ID
   */
  async buscarAssunto(assuntoId) {
    try {
      const response = await this.client.post('/su_oss_assunto', {
        qtype: 'su_oss_assunto.id',
        query: String(assuntoId),
        rp: '1',
        sortname: 'su_oss_assunto.id',
        sortorder: 'asc',
      });
      const registros = response.data?.registros || [];
      return registros.length > 0 ? registros[0] : null;
    } catch (err) {
      // Assunto não acessível, não é crítico
      return null;
    }
  }

  /**
   * Sincroniza OS do IXC para o banco local
   * Importa apenas OS abertas/em execução recentes
   */
  async sincronizar(empresaId) {
    console.log(`🔄 Sincronizando OS do IXC para empresa #${empresaId}...`);

    // Busca apenas 200 OS mais recentes (abertas)
    const ordensIXC = await this.buscarOrdensServico(1, 200);

    if (!ordensIXC.length) {
      console.log('ℹ️  Nenhuma OS encontrada no IXC');
      return { sincronizadas: 0, novas: 0, atualizadas: 0, erros: 0 };
    }

    // Filtra apenas OS abertas ou em execução
    const ordensAbertas = ordensIXC.filter(os => {
      const status = (os.status || '').toUpperCase();
      return status === 'A' || status === 'E' || status === 'AB' || status === 'EN';
    });

    console.log(`📡 Total IXC: ${ordensIXC.length} | Abertas/Execução: ${ordensAbertas.length}`);

    // Cache de assuntos pra não buscar repetido
    const assuntoCache = {};
    let novas = 0;
    let atualizadas = 0;
    let erros = 0;

    for (const osIxc of ordensAbertas) {
      try {
        const osId = osIxc.id;
        if (!osId) continue;

        // Verifica se já existe no banco local
        const existente = await pool.query(
          'SELECT id FROM ordens_servico WHERE ixc_os_id = $1 AND empresa_id = $2',
          [osId, empresaId]
        );

        if (existente.rows.length > 0) {
          atualizadas++;
          continue;
        }

        // Busca nome do assunto (com cache)
        let nomeAssunto = '';
        if (osIxc.id_assunto && !assuntoCache[osIxc.id_assunto]) {
          const assunto = await this.buscarAssunto(osIxc.id_assunto);
          assuntoCache[osIxc.id_assunto] = assunto?.assunto || assunto?.descricao || '';
        }
        nomeAssunto = assuntoCache[osIxc.id_assunto] || '';

        // Busca dados do cliente
        let clienteNome = null;
        let clienteCpf = null;
        let clienteTelefone = null;
        let cidade = 'Não informada';
        let endereco = null;

        if (osIxc.id_cliente) {
          const cliente = await this.buscarCliente(osIxc.id_cliente);
          if (cliente) {
            clienteNome = cliente.razao || cliente.fantasia || null;
            clienteCpf = cliente.cnpj_cpf || null;
            clienteTelefone = cliente.telefone_celular || cliente.telefone_comercial || null;
            cidade = cliente.cidade || 'Não informada';
            endereco = [cliente.endereco, cliente.numero, cliente.bairro].filter(Boolean).join(', ') || null;
          }
        }

        // Mapeia tipo de serviço
        const tipoMapeado = mapearTipoServico(osIxc.id_assunto, nomeAssunto);
        const statusMapeado = mapearStatus(osIxc.status);

        // Insere nova OS
        await pool.query(`
          INSERT INTO ordens_servico
            (empresa_id, cliente_cpf, cliente_nome, cliente_telefone, cidade, endereco,
             tipo, tipo_servico, status, observacao, ixc_os_id, ixc_contrato_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          empresaId,
          clienteCpf,
          clienteNome,
          clienteTelefone,
          cidade,
          endereco,
          tipoMapeado.tipo,
          tipoMapeado.tipoServico,
          statusMapeado,
          osIxc.mensagem || null,
          osId,
          osIxc.id_contrato_kit || null,
        ]);
        novas++;

        // Log progresso a cada 20
        if (novas % 20 === 0) console.log(`  ... ${novas} novas importadas`);

      } catch (err) {
        erros++;
        console.error(`❌ Erro OS IXC #${osIxc.id}:`, err.message);
      }
    }

    // Marca empresa como sincronizada
    await pool.query(
      'UPDATE empresas SET ixc_sincronizado = TRUE, atualizado_em = NOW() WHERE id = $1',
      [empresaId]
    );

    const resultado = { sincronizadas: ordensAbertas.length, novas, atualizadas, erros };
    console.log(`✅ Sincronização concluída:`, resultado);
    return resultado;
  }
}

/**
 * Mapeia o assunto/tipo do IXC para nosso sistema
 * Usa o nome do assunto pra identificar o tipo
 */
function mapearTipoServico(idAssunto, nomeAssunto = '') {
  const nome = nomeAssunto.toLowerCase();

  if (nome.includes('instalação') || nome.includes('instalacao') || nome.includes('install')) {
    return { tipo: 'instalacao', tipoServico: 'instalacao' };
  }
  if (nome.includes('reparo') || nome.includes('problema') || nome.includes('sem conexão') || nome.includes('sem conexao') || nome.includes('lentidão') || nome.includes('lentidao') || nome.includes('intermit')) {
    if (nome.includes('lentidão') || nome.includes('lentidao')) return { tipo: 'reparo', tipoServico: 'reparo_lentidao' };
    if (nome.includes('intermit')) return { tipo: 'reparo', tipoServico: 'reparo_intermitente' };
    return { tipo: 'reparo', tipoServico: 'reparo_sem_conexao' };
  }
  if (nome.includes('manutenção') || nome.includes('manutencao') || nome.includes('manuten')) {
    return { tipo: 'reparo', tipoServico: 'manutencao' };
  }
  if (nome.includes('migração') || nome.includes('migracao') || nome.includes('troca de local')) {
    return { tipo: 'instalacao', tipoServico: 'migracao' };
  }
  if (nome.includes('cancelamento') || nome.includes('recolhimento')) {
    return { tipo: 'reparo', tipoServico: 'recolhimento' };
  }
  if (nome.includes('reativação') || nome.includes('reativacao')) {
    return { tipo: 'instalacao', tipoServico: 'reativacao' };
  }
  if (nome.includes('ponto extra') || nome.includes('wi-fi') || nome.includes('wifi') || nome.includes('mesh')) {
    return { tipo: 'instalacao', tipoServico: 'ponto_extra' };
  }
  if (nome.includes('auditoria') || nome.includes('análise') || nome.includes('analise') || nome.includes('viabilidade')) {
    return { tipo: 'reparo', tipoServico: 'analise' };
  }
  if (nome.includes('infraestrutura') || nome.includes('predial')) {
    return { tipo: 'instalacao', tipoServico: 'infraestrutura' };
  }
  if (nome.includes('expansão') || nome.includes('expansao') || nome.includes('rede fibra')) {
    return { tipo: 'instalacao', tipoServico: 'expansao_rede' };
  }

  // Fallback por ID numérico
  const mapa = {
    1: { tipo: 'instalacao', tipoServico: 'instalacao' },
    2: { tipo: 'reparo', tipoServico: 'reparo_sem_conexao' },
    3: { tipo: 'reparo', tipoServico: 'reparo_lentidao' },
    4: { tipo: 'instalacao', tipoServico: 'migracao' },
    5: { tipo: 'reparo', tipoServico: 'reparo_intermitente' },
  };
  return mapa[idAssunto] || { tipo: 'reparo', tipoServico: 'reparo_sem_conexao' };
}

/**
 * Mapeia status do IXC para nosso sistema
 */
function mapearStatus(statusIxc) {
  const mapa = {
    'A': 'disponivel',       // Aberto
    'E': 'em_execucao',      // Em execução
    'F': 'executada',        // Fechado/Finalizado
    'C': 'executada',        // Cancelado (tratamos como finalizado)
  };
  return mapa[statusIxc] || 'disponivel';
}

module.exports = IXCService;
