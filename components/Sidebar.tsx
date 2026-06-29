
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { NavItem } from '../tipos';
import { Shield, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeItem: NavItem;
  onSelect: (item: NavItem) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelect, isCollapsed, setIsCollapsed }) => {
  // O sidebar agora tem um comportamento dinâmico por item
  // Se estiver colapsado globalmente, ele expande no hover para mostrar nomes
  const [isHovered, setIsHovered] = React.useState(false);
  const effectiveExpanded = !isCollapsed || isHovered;

  return (
    <aside 
      className="h-screen bg-white flex flex-col w-20 items-center py-4 border-r border-gray-100 shadow-sm z-50"
    >
      <div className="mb-8">
        <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
          <Shield className="text-white" size={24} />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2 w-full px-2">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full py-3 rounded-xl transition-all duration-200 relative group flex flex-col items-center gap-1.5 ${
                isActive 
                  ? 'bg-purple-50 text-purple-600 shadow-sm' 
                  : 'text-gray-400 hover:text-purple-600 hover:bg-gray-50'
              }`}
              title={item.label}
            >
              <div className="transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tighter text-center leading-none px-1 ${
                isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-600'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full border-2 border-gray-100 overflow-hidden shadow-sm">
          <img 
            src="https://picsum.photos/seed/admin/100/100" 
            className="w-full h-full object-cover"
            alt="Usuário"
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
