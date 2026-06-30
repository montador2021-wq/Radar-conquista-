
import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Terminal, CheckSquare, Square, Percent, User, Search, ShoppingBag, Sparkles, Trash2, Check } from 'lucide-react';
import { Sale, Customer, Targets } from '../tipos';

interface SaleFormProps {
  onCancel: () => void;
  onSubmit: (sale: Partial<Sale> & { pedido: string, produto: number, assistencia: number, impermeabilizacao: number, clienteId?: string, customDate?: string }) => void;
  customers: Customer[];
  targets: Targets;
  stats?: any;
}

const SaleForm: React.FC<SaleFormProps> = ({ onCancel, onSubmit, customers, targets, stats }) => {
  const [pedido, setPedido] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [produto, setProduto] = useState<number>(0);
  
  // States para os dados do produto preenchidos automaticamente ou manualmente
  const [produtoNome, setProdutoNome] = useState('');
  const [produtoCodigo, setProdutoCodigo] = useState('');
  const [produtoCategoria, setProdutoCategoria] = useState('');
  const [produtoImagem, setProdutoImagem] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  const updateFormWithProducts = (productsList: any[]) => {
    const totalValue = productsList.reduce((sum, p) => sum + (p.price || 0), 0);
    const names = productsList.map(p => p.name).join(', ');
    
    setProduto(totalValue);
    setProdutoNome(names);
    setProdutoCodigo(productsList[0]?.code || '');
    setProdutoCategoria(productsList[0]?.category || '');
    setProdutoImagem(productsList[0]?.image || '');
  };

  const handleProductPriceInputChange = (index: number, valueStr: string) => {
    const rawDigits = valueStr.replace(/\D/g, '');
    const numericValue = Number(rawDigits) / 100;
    
    const updated = selectedProducts.map((p, idx) => {
      if (idx === index) {
        return { ...p, price: numericValue };
      }
      return p;
    });
    setSelectedProducts(updated);
    updateFormWithProducts(updated);
  };

  const removeProduct = (index: number) => {
    const updated = selectedProducts.filter((_, idx) => idx !== index);
    setSelectedProducts(updated);
    updateFormWithProducts(updated);
  };
  const [assistencia, setAssistencia] = useState<number>(0);
  const [impermeabilizacao, setImpermeabilizacao] = useState<number>(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [dataPedido, setDataPedido] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [extras, setExtras] = useState({
    montagem: false,
    lavagem: false,
    almofada: false,
    pes_guarda_roupa: false,
    impermeabilizacao_bonus: false
  });

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTotal(produto + assistencia + impermeabilizacao);
  }, [produto, assistencia, impermeabilizacao]);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleSearchCatalog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Erro ao buscar no catálogo:", err);
    } finally {
      setSearching(false);
    }
  };

  const isBonusPorPedidoAtivo = targets.bonusPorPedido?.ativo ?? false;
  const valorBonusPorPedido = targets.bonusPorPedido?.valor ?? 5;

  const calculateBonusFixo = () => {
    let bonusTotal = 0;
    if (extras.montagem) bonusTotal += targets.serviceBonuses.montagem;
    if (extras.lavagem) bonusTotal += targets.serviceBonuses.lavagem;
    if (extras.almofada) bonusTotal += targets.serviceBonuses.almofada;
    if (extras.pes_guarda_roupa) bonusTotal += targets.serviceBonuses.pes_guarda_roupa;
    if (extras.impermeabilizacao_bonus) bonusTotal += targets.serviceBonuses.impermeabilizacao_bonus;
    if (isBonusPorPedidoAtivo) bonusTotal += valorBonusPorPedido;
    return bonusTotal;
  };

  const comissaoP = targets.productCommissionRate ?? 2.2;
  const comissaoProdutoBase = produto * (comissaoP / 100); 
  const currentAssistanceRate = stats?.taxaGarantia || 0.05;
  const comissaoAssistenciaBase = assistencia * currentAssistanceRate;

  const getSelectedLabels = () => {
    const labels: string[] = [];
    if (extras.montagem) labels.push("Montagem");
    if (extras.lavagem) labels.push("Lavagem");
    if (extras.almofada) labels.push("Almofada");
    if (extras.pes_guarda_roupa) labels.push("Pés G-Roupa");
    if (extras.impermeabilizacao_bonus) labels.push("Impermeab.");
    if (isBonusPorPedidoAtivo) labels.push("Bônus por Pedido");
    return labels;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d]/g, '')) / 100;
    setter(isNaN(numericValue) ? 0 : numericValue);
  };

  const toggleExtra = (key: keyof typeof extras) => {
    setExtras(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in zoom-in-95 duration-500 pb-20">
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200 relative">
        <div className="p-6 md:p-12 relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 text-purple-600 mb-2">
                <Terminal size={18} />
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">Módulo Conquista App v5.0</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tighter uppercase leading-none italic">Lançar Novo Pedido</h2>
            </div>
            <button onClick={onCancel} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200 hover:bg-gray-200 transition-all">
              Voltar
            </button>
          </div>

          <form className="space-y-8" onSubmit={(e) => {
            e.preventDefault();
            if (!pedido) {
              setErrorMsg('Lembrete: Você precisa informar o ID do Pedido.');
              return;
            }
            if (produto <= 0) {
              setErrorMsg('Lembrete: O valor mínimo do produto precisa ser preenchido.');
              return;
            }
            setErrorMsg('');

            const finalProducts = selectedProducts.length > 0 ? selectedProducts : (produtoNome ? [{
              name: produtoNome,
              code: produtoCodigo || '',
              price: produto,
              originalPrice: produto,
              image: produtoImagem || '',
              category: produtoCategoria || '',
              nickname: produtoNome.split(' - ')[0] || ''
            }] : []);

            onSubmit({ 
              pedido, 
              clienteId,
              produto, 
              assistencia, 
              impermeabilizacao, 
              total,
              comissaoProduto: comissaoProdutoBase,
              bonusTotal: calculateBonusFixo() + comissaoProdutoBase + comissaoAssistenciaBase,
              servicosExtras: getSelectedLabels(),
              customDate: dataPedido,
              produtoCodigo: produtoCodigo || undefined,
              produtoNome: produtoNome || undefined,
              produtoImagem: produtoImagem || undefined,
              produtoNickname: produtoNome ? produtoNome.split(' - ')[0] : undefined,
              produtoCategoria: produtoCategoria || undefined,
              products: finalProducts
            });
          }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">ID Pedido</label>
                <input
                  ref={firstInputRef}
                  type="number"
                  inputMode="numeric"
                  value={pedido}
                  onChange={(e) => {
                    setPedido(e.target.value.replace(/[^0-9]/g, ''));
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="EX: 1234"
                  className="w-full bg-gray-50 border border-gray-200 p-5 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800 font-bold text-lg outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Data do Pedido</label>
                <input
                  type="date"
                  value={dataPedido}
                  onChange={(e) => setDataPedido(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-5 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800 font-bold text-lg outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Vincular Cliente</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-5 pl-12 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800 font-bold text-lg outline-none appearance-none"
                  >
                    <option value="">Nenhum Cliente</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BUSCAR PRODUTO NO CATÁLOGO (SONO SHOW MÓVEIS) */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase text-purple-900 tracking-wider">Busca de Produto</h3>
                    <p className="text-[9px] text-purple-600/70 font-semibold uppercase tracking-widest">Pesquise produtos na API de catálogo para preenchimento automático</p>
                  </div>
                </div>
                {selectedProducts.length > 0 && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1 animate-in zoom-in-95">
                    <Check size={10} /> {selectedProducts.length} Vinculado{selectedProducts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar produto no catálogo... (ex: Sofá, Guarda-Roupa)"
                        className="w-full bg-white border border-gray-200 p-4 pl-12 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-800"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchCatalog();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearchCatalog()}
                      disabled={searching}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {searching ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>

                  {/* LISTA DROPDOWN FLUTUANTE ABAIXO DO INPUT */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-50 p-2 space-y-1">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 mb-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Produtos Encontrados ({searchResults.length})</span>
                        <button
                          type="button"
                          onClick={() => setSearchResults([])}
                          className="text-[9px] font-bold text-purple-600 hover:text-purple-700 uppercase"
                        >
                          Fechar
                        </button>
                      </div>
                      {searchResults.map((item) => (
                        <div
                          key={item.code}
                          className="hover:bg-purple-50/50 rounded-xl p-2.5 flex gap-3 transition-all cursor-pointer group"
                          onClick={() => {
                            const newProduct = {
                              name: item.name || '',
                              code: item.code || item.sku || '',
                              price: item.price || 0,
                              originalPrice: item.price || 0,
                              image: item.image || '',
                              category: item.category || '',
                              nickname: item.nickname || ''
                            };
                            const updated = [...selectedProducts, newProduct];
                            setSelectedProducts(updated);
                            updateFormWithProducts(updated);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                        >
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600'}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-cover rounded-lg bg-gray-50 flex-shrink-0 border border-gray-100"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[8px] font-black text-purple-600 uppercase tracking-wider truncate">{item.category}</span>
                              <span className="text-[9px] font-mono text-gray-400">Cód: {item.code}</span>
                            </div>
                            <h4 className="text-[11px] font-bold text-gray-800 line-clamp-1 leading-tight group-hover:text-purple-700">{item.name}</h4>
                            <div className="text-xs font-black text-gray-900 mt-0.5">{formatCurrency(item.price)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* LISTA DE PRODUTOS SELECIONADOS NO PEDIDO */}
                  {selectedProducts.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none">
                        Produtos Selecionados ({selectedProducts.length})
                      </div>
                      
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {selectedProducts.map((product, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white border border-purple-100 rounded-xl p-3 flex flex-col gap-2 relative animate-in zoom-in-95 duration-200"
                          >
                            <div className="flex items-start gap-3">
                              <img 
                                src={product.image || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600'} 
                                alt={product.name} 
                                className="w-10 h-10 object-cover rounded-lg bg-white border border-purple-100 flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-[8px] font-black text-purple-600 uppercase tracking-widest leading-none">Produto #{idx + 1}</div>
                                <div className="text-[11px] font-extrabold text-gray-800 truncate mt-0.5" title={product.name}>
                                  {product.name}
                                </div>
                                {product.code && (
                                  <div className="text-[8px] text-gray-400 font-mono">SKU: {product.code}</div>
                                )}
                                <div className="text-[9px] text-gray-500 font-medium">
                                  Preço Catálogo: {formatCurrency(product.originalPrice || 0)}
                                </div>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeProduct(idx)} 
                                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-all"
                                title="Remover Produto"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* Preço de venda editável */}
                            <div className="flex items-center justify-between pt-2 border-t border-purple-100/30">
                              <span className="text-[9px] font-bold text-gray-500 uppercase">Preço Venda (Negociado):</span>
                              <div className="relative max-w-[120px]">
                                <input 
                                  type="text" 
                                  value={formatCurrency(product.price || 0)}
                                  onChange={(e) => handleProductPriceInputChange(idx, e.target.value)}
                                  className="w-full bg-white border border-gray-300 focus:border-purple-500 text-right px-2 py-1 rounded-lg text-[11px] font-extrabold text-gray-800 outline-none transition-all shadow-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FORMULÁRIO DE DADOS DO PRODUTO (NOME, CÓDIGO, CATEGORIA, PREÇO UNITÁRIO, IMAGEM) */}
            <div className="bg-gray-50/70 border border-gray-200/80 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase text-gray-800 tracking-wider">Dados do Produto</h3>
                    <p className="text-[9px] text-gray-500/70 font-semibold uppercase tracking-widest">Informações detalhadas do produto selecionado ou preenchidas manualmente</p>
                  </div>
                </div>
                {(produtoNome || produtoCodigo || selectedProducts.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedProducts([]);
                      setProdutoNome('');
                      setProdutoCodigo('');
                      setProdutoCategoria('');
                      setProdutoImagem('');
                      setProduto(0);
                      setSearchQuery('');
                    }}
                    className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider flex items-center gap-1"
                    title="Limpar formulário do produto"
                  >
                    <Trash2 size={12} /> Limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Nome do Produto</label>
                  <input
                    type="text"
                    value={produtoNome}
                    onChange={(e) => setProdutoNome(e.target.value)}
                    placeholder="Ex: Guarda-Roupa Blumenau com Espelho 3 Portas nature"
                    className="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-800 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Código do Produto</label>
                  <input
                    type="text"
                    value={produtoCodigo}
                    onChange={(e) => setProdutoCodigo(e.target.value)}
                    placeholder="Ex: G-BLU-01"
                    className="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-800 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Categoria</label>
                  <input
                    type="text"
                    value={produtoCategoria}
                    onChange={(e) => setProdutoCategoria(e.target.value)}
                    placeholder="Ex: Dormitório"
                    className="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm font-semibold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-800 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Preço Unitário (Valor do Produto)</label>
                    {produto > 0 && (
                      <div className="flex items-center gap-1 text-purple-600 font-black text-[9px] animate-in slide-in-from-right-2">
                        +{formatCurrency(comissaoProdutoBase)} ({comissaoP}%)
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={produto === 0 ? "" : formatCurrency(produto)}
                    onChange={(e) => {
                      handleInputChange(setProduto, e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="R$ 0,00"
                    className="w-full bg-white border border-gray-200 p-4 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Imagem do Produto (URL)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={produtoImagem}
                      onChange={(e) => setProdutoImagem(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-white border border-gray-200 p-4 rounded-xl text-xs font-semibold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-800"
                    />
                    {produtoImagem && (
                      <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                        <img
                          src={produtoImagem}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=100';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Valor Assistência</label>
                  {assistencia > 0 && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] animate-in slide-in-from-right-2">
                       <Percent size={10} /> + {formatCurrency(comissaoAssistenciaBase)} ({(currentAssistanceRate * 100).toFixed(0)}%)
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={assistencia === 0 ? "" : formatCurrency(assistencia)}
                  onChange={(e) => handleInputChange(setAssistencia, e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full bg-gray-50 border border-gray-200 p-5 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800 outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Impermeabilização</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={impermeabilizacao === 0 ? "" : formatCurrency(impermeabilizacao)}
                  onChange={(e) => handleInputChange(setImpermeabilizacao, e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full bg-gray-50 border border-gray-200 p-5 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800 outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-3 mb-6">
                <CheckSquare size={16} className="text-emerald-600" />
                <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Serviços Extras (Bônus Fixo)</h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { id: 'montagem', label: 'Montagem', value: `R$${targets.serviceBonuses.montagem}` },
                  { id: 'lavagem', label: 'Lavagem', value: `R$${targets.serviceBonuses.lavagem}` },
                  { id: 'almofada', label: 'Almofada', value: `R$${targets.serviceBonuses.almofada}` },
                  { id: 'pes_guarda_roupa', label: 'Pés G-R', value: `R$${targets.serviceBonuses.pes_guarda_roupa}` },
                  { id: 'impermeabilizacao_bonus', label: 'Impermeab.', value: `R$${targets.serviceBonuses.impermeabilizacao_bonus}` }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleExtra(item.id as keyof typeof extras)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      extras[item.id as keyof typeof extras]
                      ? 'bg-emerald-50 border-emerald-500/40 text-emerald-600'
                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[10px] font-bold uppercase tracking-tighter leading-none mb-1">{item.label}</span>
                      <span className="text-[8px] opacity-60 font-black">{item.value}</span>
                    </div>
                    {extras[item.id as keyof typeof extras] ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              {errorMsg && (
                <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-black">!</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">{errorMsg}</span>
                </div>
              )}
              
              <div className="bg-white rounded-[1.8rem] p-8 flex flex-col md:flex-row items-center justify-between gap-10 border border-gray-200 shadow-sm">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">Faturamento do Pedido</span>
                  <div className="text-3xl md:text-4xl font-black text-gray-900 leading-none">{formatCurrency(total)}</div>
                </div>
                
                <div className="flex flex-col items-center md:items-end gap-2 border-l border-gray-100 pl-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-1">Meus Ganhos Totais</span>
                  <div className="text-3xl md:text-4xl font-black text-emerald-600 leading-none">
                    {formatCurrency(calculateBonusFixo() + comissaoProdutoBase + comissaoAssistenciaBase)}
                  </div>
                  {isBonusPorPedidoAtivo && (
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 bg-gray-100 px-2 py-1 rounded-md">
                      +{formatCurrency(valorBonusPorPedido)} Incluído
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-purple-600 text-white py-6 rounded-2xl font-black text-sm hover:bg-purple-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20">
              <Save size={20} /> FINALIZAR E SOMAR COMISSÃO
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SaleForm;
