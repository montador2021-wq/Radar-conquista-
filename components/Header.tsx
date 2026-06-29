
import React from 'react';
import { Search, Bell, Cpu } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-20 flex items-center justify-between px-6 md:px-10 lg:px-14 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="BUSCAR DADOS..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-[10px] font-bold tracking-widest text-gray-700 placeholder:text-gray-400 uppercase"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Online</span>
        </div>
        <button className="text-gray-400 hover:text-purple-600 transition-all relative">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full border-2 border-white"></span>
        </button>
        <button className="bg-gray-50 p-2 rounded-lg text-gray-400 hover:text-purple-600 transition-all border border-gray-200">
          <Cpu size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
