import React, { useState } from 'react';
import { Opportunity } from '../tipos';
import { X, Save, Search, ShoppingBag } from 'lucide-react';

interface OpportunityEditFormProps {
  opportunity: Opportunity;
  onCancel: () => void;
  onSave: (opportunity: Opportunity) => void;
}

const OpportunityEditForm: React.FC<OpportunityEditFormProps> = ({ opportunity, onCancel, onSave }) => {
  const [formData, setFormData] = useState<Opportunity>(() => ({
    shippingFee: 0,
    assemblyFee: 0,
    isAssemblyFree: true,
    validityDays: 5,
    ...opportunity
  }));
  const [displayValue, setDisplayValue] = useState(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opportunity.value)
  );
  const [shippingDisplayValue, setShippingDisplayValue] = useState(() => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opportunity.shippingFee || 0)
  );
  const [assemblyDisplayValue, setAssemblyDisplayValue] = useState(() => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opportunity.assemblyFee || 0)
  );

  // Catalog search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Initialize multiple products from existing fields (backward compatible fallback)
  const [selectedProducts, setSelectedProducts] = useState<any[]>(() => {
    if (opportunity.products && opportunity.products.length > 0) {
      return opportunity.products.map(p => ({
        name: p.name || '',
        code: p.code || '',
        price: p.price || 0,
        originalPrice: p.originalPrice || p.price || 0,
        image: p.image || '',
        category: p.category || '',
        nickname: p.nickname || ''
      }));
    }
    // Fallback for legacy opportunities
    if (opportunity.productInterest) {
      return [{
        name: opportunity.productInterest,
        code: opportunity.productCode || '',
        price: opportunity.value || 0,
        originalPrice: opportunity.value || 0,
        image: opportunity.productImage || '',
        category: opportunity.productCategory || '',
        nickname: opportunity.productNickname || ''
      }];
    }
    return [];
  });

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;
    
    setDisplayValue(new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue));

    setFormData(prev => ({ ...prev, value: numericValue }));
  };

  const handleSearchCatalog = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/catalog?site=catalogo.sonoshowmoveis.com.br&query=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setSearchResults(data.products);
        } else if (Array.isArray(data)) {
          setSearchResults(data);
        }
      } else {
        // Fallback endpoint
        const resFallback = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (resFallback.ok) {
          const dataFallback = await resFallback.json();
          setSearchResults(dataFallback);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar no catálogo:", err);
    } finally {
      setSearching(false);
    }
  };

  const updateFormWithProducts = (productsList: any[]) => {
    const totalValue = productsList.reduce((sum, p) => sum + (p.price || 0), 0);
    const names = productsList.map(p => p.name).join(', ');
    
    setFormData(prev => ({
      ...prev,
      productInterest: names,
      value: totalValue,
      productImage: productsList[0]?.image || '',
      productCode: productsList[0]?.code || '',
      productCategory: productsList[0]?.category || '',
      productNickname: productsList[0]?.nickname || '',
      products: productsList
    }));

    setDisplayValue(new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(totalValue));
  };

  const selectProduct = (item: any) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">Editar Card</h3>
            <span className="text-[9px] font-black text-purple-600 tracking-wider uppercase">CRM Conquista</span>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200 transition-all"
          >
            Voltar
          </button>
        </div>

        {/* BUSCA DE PRODUTO NO CATÁLOGO */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 relative">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={14} className="text-purple-600" />
            <label className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Buscar no Catálogo Inteligente</label>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Busque por sofá, guarda-roupa, etc..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchCatalog();
                  }
                }}
                className="w-full bg-white border border-gray-300 pl-9 pr-3 py-2.5 rounded-xl outline-none text-gray-900 text-xs placeholder-gray-400 focus:border-purple-500 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchCatalog}
              disabled={searching}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {searching ? '...' : 'Buscar'}
            </button>
          </div>

          {/* DROPDOWN DE RESULTADOS */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-50 p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 mb-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Catálogo ({searchResults.length})</span>
                <button
                  type="button"
                  onClick={() => setSearchResults([])}
                  className="text-[9px] font-bold text-purple-600 hover:text-purple-700 uppercase"
                >
                  Fechar
                </button>
              </div>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectProduct(item)}
                  className="hover:bg-purple-50/50 rounded-xl p-2 flex gap-3 transition-all cursor-pointer group animate-none"
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600'}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded-lg bg-gray-50 flex-shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-800 truncate group-hover:text-purple-600 transition-all">{item.name}</h4>
                    <span className="text-[10px] text-purple-600 font-bold font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LISTA DE PRODUTOS VINCULADOS */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none">
                Produtos Vinculados ({selectedProducts.length})
              </div>
              
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {selectedProducts.map((product, idx) => (
                  <div 
                    key={idx} 
                    className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 flex flex-col gap-2 relative animate-in zoom-in-95 duration-200"
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
                          Preço Catálogo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice || 0)}
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
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Preço Negociado:</span>
                      <div className="relative max-w-[120px]">
                        <input 
                          type="text" 
                          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || 0)}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Nome do Cliente</label>
            <input 
              required 
              placeholder="Nome do Cliente" 
              value={formData.title} 
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
              className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Telefone</label>
            <input 
              type="tel"
              placeholder="(00) 00000-0000" 
              value={formData.phone || ''} 
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, phone: value }));
              }} 
              className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Produto de interesse</label>
            <input 
              required
              placeholder="Produto de interesse" 
              value={formData.productInterest || ''} 
              onChange={e => setFormData(prev => ({ ...prev, productInterest: e.target.value }))} 
              className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Data de retorno</label>
            <input 
              type="date" 
              value={formData.returnDate || ''} 
              onChange={e => setFormData(prev => ({ ...prev, returnDate: e.target.value }))} 
              className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Valor Estimado (R$)</label>
            <input 
              type="text" 
              placeholder="R$ 0,00" 
              value={displayValue} 
              onChange={handleValueChange} 
              className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" 
            />
          </div>

          {/* CONFIGURAÇÃO DE FRETE, MONTAGEM E VALIDADE */}
          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-4">
            <h4 className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Logística e Condições do Orçamento</h4>
            
            {/* VALIDADE */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-500 uppercase">Validade do Orçamento</label>
              <select
                value={formData.validityDays}
                onChange={e => setFormData(prev => ({ ...prev, validityDays: Number(e.target.value) }))}
                className="w-full bg-white border border-gray-300 p-2.5 rounded-xl outline-none text-gray-900 text-xs focus:border-purple-500 transition-all"
              >
                <option value={1}>1 dia útil (Hoje apenas)</option>
                <option value={3}>3 dias corridos</option>
                <option value={5}>5 dias corridos (Padrão)</option>
                <option value={7}>7 dias corridos</option>
                <option value={10}>10 dias corridos</option>
                <option value={15}>15 dias corridos</option>
                <option value={30}>30 dias corridos</option>
              </select>
            </div>

            {/* FRETE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-500 uppercase">Frete / Entrega</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, shippingFee: 0 }));
                      setShippingDisplayValue('R$ 0,00');
                    }}
                    className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                      (formData.shippingFee === undefined || formData.shippingFee === 0) 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Grátis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.shippingFee) {
                        setFormData(prev => ({ ...prev, shippingFee: 29.90 }));
                        setShippingDisplayValue('R$ 29,90');
                      }
                    }}
                    className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                      (formData.shippingFee !== undefined && formData.shippingFee > 0) 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Cobrar
                  </button>
                </div>
              </div>

              {formData.shippingFee !== undefined && formData.shippingFee > 0 && (
                <div className="animate-in slide-in-from-top-1 duration-150">
                  <input
                    type="text"
                    placeholder="Valor do Frete (R$)"
                    value={shippingDisplayValue}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const val = Number(raw) / 100;
                      setShippingDisplayValue(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val));
                      setFormData(prev => ({ ...prev, shippingFee: val }));
                    }}
                    className="w-full bg-white border border-gray-300 p-2 rounded-xl outline-none text-xs text-gray-900 focus:border-purple-500 font-bold"
                  />
                </div>
              )}
            </div>

            {/* MONTAGEM */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-500 uppercase">Montagem dos Móveis</span>
                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, isAssemblyFree: true, assemblyFee: 0 }));
                      setAssemblyDisplayValue('R$ 0,00');
                    }}
                    className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                      formData.isAssemblyFree 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Grátis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, isAssemblyFree: false }));
                      if (!formData.assemblyFee) {
                        setFormData(prev => ({ ...prev, assemblyFee: 50 }));
                        setAssemblyDisplayValue('R$ 50,00');
                      }
                    }}
                    className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                      !formData.isAssemblyFree 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Cobrar
                  </button>
                </div>
              </div>

              {!formData.isAssemblyFree && (
                <div className="animate-in slide-in-from-top-1 duration-150">
                  <input
                    type="text"
                    placeholder="Valor da Montagem (R$)"
                    value={assemblyDisplayValue}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const val = Number(raw) / 100;
                      setAssemblyDisplayValue(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val));
                      setFormData(prev => ({ ...prev, assemblyFee: val }));
                    }}
                    className="w-full bg-white border border-gray-300 p-2 rounded-xl outline-none text-xs text-gray-900 focus:border-purple-500 font-bold"
                  />
                </div>
              )}
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all duration-300"
          >
            <Save size={18} /> Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpportunityEditForm;
