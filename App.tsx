
// Firebase and Firestore integration enabled
import React, { useState, useEffect, useMemo } from 'react';
import { User, AccessLog } from './src/types';
import SaleForm from './components/SaleForm';
import Settings from './components/Settings';
import Customers from './components/Customers';
import InstallPrompt from './components/InstallPrompt';
import OpportunityForm from './components/OpportunityForm';
import OpportunityEditForm from './components/OpportunityEditForm';
import Login from './components/Login';
import { NavItem, Sale, Targets, WeeklyPerformance, DashboardStats, Customer, Opportunity } from './tipos';
import { PIPELINE_STAGES, MOCK_OPPORTUNITIES, NAVIGATION_ITEMS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './src/supabase';
import { 
  Plus, 
  Wrench, 
  Droplets, 
  Layers, 
  Layout, 
  Star, 
  ShieldCheck, 
  Zap, 
  Target,
  CloudLightning,
  Wifi,
  WifiOff,
  BarChart,
  Phone,
  MessageCircle,
  CheckSquare,
  Smartphone,
  X,
  RotateCcw,
  Database,
  Clock,
  Users,
  Home,
  Gem,
  DollarSign,
  Calendar,
  Edit2,
  Search
} from 'lucide-react';

import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const STORAGE_KEY = 'conquista_app_data_v1';
const TARGETS_KEY = 'conquista_app_targets_v1';
const CUSTOMERS_KEY = 'conquista_app_customers_v1';
const OPPORTUNITIES_KEY = 'conquista_app_opportunities_v1';

const DEFAULT_TARGETS: Targets = {
  product: 50000,
  assistance: 3000,
  waterproofing: 2000,
  productCommissionRate: 2.2,
  serviceBonuses: {
    montagem: 10,
    lavagem: 40,
    almofada: 10,
    pes_guarda_roupa: 7,
    impermeabilizacao_bonus: 40
  },
  levels: {
    1: { threshold: 100, rate: 0.6 },
    2: { threshold: 120, rate: 0.8 },
    3: { threshold: 140, rate: 1.1 }
  },
  bonusPorPedido: {
    ativo: false,
    valor: 5
  },
  metaAtivacao: {
    product: true,
    assistance: true,
    waterproofing: true
  },
  premiacaoExtra: {
    metaValor: 20000,
    valorPremio: 100,
    ativo: false,
    dataInicio: '',
    dataFim: ''
  }
};

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavItem>(NavItem.Resumos);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [savedSales, setSavedSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading saved sales:", e);
      return [];
    }
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading customers:", e);
      return [];
    }
  });
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem(OPPORTUNITIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading opportunities:", e);
      return [];
    }
  });
  const [isAddingOpportunity, setIsAddingOpportunity] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [reportPeriod, setReportPeriod] = useState<number>(30); // Dias
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  });
  const [isEditingSaleDate, setIsEditingSaleDate] = useState(false);
  const [tempSaleDate, setTempSaleDate] = useState<string>('');
  const [searchOrderNumber, setSearchOrderNumber] = useState<string>('');

  // Auto-view sale when searchOrderNumber matches exactly
  useEffect(() => {
    const trimmed = searchOrderNumber.trim();
    if (trimmed) {
      const found = savedSales.find(s => s.numeroPedido && String(s.numeroPedido).trim() === trimmed);
      if (found) {
        setSelectedSale(found);
      }
    }
  }, [searchOrderNumber, savedSales]);

  const [targets, setTargets] = useState<Targets>(() => {
    try {
      const saved = localStorage.getItem(TARGETS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TARGETS;
    } catch (e) {
      console.error("Error loading targets:", e);
      return DEFAULT_TARGETS;
    }
  });

  const logAccess = async (currentUser: User) => {
    if (!supabase || currentUser.id === 'anon-default') return;
    
    const log: Omit<AccessLog, 'id'> = {
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      store: currentUser.store,
      timestamp: new Date().toISOString(),
      action: 'access'
    };

    try {
      await supabase.from('access_logs').insert([log]);
      // Atualizar lastLogin do usuário
      await supabase.from('users').update({ lastLogin: log.timestamp }).eq('id', currentUser.id);
    } catch (err) {
      console.warn("Erro ao registrar acesso:", err);
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingVendedorId, setViewingVendedorId] = useState<string | null>(null);
  const [vendedores, setVendedores] = useState<User[]>([]);
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'gerente';

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));
    logAccess(loggedUser);
  };

  const addOpportunity = async (oppData: Omit<Opportunity, 'id' | 'daysAgo' | 'user' | 'tags'>) => {
    console.log("Adicionando nova oportunidade:", oppData);
    try {
      const newOpp: Opportunity = {
        ...oppData,
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vendedorId: user?.id || 'unknown',
        daysAgo: 0,
        user: { name: user?.firstName || 'Admin', avatar: user?.photoUrl || 'https://picsum.photos/seed/u1/40/40' },
        tags: []
      };

      // Atualizar estado local imediatamente
      setOpportunities(prev => {
        const updated = [newOpp, ...(Array.isArray(prev) ? prev : [])];
        localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(updated));
        return updated;
      });
      setIsAddingOpportunity(false);

      // Sincronizar com Supabase
      console.log("Sincronizando oportunidade com Supabase...");
      const { error } = await supabase.from('opportunities').insert([newOpp]);
      if (error) {
        console.error("Erro detalhado do Supabase ao inserir oportunidade:", error);
        throw error;
      }
      console.log("Oportunidade sincronizada com sucesso!");
    } catch (error) {
      console.error("Erro geral ao adicionar oportunidade:", error);
      alert("Erro ao salvar card. Verifique sua conexão.");
    }
  };

  const saveOpportunity = async (updatedOpp: Opportunity) => {
    // Atualizar estado local imediatamente
    setOpportunities(prev => {
      const updated = prev.map(opp => opp.id === updatedOpp.id ? updatedOpp : opp);
      localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(updated));
      return updated;
    });
    setEditingOpportunity(null);

    // Sincronizar com Supabase
    try {
      const { id, ...data } = updatedOpp;
      const { error } = await supabase.from('opportunities').update(data).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao atualizar oportunidade no Supabase:", error);
    }
  };

  const handleNavSelect = (navItem: NavItem) => {
    setActiveNav(navItem);
  };

  useEffect(() => {
    const handleAuthCheck = async () => {
      try {
        // 1. Check for URL token login (direct link sent via WhatsApp)
        const urlParams = new URLSearchParams(window.location.search);
        const accessKey = urlParams.get('key') || urlParams.get('token');
        
        if (accessKey) {
          setLoading(true);
          const { data: matchedUser, error: tokenError } = await supabase
            .from('users')
            .eq('accessToken', accessKey)
            .maybeSingle() as any;
            
          if (tokenError) {
            console.error("Erro ao autenticar com token:", tokenError);
          }
          
          if (matchedUser) {
            if (matchedUser.status === 'bloqueado') {
              setUser(matchedUser);
              localStorage.setItem('currentUser', JSON.stringify(matchedUser));
            } else {
              const updatedUser = {
                ...matchedUser,
                lastLogin: new Date().toISOString()
              };
              await supabase.from('users').update({ lastLogin: updatedUser.lastLogin }).eq('id', matchedUser.id);
              setUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              logAccess(updatedUser);
            }
            // Clear URL params to keep it clean
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
            return;
          } else {
            alert("Link de acesso inválido ou expirado.");
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        // 2. Fallback to localStorage session
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          let parsedUser: User | null = null;
          try {
            parsedUser = JSON.parse(storedUser);
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
          
          if (parsedUser && parsedUser.id) {
            // Refresh user status from DB to capture admin blocks / role changes instantly
            const { data: latestUser } = await supabase.from('users').eq('id', parsedUser.id).maybeSingle() as any;
            if (latestUser) {
              setUser(latestUser);
              localStorage.setItem('currentUser', JSON.stringify(latestUser));
              if (latestUser.status !== 'bloqueado') {
                logAccess(latestUser);
              }
            } else {
              setUser(parsedUser);
              logAccess(parsedUser);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Erro na verificação de autenticação:", err);
      } finally {
        setLoading(false);
      }
    };
    
    handleAuthCheck();
  }, []);
  
  // Monitorar conexão e PWA
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Sincronizar vendas pendentes
      const pending = JSON.parse(localStorage.getItem('pending_sales') || '[]');
      if (pending.length > 0) {
        for (const sale of pending) {
          try {
            const { error } = await supabase.from('sales').insert([sale]);
            if (error) throw error;
            // Atualizar estatísticas do cliente se vinculado
            if (sale.clienteId) {
              const customer = customers.find(c => c.id === sale.clienteId);
              if (customer) {
                await supabase.from('customers').update({
                  totalComprado: (customer.totalComprado || 0) + sale.total,
                  pedidosCount: (customer.pedidosCount || 0) + 1
                }).eq('id', sale.clienteId);
              }
            }
          } catch (error) {
            console.error("Erro ao sincronizar venda pendente:", error);
            continue;
          }
        }
        localStorage.removeItem('pending_sales');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setIsOnline(false));

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });

    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });
    
    // Carregar dados do Supabase com mais robustez
    const loadData = async () => {
      if (!user) return;

      // Se for admin, buscar lista de vendedores
      if (isAdmin) {
        try {
          const { data: vendedoresData } = await supabase.from('users').select('*');
          if (vendedoresData) setVendedores(vendedoresData as User[]);
        } catch (err) {
          console.warn("Erro ao buscar vendedores:", err);
        }
      }

      // Carregar do localStorage primeiro para rapidez
      const localOpps = localStorage.getItem(OPPORTUNITIES_KEY);
      if (localOpps) setOpportunities(JSON.parse(localOpps));

      if (!supabase) return;
      
      console.log("Buscando dados no Supabase...");
      try {
        let query = supabase.from('sales').select('*');
        
        // Se não for admin, filtra apenas as próprias vendas
        if (!isAdmin) {
          query = query.eq('vendedorId', user.id);
        } else if (viewingVendedorId) {
          query = query.eq('vendedorId', viewingVendedorId);
        }

        const { data: salesData, error: salesError } = await query;
        if (salesError) throw salesError;
        
        console.log("Vendas carregadas:", salesData);
        if (salesData) {
          setSavedSales(salesData as Sale[]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(salesData));
        }
      } catch (err) {
        console.warn("Erro ao buscar vendas:", err);
      }

      try {
        // Metas agora podem ser individuais ou globais. Vamos tentar buscar por vendedorId primeiro.
        let targetsQuery = supabase.from('settings').select('*').eq('id', `targets_${user.id}`).single();
        let { data: targetsData } = await targetsQuery;

        if (!targetsData) {
          // Se não tiver individual, tenta a global
          const { data: globalTargets } = await supabase.from('settings').select('*').eq('id', 'targets').single();
          targetsData = globalTargets;
        }

        if (targetsData) {
          const mergedTargets: Targets = {
            ...DEFAULT_TARGETS,
            ...targetsData,
            metaAtivacao: { ...DEFAULT_TARGETS.metaAtivacao, ...(targetsData.metaAtivacao || {}) },
            premiacaoExtra: { ...DEFAULT_TARGETS.premiacaoExtra, ...(targetsData.premiacaoExtra || {}) },
            serviceBonuses: { ...DEFAULT_TARGETS.serviceBonuses, ...(targetsData.serviceBonuses || {}) },
            levels: { ...DEFAULT_TARGETS.levels, ...(targetsData.levels || {}) },
            bonusPorPedido: { ...DEFAULT_TARGETS.bonusPorPedido, ...(targetsData.bonusPorPedido || { ativo: false, valor: 5 }) }
          };
          setTargets(mergedTargets);
          localStorage.setItem(TARGETS_KEY, JSON.stringify(mergedTargets));
        }
      } catch (err) {
        console.warn("Erro ao buscar metas:", err);
      }

      try {
        let query = supabase.from('customers').select('*');
        if (!isAdmin) {
          query = query.eq('vendedorId', user.id);
        } else if (viewingVendedorId) {
          query = query.eq('vendedorId', viewingVendedorId);
        }

        const { data: customersData } = await query;
        if (customersData) {
          setCustomers(customersData as Customer[]);
          localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customersData));
        }
      } catch (err) {
        console.warn("Erro ao buscar clientes:", err);
      }
      
      try {
        console.log("Buscando oportunidades no Supabase...");
        let query = supabase.from('opportunities').select('*');
        if (!isAdmin) {
          query = query.eq('vendedorId', user.id);
        } else if (viewingVendedorId) {
          query = query.eq('vendedorId', viewingVendedorId);
        }

        const { data: oppsData, error: oppsError } = await query;
        if (oppsError) throw oppsError;
        
        if (oppsData) {
          console.log("Oportunidades brutas do DB:", oppsData);
          const mappedOpps = oppsData.map((o: any) => {
            const vId = o.vendedorId || o.vendedor_id || o.vendedorid || 'unknown';
            const pInt = o.productInterest || o.product_interest || o.interesse || '';
            const rDate = o.returnDate || o.return_date || o.data_retorno || '';
            const title = o.title || o.titulo || o.nome || 'Sem título';
            const stage = o.stage || o.estagio || 'lead';
            
            return {
              ...o,
              id: o.id || o.uuid || `db-${Math.random()}`,
              title,
              stage,
              productInterest: pInt,
              returnDate: rDate,
              vendedorId: vId,
              value: Number(o.value || o.valor || 0),
              user: typeof o.user === 'string' ? JSON.parse(o.user) : (o.user || { name: user.firstName, avatar: user.photoUrl || 'https://picsum.photos/seed/u1/40/40' }),
              tags: Array.isArray(o.tags) ? o.tags : (typeof o.tags === 'string' ? JSON.parse(o.tags) : [])
            };
          });
          
          console.log("Oportunidades mapeadas finais:", mappedOpps);
          if (mappedOpps.length > 0 || (localOpps && JSON.parse(localOpps).length === 0)) {
            setOpportunities(mappedOpps as Opportunity[]);
            localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(mappedOpps));
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar oportunidades:", err);
      }
    };

    if (user) {
      loadData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [user, viewingVendedorId, isAdmin]);

  const filteredSales = useMemo(() => {
    return savedSales.filter(sale => sale.status !== 'cancelado');
  }, [savedSales]);

  const filteredOpportunities = useMemo(() => {
    return opportunities;
  }, [opportunities]);

  const saveTargets = async (newTargets: Targets) => {
    try {
      console.log("Saving targets:", newTargets);
      const targetId = (user && user.id !== 'user-default') ? `targets_${user.id}` : 'targets';
      
      console.log("Upserting with targetId:", targetId);
      
      // Salva no Supabase (Online)
      const { data, error } = await supabase.from('settings').upsert({ id: targetId, ...newTargets });
      if (error) {
        console.error("Supabase error detail:", error);
        throw error;
      }
      
      console.log("Upsert success. Returned data:", data);

      // Salva no localStorage (Offline)
      localStorage.setItem(TARGETS_KEY, JSON.stringify(newTargets));
      
      setTargets(newTargets);
      setActiveNav(NavItem.Resumos);
      console.log("Targets saved successfully to", targetId);
    } catch (error) {
      console.error("Error saving targets:", error);
      // Mesmo com erro no Firebase, salva no localStorage para garantir offline
      localStorage.setItem(TARGETS_KEY, JSON.stringify(newTargets));
      setTargets(newTargets);
      setActiveNav(NavItem.Resumos);
      alert("Erro ao salvar metas online: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const cancelSale = async (sale: Sale) => {
    // Se for um pedido pendente (sem ID), remove do localStorage
    if (!sale.id) {
      const pending = JSON.parse(localStorage.getItem('pending_sales') || '[]');
      const updatedPending = pending.filter((s: Sale) => s.numeroPedido !== sale.numeroPedido);
      localStorage.setItem('pending_sales', JSON.stringify(updatedPending));
      setSavedSales(prev => prev.filter(s => s.numeroPedido !== sale.numeroPedido));
      return;
    }

    try {
      const { error } = await supabase.from('sales').update({ status: 'cancelado' }).eq('id', sale.id);
      if (error) throw error;
      // Atualizar estado local
      setSavedSales(prev => prev.map(s => s.id === sale.id ? { ...s, status: 'cancelado' } : s));
      // Atualizar localStorage
      const updatedSales = savedSales.map(s => s.id === sale.id ? { ...s, status: 'cancelado' } : s);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
    }
  };

  const deleteSale = async (sale: Sale) => {
    if (!sale.id) {
      const pending = JSON.parse(localStorage.getItem('pending_sales') || '[]');
      const updatedPending = pending.filter((s: Sale) => s.numeroPedido !== sale.numeroPedido);
      localStorage.setItem('pending_sales', JSON.stringify(updatedPending));
      setSavedSales(prev => prev.filter(s => s.numeroPedido !== sale.numeroPedido));
      setSaleToDelete(null);
      return;
    }

    try {
      const { error } = await supabase.from('sales').delete().eq('id', sale.id);
      if (error) throw error;
      setSavedSales(prev => prev.filter(s => s.id !== sale.id));
      const updatedSales = savedSales.filter(s => s.id !== sale.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));
      setSaleToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir venda:", error);
    }
  };

  useEffect(() => {
    if (selectedSale) {
      if (selectedSale.timestamp) {
        setTempSaleDate(new Date(selectedSale.timestamp).toISOString().split('T')[0]);
      } else if (selectedSale.data) {
        const [day, month, year] = selectedSale.data.split('/');
        setTempSaleDate(`${year}-${month}-${day}`);
      } else {
        setTempSaleDate('');
      }
      setIsEditingSaleDate(false);
    }
  }, [selectedSale]);

  const handleUpdateSaleDate = async () => {
    if (!selectedSale || !tempSaleDate) return;

    const [year, month, day] = tempSaleDate.split('-');
    const formattedData = `${day}/${month}/${year}`;
    const newTimestamp = new Date(tempSaleDate + 'T12:00:00').getTime();

    // 1. Atualizar localmente no state
    setSavedSales(prev => prev.map(s => 
      s.id === selectedSale.id || (s.numeroPedido === selectedSale.numeroPedido && s.timestamp === selectedSale.timestamp)
        ? { ...s, data: formattedData, timestamp: newTimestamp }
        : s
    ));

    // 2. Atualizar localmente no localStorage
    const currentSales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updatedSales = currentSales.map((s: Sale) => 
      s.id === selectedSale.id || (s.numeroPedido === selectedSale.numeroPedido && s.timestamp === selectedSale.timestamp)
        ? { ...s, data: formattedData, timestamp: newTimestamp }
        : s
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSales));

    // 3. Atualizar visualização do pedido selecionado
    setSelectedSale(prev => prev ? { ...prev, data: formattedData, timestamp: newTimestamp } : null);
    setIsEditingSaleDate(false);

    // 4. Sincronizar com o Supabase
    try {
      if (selectedSale.id) {
        const { error } = await supabase.from('sales').update({ data: formattedData, timestamp: newTimestamp }).eq('id', selectedSale.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sales').update({ data: formattedData, timestamp: newTimestamp }).eq('numeroPedido', selectedSale.numeroPedido);
        if (error) throw error;
      }
    } catch (err) {
      console.error("Erro ao sincronizar nova data com o Supabase:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    window.location.reload();
  };

  const saveSale = async (newSaleData: any) => {
    console.log("Iniciando salvamento offline-first...");
    
    // Valores padrão
    let dataFormatada = new Date().toLocaleDateString('pt-BR');
    let saleTimestamp = Date.now();

    if (newSaleData.customDate) {
      const [year, month, day] = newSaleData.customDate.split('-');
      dataFormatada = `${day}/${month}/${year}`;
      // Usar a data selecionada ao meio-dia local para evitar pulos de fuso horário
      saleTimestamp = new Date(newSaleData.customDate + 'T12:00:00').getTime();
    }

    const saleObj: Sale = {
      id: crypto.randomUUID(), // Gera um ID único localmente
      numeroPedido: newSaleData.pedido,
      vendedorId: user?.id || 'unknown',
      clienteId: newSaleData.clienteId,
      valorProduto: newSaleData.produto,
      valorAssistencia: newSaleData.assistencia,
      valorImpermeabilizacao: newSaleData.impermeabilizacao,
      total: newSaleData.total,
      bonusTotal: newSaleData.bonusTotal,
      comissaoProduto: newSaleData.comissaoProduto,
      servicosExtras: newSaleData.servicosExtras,
      data: dataFormatada,
      timestamp: saleTimestamp,
      status: 'ativo'
    };

    // 1. Salvar localmente IMEDIATAMENTE
    setSavedSales(prev => [saleObj, ...prev]);
    const currentSales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([saleObj, ...currentSales]));
    
    // 2. Redirecionar imediatamente
    setActiveNav(NavItem.ResumoPedido);

    // 3. Tentar sincronizar com Supabase
    try {
      console.log("Tentando sincronizar com Supabase...");
      const { error } = await supabase.from('sales').insert([saleObj]);
      if (error) throw error;
      console.log("Sincronizado com sucesso!");
    } catch (error) {
      console.warn("Erro ao sincronizar, salvando para depois:", error);
      // Salva na fila de pendentes para tentar novamente quando voltar online
      const pending = JSON.parse(localStorage.getItem('pending_sales') || '[]');
      localStorage.setItem('pending_sales', JSON.stringify([...pending, saleObj]));
    }
  };

  const formatBRL = (val: any) => {
    const num = typeof val === 'number' ? val : 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const stats = useMemo<DashboardStats>(() => {
    const activeSales = savedSales.filter(s => {
      if (s.status === 'cancelado') return false;
      if (!s.timestamp) return true;
      const saleDate = new Date(s.timestamp).toISOString().split('T')[0];
      const isAfterStart = startDate ? saleDate >= startDate : true;
      const isBeforeEnd = endDate ? saleDate <= endDate : true;
      return isAfterStart && isBeforeEnd;
    });
    const pTotal = activeSales.reduce((acc, s) => acc + s.valorProduto, 0);
    const aTotal = activeSales.reduce((acc, s) => acc + s.valorAssistencia, 0);
    const iTotal = activeSales.reduce((acc, s) => acc + s.valorImpermeabilizacao, 0);
    
    // Check activations
    const isPActive = targets.metaAtivacao?.product ?? true;
    const isAActive = targets.metaAtivacao?.assistance ?? true;
    const isIActive = targets.metaAtivacao?.waterproofing ?? true;

    const pPerc = isPActive && targets.product > 0 ? (pTotal / targets.product) : 0;
    const aPerc = isAActive && targets.assistance > 0 ? (aTotal / targets.assistance) : 0;
    const iPerc = isIActive && targets.waterproofing > 0 ? (iTotal / targets.waterproofing) : 0;

    let level = 0;
    // Check only levels based on active metas? The requirement said "ou deixa os 2 ou os 3".
    // I will assume if a meta is inactivated, it's ignored in the "all three" type logic.
    [3, 2, 1].forEach(lvlNum => {
      if (level > 0) return;
      const lNum = lvlNum as 1 | 2 | 3;
      const thresh = targets.levels[lNum].threshold / 100;
      
      let allMetActive = true;
      if (isPActive && pPerc < thresh) allMetActive = false;
      if (isAActive && aPerc < thresh) allMetActive = false;
      if (isIActive && iPerc < thresh) allMetActive = false;
      
      if (allMetActive) level = lNum;
    });

    // ... (rest of the logic, need to be careful with variables)
    const serviceCounts = { 'Montagem': 0, 'Lavagem': 0, 'Almofada': 0, 'Pés G-Roupa': 0, 'Impermeab.': 0 };
    activeSales.forEach(s => {
      if (s.servicosExtras && Array.isArray(s.servicosExtras)) {
        s.servicosExtras.forEach(ex => { 
          if (Object.prototype.hasOwnProperty.call(serviceCounts, ex)) {
            (serviceCounts as any)[ex]++; 
          }
        });
      }
    });

    const totalExtras = Object.keys(serviceCounts).reduce((acc, k) => {
        let val = 0;
        if (k === 'Montagem') val = targets.serviceBonuses.montagem;
        if (k === 'Lavagem') val = targets.serviceBonuses.lavagem;
        if (k === 'Almofada') val = targets.serviceBonuses.almofada;
        if (k === 'Pés G-Roupa') val = targets.serviceBonuses.pes_guarda_roupa;
        if (k === 'Impermeab.') val = targets.serviceBonuses.impermeabilizacao_bonus;
        return acc + ((serviceCounts as any)[k] * val);
    }, 0);
    
    // Bonus por pedido (Configurado)
    const bonusPorPedidoTotal = targets.bonusPorPedido?.ativo 
        ? (activeSales.length * (targets.bonusPorPedido?.valor || 5)) 
        : 0;

    // Premiação Semanal (Configurado)
    const fatGeral = pTotal + aTotal + iTotal;
    let premiacaoExtraTotal = 0;
    if (targets.premiacaoExtra?.ativo && targets.premiacaoExtra.dataInicio && targets.premiacaoExtra.dataFim) {
        const [yS, mS, dS] = targets.premiacaoExtra.dataInicio.split('-').map(Number);
        const [yE, mE, dE] = targets.premiacaoExtra.dataFim.split('-').map(Number);
        
        const start = new Date(yS, mS - 1, dS);
        const end = new Date(yE, mE - 1, dE);
        
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);

        const filteredSales = activeSales.filter(s => {
             const [d, m, y] = s.data.split('/').map(Number);
             const saleDate = new Date(y, m - 1, d);
             return saleDate >= start && saleDate <= end;
        });

        const fatGeralBonusPeriod = filteredSales.reduce((acc, s) => acc + s.valorProduto + s.valorAssistencia + s.valorImpermeabilizacao, 0);

        if (fatGeralBonusPeriod >= (targets.premiacaoExtra.metaValor || 0)) {
            premiacaoExtraTotal = targets.premiacaoExtra.valorPremio || 0;
        }
    }
    
    const comissaoProdBase = targets.productCommissionRate ?? 2.2;
    const pComissaoBase = pTotal * (comissaoProdBase / 100);
    
    // Regra da Garantia: Bater os três principais (ou os que estiverem ativos) dá 10%
    let allActiveMetasMet = true;
    if (isPActive && pPerc < 1) allActiveMetasMet = false;
    if (isAActive && aPerc < 1) allActiveMetasMet = false;
    if (isIActive && iPerc < 1) allActiveMetasMet = false;
    
    const taxaGarantia = allActiveMetasMet ? 0.10 : 0.05;
    const aComissao = aTotal * taxaGarantia;
    
    const accelBonus = (level > 0) ? pTotal * (targets.levels[level as 1|2|3].rate / 100) : 0;
    const finalBonusAcelerador = accelBonus;
    const bonusGarantiaExtra = (level >= 1) ? pTotal * 0.006 : 0;

    return {
      pTotal, aTotal, iTotal, pPerc, aPerc, iPerc, level, taxaGarantia, bateuOsTres: allActiveMetasMet,
      comissaoProdutos: pComissaoBase,
      comissaoAssistencia: aComissao,
      bonusGarantia: bonusGarantiaExtra,
      bonusServicos: totalExtras,
      bonusAcelerador: finalBonusAcelerador,
      bonusPorPedidoTotal,
      premiacaoExtraTotal,
      ganhosTotais: pComissaoBase + aComissao + totalExtras + finalBonusAcelerador + bonusGarantiaExtra + bonusPorPedidoTotal + premiacaoExtraTotal,
      faturamentoGeral: fatGeral,
      activeSalesCount: activeSales.length
    };
  }, [savedSales, targets, startDate, endDate]);

  const addCustomer = async (data: Omit<Customer, 'id' | 'dataCadastro' | 'totalComprado' | 'pedidosCount'>) => {
    const newCustomer: Omit<Customer, 'id'> = {
      ...data,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      totalComprado: 0,
      pedidosCount: 0
    };
    const { error } = await supabase.from('customers').insert([newCustomer]);
    if (error) console.error("Erro ao adicionar cliente:", error);
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error("Erro ao deletar cliente:", error);
  };

  const updateCustomer = async (updated: Customer) => {
    const { id, ...data } = updated;
    const { error } = await supabase.from('customers').update(data).eq('id', id);
    if (error) console.error("Erro ao atualizar cliente:", error);
  };

  const renderContent = () => {
    if (activeNav === NavItem.Resumos) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col items-center p-8 space-y-12 overflow-y-auto pb-32"
        >
          <div className="text-center space-y-4">
            {user && (
              <div className="bg-purple-50 px-6 py-3 rounded-full mb-6 inline-flex items-center gap-3 active:scale-95 transition-all">
                {user.photoUrl && (
                  <img src={user.photoUrl} alt="Foto" className="w-8 h-8 rounded-full object-cover" />
                )}
                <p className="text-purple-800 font-black uppercase text-[10px] tracking-[0.2em]">
                  {user.role === 'admin' ? 'Admin' : 'Vendedor'} {user.firstName}
                </p>
              </div>
            )}
            <div className="w-24 h-24 bg-purple-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-purple-500/40 animate-bounce duration-[3000ms]">
              <ShieldCheck size={48} />
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Conquista <span className="text-purple-600">App</span></h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em]">Ecossistema de Alta Performance</p>
          </div>

          <div className="w-full max-w-6xl space-y-12">
            {/* Atalhos Rápidos com Nomes (Botões Grandes) - AGORA EM PRIMEIRO */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] text-center">Menu Principal</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {NAVIGATION_ITEMS.filter(item => item.id !== NavItem.Resumos).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className="mechanical-btn bg-white p-8 rounded-[2.5rem] border border-gray-100 flex flex-col items-center text-center space-y-4 group"
                  >
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                      {item.icon}
                    </div>
                    <span className="text-[12px] font-black text-gray-800 uppercase tracking-widest leading-tight">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumo de Relatório (Faturamento e Ganhos) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Venda de Produtos</span>
                  <div className="text-4xl font-black text-purple-600 leading-none">{formatBRL(stats.pTotal)}</div>
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block mt-1">Válido p/ Meta do Vendedor</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                   <div className="flex justify-between text-[10px] font-bold text-gray-500">
                      <span>Assistência:</span>
                      <span className="text-gray-800 font-semibold">{formatBRL(stats.aTotal)}</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-bold text-gray-500">
                      <span>Impermeabilização:</span>
                      <span className="text-gray-800 font-semibold">{formatBRL(stats.iTotal)}</span>
                   </div>
                   <div className="flex justify-between text-xs font-black text-gray-900 pt-1.5 border-t border-dashed border-gray-200">
                      <span>Faturamento Geral (Total):</span>
                      <span className="text-purple-600 font-black">{formatBRL(stats.faturamentoGeral)}</span>
                   </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-xl shadow-emerald-200/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Seus Ganhos Totais</span>
                  <div className="text-4xl font-black text-emerald-600 leading-none">{formatBRL(stats.ganhosTotais)}</div>
                  {stats.level > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mt-2.5 border border-purple-200">
                      <Zap size={10} className="fill-purple-600 text-purple-600 animate-pulse" />
                      Acelerador Nível {stats.level} Ativo! (+{targets.levels[stats.level as 1|2|3]?.rate}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mt-2.5 border border-gray-200">
                      Sem Acelerador Ativo
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-100/50 space-y-1.5">
                   <div className="flex justify-between text-[9px] font-bold text-emerald-800">
                      <span>Comissão de Produtos ({targets.productCommissionRate ?? 2.2}%):</span>
                      <span className="font-extrabold">{formatBRL(stats.comissaoProdutos)}</span>
                   </div>
                   <div className="flex justify-between text-[9px] font-bold text-emerald-800">
                      <span>Comissão de Assistência ({(stats.taxaGarantia * 100).toFixed(0)}%):</span>
                      <span className="font-extrabold">{formatBRL(stats.comissaoAssistencia)}</span>
                   </div>
                   {stats.bonusAcelerador > 0 && (
                     <div className="flex justify-between text-[9px] font-black text-purple-700 bg-purple-100/60 p-1.5 rounded-xl border border-purple-200/50">
                        <span className="flex items-center gap-1">
                          <Zap size={10} className="fill-purple-600 text-purple-600" />
                          Acelerador Lvl {stats.level} (+{targets.levels[stats.level as 1|2|3]?.rate}%):
                        </span>
                        <span>{formatBRL(stats.bonusAcelerador)}</span>
                     </div>
                   )}
                   {stats.bonusGarantia > 0 && (
                     <div className="flex justify-between text-[9px] font-black text-indigo-700 bg-indigo-100/60 p-1.5 rounded-xl border border-indigo-200/50">
                        <span>Bônus Garantia Extra (0.6%):</span>
                        <span>{formatBRL(stats.bonusGarantia)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-[9px] font-bold text-emerald-800">
                      <span>Bônus Serviços Extras:</span>
                      <span className="font-extrabold">{formatBRL(stats.bonusServicos)}</span>
                   </div>
                   {stats.bonusPorPedidoTotal > 0 && (
                     <div className="flex justify-between text-[9px] font-bold text-emerald-800">
                        <span>Bônus Fixo por Pedido:</span>
                        <span className="font-extrabold">{formatBRL(stats.bonusPorPedidoTotal)}</span>
                     </div>
                   )}
                   {stats.premiacaoExtraTotal > 0 && (
                     <div className="flex justify-between text-[9px] font-bold text-emerald-800">
                        <span>Premiação Semanal:</span>
                        <span className="font-extrabold">{formatBRL(stats.premiacaoExtraTotal)}</span>
                     </div>
                   )}
                </div>
              </div>

              <div className="bg-purple-50 p-8 rounded-[3rem] border border-purple-100 shadow-xl shadow-purple-200/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block mb-2">Pedidos Ativos</span>
                  <div className="text-4xl font-black text-purple-600">{stats.activeSalesCount ?? 0}</div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-purple-600">
                  <BarChart size={12} />
                  <span>Histórico de Atividade</span>
                </div>
              </div>
            </div>

            {/* Progresso de Metas */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-gray-800 uppercase italic tracking-tighter">Progresso das Metas</h3>
                <Target size={20} className="text-purple-600" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'Venda de Produtos (Meta)', current: stats.pPerc, color: 'bg-purple-600' },
                  { label: 'Assistência', current: stats.aPerc, color: 'bg-emerald-500' },
                  { label: 'Impermeab.', current: stats.iPerc, color: 'bg-indigo-500' },
                ].map((cat) => (
                  <div key={cat.label} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">{cat.label}</span>
                      <span className="text-gray-900">{(cat.current * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(cat.current * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${cat.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Card de Indicações */}
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                    <Users size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">Indicações</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Total de Leads por Indicação</p>
                </div>
                <div className="mt-8">
                  <div className="text-5xl font-black text-emerald-600">
                    {filteredOpportunities.filter(o => o.type === 'Indicação').length}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Cards Ativos</p>
                </div>
              </div>

              {/* Tarefas de Hoje */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Tarefas de Hoje</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Retornos agendados para este período</p>
                  </div>
                  {filteredOpportunities.filter(o => o.returnDate === new Date().toISOString().split('T')[0] && o.stage !== 'fechamento' && o.stage !== 'perdido').length > 0 && (
                    <div className="bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100 flex flex-col items-center md:items-end">
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em] italic">Potencial Total Hoje</span>
                      <span className="text-xl font-black text-purple-600 leading-none mt-1">
                        {formatBRL(filteredOpportunities
                          .filter(o => o.returnDate === new Date().toISOString().split('T')[0] && o.stage !== 'fechamento' && o.stage !== 'perdido')
                          .reduce((acc, o) => acc + o.value, 0))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOpportunities
                    .filter(o => o.returnDate === new Date().toISOString().split('T')[0] && o.stage !== 'fechamento' && o.stage !== 'perdido')
                    .map(o => (
                      <div key={o.id} className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 flex flex-col gap-4 hover:border-purple-200 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                              <Users size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-gray-800 uppercase text-[11px] leading-none truncate max-w-[120px]">{o.title}</p>
                              <span className="text-[7px] font-black text-purple-400 uppercase tracking-widest mt-1 block">Cliente em Potencial</span>
                            </div>
                          </div>
                          <span className="text-[7px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100 uppercase whitespace-nowrap">Retorno</span>
                        </div>
                        
                        <div className="bg-white rounded-2xl p-3 flex items-center justify-between border border-gray-100 shadow-sm">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-[7px] text-gray-400 uppercase font-black mb-0.5 tracking-tighter">Interesse</p>
                            <p className="text-[10px] text-gray-600 font-bold uppercase truncate">{o.productInterest}</p>
                          </div>
                          <div className="text-right border-l border-gray-50 pl-3">
                            <p className="text-[7px] text-gray-400 uppercase font-black mb-0.5 tracking-tighter">Valor</p>
                            <p className="text-xs font-black text-purple-600 leading-none">{formatBRL(o.value)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {o.phone && (
                            <a 
                              href={`https://wa.me/55${o.phone.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-[9px] font-black uppercase tracking-widest"
                            >
                              <MessageCircle size={16} />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  
                  {filteredOpportunities.filter(o => o.returnDate === new Date().toISOString().split('T')[0] && o.stage !== 'fechamento' && o.stage !== 'perdido').length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
                        <CheckSquare size={32} />
                      </div>
                      <p className="text-sm text-gray-400 font-bold italic uppercase tracking-widest">Nenhuma tarefa de retorno para hoje.</p>
                      <p className="text-[10px] text-gray-300 font-medium mt-1 uppercase">Tudo em dia por aqui!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-gray-100 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sistema Operacional Conquista v1.0</span>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeNav === NavItem.Processos) {
      return (
        <div className="flex flex-col h-full space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Fluxo de Vendas</h2>
              <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Gestão de Leads & Pipeline</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
              <button 
                onClick={() => setIsAddingOpportunity(true)}
                className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20 text-white hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Novo Card</span>
              </button>
            </div>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 h-full min-h-[600px]">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <h3 className="font-semibold text-gray-700 uppercase text-xs tracking-wider">{stage.label}</h3>
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {filteredOpportunities.filter(o => o.stage === stage.id).length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 space-y-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider italic">Vendas</span>
                    <span className="text-xs font-black text-gray-900">
                      {formatBRL(filteredOpportunities.filter(o => o.stage === stage.id).reduce((acc, o) => acc + o.value, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider italic">Comissões</span>
                    <span className="text-xs font-black text-purple-600">
                      {formatBRL(filteredOpportunities.filter(o => o.stage === stage.id).reduce((acc, o) => acc + (o.value * 0.022), 0))}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 bg-gray-100/50 rounded-xl p-3 space-y-3 border border-gray-200/50">
                  {filteredOpportunities.filter(o => o.stage === stage.id).map((opp) => {
                    const commission = opp.value * 0.022;
                    const isGolden = opp.value >= 5000;
                    
                    return (
                    <motion.div 
                      key={opp.id}
                      layoutId={opp.id}
                      onClick={() => setEditingOpportunity(opp)}
                      className={`bg-white p-4 rounded-xl shadow-sm border ${isGolden ? 'border-amber-200' : 'border-gray-200'} hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden`}
                    >
                      {isGolden && (
                        <div className="absolute top-0 right-0 bg-amber-400 text-white p-1 rounded-bl-lg shadow-sm z-10">
                          <Gem size={10} />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-purple-600 uppercase bg-purple-50 px-2 py-0.5 rounded">{opp.type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{opp.daysAgo}d</span>
                          <select 
                            className="text-[10px] bg-purple-50 text-purple-700 font-bold rounded-lg px-2 py-1 outline-none border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                            value={opp.stage}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newStage = e.target.value;
                              const updatedOpp = { ...opp, stage: newStage };
                              saveOpportunity(updatedOpp);
                            }}
                          >
                            {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">{opp.title}</h4>
                      <p className="text-[10px] text-gray-500 mb-2 font-bold">{opp.productInterest}</p>
                      
                      {isGolden && (
                        <div className="mb-2">
                          <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Oportunidade de Ouro</span>
                        </div>
                      )}

                      <div className="bg-purple-50/50 rounded-xl p-2 mb-3 border border-purple-100/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <DollarSign size={10} className="text-purple-600" />
                            <span className="text-[9px] font-black text-purple-600 uppercase tracking-tighter">Ganho Estimado</span>
                          </div>
                          <span className="text-[10px] font-black text-purple-700">{formatBRL(commission)}</span>
                        </div>
                      </div>

                      {opp.phone && (
                        <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-600">{opp.phone}</span>
                          <a 
                            href={`https://wa.me/55${opp.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-500 hover:text-emerald-700 transition-colors"
                          >
                            <MessageCircle size={16} />
                          </a>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold text-gray-900">{formatBRL(opp.value)}</div>
                        <img src={opp.user.avatar} className="w-6 h-6 rounded-full border border-gray-200" alt={opp.user.name} referrerPolicy="no-referrer" />
                      </div>
                    </motion.div>
                  );})}
                  <button 
                    onClick={() => setIsAddingOpportunity(true)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Plus size={16} /> Novo Card
                  </button>
                </div>
              </div>
            ))}
          </div>
          {isAddingOpportunity && <OpportunityForm onCancel={() => setIsAddingOpportunity(false)} onSubmit={addOpportunity} />}
          {editingOpportunity && <OpportunityEditForm opportunity={editingOpportunity} onCancel={() => setEditingOpportunity(null)} onSave={saveOpportunity} />}
        </div>
      );
    }

    if (activeNav === NavItem.AdicionarVenda) return <SaleForm onCancel={() => setActiveNav(NavItem.Resumos)} onSubmit={saveSale} customers={customers} targets={targets} stats={stats} />;
    if (activeNav === NavItem.Clientes) return (
      <Customers 
        customers={customers} 
        onAdd={addCustomer} 
        onDelete={deleteCustomer} 
        onUpdate={updateCustomer} 
        onBack={() => setActiveNav(NavItem.Resumos)}
      />
    );
    if (activeNav === NavItem.Configuracoes) return (
      <Settings 
        targets={targets} 
        onSave={saveTargets} 
        onClose={() => setActiveNav(NavItem.Resumos)} 
        showInstallBtn={showInstallBtn}
        onInstall={handleInstallApp}
        onLogout={handleLogout}
        user={user}
      />
    );

    if (activeNav === NavItem.Meta) {
      const data = [
        { name: 'Produtos', value: stats.pTotal, target: targets.product, fill: '#9333ea' },
        { name: 'Assistência', value: stats.aTotal, target: targets.assistance, fill: '#10b981' },
        { name: 'Impermeab.', value: stats.iTotal, target: targets.waterproofing, fill: '#6366f1' },
      ];

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 pb-20"
        >
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Minhas Metas</h2>
              <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Progresso em Tempo Real</span>
            </div>
            <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {data.map((item) => {
              const perc = item.target > 0 ? (item.value / item.target) * 100 : 0;
              return (
                <div key={item.name} className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
                  <div className="flex justify-between items-end gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">{item.name}</span>
                      <div className="text-xl md:text-2xl font-black text-gray-900 truncate">{formatBRL(item.value)}</div>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block truncate">Meta</span>
                      <div className="text-xs md:text-sm font-black text-gray-500 truncate">{formatBRL(item.target)}</div>
                    </div>
                  </div>
                  
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(perc, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute h-full rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-gray-900">{perc.toFixed(1)}%</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase truncate">Faltam {formatBRL(Math.max(0, item.target - item.value))}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-6 shadow-sm">
            <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.4em]">Status do Acelerador de Metas</h3>
            
            <div className="flex justify-center items-center gap-8">
              {[1, 2, 3].map(lvl => (
                <div key={lvl} className={`flex flex-col items-center gap-2 ${stats.level >= lvl ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${stats.level >= lvl ? 'border-purple-600 bg-purple-50 shadow-md shadow-purple-100' : 'border-gray-200 bg-gray-50'}`}>
                    <Zap size={20} className={stats.level >= lvl ? 'text-purple-600 fill-purple-600 animate-pulse' : 'text-gray-300'} />
                  </div>
                  <span className="text-[10px] font-black text-gray-800">Lvl {lvl}</span>
                  <span className="text-[8px] font-extrabold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{targets.levels[lvl as 1|2|3]?.rate}% Bônus</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6 text-left space-y-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Gatilhos e Regras do Acelerador</span>
              {[1, 2, 3].map(lvl => {
                const targetLvl = targets.levels[lvl as 1|2|3];
                const isMet = stats.level >= lvl;
                return (
                  <div key={lvl} className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all ${isMet ? 'bg-purple-50/50 border-purple-200' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-800 uppercase">Acelerador Nível {lvl}</span>
                        {isMet ? (
                          <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-purple-200">Atingido!</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-gray-200">Abaixo do Gatilho</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-1">
                        Requer alcançar no mínimo <strong className="text-gray-700 font-bold">{targetLvl.threshold}%</strong> de progresso em todas as metas ativas.
                      </p>
                    </div>
                    <div className="text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 flex md:flex-col justify-between items-center md:items-end gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase">Bônus s/ Vendas de Produtos</span>
                      <span className={`text-sm font-black ${isMet ? 'text-purple-600' : 'text-gray-500'}`}>
                        +{targetLvl.rate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {stats.pPerc >= 1 && stats.aPerc >= 1 && stats.iPerc >= 1 && (
              <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase border border-emerald-200 animate-pulse">
                Garantia Dobrada Ativa! Comissão de Assistência passa de 5% para 10%.
              </div>
            )}
            <p className="text-[10px] font-medium text-gray-500 max-w-[300px] mx-auto pt-2">
              {stats.level === 3 
                ? "Parabéns! Você atingiu o nível máximo de aceleração." 
                : `Dica: Atinga ${targets.levels[(stats.level + 1) as 1|2|3]?.threshold}% em todas as categorias para liberar o Nível ${stats.level + 1}.`}
            </p>
          </div>
        </motion.div>
      );
    }

    if (activeNav === NavItem.ResumoServico) {
      const totalAssistencia = stats.aTotal;
      const totalComissaoAssistencia = stats.comissaoAssistencia;

      const serviceData = [
        { name: 'Montagem', count: 0, bonus: targets.serviceBonuses.montagem, color: '#9333ea' },
        { name: 'Lavagem', count: 0, bonus: targets.serviceBonuses.lavagem, color: '#6366f1' },
        { name: 'Almofada', count: 0, bonus: targets.serviceBonuses.almofada, color: '#10b981' },
        { name: 'Pés G-Roupa', count: 0, bonus: targets.serviceBonuses.pes_guarda_roupa, color: '#f59e0b' },
        { name: 'Impermeab.', count: 0, bonus: targets.serviceBonuses.impermeabilizacao_bonus, color: '#ec4899' },
      ];

      if (targets.bonusPorPedido?.ativo) {
        serviceData.push({ name: 'Bônus por Pedido', count: 0, bonus: targets.bonusPorPedido.valor, color: '#0ea5e9' as any });
      }

      savedSales.forEach(s => {
        if (Array.isArray(s.servicosExtras)) {
          s.servicosExtras.forEach(ex => {
            const item = serviceData.find(d => d.name === ex);
            if (item) item.count++;
          });
        }
      });

      const totalServiceBonus = serviceData.reduce((acc, d) => acc + (d.count * d.bonus), 0) + totalComissaoAssistencia;

      return (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 pb-20"
        >
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Serviços</h2>
              <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Resumo de Extras & Garantia</span>
            </div>
            <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 flex flex-col items-center justify-center space-y-2 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ganhos Totais (Extras + Pedidos)</span>
            <div className="text-4xl font-black text-emerald-600">{formatBRL(totalServiceBonus + stats.bonusPorPedidoTotal + stats.premiacaoExtraTotal)}</div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Premiação Semanal - Placeholder for logic */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 border border-rose-100">
                    <Target size={18} className="text-rose-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">Premiação Semanal</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-rose-600">{formatBRL(stats.premiacaoExtraTotal)}</div>
                </div>
            </div>

            {serviceData.map((item) => (
              <div key={item.name} className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}20` }}>
                    <Wrench size={18} style={{ color: item.color }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">{item.name}</span>
                    <div className="text-[8px] font-bold text-gray-400 uppercase">{(item.count || 0)} Realizados</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-gray-900">{formatBRL((item.count || 0) * (item.bonus || 0))}</div>
                  <div className="text-[8px] font-bold text-emerald-600 uppercase">+{formatBRL(item.bonus || 0)}/un</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }

    if (activeNav === NavItem.Relatorios) {
      const filteredSales = savedSales.filter(s => {
        const saleDate = new Date(s.timestamp).toISOString().split('T')[0];
        const isAfterStart = startDate ? saleDate >= startDate : true;
        const isBeforeEnd = endDate ? saleDate <= endDate : true;
        return isAfterStart && isBeforeEnd;
      });

      const activeSales = filteredSales.filter(s => s.status !== 'cancelado');

      const periodStats = {
        total: stats.faturamentoGeral,
        bonus: stats.ganhosTotais,
        count: activeSales.length,
        products: stats.pTotal,
        assistance: stats.aTotal,
        water: stats.iTotal,
        comissaoProd: stats.comissaoProdutos,
        comissaoAssis: stats.comissaoAssistencia,
        bonusServ: stats.bonusServicos
      };

      const sharePeriodReport = () => {
        const text = `Relatório CRM - Período: ${startDate || 'Início'} a ${endDate || 'Hoje'}\n` +
          `Total de Pedidos Ativos: ${periodStats.count}\n` +
          `Venda Total: ${formatBRL(periodStats.total)}\n` +
          `Bônus Acumulado: ${formatBRL(periodStats.bonus)}\n` +
          `-------------------\n` +
          filteredSales.map(s => {
            const isCanceled = s.status === 'cancelado';
            const items = [];
            if (s.valorProduto > 0) items.push("Produto");
            if (s.valorAssistencia > 0) items.push("Assistência");
            if (s.valorImpermeabilizacao > 0) items.push("Impermeabilização");
            if (s.servicosExtras && s.servicosExtras.length > 0) items.push(...s.servicosExtras);
            
            return `Pedido #${s.numeroPedido}${isCanceled ? ' [CANCELADO]' : ''}: ${isCanceled ? 'R$ 0,00 (Cancelado)' : formatBRL(s.total)}\nItems: ${items.join(', ')}`;
          }).join('\n\n');

        if (navigator.share) {
          navigator.share({ title: `Relatório ${reportPeriod} dias`, text });
        } else {
          navigator.clipboard.writeText(text);
          alert('Relatório copiado para a área de transferência!');
        }
      };

      return (
        <div className="content-section py-2 px-2 space-y-6 animate-in slide-in-from-bottom-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
             <div>
                <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Relatórios</h2>
                <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Consolidado por Período</span>
             </div>
             <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
          </div>

          <div className="flex flex-col gap-2 pb-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data Início</label>
                <input 
                  type="date" 
                  value={startDate}
                  className="w-full bg-white border border-gray-200 p-3 rounded-xl text-[10px] font-bold text-gray-800 outline-none focus:border-purple-500"
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data Fim</label>
                <input 
                  type="date" 
                  value={endDate}
                  className="w-full bg-white border border-gray-200 p-3 rounded-xl text-[10px] font-bold text-gray-800 outline-none focus:border-purple-500"
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = String(now.getMonth() + 1).padStart(2, '0');
                  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
                  setStartDate(`${year}-${month}-01`);
                  setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
                }}
                className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all"
              >
                Mês Atual
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all"
              >
                Limpar Filtro (Ver Tudo)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
              <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Venda de Produtos (Meta)</span>
              <div className="text-sm font-black text-purple-600 text-center">{formatBRL(periodStats.products)}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
              <span className="text-[8px] font-black text-gray-400 uppercase mb-1">Faturamento Geral (Soma)</span>
              <div className="text-sm font-black text-gray-900 text-center">{formatBRL(periodStats.total)}</div>
            </div>
            <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center">
              <span className="text-[8px] font-black text-emerald-600 uppercase mb-1">Bônus Total</span>
              <div className="text-sm font-black text-emerald-600 text-center">{formatBRL(periodStats.bonus)}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Ganhos no Período</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Comissão Produtos</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.comissaoProd)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Comissão Garantia (Base)</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.comissaoAssis)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Bônus Serviços Fixos</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.bonusServ)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume de Vendas</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Total de Pedidos</span>
                <span className="text-gray-900 font-bold">{periodStats.count}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Produtos</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.products)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Assistência</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.assistance)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500 uppercase">Impermeabilização</span>
                <span className="text-gray-900 font-bold">{formatBRL(periodStats.water)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Relatório de Serviços</h4>
            <div className="space-y-3">
              {(() => {
                const services = filteredSales.flatMap(s => Array.isArray(s.servicosExtras) ? s.servicosExtras : []);
                const counts = services.reduce((acc: Record<string, number>, service) => {
                  acc[service] = (acc[service] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                
                const entries = Object.entries(counts);
                
                if (entries.length === 0) {
                  return <p className="text-[10px] text-gray-400 text-center">Nenhum serviço extra realizado.</p>;
                }
                
                return entries.map(([service, count]) => (
                  <div key={service} className="flex justify-between text-[11px]">
                    <span className="text-gray-500 uppercase">{service}</span>
                    <span className="text-gray-900 font-bold">{count}x</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <button 
            onClick={sharePeriodReport}
            className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
          >
            Compartilhar Relatório
          </button>
        </div>
      );
    }

    /*
    if (activeNav === NavItem.Retornos) {
      const retornosPendentes = savedSales.filter(s => s.dataRetorno && s.statusRetorno === 'pendente');
      
      return (
        <div className="content-section py-2 px-2 space-y-6 animate-in slide-in-from-bottom-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
             <div>
                <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Retornos</h2>
                <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Pendentes</span>
             </div>
          </div>

          <div className="space-y-3">
             {retornosPendentes.length === 0 ? (
               <div className="bg-white p-10 rounded-3xl text-center border border-gray-200 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum retorno pendente!</p>
               </div>
             ) : (
               retornosPendentes.map((sale, i) => (
                 <div key={i} className={`bg-white p-5 rounded-2xl border ${new Date(sale.dataRetorno!) <= new Date() ? 'border-red-200' : 'border-gray-200'} flex justify-between items-center shadow-sm`}>
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      className="flex flex-col text-left hover:opacity-70 transition-opacity"
                    >
                       <span className="text-[10px] font-black text-purple-600">#{sale.numeroPedido} - {new Date(sale.dataRetorno!).toLocaleDateString('pt-BR')}</span>
                       <span className="text-[10px] font-bold text-gray-600 mt-0.5">{sale.descricaoRetorno}</span>
                    </button>
                    <button 
                      onClick={async () => {
                        const handleFinalizeRetorno = async () => {
                          const { error } = await supabase.from('sales').update({ statusRetorno: 'finalizado' }).eq('id', sale.id);
                          if (error) console.error("Erro ao finalizar retorno:", error);
                        };
                        handleFinalizeRetorno();
                      }}
                      className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"
                    >
                      <CheckSquare size={16} />
                    </button>
                 </div>
               ))
             )}
          </div>
        </div>
      );
    }
    */

    if (activeNav === NavItem.ResumoPedido) {
      const filteredSalesByDate = savedSales.filter(s => {
        if (searchOrderNumber.trim()) {
          return s.numeroPedido?.toLowerCase().includes(searchOrderNumber.trim().toLowerCase());
        }
        if (!s.timestamp) return true;
        const saleDate = new Date(s.timestamp).toISOString().split('T')[0];
        const isAfterStart = startDate ? saleDate >= startDate : true;
        const isBeforeEnd = endDate ? saleDate <= endDate : true;
        return isAfterStart && isBeforeEnd;
      });

      const activeSalesInPeriod = filteredSalesByDate.filter(s => s.status !== 'cancelado');
      const totalPeriodo = activeSalesInPeriod.reduce((acc, s) => acc + s.total, 0);

      const shareAllSales = () => {
        if (filteredSalesByDate.length === 0) return;
        
        const activeSales = filteredSalesByDate.filter(s => s.status !== 'cancelado');
        const totalGeral = activeSales.reduce((acc, s) => acc + s.total, 0);
        
        let text = `📋 *RELATÓRIO DE PEDIDOS - CONQUISTA APP*\n`;
        text += `Período: ${startDate || 'Início'} a ${endDate || 'Hoje'}\n`;
        text += `Vendedor: ${user?.firstName || 'Vendedor'}\n`;
        text += `Total de Pedidos Ativos: ${activeSales.length}\n`;
        text += `Valor Total: ${formatBRL(totalGeral)}\n`;
        text += `----------------------------------\n\n`;
        
        filteredSalesByDate.forEach((s) => {
          const date = s.timestamp ? new Date(s.timestamp).toLocaleDateString('pt-BR') : '---';
          const isCancelled = s.status === 'cancelado';
          
          text += `*Pedido #${s.numeroPedido}* (${date})${isCancelled ? ' [CANCELADO]' : ''}\n`;
          text += `Valor: ${isCancelled ? 'R$ 0,00 (Cancelado)' : formatBRL(s.total)}\n`;
          if (s.clienteId) {
            const cliente = customers.find(c => c.id === s.clienteId);
            if (cliente) text += `Cliente: ${cliente.nome}\n`;
          }
          text += `----------------------------------\n`;
        });

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      };

      return (
        <div className="content-section py-2 px-2 space-y-6 animate-in slide-in-from-bottom-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
             <div>
                <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Histórico</h2>
                <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Todos os Pedidos</span>
             </div>
             <div className="flex gap-2">
               {filteredSalesByDate.length > 0 && (
                 <button 
                   onClick={shareAllSales}
                   className="bg-emerald-500 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                 >
                   <MessageCircle size={14} />
                   Enviar Tudo
                 </button>
               )}
               <button onClick={() => setActiveNav(NavItem.Resumos)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
             </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic block">Pesquisar por Pedido</span>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Digite o número do pedido..." 
                  value={searchOrderNumber}
                  className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-[10px] font-bold text-gray-800 outline-none focus:border-purple-500 pr-10"
                  onChange={(e) => setSearchOrderNumber(e.target.value)}
                />
                {searchOrderNumber && (
                  <button 
                    onClick={() => setSearchOrderNumber('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-[10px]"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic">Filtrar Período (Quando não pesquisando)</span>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Início</label>
                  <input 
                    type="date" 
                    value={startDate}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-[10px] font-bold text-gray-800 outline-none focus:border-purple-500"
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={!!searchOrderNumber}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fim</label>
                  <input 
                    type="date" 
                    value={endDate}
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-[10px] font-bold text-gray-800 outline-none focus:border-purple-500"
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={!!searchOrderNumber}
                  />
                </div>
              </div>
            </div>

            {filteredSalesByDate.length > 0 && (
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total no Período</span>
                  <span className="text-lg font-black text-emerald-600 leading-none mt-1">{formatBRL(totalPeriodo)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pedidos</span>
                  <span className="text-lg font-black text-gray-800 leading-none mt-1 block">{activeSalesInPeriod.length}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
             {filteredSalesByDate.length === 0 ? (
               <div className="bg-white p-10 rounded-3xl text-center border border-gray-200 shadow-sm">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum pedido neste período</p>
               </div>
             ) : (
               filteredSalesByDate.map((sale, i) => {
                 if (!sale) return null;
                 const saleDate = sale.timestamp ? new Date(sale.timestamp) : null;
                 const isValidDate = saleDate && !isNaN(saleDate.getTime());
                 return (
                   <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="flex flex-col text-left hover:opacity-70 transition-opacity"
                      >
                         <span className="text-[10px] font-black text-purple-600 underline decoration-purple-200 underline-offset-4">#{sale.numeroPedido || '---'}</span>
                         <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">
                           {isValidDate ? saleDate.toLocaleDateString('pt-BR') : '---'} {isValidDate ? saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                         </span>
                      </button>
                      <div className="flex flex-col items-end gap-1">
                         <div className="text-[11px] font-black text-emerald-600">{formatBRL(sale.total)}</div>
                         <div className="flex gap-2">
                           {sale.status === 'cancelado' ? (
                             <span className="text-[8px] font-black text-red-500 uppercase">Cancelado</span>
                           ) : (
                             <button 
                               onClick={() => cancelSale(sale)}
                               className="text-[8px] font-black text-red-500 uppercase underline"
                             >
                               Cancelar
                             </button>
                           )}
                           <button 
                             onClick={() => setSaleToDelete(sale)}
                             className="text-[8px] font-black text-gray-400 uppercase underline"
                           >
                             Excluir
                           </button>
                         </div>
                      </div>
                   </div>
                 );
               })
             )}
          </div>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="content-section py-2 px-2 space-y-6"
      >
        <div className="bg-white p-6 rounded-3xl border border-gray-200 flex items-center justify-between shadow-sm">
           <div>
              <h2 className="text-xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">V&C Hub</h2>
              <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Gestão de Vendas</span>
           </div>
           <button onClick={() => setActiveNav(NavItem.AdicionarVenda)} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-purple-500/20 active:scale-95 transition-all">Novo Pedido</button>
        </div>

        {/* Status de Conexão */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-fit text-[8px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
           {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
           {isOnline ? 'Sincronizado Cloud' : 'Modo Offline'}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic">Performance Semanal</span>
              <BarChart size={18} className="text-purple-600" />
           </div>
           
           <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <RechartsBarChart data={savedSales.slice(0, 7).reverse()}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                 <XAxis 
                   dataKey="data" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 900 }} 
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#9333ea', fontSize: '10px', fontWeight: 'bold' }}
                   labelStyle={{ color: '#64748b', fontSize: '8px', marginBottom: '4px' }}
                 />
                 <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                   {savedSales.slice(0, 7).reverse().map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 6 ? '#9333ea' : '#e2e8f0'} />
                   ))}
                 </Bar>
               </RechartsBarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic">Nível de Performance: {stats.level}</span>
              <CloudLightning size={18} className="text-purple-600 animate-pulse" />
           </div>
           <div className="space-y-6">
              {[
                { label: 'Venda Geral', current: stats.pPerc, color: 'bg-purple-600' },
                { label: 'Assistência', current: stats.aPerc, color: 'bg-emerald-500' },
                { label: 'Impermeab.', current: stats.iPerc, color: 'bg-indigo-500' },
              ].map((cat) => (
                <div key={cat.label} className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">{cat.label}</span>
                      <span className="text-gray-900">{(cat.current * 100).toFixed(1)}%</span>
                   </div>
                   <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(cat.current * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${cat.color} rounded-full`}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Faturamento</span>
              <div className="text-lg font-black text-gray-900">{formatBRL(stats.faturamentoGeral)}</div>
           </div>
           <button 
             onClick={() => setActiveNav(NavItem.Relatorios)}
             className="bg-purple-50 p-6 rounded-3xl border border-purple-100 text-left active:scale-95 transition-all group"
           >
              <span className="text-[8px] font-black text-purple-600 uppercase block mb-1">Ver Relatórios</span>
              <div className="text-lg font-black text-purple-600 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                Acessar <BarChart size={14} />
              </div>
           </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Detalhamento de Ganhos</h3>
              <div className="text-2xl font-black text-emerald-600">{formatBRL(stats.ganhosTotais)}</div>
           </div>
           
           <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <span className="text-[9px] font-bold text-gray-500 uppercase">Comissão Produtos (2.2%)</span>
                 <span className="text-[11px] font-black text-gray-900">{formatBRL(stats.comissaoProdutos)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <span className="text-[9px] font-bold text-gray-500 uppercase">Comissão Garantia</span>
                 <span className="text-[11px] font-black text-gray-900">{formatBRL(stats.comissaoAssistencia)}</span>
              </div>
              {stats.bonusGarantia > 0 && (
                <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                   <span className="text-[9px] font-bold text-emerald-600 uppercase">Bônus Garantia (Acelerador)</span>
                   <span className="text-[11px] font-black text-emerald-600">{formatBRL(stats.bonusGarantia)}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                 <span className="text-[9px] font-bold text-gray-500 uppercase">Bônus Serviços Fixos</span>
                 <span className="text-[11px] font-black text-gray-900">{formatBRL(stats.bonusServicos)}</span>
              </div>
              {stats.bonusAcelerador > 0 && (
                <div className="flex justify-between items-center p-4 rounded-2xl bg-purple-50 border border-purple-100">
                   <span className="text-[9px] font-bold text-purple-600 uppercase">Bônus Acelerador (Nível {stats.level})</span>
                   <span className="text-[11px] font-black text-purple-600">{formatBRL(stats.bonusAcelerador)}</span>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-3">
           <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Últimas Atividades</h3>
           {filteredSales.slice(0, 5).map((sale, i) => {
             if (!sale) return null;
             return (
               <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                  <button 
                    onClick={() => setSelectedSale(sale)}
                    className="flex flex-col text-left hover:opacity-70 transition-opacity"
                  >
                     <span className="text-[10px] font-black text-purple-600 underline decoration-purple-200 underline-offset-4">#{sale.numeroPedido || '---'}</span>
                     <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{sale.data || '---'}</span>
                  </button>
                  <div className="text-right">
                     <div className="text-[11px] font-black text-emerald-600">{formatBRL(sale.bonusTotal)}</div>
                     <div className="text-[8px] font-bold text-gray-400 uppercase">Bônus</div>
                  </div>
               </div>
             );
           })}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest animate-pulse">Carregando Conquista App...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user && user.status === 'bloqueado') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-red-100 p-10 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
            <Lock size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Acesso Suspenso</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Radar Conquista - Gestão</p>
          </div>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            Olá, <span className="font-bold text-gray-900">{user.firstName}</span>. Seu acesso ao sistema está temporariamente suspenso devido ao vencimento ou pendência da sua mensalidade.
          </p>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-[10px] font-black uppercase text-red-700 tracking-wider">
            Entre em contato com o administrador para regularizar seu cadastro.
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-gray-200 active:scale-95 transition-all"
          >
            Sair / Trocar de Conta
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col selection:bg-purple-500/30 overflow-hidden font-sans">
      <InstallPrompt />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          {/* Campo de Busca de Pedidos Rápido */}
          <div className="hidden sm:flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-[10px] w-36 md:w-64 max-w-xs transition-all focus-within:border-purple-500 focus-within:bg-white focus-within:shadow-sm">
             <Search size={14} className="text-gray-400 mr-2 shrink-0" />
             <input 
                type="text" 
                placeholder="Localizar Pedido..." 
                className="bg-transparent border-none outline-none text-gray-700 w-full font-bold placeholder-gray-400 text-[10px]"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
             />
             {searchOrderNumber && (
               <button 
                 onClick={() => setSearchOrderNumber('')} 
                 className="text-gray-400 hover:text-gray-600 ml-1 font-black shrink-0 text-sm"
               >
                 ×
               </button>
             )}
          </div>
           <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveNav(NavItem.Resumos)}>
             <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
               <Home size={18} />
             </div>
             <div className="flex flex-col">
               <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-none">CRM <span className="text-purple-600">V&C</span></h1>
               {isAdmin && (
                 <select 
                   value={viewingVendedorId || ''} 
                   onChange={(e) => setViewingVendedorId(e.target.value || null)}
                   className="text-[9px] font-black text-purple-600 uppercase tracking-widest bg-transparent border-none outline-none cursor-pointer mt-1"
                 >
                   <option value="">Visão Geral (Todos)</option>
                   {vendedores.map(v => (
                     <option key={v.id} value={v.id}>{v.firstName} {v.lastName} ({v.id})</option>
                   ))}
                 </select>
               )}
             </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></div>
                 {isOnline ? 'Online' : 'Offline'}
              </div>
              <button 
                onClick={() => setActiveNav(NavItem.Configuracoes)}
                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
              >
                <Wrench size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 overflow-hidden active:scale-90 transition-all">
                 <img 
                   src={user?.photoUrl || "https://picsum.photos/seed/vc/100/100"} 
                   alt="Avatar" 
                   className="w-full h-full object-cover"
                   referrerPolicy="no-referrer"
                 />
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {renderContent()}
        </main>

        {/* BOTÃO FLUTUANTE DIRETO */}
        <div className="fixed bottom-8 right-8 z-40">
           <button 
             onClick={() => setActiveNav(NavItem.AdicionarVenda)} 
             className="mechanical-btn w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white"
           >
              <Plus size={32} strokeWidth={2.5} />
           </button>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedSale(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 italic tracking-tighter uppercase">Pedido #{selectedSale.numeroPedido}</h3>
                  {isEditingSaleDate ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <input 
                        type="date"
                        value={tempSaleDate}
                        onChange={(e) => setTempSaleDate(e.target.value)}
                        className="bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-purple-500"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleUpdateSaleDate}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-purple-700 transition-all"
                        >
                          Salvar
                        </button>
                        <button 
                          onClick={() => setIsEditingSaleDate(false)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase border border-gray-200 hover:bg-gray-200 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">{selectedSale.data}</p>
                      <button 
                        onClick={() => {
                          setIsEditingSaleDate(true);
                          if (selectedSale.timestamp) {
                            setTempSaleDate(new Date(selectedSale.timestamp).toISOString().split('T')[0]);
                          } else {
                            const [day, month, year] = selectedSale.data.split('/');
                            setTempSaleDate(`${year}-${month}-${day}`);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600 rounded transition-all flex items-center justify-center"
                        title="Editar Data"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedSale(null)} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200">
                  Voltar
                </button>
              </div>

              <div className="space-y-4">
                  {(selectedSale.dataRetorno || selectedSale.descricaoRetorno) && (
                    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                      <span className="text-[8px] font-black text-purple-600 uppercase block mb-3">Informações de Retorno</span>
                      <div className="space-y-2">
                        {selectedSale.dataRetorno && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-purple-500 uppercase">Data</span>
                            <span className="text-purple-900 font-black">{new Date(selectedSale.dataRetorno).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {selectedSale.descricaoRetorno && (
                          <div className="text-[11px] text-purple-900 font-bold mt-2 pt-2 border-t border-purple-100">
                            {selectedSale.descricaoRetorno}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-3">Composição da Venda</span>
                  <div className="space-y-3">
                    {selectedSale.clienteId && (
                      <div className="flex justify-between text-[11px] border-b border-gray-100 pb-2 mb-2">
                        <span className="text-gray-500 uppercase">Cliente</span>
                        <span className="text-purple-600 font-black">{customers.find(c => c.id === selectedSale.clienteId)?.nome || 'Não encontrado'}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 uppercase">Produtos</span>
                      <span className="text-gray-900 font-bold">{formatBRL(selectedSale.valorProduto || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 uppercase">Assistência</span>
                      <span className="text-gray-900 font-bold">{formatBRL(selectedSale.valorAssistencia || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 uppercase">Impermeabilização</span>
                      <span className="text-gray-900 font-bold">{formatBRL(selectedSale.valorImpermeabilizacao || 0)}</span>
                    </div>
                  </div>
                </div>

                {Array.isArray(selectedSale.servicosExtras) && selectedSale.servicosExtras.length > 0 && (
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-3">Serviços Extras</span>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedSale.servicosExtras.map((serv, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-50 border border-purple-100 rounded-lg text-[9px] font-black text-purple-600 uppercase">
                          {serv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1">Ganhos</span>
                    <div className="text-xl font-black text-emerald-600">{formatBRL(selectedSale.bonusTotal)}</div>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Total Pedido</span>
                    <div className="text-xl font-black text-gray-900">{formatBRL(selectedSale.total)}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Detalhamento de Ganhos</span>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase">Comissão Produto (2.2%)</span>
                    <span className="text-gray-900 font-bold">{formatBRL(selectedSale.comissaoProduto)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase">Garantia + Serviços</span>
                    <span className="text-gray-900 font-bold">{formatBRL(selectedSale.bonusTotal - selectedSale.comissaoProduto)}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  const items = [];
                  if (selectedSale.valorProduto > 0) items.push("Produto");
                  if (selectedSale.valorAssistencia > 0) items.push("Assistência");
                  if (selectedSale.valorImpermeabilizacao > 0) items.push("Impermeabilização");
                  if (selectedSale.servicosExtras && selectedSale.servicosExtras.length > 0) items.push(...selectedSale.servicosExtras);

                  const text = `Relatório Pedido #${selectedSale.numeroPedido}\n` +
                    `Data: ${selectedSale.data}\n` +
                    `Total: ${formatBRL(selectedSale.total)}\n` +
                    `Bônus: ${formatBRL(selectedSale.bonusTotal)}\n` +
                    `-------------------\n` +
                    `Items: ${items.join(', ')}`;
                  
                  if (navigator.share) {
                    navigator.share({ title: `Pedido ${selectedSale.numeroPedido}`, text });
                  } else {
                    navigator.clipboard.writeText(text);
                    alert('Copiado para a área de transferência!');
                  }
                }}
                className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all hover:bg-purple-700"
              >
                Compartilhar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {saleToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-red-100"
          >
            <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter mb-2">Excluir Pedido?</h3>
            <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase">
              Você está prestes a excluir permanentemente o pedido <span className="text-red-600">#{saleToDelete.numeroPedido}</span>. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setSaleToDelete(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200"
              >
                Voltar
              </button>
              <button 
                onClick={() => deleteSale(saleToDelete)}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-red-500/20"
              >
                Excluir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default App;
