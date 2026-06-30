/**
 * Representa uma venda/pedido realizado no sistema.
 */
export interface Sale {
  id?: string;
  numeroPedido: string;
  vendedorId?: string; // ID do vendedor
  clienteId?: string; // ID do cliente vinculado
  valorProduto: number;
  valorAssistencia: number;
  valorImpermeabilizacao: number;
  total: number;
  data: string; // Formato DD/MM/AAAA
  timestamp: number;
  bonusTotal: number; // Soma de comissões + bônus fixos
  comissaoProduto: number; // Base 2.2%
  servicosExtras: string[]; // Lista de nomes dos bônus fixos (ex: ["Montagem", "Lavagem"])
  status?: 'ativo' | 'cancelado';
  produtoCodigo?: string;
  produtoNome?: string;
  produtoImagem?: string;
  produtoNickname?: string;
  produtoCategoria?: string;
  empresaId?: string;
  lojaId?: string;
  usuarioId?: string;
  createdAt?: string | number;
  products?: Array<{
    name: string;
    code: string;
    price: number;
    originalPrice?: number;
    image?: string;
    category?: string;
    nickname?: string;
  }>;
}

/**
 * Configuração de um nível do acelerador de metas.
 */
export interface LevelConfig {
  threshold: number; // Porcentagem mínima para atingir o nível (ex: 100)
  rate: number;      // Taxa de bônus aplicada (ex: 0.6)
}

/**
 * Configurações globais de metas e aceleradores.
 */
export interface Targets {
  product: number;
  assistance: number;
  waterproofing: number;
  productCommissionRate?: number; // Base product commission rate in percentage (e.g., 2.2)
  metaAtivacao: {
      product: boolean;
      assistance: boolean;
      waterproofing: boolean;
  };
  premiacaoExtra: {
      metaValor: number;
      valorPremio: number;
      ativo: boolean;
      dataInicio?: string;
      dataFim?: string;
  };
  serviceBonuses: {
    montagem: number;
    lavagem: number;
    almofada: number;
    pes_guarda_roupa: number;
    impermeabilizacao_bonus: number;
  };
  levels: {
    1: LevelConfig;
    2: LevelConfig;
    3: LevelConfig;
  };
  bonusPorPedido?: {
    ativo: boolean;
    valor: number;
  };
  menuOculto?: Record<string, boolean>;
}

/**
 * Dados para o gráfico de performance semanal.
 */
export interface WeeklyPerformance {
  day: string;
  vendas: number;
  comissao: number;
}

/**
 * Estatísticas consolidadas para o Dashboard.
 */
export interface DashboardStats {
  pTotal: number;
  aTotal: number;
  iTotal: number;
  pPerc: number;
  aPerc: number;
  iPerc: number;
  level: number;
  taxaGarantia?: number;
  bateuOsTres?: boolean;
  comissaoProdutos: number;
  comissaoAssistencia: number;
  bonusGarantia: number;
  bonusServicos: number;
  bonusAcelerador: number;
  bonusPorPedidoTotal: number;
  premiacaoExtraTotal: number;
  ganhosTotais: number;
  faturamentoGeral: number;
  activeSalesCount?: number;
}

/**
 * Itens de navegação do sistema.
 */
export enum NavItem {
  Resumos = 'Resumos',
  Relatorios = 'Relatórios',
  Meta = 'Meta',
  ResumoServico = 'Resumo serviço',
  ResumoPedido = 'Resumo pedido',
  AdicionarVenda = 'Adicionar vendas',
  Configuracoes = 'Configurações',
  Clientes = 'Clientes',
  Processos = 'Processos',
  Retornos = 'Retornos'
}

/**
 * Representa um cliente no sistema.
 */
export interface Customer {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  dataCadastro: string;
  totalComprado: number;
  pedidosCount: number;
  interesse?: string;
  dataRetorno?: string;
  statusRetorno?: 'pendente' | 'finalizado';
}

/**
 * Tipos legados/CRM (Mantidos para compatibilidade com constantes se necessário)
 */
export interface PipelineStage {
  id: string;
  label: string;
  color: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: string;
  value: number;
  daysAgo: number;
  stage: string;
  vendedorId?: string; // ID do vendedor que criou o card
  user: {
    name: string;
    avatar: string;
  };
  tags: string[];
  phone?: string;
  returnDate?: string;
  productInterest?: string;
  productImage?: string;
  productCode?: string;
  productCategory?: string;
  productNickname?: string;
  shippingFee?: number;
  assemblyFee?: number;
  isAssemblyFree?: boolean;
  validityDays?: number;
  products?: Array<{
    name: string;
    code: string;
    price: number;
    originalPrice?: number;
    image?: string;
    category?: string;
    nickname?: string;
  }>;
}
