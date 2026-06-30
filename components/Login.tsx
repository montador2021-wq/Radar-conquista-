import React, { useState } from 'react';
import { supabase } from '../src/supabase';
import { User } from '../src/types';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Lock, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  Check, 
  QrCode, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Mail,
  Store,
  FileText,
  Phone,
  Award,
  Users,
  ArrowUpRight,
  BarChart3,
  CheckSquare,
  Settings2,
  Play
} from 'lucide-react';
import { auth } from '../src/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Mode: 'landing' (presentation website) | 'app' (auth & saas screens)
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');

  // Interactive Simulator States
  const [simProductValue, setSimProductValue] = useState<number>(1499.90);
  const [simShippingFree, setSimShippingFree] = useState<boolean>(true);
  const [simShippingFee, setSimShippingFee] = useState<number>(49.90);
  const [simAssemblyFree, setSimAssemblyFree] = useState<boolean>(true);
  const [simAssemblyFee, setSimAssemblyFee] = useState<number>(75.00);
  const [simValidityDays, setSimValidityDays] = useState<number>(5);

  const calculatedTotal = () => {
    let total = simProductValue;
    if (!simShippingFree) total += simShippingFee;
    if (!simAssemblyFree) total += simAssemblyFee;
    return total;
  };

  // Tabs: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login states
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register SaaS states
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [firstStoreName, setFirstStoreName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'pequeno' | 'medio' | 'empresarial'>('pequeno');
  const [pixKeyCopied, setPixKeyCopied] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    {
      id: 'solo' as const,
      name: 'Consultor Solo',
      price: 'R$ 10,00',
      period: '/mês',
      features: [
        'Apenas 1 usuário ativo',
        'Controle de orçamento completo',
        'Configuração de frete e montagem',
        'Gerador de PDF de alta fidelidade',
        'Validade de orçamento customizada',
        'Acesso individual ao painel'
      ],
      tag: 'Plano Individual',
      color: 'border-gray-200 hover:border-purple-300'
    },
    {
      id: 'pequeno' as const,
      name: 'Equipe Bronze',
      price: 'R$ 49,90',
      period: '/mês',
      features: [
        'Até 10 vendedores ativos',
        'Painel gerencial integrado',
        'Acelerador de metas e bônus',
        'Registro de clientes e orçamentos',
        'Validade do orçamento dinâmica',
        'Suporte por e-mail'
      ],
      tag: 'Até 10 Vendedores ⭐',
      color: 'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/5'
    },
    {
      id: 'medio' as const,
      name: 'Equipe Prata',
      price: 'R$ 199,00',
      period: '/mês',
      features: [
        'Até 40 pessoas ativas',
        'Controle total de equipe (supervisor/gerente)',
        'Ocultação de categorias personalizada',
        'Comissões dinâmicas por níveis',
        'Histórico e transferência de clientes',
        'Suporte prioritário via WhatsApp'
      ],
      tag: 'Até 40 Vendedores',
      color: 'border-gray-200 hover:border-purple-300'
    },
    {
      id: 'empresarial' as const,
      name: 'Corporativo Ouro',
      price: 'R$ 499,00',
      period: '/mês',
      features: [
        'Vendedores e gerentes ilimitados',
        'Controle de múltiplas filiais',
        'Painel gerencial master',
        'Relatórios customizados e exportáveis',
        'Hierarquia automática total',
        'Gerente de contas dedicado 24/7'
      ],
      tag: 'Usuários Ilimitados',
      color: 'border-gray-200 hover:border-purple-300'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCompleto || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite de conexão esgotado.')), 10000)
    );

    try {
      const names = nomeCompleto.trim().split(/\s+/).filter(Boolean);
      if (names.length < 1) {
        setError('Por favor, digite seu nome.');
        setLoading(false);
        return;
      }
      
      const firstName = names[0];
      const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

      const fetchPromise = supabase
        .from('users')
        .select('*')
        .ilike('firstName', firstName.trim())
        .ilike('lastName', lastName.trim())
        .maybeSingle();

      const { data: existingUser, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (fetchError && fetchError.code !== 'PGRST116') { 
        if (fetchError.code === '42P01') {
          throw new Error('A tabela de usuários não existe.');
        }
        throw fetchError;
      }

      if (existingUser) {
        if (existingUser.status === 'bloqueado') {
          setError('Seu acesso está suspenso. Por favor, entre em contato com o administrador.');
          setLoading(false);
          return;
        }

        if (existingUser.password === senha) {
          onLogin(existingUser as User);
        } else {
          setError('Senha incorreta.');
        }
      } else {
        // Auto-create user if not exists
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const nextId = (count || 0) + 1;
        const year = new Date().getFullYear();
        const customId = `VC-${year}-${String(nextId).padStart(3, '0')}`;
        const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const newUser: User = {
          id: customId,
          firstName,
          lastName,
          store: 'Loja 1',
          password: senha,
          role: (firstName.toLowerCase() === 'valmir' && lastName.toLowerCase() === 'melo') ? 'admin' : 'vendedor',
          status: 'ativo',
          lastLogin: new Date().toISOString(),
          photoUrl: "https://picsum.photos/seed/" + customId + "/100/100",
          accessToken: randomToken,
          createdAt: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { error: insertError } = await supabase.from('users').insert([newUser]);
        if (insertError) throw insertError;

        onLogin(newUser);
      }
    } catch (err: any) {
      console.error('Erro detalhado no login:', err);
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        throw new Error('Não foi possível obter o e-mail da sua conta do Google.');
      }

      // Check if user exists by email
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .eq('email', firebaseUser.email)
        .maybeSingle() as any;

      if (fetchError) {
        console.error('Erro ao buscar usuário por email:', fetchError);
      }

      if (existingUser) {
        if (existingUser.status === 'bloqueado') {
          setError('Seu acesso está suspenso. Por favor, entre em contato com o administrador para reativar.');
          setLoading(false);
          return;
        }

        const updatedUser = {
          ...existingUser,
          lastLogin: new Date().toISOString(),
          photoUrl: firebaseUser.photoURL || existingUser.photoUrl
        };

        await supabase
          .from('users')
          .update({ lastLogin: updatedUser.lastLogin, photoUrl: updatedUser.photoUrl })
          .eq('id', existingUser.id);

        onLogin(updatedUser);
      } else {
        const names = firebaseUser.displayName ? firebaseUser.displayName.split(' ') : ['Usuário'];
        const firstName = names[0];
        const lastName = names.slice(1).join(' ');

        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const nextId = (count || 0) + 1;
        const year = new Date().getFullYear();
        const customId = `VC-${year}-${String(nextId).padStart(3, '0')}`;
        const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const isValmir = 
          firebaseUser.email.toLowerCase() === 'prvalmirdej@gmail.com' || 
          firebaseUser.email.toLowerCase() === 'valmirmelo@gmail.com';

        const newUser: User = {
          id: firebaseUser.uid,
          firstName,
          lastName,
          email: firebaseUser.email,
          store: 'Loja 1',
          password: '',
          role: isValmir ? 'admin' : 'vendedor',
          status: 'ativo',
          photoUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${customId}/100/100`,
          lastLogin: new Date().toISOString(),
          accessToken: randomToken,
          createdAt: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { error: insertError } = await supabase.from('users').insert([newUser]);
        if (insertError) throw insertError;

        onLogin(newUser);
      }
    } catch (err: any) {
      console.error('Erro no Google Login:', err);
      setError(err.message || 'Falha ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaaSOnboarding = async () => {
    if (!companyName || !supervisorName || !firstStoreName || !regEmail || !regPassword) {
      setRegError('Por favor, preencha todos os campos do primeiro passo.');
      setRegStep(1);
      return;
    }

    setLoading(true);
    setRegError(null);

    try {
      const names = supervisorName.trim().split(/\s+/).filter(Boolean);
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');

      // 1. Generate unique IDs
      const tenantId = `tenant-${Math.random().toString(36).substring(2, 9)}`;
      const supervisorId = `user-${Math.random().toString(36).substring(2, 11)}`;
      const randomToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const price = selectedPlan === 'solo' ? 10 : selectedPlan === 'pequeno' ? 49.90 : selectedPlan === 'medio' ? 199 : 499;

      // 2. Insert Company (Tenant)
      const newTenant = {
        id: tenantId,
        name: companyName.trim(),
        plan: selectedPlan,
        status: 'ativo',
        price,
        ownerEmail: regEmail.trim(),
        createdAt: new Date().toISOString()
      };

      const { error: tenantError } = await supabase.from('tenants').insert([newTenant]);
      if (tenantError) throw tenantError;

      // 3. Insert Supervisor Admin User (automatically mapped to this tenant)
      const newSupervisor: User = {
        id: supervisorId,
        firstName,
        lastName,
        email: regEmail.trim(),
        store: firstStoreName.trim(),
        password: regPassword,
        role: 'supervisor',
        status: 'ativo',
        photoUrl: `https://picsum.photos/seed/${supervisorId}/100/100`,
        lastLogin: new Date().toISOString(),
        accessToken: randomToken,
        tenantId,
        tenantName: companyName.trim(),
        plan: selectedPlan,
        createdAt: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error: userError } = await supabase.from('users').insert([newSupervisor]);
      if (userError) throw userError;

      // 4. Insert dynamic defaults for targets so company starts set up correctly
      const defaultTargets = {
        id: `targets`,
        tenantId,
        product: 50000,
        assistance: 3000,
        waterproofing: 5000,
        metaAtivacao: { product: true, assistance: true, waterproofing: true },
        premiacaoExtra: { metaValor: 100000, valorPremio: 1000, ativo: false },
        serviceBonuses: { montagem: 10, lavagem: 15, almofada: 5, pes_guarda_roupa: 8, impermeabilizacao_bonus: 20 },
        levels: {
          1: { threshold: 100, rate: 0.6 },
          2: { threshold: 110, rate: 0.8 },
          3: { threshold: 120, rate: 1.0 }
        }
      };
      await supabase.from('settings').insert([defaultTargets]);

      setPaymentSuccess(true);
      
      // Simulate brief success animation before log in
      setTimeout(() => {
        onLogin(newSupervisor);
      }, 2000);

    } catch (err: any) {
      console.error('Erro ao cadastrar empresa SaaS:', err);
      setRegError(err.message || 'Erro ao criar conta da empresa. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = () => {
    try {
      const pixKey = "conquista.saas.pix@pagamentos.com.br";
      navigator.clipboard.writeText(pixKey);
      setPixKeyCopied(true);
      setTimeout(() => setPixKeyCopied(false), 3000);
    } catch (e) {
      console.warn("Clipboard blocked.");
    }
  };

  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen bg-[#070609] text-slate-100 font-sans selection:bg-purple-600 selection:text-white overflow-x-hidden pb-16">
        {/* HEADER */}
        <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/5">
              <ShieldCheck size={22} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-md font-black tracking-tight uppercase leading-none text-white">Conquista</h2>
              <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest block mt-0.5">Plataforma Comercial</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <a href="#recursos" className="hover:text-purple-400 transition-colors">Recursos</a>
            <a href="#simulador" className="hover:text-purple-400 transition-colors">Simulador</a>
            <a href="#planos" className="hover:text-purple-400 transition-colors">Planos</a>
          </nav>

          <button
            onClick={() => {
              setActiveTab('login');
              setViewMode('app');
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/10 hover:shadow-purple-600/20 active:scale-95 cursor-pointer"
          >
            Acessar Sistema
          </button>
        </header>

        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-[100px] -z-10 pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full filter blur-[100px] -z-10 pointer-events-none" />

          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={12} className="text-yellow-400" />
              Gestão de Alta Performance para Lojas de Móveis
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase italic leading-[0.95] text-white">
              Eleve suas vendas ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">próximo nível</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed font-medium">
              A plataforma comercial definitiva que otimiza sua logística e acelera metas. Simule fretes e montagens de móveis com flexibilidade, defina validade de orçamentos e gere PDFs corporativos profissionais prontos para enviar por WhatsApp sem encher a memória do aparelho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setViewMode('app');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-xl shadow-purple-600/15 flex items-center justify-center gap-2 hover:gap-3 active:scale-95 cursor-pointer"
              >
                Acessar Plataforma
                <ArrowRight size={16} />
              </button>
              <a
                href="#simulador"
                className="bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 text-center"
              >
                Testar Simulador
              </a>
            </div>
          </div>

          {/* HERO VISUAL MOCKUP */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full filter blur-2xl pointer-events-none" />
            
            {/* Mockup Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">RadarConquista - Dashboard</span>
            </div>

            {/* Mockup Body (Stats & visual cards) */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Meta Mensal</span>
                  <div className="text-lg font-black text-white mt-1">R$ 50.000</div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '74%' }} />
                  </div>
                  <div className="text-[8px] text-purple-400 font-bold mt-1 uppercase text-right">74% Concluído</div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Sua Comissão</span>
                  <div className="text-lg font-black text-emerald-400 mt-1">R$ 1.340,50</div>
                  <div className="text-[8px] text-emerald-500/80 font-bold mt-1.5 uppercase flex items-center gap-1">
                    <Sparkles size={10} /> +0.6% Nível Bônus
                  </div>
                </div>
              </div>

              {/* PDF & Logistcs preview */}
              <div className="bg-purple-900/10 border border-purple-500/10 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-purple-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Último Orçamento</span>
                  </div>
                  <span className="text-[8px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Aguardando</span>
                </div>
                <hr className="border-white/5" />
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>Guarda-Roupa Casal</span>
                  <span className="font-bold text-white">R$ 1.499,90</span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <div className="bg-white/5 p-1 rounded text-center text-[8px] text-slate-400 font-bold">
                    Frete: <span className="text-emerald-400">Grátis</span>
                  </div>
                  <div className="bg-white/5 p-1 rounded text-center text-[8px] text-slate-400 font-bold">
                    Montagem: <span className="text-white">R$ 50</span>
                  </div>
                  <div className="bg-white/5 p-1 rounded text-center text-[8px] text-slate-400 font-bold">
                    Validade: <span className="text-white">5 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="recursos" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Por que o Conquista App?</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">
              Recursos construídos para <span className="text-purple-400">vender mais</span>
            </h2>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Especialmente desenvolvido para o varejo de móveis e eletro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-purple-500/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-md font-black uppercase tracking-tight text-white mb-2">Metas Aceleradoras</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Comissões progressivas divididas em níveis dinâmicos para desafiar e premiar os vendedores conforme batem 100%, 120% ou 140% das metas de produtos e serviços.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-purple-500/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Settings2 size={24} />
              </div>
              <h3 className="text-md font-black uppercase tracking-tight text-white mb-2">Logística Flexível</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Controle total e instantâneo sobre as regras de orçamento: selecione frete e montagem grátis ou cobre valores específicos com campos dinâmicos integrados.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-purple-500/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-md font-black uppercase tracking-tight text-white mb-2">PDF de Alta Fidelidade</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Propostas em formato profissional com logotipo corporativo Sono Show Móveis, paginação inteligente de margem de segurança e rodapé personalizado.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-purple-500/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-md font-black uppercase tracking-tight text-white mb-2">Controle Gerencial</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Permissões inteligentes baseadas em cargos (Supervisor, Gerente, Vendedor) com painel para gerenciar a equipe e ocultar categorias específicas de produtos.
              </p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SIMULATOR SECTION */}
        <section id="simulador" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column (Info & Controls) */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Demonstração Interativa</span>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">
                Simule orçamentos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">forma simples</span>
              </h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider leading-relaxed">
                Mexa nos botões abaixo para ver como as novas opções de frete, montagem e validade alteram as condições comerciais do orçamento instantaneamente na tela.
              </p>

              <hr className="border-white/5" />

              {/* SIMULATOR CONTROLS */}
              <div className="space-y-4">
                {/* Product value */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor do Produto (R$)</label>
                  <input
                    type="number"
                    value={simProductValue}
                    onChange={(e) => setSimProductValue(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none text-white font-bold focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Shipping Control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Entrega / Frete</span>
                    <div className="flex bg-slate-850 p-0.5 rounded-lg border border-white/5 max-w-[160px]">
                      <button
                        type="button"
                        onClick={() => setSimShippingFree(true)}
                        className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${simShippingFree ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Grátis
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimShippingFree(false)}
                        className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${!simShippingFree ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>

                  {!simShippingFree && (
                    <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Valor do Frete (R$)</label>
                      <input
                        type="number"
                        value={simShippingFee}
                        onChange={(e) => setSimShippingFee(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>

                {/* Assembly Control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Montagem de Móveis</span>
                    <div className="flex bg-slate-850 p-0.5 rounded-lg border border-white/5 max-w-[160px]">
                      <button
                        type="button"
                        onClick={() => setSimAssemblyFree(true)}
                        className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${simAssemblyFree ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Grátis
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimAssemblyFree(false)}
                        className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${!simAssemblyFree ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Cobrar
                      </button>
                    </div>
                  </div>

                  {!simAssemblyFree && (
                    <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Valor de Montagem (R$)</label>
                      <input
                        type="number"
                        value={simAssemblyFee}
                        onChange={(e) => setSimAssemblyFee(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>

                {/* Validity days select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Validade do Orçamento</label>
                  <select
                    value={simValidityDays}
                    onChange={(e) => setSimValidityDays(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none text-white text-xs font-bold focus:border-purple-500"
                  >
                    <option value={1} className="bg-slate-900">1 dia útil (Apenas hoje)</option>
                    <option value={3} className="bg-slate-900">3 dias corridos</option>
                    <option value={5} className="bg-slate-900">5 dias corridos (Recomendado)</option>
                    <option value={7} className="bg-slate-900">7 dias corridos</option>
                    <option value={10} className="bg-slate-900">10 dias corridos</option>
                    <option value={15} className="bg-slate-900">15 dias corridos</option>
                    <option value={30} className="bg-slate-900">30 dias corridos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column (Dynamic Proposal Simulation) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm bg-white text-slate-900 rounded-[2.5rem] p-6 shadow-2xl space-y-5 border border-purple-100 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full filter blur-2xl pointer-events-none" />
                
                <div className="space-y-4">
                  {/* Corporate header mockup */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                        <ShieldCheck size={14} className="text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight text-gray-800">Sono Show Móveis</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] font-mono text-gray-400 block">PROPOSTA SIMULADA</span>
                      <span className="text-[9px] font-black text-purple-600 uppercase">Validade: {simValidityDays} {simValidityDays === 1 ? 'dia' : 'dias'}</span>
                    </div>
                  </div>

                  {/* Client and Product Details */}
                  <div className="space-y-3">
                    <div className="bg-purple-50/50 p-2.5 rounded-lg text-[9px] font-bold text-purple-700 uppercase">
                      Cliente: Consumidor Demonstrativo
                    </div>
                    
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <img 
                        src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&h=150&q=80" 
                        alt="Sofa Reclinável Premium" 
                        className="w-12 h-12 object-cover rounded-xl border border-purple-100 shadow-sm flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-black text-purple-600 block uppercase tracking-wider">Estofados Selecionados</span>
                        <h4 className="text-[11px] font-bold text-gray-800 truncate">Sofa Reclinável Premium</h4>
                        <span className="text-[11px] font-black text-gray-900 block mt-0.5">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(simProductValue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Conditions Lines */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 uppercase">Frete:</span>
                      <span className={simShippingFree ? 'text-green-600' : 'text-gray-700'}>
                        {simShippingFree ? 'GRÁTIS' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(simShippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400 uppercase">Montagem:</span>
                      <span className={simAssemblyFree ? 'text-green-600' : 'text-gray-700'}>
                        {simAssemblyFree ? 'GRÁTIS' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(simAssemblyFee)}
                      </span>
                    </div>
                  </div>

                  {/* Total line */}
                  <div className="bg-purple-50 p-3.5 rounded-2xl flex justify-between items-center border border-purple-100">
                    <div>
                      <span className="text-[8px] font-black text-purple-700 uppercase block tracking-wider">Valor Total</span>
                      <span className="text-xs font-medium text-purple-500">Logística inclusa</span>
                    </div>
                    <span className="text-xl font-black text-purple-900 tracking-tight">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedTotal())}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('login');
                    setViewMode('app');
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Criar um Orçamento Real
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* PLANS SECTION */}
        <section id="planos" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Ambientes Prontos</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">
              A escala perfeita para <span className="text-purple-400">seu negócio</span>
            </h2>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Planos sob medida com ambientes de dados 100% isolados</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div 
                key={p.id}
                className={`bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col justify-between hover:border-purple-500/20 transition-all duration-300 relative ${p.id === 'pequeno' ? 'ring-2 ring-purple-600 shadow-xl shadow-purple-600/5' : ''}`}
              >
                {p.id === 'pequeno' && (
                  <span className="absolute -top-3 right-6 bg-purple-600 text-white font-black text-[8px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">Mais Escolhido</span>
                )}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-sm text-slate-300 uppercase tracking-tight">{p.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black text-white tracking-tight">{p.price}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.period}</span>
                    </div>
                  </div>
                  <hr className="border-white/5" />
                  <ul className="space-y-3">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex gap-2 items-start text-xs text-slate-300">
                        <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlan(p.id);
                    setActiveTab('register');
                    setRegStep(1);
                    setViewMode('app');
                  }}
                  className={`w-full font-black text-[10px] uppercase tracking-wider py-3.5 rounded-xl mt-8 transition-all active:scale-95 cursor-pointer ${
                    p.id === 'pequeno'
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/10'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Cadastrar Empresa
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="max-w-7xl mx-auto px-6 pt-12 border-t border-white/5 text-center space-y-4">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
            Conquista App SaaS - Todos os direitos reservados
          </p>
          <p className="text-slate-600 text-[9px] font-medium max-w-md mx-auto">
            Plataforma de alta performance para inteligência de vendas, gestão de metas progressivas, e orçamentos corporativos integrados.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl shadow-purple-500/5 border border-gray-100 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left panel (Welcome, features and SaaS info) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-800 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full filter blur-2xl" />
            
            <div className="space-y-8 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                  <ShieldCheck size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase leading-none">Conquista</h2>
                  <span className="text-[9px] font-bold text-purple-200 uppercase tracking-widest">Plataforma Comercial</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight uppercase italic">
                  Eleve suas vendas ao <span className="text-yellow-300">próximo nível</span>
                </h3>
                <p className="text-purple-100 text-xs font-medium leading-relaxed">
                  Gerencie múltiplas lojas, defina metas aceleradas inteligentes, acompanhe vendedores e garanta inteligência comercial automática em tempo real.
                </p>
              </div>
            </div>

            {/* SaaS Value points */}
            <div className="space-y-4 my-8 lg:my-0 z-10">
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 p-1 bg-white/10 rounded-lg text-yellow-300 shrink-0">
                  <Sparkles size={12} />
                </div>
                <p className="text-[11px] font-bold text-purple-100 uppercase tracking-wider">
                  Multi-empresa com ambientes 100% isolados
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 p-1 bg-white/10 rounded-lg text-yellow-300 shrink-0">
                  <Check size={12} />
                </div>
                <p className="text-[11px] font-bold text-purple-100 uppercase tracking-wider">
                  Hierarquias Automatizadas (Supervisor, Gerente e Vendedor)
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 p-1 bg-white/10 rounded-lg text-yellow-300 shrink-0">
                  <Store size={12} />
                </div>
                <p className="text-[11px] font-bold text-purple-100 uppercase tracking-wider">
                  Envio rápido via WhatsApp e Orçamentos Rápidos
                </p>
              </div>
            </div>

            <div className="text-purple-200 text-[9px] font-bold tracking-widest uppercase z-10 mt-6 lg:mt-0">
              © CONQUISTA APP SAAS - ALTA PERFORMANCE
            </div>
          </div>

          {/* Right panel (Tabs: Login or SaaS Registration Wizard) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            
            {/* Back to Landing Page option */}
            <div className="flex justify-start mb-6">
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100/85 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft size={12} strokeWidth={3} />
                Voltar para apresentação
              </button>
            </div>
            
            {/* Header Tabs */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 mb-8 max-w-sm">
              <button
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'login' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Acessar Sistema
              </button>
              <button
                onClick={() => { setActiveTab('register'); setRegError(null); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'register' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Cadastrar Minha Empresa (SaaS)
              </button>
            </div>

            {/* TAB: LOGIN */}
            {activeTab === 'login' && (
              <div className="space-y-6 my-auto">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic leading-none">
                    Entrar no <span className="text-purple-600">Sistema</span>
                  </h3>
                  <p className="text-gray-400 font-bold uppercase text-[8px] tracking-widest mt-2">Insira suas credenciais cadastradas</p>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white text-gray-700 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.35 1 3.34 3.65 1.34 7.5l3.85 2.99c.9-2.7 3.42-4.45 6.81-4.45z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.31 3.49l3.6 2.79c2.1-1.94 3.77-5.18 3.77-8.43z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.19 10.49c-.23-.69-.36-1.43-.36-2.19s.13-1.5.36-2.19L1.34 3.12C.48 4.82 0 6.74 0 8.75s.48 3.93 1.34 5.63l3.85-2.99z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1.1.74-2.5 1.18-4.36 1.18-3.39 0-5.91-1.75-6.81-4.45L1.34 14.4c2 3.85 6.01 6.5 10.66 6.5z"
                    />
                  </svg>
                  Acessar com o Google
                </button>

                <div className="flex items-center justify-between">
                  <hr className="w-full border-gray-100" />
                  <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest px-3 bg-white shrink-0">Ou Login Manual</span>
                  <hr className="w-full border-gray-100" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <UserIcon size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Nome Completo (Ex: João Silva)"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-3.5 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type="password"
                      placeholder="Sua Senha de Acesso"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-3.5 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 transition-all"
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        type="button"
                        onClick={() => setError("Caso tenha esquecido sua senha, seu supervisor/admin pode redefini-la na aba Configurações.")}
                        className="text-[9px] text-gray-400 hover:text-purple-600 font-bold uppercase tracking-widest underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 p-3.5 rounded-xl border border-red-100">
                      <p className="text-red-500 text-[9px] font-black uppercase text-center tracking-wider leading-relaxed">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Entrando...' : (
                      <>
                        Entrar no Sistema
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: SAAS REGISTER WIZARD */}
            {activeTab === 'register' && (
              <div className="space-y-6 my-auto">
                
                {/* Wizard steps indicator */}
                <div className="flex justify-between items-center bg-purple-50/60 p-2.5 rounded-xl max-w-md">
                  <div className="flex gap-2 items-center">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${regStep === 1 ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}>1</span>
                    <span className="text-[8px] font-black uppercase text-purple-700">Dados</span>
                  </div>
                  <div className="h-0.5 w-10 bg-purple-200" />
                  <div className="flex gap-2 items-center">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${regStep === 2 ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}>2</span>
                    <span className="text-[8px] font-black uppercase text-purple-700">Plano</span>
                  </div>
                  <div className="h-0.5 w-10 bg-purple-200" />
                  <div className="flex gap-2 items-center">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${regStep === 3 ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'}`}>3</span>
                    <span className="text-[8px] font-black uppercase text-purple-700">Ativação</span>
                  </div>
                </div>

                {/* STEP 1: Basic registration fields */}
                {regStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic leading-none">
                        Dados do <span className="text-purple-600">Ambiente SaaS</span>
                      </h3>
                      <p className="text-gray-400 font-bold uppercase text-[8px] tracking-widest mt-1.5">Insira os dados iniciais da sua organização</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Nome da Empresa</label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Ex: Radar Comercial"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 pl-10 pr-3 py-3 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Nome da Primeira Loja</label>
                        <div className="relative">
                          <Store size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Ex: Loja Matriz"
                            value={firstStoreName}
                            onChange={(e) => setFirstStoreName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 pl-10 pr-3 py-3 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Seu Nome Completo (Como Administrador)</label>
                      <div className="relative">
                        <UserIcon size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Ex: João da Silva"
                          value={supervisorName}
                          onChange={(e) => setSupervisorName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 pl-10 pr-3 py-3 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">E-mail do Administrador</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                          <input
                            type="email"
                            placeholder="Ex: joao@empresa.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 pl-10 pr-3 py-3 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">Senha de Acesso</label>
                        <div className="relative">
                          <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                          <input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 pl-10 pr-3 py-3 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {regError && (
                      <p className="text-[9px] font-black text-red-500 uppercase text-center tracking-wider">{regError}</p>
                    )}

                    <button
                      onClick={() => {
                        if (!companyName.trim() || !supervisorName.trim() || !firstStoreName.trim() || !regEmail.trim() || !regPassword) {
                          setRegError('Por favor, preencha todos os campos.');
                          return;
                        }
                        setRegError(null);
                        setRegStep(2);
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center gap-1"
                    >
                      Avançar para Planos
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* STEP 2: Plan Selection */}
                {regStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic leading-none">
                        Selecione seu <span className="text-purple-600">Plano SaaS</span>
                      </h3>
                      <p className="text-gray-400 font-bold uppercase text-[8px] tracking-widest mt-1.5">Escolha a escala ideal para o seu negócio</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {plans.map((p) => (
                        <div 
                          key={p.id}
                          onClick={() => setSelectedPlan(p.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${p.color} ${
                            selectedPlan === p.id 
                              ? 'border-purple-600 bg-purple-50/20' 
                              : 'bg-white'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[8px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{p.tag}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPlan === p.id ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300'}`}>
                                {selectedPlan === p.id && <Check size={8} strokeWidth={4} />}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-black text-xs text-gray-800 uppercase tracking-tight">{p.name}</h4>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-black text-gray-900 leading-none">{p.price}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{p.period}</span>
                              </div>
                            </div>
                            <hr className="border-gray-100" />
                            <ul className="space-y-2">
                              {p.features.map((f, idx) => (
                                <li key={idx} className="flex gap-2 items-start text-[9px] text-gray-600 leading-tight">
                                  <Check size={10} className="text-green-500 shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setRegStep(1)}
                        className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-1"
                      >
                        <ChevronLeft size={14} />
                        Voltar
                      </button>
                      <button
                        onClick={() => setRegStep(3)}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/10 flex items-center justify-center gap-1"
                      >
                        Avançar para Pagamento
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Pix Payment Simulation */}
                {regStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic leading-none">
                        Ativação da <span className="text-purple-600">Assinatura</span>
                      </h3>
                      <p className="text-gray-400 font-bold uppercase text-[8px] tracking-widest mt-1.5">Efetue o pagamento Pix para liberar o seu ambiente instantaneamente</p>
                    </div>

                    {paymentSuccess ? (
                      <div className="bg-green-50 border border-green-200 p-8 rounded-3xl text-center space-y-4">
                        <CheckCircle2 className="text-green-600 mx-auto" size={48} />
                        <div>
                          <h4 className="text-green-800 font-black text-sm uppercase tracking-wider">Pagamento Recebido com Sucesso!</h4>
                          <p className="text-[10px] text-green-600 uppercase font-black tracking-widest mt-1">Configurando seu ambiente comercial exclusivo...</p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                          Seu tenant multiempresa foi provisionado. Estamos te redirecionando para a sua central de controle.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-purple-50/20 p-5 rounded-3xl border border-purple-100/50">
                        
                        {/* QrCode */}
                        <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center border border-gray-100 space-y-3 shadow-sm">
                          <div className="p-3 bg-purple-50 rounded-xl">
                            <QrCode size={120} className="text-purple-700" />
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Valor do Plano Selecionado</p>
                            <span className="text-lg font-black text-purple-700">
                              {selectedPlan === 'solo' ? 'R$ 10,00' : selectedPlan === 'pequeno' ? 'R$ 49,90' : selectedPlan === 'medio' ? 'R$ 199,00' : 'R$ 499,00'}
                            </span>
                          </div>
                        </div>

                        {/* Pix copy and paste & instructions */}
                        <div className="flex flex-col justify-between py-1 space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-purple-700">
                              <CreditCard size={14} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Pix Copia e Cola</h4>
                            </div>
                            <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed">
                              Copie a chave Pix abaixo e pague no aplicativo do seu banco para ativar instantaneamente:
                            </p>
                            <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-[10px] font-mono text-gray-700 flex justify-between items-center shadow-inner overflow-hidden select-all break-all">
                              <span>conquista.saas.pix@pagamentos.com.br</span>
                            </div>
                            <button
                              onClick={copyPixKey}
                              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              {pixKeyCopied ? 'Copiado!' : 'Copiar Chave Pix'}
                            </button>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[8px] text-purple-600 font-black uppercase tracking-widest leading-relaxed">
                              * ATENÇÃO: ESSA É UMA SIMULAÇÃO DE ALTA FIDELIDADE PARA O MODELO SAAS. O BOTÃO ABAIXO SIMULA O RETORNO DA API DE PAGAMENTO (WEBHOOK).
                            </p>
                            <button
                              onClick={handleSaaSOnboarding}
                              disabled={loading}
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                            >
                              {loading ? 'Processando...' : 'Confirmar Pagamento Pix Simulado'}
                            </button>
                          </div>

                        </div>
                      </div>
                    )}

                    {!paymentSuccess && (
                      <button
                        onClick={() => setRegStep(2)}
                        disabled={loading}
                        className="py-3 px-6 border border-gray-200 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-1"
                      >
                        <ChevronLeft size={14} />
                        Voltar para Planos
                      </button>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </motion.div>
      
      <p className="mt-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">Conquista App SaaS - Plataforma de Vendas e Inteligência Comercial</p>
    </div>
  );
};

export default Login;
