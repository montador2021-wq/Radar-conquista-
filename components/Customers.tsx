
import React, { useState } from 'react';
import { Plus, Search, User, Phone, Mail, FileText, MapPin, Trash2, Edit2, X, Save } from 'lucide-react';
import { Customer } from '../tipos';
import { motion, AnimatePresence } from 'motion/react';

interface CustomersProps {
  customers: Customer[];
  onAdd: (customer: Omit<Customer, 'id' | 'dataCadastro' | 'totalComprado' | 'pedidosCount'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (customer: Customer) => void;
  onBack?: () => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAdd, onDelete, onUpdate, onBack }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdate({ ...editingCustomer, ...formData });
      setEditingCustomer(null);
    } else {
      onAdd(formData);
    }
    setFormData({ nome: '', email: '', telefone: '', endereco: '' });
    setIsAdding(false);
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      nome: customer.nome,
      email: customer.email || '',
      telefone: customer.telefone || '',
      endereco: customer.endereco || ''
    });
    setIsAdding(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpf && c.cpf.includes(searchTerm)) ||
    (c.telefone && c.telefone.includes(searchTerm))
  );

  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h2 className="text-2xl font-black text-gray-800 italic tracking-tighter uppercase leading-none">Clientes</h2>
            <span className="text-[8px] font-black text-purple-600 tracking-[0.3em] uppercase">Base de Dados de Compradores</span>
          </div>
          {onBack && (
            <button 
              onClick={onBack}
              className="md:hidden bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200"
            >
              Voltar
            </button>
          )}
        </div>
        
        <div className="flex gap-3 items-center">
          {onBack && (
            <button 
              onClick={onBack}
              className="hidden md:block bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase border border-gray-200"
            >
              Voltar
            </button>
          )}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => { setIsAdding(true); setEditingCustomer(null); setFormData({ nome: '', email: '', telefone: '', cpf: '', endereco: '' }); }}
            className="bg-purple-600 text-white p-2 rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-purple-200 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-800 uppercase italic tracking-tighter">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  required
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <input 
                  value={formData.telefone}
                  onChange={e => setFormData({...formData, telefone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Endereço</label>
                <input 
                  value={formData.endereco}
                  onChange={e => setFormData({...formData, endereco: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none font-bold"
                />
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                  <Save size={18} /> {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center">
            <User size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum cliente encontrado</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <motion.div 
              key={customer.id}
              layout
              className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100">
                  <User size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(customer)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(customer.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-800 leading-tight mb-4">{customer.nome}</h3>

              <div className="space-y-2 mb-6">
                {customer.telefone && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                    <Phone size={12} className="text-purple-400" /> {customer.telefone}
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                    <Mail size={12} className="text-purple-400" /> {customer.email}
                  </div>
                )}
                {customer.endereco && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                    <MapPin size={12} className="text-purple-400" /> {customer.endereco}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] font-black text-gray-400 uppercase block">Total Comprado</span>
                  <span className="text-sm font-black text-emerald-600">{formatBRL(customer.totalComprado)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-gray-400 uppercase block">Pedidos</span>
                  <span className="text-sm font-black text-gray-800">{customer.pedidosCount}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Customers;
