
import React from 'react';
import { Tag, TrendingUp, Clock, Plus, MoreHorizontal } from 'lucide-react';
import { Opportunity } from '../tipos';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(opportunity.value);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-purple-500/30 transition-all duration-300 group cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden shadow-sm hover:shadow-md">
      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/0 group-hover:bg-purple-500 transition-all"></div>
      
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 group-hover:border-purple-500/50 transition-all">
            <img 
              src={opportunity.user.avatar} 
              alt={opportunity.user.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-gray-800 font-bold text-md tracking-tight italic">Oportunidade</h3>
            <span className="text-gray-400 text-xs font-mono">{opportunity.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
              {opportunity.type.split(' ')[0]}
            </div>
            {opportunity.value > 15000 && (
              <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                Elite
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100">
        <div className="flex flex-col items-start lg:items-end">
          <div className="text-xl font-black text-gray-900 tracking-tighter">{formattedValue}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase mt-0.5 italic">
            <Clock size={12} className="text-gray-400" />
            {opportunity.daysAgo}d Decorridos
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="h-9 w-9 flex items-center justify-center bg-gray-50 text-gray-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all border border-gray-200">
            <Plus size={18} />
          </button>
          <button className="h-9 w-9 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-all">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
