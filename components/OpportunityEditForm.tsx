import React, { useState } from 'react';
import { Opportunity } from '../tipos';
import { X, Save } from 'lucide-react';

interface OpportunityEditFormProps {
  opportunity: Opportunity;
  onCancel: () => void;
  onSave: (opportunity: Opportunity) => void;
}

const OpportunityEditForm: React.FC<OpportunityEditFormProps> = ({ opportunity, onCancel, onSave }) => {
  const [formData, setFormData] = useState<Opportunity>(opportunity);
  const [displayValue, setDisplayValue] = useState(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opportunity.value)
  );

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;
    
    setDisplayValue(new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numericValue));

    setFormData({...formData, value: numericValue});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">Editar Card</h3>
          <button onClick={onCancel} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200">Voltar</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Nome do Cliente</label>
            <input required placeholder="Nome do Cliente" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Telefone</label>
            <input 
              type="tel"
              placeholder="(00) 00000-0000" 
              value={formData.phone || ''} 
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({...formData, phone: value});
              }} 
              className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Produto de interesse</label>
            <input placeholder="Produto de interesse" value={formData.productInterest || ''} onChange={e => setFormData({...formData, productInterest: e.target.value})} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Data de retorno</label>
            <input type="date" value={formData.returnDate || ''} onChange={e => setFormData({...formData, returnDate: e.target.value})} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 focus:border-purple-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase">Valor Estimado (R$)</label>
            <input type="text" placeholder="R$ 0,00" value={displayValue} onChange={handleValueChange} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none text-gray-900 placeholder-gray-400 focus:border-purple-500" />
          </div>
          <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
            <Save size={18} /> Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpportunityEditForm;
