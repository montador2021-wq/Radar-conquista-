
import React from 'react';
import { 
  Zap, 
  Users, 
  Cpu, 
  Files, 
  Box, 
  Activity, 
  Database,
  Crosshair,
  BarChart,
  ShoppingBag,
  PlusSquare,
  Settings as SettingsIcon,
  Home,
  Phone
} from 'lucide-react';
import { NavItem, PipelineStage, Opportunity } from './tipos';

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'lead', label: 'Atendimento Inicial', color: 'bg-cyan-500' },
  { id: 'qualificacao', label: 'Aguardando Data/Cartão', color: 'bg-violet-500' },
  { id: 'proposta', label: 'Aguardando Estoque', color: 'bg-blue-500' },
  { id: 'negociacao', label: 'Negociação Final', color: 'bg-fuchsia-500' },
  { id: 'fechamento', label: 'Venda Concluída', color: 'bg-emerald-500' },
  { id: 'perdido', label: 'Venda Perdida', color: 'bg-gray-500' },
];

export const NAVIGATION_ITEMS = [
  { id: NavItem.Resumos, label: 'Painel', icon: <Zap size={20} /> },
  { id: NavItem.Relatorios, label: 'Relatórios', icon: <BarChart size={20} /> },
  { id: NavItem.Meta, label: 'Metas', icon: <Crosshair size={20} /> },
  { id: NavItem.ResumoServico, label: 'Serviços', icon: <Activity size={20} /> },
  { id: NavItem.ResumoPedido, label: 'Pedidos', icon: <ShoppingBag size={20} /> },
  { id: NavItem.AdicionarVenda, label: 'Lançar', icon: <PlusSquare size={20} /> },
  { id: NavItem.Configuracoes, label: 'Ajustes', icon: <SettingsIcon size={20} /> },
  { id: NavItem.Clientes, label: 'Clientes', icon: <Users size={20} /> },
  { id: NavItem.Processos, label: 'Fluxo', icon: <Cpu size={20} /> },
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'VC-001',
    title: 'Expansão Interface',
    type: 'Marketing',
    value: 20000.00,
    daysAgo: 1,
    stage: 'lead',
    user: { name: 'Admin', avatar: 'https://picsum.photos/seed/u1/40/40' },
    tags: ['Prioridade']
  },
  {
    id: 'VC-002',
    title: 'Cloud Sync',
    type: 'Indicação',
    value: 12500.00,
    daysAgo: 3,
    stage: 'qualificacao',
    user: { name: 'Admin', avatar: 'https://picsum.photos/seed/u2/40/40' },
    tags: ['Tech']
  },
  {
    id: 'VC-003',
    title: 'Manutenção',
    type: 'R&R Ativo',
    value: 1145.00,
    daysAgo: 5,
    stage: 'proposta',
    user: { name: 'Admin', avatar: 'https://picsum.photos/seed/u3/40/40' },
    tags: ['Rotina']
  }
];
