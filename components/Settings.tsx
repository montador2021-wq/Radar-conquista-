import React, { useState, useEffect } from 'react';
import { Targets, NavItem } from '../tipos';
import { User } from '../src/types';
import { supabase } from '../src/supabase';
import { 
  Save, 
  RotateCcw, 
  Target, 
  ShieldCheck, 
  Download, 
  Wrench, 
  RefreshCw, 
  Volume2, 
  Users, 
  Lock, 
  Unlock, 
  Copy, 
  Check, 
  ShieldAlert, 
  UserPlus,
  Sparkles,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { isMechanicalMuted, setMechanicalMuted } from '../src/mechanicalTouch';

interface SettingsProps {
  targets: Targets;
  onSave: (newTargets: Targets) => void;
  onClose: () => void;
  showInstallBtn?: boolean;
  onInstall?: () => void;
  onLogout: () => void;
  user?: User | null;
}

const Settings: React.FC<SettingsProps> = ({ targets, onSave, onClose, showInstallBtn, onInstall, onLogout, user }) => {
  const [tempTargets, setTempTargets] = useState<Targets>(targets);
  const [isUpdating, setIsUpdating] = useState(false);
  const [muted, setMuted] = useState(isMechanicalMuted());
  
  // Member management states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // SaaS Master admin panel states
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // New registration states
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'vendedor' | 'gerente' | 'supervisor' | 'admin'>('vendedor');
  const [newStoreName, setNewStoreName] = useState(user?.store || 'Loja 1');
  const [newPassword, setNewPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleRegisterUser = async () => {
    if (!newFirstName.trim()) {
      setRegError("O nome é obrigatório.");
      return;
    }
    setIsRegistering(true);
    setRegError(null);
    setRegSuccess(null);

    try {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const nextId = (count || 0) + 1;
      const year = new Date().getFullYear();
      const customId = `VC-${year}-${String(nextId).padStart(3, '0')}`;
      const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const newUser: User = {
        id: customId,
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim() || undefined,
        store: newStoreName.trim() || 'Loja 1',
        password: newPassword || '123456',
        role: newRole,
        status: 'ativo',
        photoUrl: `https://picsum.photos/seed/${customId}/100/100`,
        lastLogin: '',
        accessToken: randomToken,
        tenantId: user?.tenantId || undefined,
        tenantName: user?.tenantName || undefined,
        plan: user?.plan || undefined,
        createdAt: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase.from('users').insert([newUser]);
      if (error) {
        throw error;
      }

      setUsersList(prev => [...prev, newUser]);
      
      const domain = window.location.origin;
      const accessLink = `${domain}/?token=${randomToken}`;
      setRegSuccess(`Sucesso! Link gerado: ${accessLink}`);

      // Clear fields
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      setRegError(err.message || "Erro ao cadastrar usuário.");
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'supervisor') {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const { data, error } = await supabase.from('users').select('*');
          if (!error && data) {
            setUsersList(data);
          }
        } catch (err) {
          console.error("Erro ao carregar usuários:", err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }

    if (user?.role === 'admin') {
      const fetchTenants = async () => {
        setLoadingTenants(true);
        try {
          const { data, error } = await supabase.from('tenants').select('*');
          if (!error && data) {
            setTenantsList(data);
          }
        } catch (err) {
          console.error("Erro ao carregar empresas SaaS:", err);
        } finally {
          setLoadingTenants(false);
        }
      };
      fetchTenants();
    }
  }, [user]);

  const handleToggleUserStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'bloqueado' ? 'ativo' : 'bloqueado';
    try {
      const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', targetUser.id);
      if (!error) {
        setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
      } else {
        alert("Erro ao alterar status do usuário.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateExpiration = async (targetUser: User, days: number | 'vitalicio') => {
    let newExpirationDate: string | null = null;
    if (days !== 'vitalicio') {
      const now = new Date();
      now.setDate(now.getDate() + days);
      newExpirationDate = now.toISOString();
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          expirationDate: newExpirationDate,
          status: 'ativo'
        })
        .eq('id', targetUser.id);
        
      if (!error) {
        setUsersList(prev => prev.map(u => 
          u.id === targetUser.id 
            ? { ...u, expirationDate: newExpirationDate || undefined, status: 'ativo' } 
            : u
        ));
      } else {
        alert("Erro ao atualizar vencimento do usuário.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'vendedor' : 'admin';
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', targetUser.id);
      if (!error) {
        setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      } else {
        alert("Erro ao alterar privilégios do usuário.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = async (targetUser: User) => {
    let token = targetUser.accessToken;
    if (!token) {
      token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await supabase.from('users').update({ accessToken: token }).eq('id', targetUser.id);
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, accessToken: token } : u));
    }
    
    const domain = window.location.origin;
    const accessLink = `${domain}/?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(accessLink);
      setCopiedUserId(targetUser.id);
      setTimeout(() => setCopiedUserId(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
    }
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      window.location.reload();
    } catch (err) {
      console.error("Erro ao forçar atualização:", err);
      window.location.reload();
    }
  };

  const handleLevelChange = (level: 1 | 2 | 3, field: 'threshold' | 'rate', value: number) => {
    setTempTargets({
      ...tempTargets,
      levels: {
        ...tempTargets.levels,
        [level]: {
          ...tempTargets.levels[level],
          [field]: value
        }
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 overflow-y-auto max-h-[85vh] pb-32 scrollbar-none"
    >
      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Ajustes & Configurações</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Metas e Controle Operacional</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase border border-gray-200 active:scale-95 transition-all hover:bg-gray-200"
        >
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Metas Individuais */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Target className="text-purple-600" size={18} />
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Metas da Equipe (Mês)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Faturamento Produtos (R$)</label>
              <input 
                type="number" 
                value={tempTargets.product}
                onChange={(e) => setTempTargets({ ...tempTargets, product: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-800 font-bold text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
              />
            </div>

            <div>
              <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Garantias / Assistências (R$)</label>
              <input 
                type="number" 
                value={tempTargets.assistance}
                onChange={(e) => setTempTargets({ ...tempTargets, assistance: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-800 font-bold text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
              />
            </div>

            <div>
              <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Impermeabilizações (R$)</label>
              <input 
                type="number" 
                value={tempTargets.waterproofing}
                onChange={(e) => setTempTargets({ ...tempTargets, waterproofing: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-800 font-bold text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
              />
            </div>

            <div>
              <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Comissão Base de Produtos (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={tempTargets.productCommissionRate ?? 2.2}
                onChange={(e) => setTempTargets({ ...tempTargets, productCommissionRate: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-800 font-bold text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
              />
            </div>
          </div>
        </div>

        {/* Níveis do Acelerador */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Target className="text-purple-600" size={18} />
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Acelerador de Metas</h3>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((lvl) => (
              <div key={lvl} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Acelerador Nível {lvl}</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Ativação (%)</label>
                    <input 
                      type="number" 
                      value={tempTargets.levels[lvl as 1|2|3].threshold}
                      onChange={(e) => handleLevelChange(lvl as 1|2|3, 'threshold', Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Prêmio Extra (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={tempTargets.levels[lvl as 1|2|3].rate}
                      onChange={(e) => handleLevelChange(lvl as 1|2|3, 'rate', Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ocultar Opções do Menu Principal */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <EyeOff className="text-purple-600" size={18} />
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Ocultar Opções do Menu Principal</h3>
          </div>

          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
            Selecione quais botões de atalho você deseja ocultar do Menu Principal da página inicial. Os recursos continuarão funcionando normalmente, apenas não aparecerão na tela de início.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: NavItem.Relatorios, label: 'Relatórios', desc: 'Ocultar atalho de relatórios' },
              { id: NavItem.Meta, label: 'Metas', desc: 'Ocultar atalho de metas' },
              { id: NavItem.ResumoServico, label: 'Serviços', desc: 'Ocultar atalho de serviços' },
              { id: NavItem.ResumoPedido, label: 'Pedidos', desc: 'Ocultar atalho de pedidos' },
              { id: NavItem.AdicionarVenda, label: 'Lançar', desc: 'Ocultar atalho de lançar venda' },
              { id: NavItem.Configuracoes, label: 'Ajustes', desc: 'Ocultar atalho de ajustes' },
              { id: NavItem.Clientes, label: 'Clientes', desc: 'Ocultar atalho de clientes' },
              { id: NavItem.Processos, label: 'Fluxo', desc: 'Ocultar atalho de fluxo (CRM)' },
            ].map((option) => (
              <label key={option.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100/50 transition-all">
                <input
                  type="checkbox"
                  checked={tempTargets.menuOculto?.[option.id] ?? false}
                  onChange={(e) => {
                    const mo = tempTargets.menuOculto || {};
                    setTempTargets({
                      ...tempTargets,
                      menuOculto: {
                        ...mo,
                        [option.id]: e.target.checked
                      }
                    });
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-800">{option.label}</span>
                  <span className="text-[9px] text-gray-400 font-medium">{option.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* SAAS MASTER PANEL (Visible ONLY to overall system admins, like Valmir Melo) */}
      {user?.role === 'admin' && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-indigo-500/20 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-yellow-300">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Painel SaaS Master</h3>
                <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider mt-0.5">Visão do Fundador / Administrador Geral</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="bg-indigo-500/20 text-indigo-200 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30">
                {tenantsList.length} Empresas Cadastradas
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">
                MRR Est.: R$ {tenantsList.reduce((acc, curr) => acc + (curr.price || 0), 0)}/mês
              </span>
            </div>
          </div>

          {loadingTenants ? (
            <div className="py-8 text-center text-xs font-black text-indigo-300 uppercase tracking-widest animate-pulse">
              Carregando carteira SaaS...
            </div>
          ) : tenantsList.length === 0 ? (
            <div className="p-8 text-center text-xs font-black text-indigo-300 uppercase tracking-widest bg-white/5 rounded-2xl border border-white/5">
              Nenhuma empresa SaaS registrada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2">
              {tenantsList.map((tenant) => (
                <div key={tenant.id} className="p-4 bg-white/5 border border-white/5 hover:border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase">{tenant.name}</span>
                      <span className="bg-purple-500/20 text-purple-300 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/30 tracking-widest">
                        {tenant.plan}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-[9px] text-indigo-200 font-semibold">
                      <span>Email do Dono: {tenant.ownerEmail}</span>
                      <span>Registrado em: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-yellow-300">R$ {tenant.price || 0}/mês</span>
                    <button 
                      onClick={async () => {
                        const newStatus = tenant.status === 'bloqueado' ? 'ativo' : 'bloqueado';
                        try {
                          await supabase.from('tenants').update({ status: newStatus }).eq('id', tenant.id);
                          setTenantsList(prev => prev.map(t => t.id === tenant.id ? { ...t, status: newStatus } : t));
                        } catch (err) {
                          alert("Erro ao alterar status da empresa.");
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                        tenant.status === 'bloqueado'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                      }`}
                    >
                      {tenant.status === 'bloqueado' ? 'Suspenso' : 'Ativo'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN & SUPERVISOR MEMBER MANAGEMENT */}
      {(user?.role === 'admin' || user?.role === 'supervisor') && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-purple-100 shadow-xl shadow-purple-500/5 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <Users className="text-purple-600" size={22} />
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Controle da Equipe & Vendedores</h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  {user?.role === 'supervisor' ? `Empresa: ${user?.tenantName || 'Minha Empresa'}` : 'Gerenciador de Acesso Global'}
                </p>
              </div>
            </div>
            <span className="bg-purple-100 text-purple-800 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-200">
              {usersList.length} Usuários
            </span>
          </div>

          {loadingUsers ? (
            <div className="py-8 text-center text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
              Carregando equipe...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2">
              {usersList.map((usr) => (
                <div key={usr.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-3">
                    <img 
                      src={usr.photoUrl || `https://picsum.photos/seed/${usr.id}/100/100`} 
                      alt={usr.firstName} 
                      className="w-10 h-10 rounded-full object-cover border border-purple-100 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-800">{usr.firstName} {usr.lastName}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest ${
                          usr.role === 'supervisor' || usr.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-200' 
                            : usr.role === 'gerente'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {usr.role}
                        </span>
                        <span className="bg-gray-200/60 text-gray-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {usr.store || 'Sem Loja'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold block">{usr.email || 'Usuário Local'}</span>
                      {usr.role !== 'admin' && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Acesso:</span>
                          {usr.expirationDate ? (
                            (() => {
                              const expDate = new Date(usr.expirationDate);
                              const isExpired = expDate.getTime() < Date.now();
                              return (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                  isExpired 
                                    ? 'bg-red-50 text-red-600 border-red-100' 
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                  {isExpired ? 'Expirado' : 'Ativo'} até {expDate.toLocaleDateString('pt-BR')}
                                </span>
                              );
                            })()
                          ) : (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded">
                              Vitalício / Sem Expiração
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 self-end sm:self-center">
                    {/* Access link copy */}
                    <button
                      onClick={() => handleCopyLink(usr)}
                      className="flex-1 sm:flex-initial bg-white border border-gray-200 text-gray-700 hover:text-purple-600 hover:border-purple-300 py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      title="Copiar Link de Acesso WhatsApp"
                    >
                      {copiedUserId === usr.id ? (
                        <>
                          <Check size={12} className="text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          WhatsApp Link
                        </>
                      )}
                    </button>

                    {/* Expiration renew select (only for non-admin) */}
                    {usr.role !== 'admin' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={usr.expirationDate ? "custom" : "vitalicio"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'vitalicio') {
                              handleUpdateExpiration(usr, 'vitalicio');
                            } else {
                              handleUpdateExpiration(usr, parseInt(val, 10));
                            }
                          }}
                          className="bg-white border border-gray-200 text-gray-700 py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider outline-none focus:border-purple-500 shadow-sm cursor-pointer"
                        >
                          <option value="custom" disabled>Prazo de Acesso</option>
                          <option value="15">+15 Dias (Teste)</option>
                          <option value="30">+30 Dias (Mensal)</option>
                          <option value="60">+60 Dias (Bimestral)</option>
                          <option value="365">+1 Ano (Anual)</option>
                          <option value="vitalicio">Vitalício (Sem limite)</option>
                        </select>
                      </div>
                    )}

                    {/* Block toggle */}
                    <button
                      onClick={() => handleToggleUserStatus(usr)}
                      className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                        usr.status === 'bloqueado'
                          ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                      }`}
                    >
                      {usr.status === 'bloqueado' ? (
                        <>
                          <Lock size={12} />
                          Bloqueado
                        </>
                      ) : (
                        <>
                          <Unlock size={12} />
                          Ativo
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form to Register New Member */}
          <div className="bg-purple-50/40 p-5 rounded-3xl border border-purple-100/60 space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <UserPlus className="text-purple-600" size={16} />
              <h4 className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Cadastrar Novo Membro da Equipe</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Nome</label>
                <input 
                  type="text" 
                  placeholder="Ex: João"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Sobrenome</label>
                <input 
                  type="text" 
                  placeholder="Ex: Silva"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">E-mail (Para Login com Google - Opcional)</label>
                <input 
                  type="email" 
                  placeholder="Ex: joaosilva@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Nível de Acesso</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="gerente">Gerente</option>
                  <option value="supervisor">Supervisor</option>
                  {user?.role === 'admin' && <option value="admin">Admin Geral</option>}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Loja de Atuação</label>
                <input 
                  type="text" 
                  placeholder="Ex: Loja Matriz"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Senha de Acesso Manual</label>
                <input 
                  type="password" 
                  placeholder="Ex: senha123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 font-bold text-xs outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {regError && (
              <p className="text-[9px] font-black text-red-600 uppercase tracking-wider">{regError}</p>
            )}

            {regSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                <p className="text-[9px] font-black text-green-700 uppercase tracking-wider">{regSuccess}</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const link = regSuccess.replace("Sucesso! Link gerado: ", "");
                        await navigator.clipboard.writeText(link);
                        alert("Link copiado para a área de transferência!");
                      } catch (err) {
                        alert("Falha ao copiar link automaticamente. Copie manualmente do texto acima.");
                      }
                    }}
                    className="bg-white border border-green-200 text-green-800 font-bold text-[9px] uppercase px-3 py-1.5 rounded-lg hover:bg-green-100"
                  >
                    Copiar Link
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Olá! Aqui está o seu link de acesso exclusivo para o Conquista App: " + regSuccess.replace("Sucesso! Link gerado: ", ""))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 text-white font-bold text-[9px] uppercase px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1"
                  >
                    Enviar via WhatsApp
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={handleRegisterUser}
              disabled={isRegistering}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
            >
              {isRegistering ? 'Cadastrando...' : 'Salvar e Gerar Link WhatsApp'}
            </button>
          </div>
        </div>
      )}

      {/* Audio & Extra Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Audio settings */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Volume2 className="text-purple-600" size={18} />
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Efeitos de Áudio</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">Som do Toque Mecânico</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Ativar ou desativar o barulho ao clicar</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={!muted}
                onChange={(e) => {
                  const newMuted = !e.target.checked;
                  setMuted(newMuted);
                  setMechanicalMuted(newMuted);
                }}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Sync version (Force reload) */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <RefreshCw className={`text-blue-600 ${isUpdating ? 'animate-spin' : ''}`} size={18} />
            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sincronizar Versão</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">Forçar Atualização</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Limpa o cache e carrega o código mais recente do servidor</span>
            </div>
            <button 
              onClick={handleForceUpdate}
              disabled={isUpdating}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shadow-sm shrink-0"
            >
              {isUpdating ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

      </div>

      {showInstallBtn && (
        <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100 space-y-4 shadow-sm animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <Download className="text-purple-600" size={18} />
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Instalar Aplicativo</h3>
          </div>
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
            Instale o Conquista App no seu dispositivo para acesso rápido e offline, como um aplicativo nativo.
          </p>
          <button 
            onClick={onInstall}
            className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
          >
            Instalar Agora
          </button>
        </div>
      )}

      <div className="flex gap-4">
        <button 
          onClick={() => setTempTargets(targets)}
          className="flex-1 py-4 bg-white text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-200 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-gray-50"
        >
          <RotateCcw size={14} /> Resetar
        </button>
        <button 
          onClick={() => onSave(tempTargets)}
          className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
        >
          <Save size={14} /> Salvar Alterações
        </button>
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-red-100"
      >
        Sair do Sistema / Trocar de Conta
      </button>

    </motion.div>
  );
};

export default Settings;
