
import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Terminal, CheckSquare, Square, Percent, User } from 'lucide-react';
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
              customDate: dataPedido
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Valor Produto</label>
                   {produto > 0 && (
                     <div className="flex items-center gap-1.5 text-purple-600 font-black text-[10px] animate-in slide-in-from-right-2">
                        <Percent size={10} /> + {formatCurrency(comissaoProdutoBase)} ({comissaoP}%)
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
                  className="w-full bg-gray-50 border border-gray-200 p-5 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800 font-bold text-lg outline-none"
                />
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
