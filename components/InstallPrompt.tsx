import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return;
    }

    // Detect iOS
    const isIOSUser = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOSUser) {
      setPlatform('ios');
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
        // Show after a small delay for better UX
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Standard Android/Chrome handler
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      
      const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[999] max-w-md mx-auto p-5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-3xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
        aria-label="Fechar"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4 pr-6">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8">
            <circle cx="256" cy="256" r="230" fill="#ffffff" />
            <path 
              d="M 256,140 C 310,140 345,160 345,220 C 345,295 295,355 256,385 C 217,355 167,295 167,220 C 167,160 202,140 256,140 Z" 
              fill="none" 
              stroke="#7e22ce" 
              stroke-width="24" 
              stroke-linecap="round" 
              stroke-linejoin="round" 
            />
            <path 
              d="M 220,255 L 245,280 L 295,225" 
              fill="none" 
              stroke="#7e22ce" 
              stroke-width="26" 
              stroke-linecap="round" 
              stroke-linejoin="round" 
            />
          </svg>
        </div>

        <div className="flex-grow space-y-1">
          <h3 className="font-black text-sm tracking-wide">Instalar Conquista App</h3>
          
          {platform === 'ios' ? (
            <p className="text-[11px] leading-relaxed text-purple-100 font-bold">
              Para instalar no iPhone:<br />
              1. Toque no botão de <span className="inline-block align-middle bg-white/20 p-1 rounded"><Share size={11} className="inline" /> Compartilhar</span> abaixo.<br />
              2. Role a página e selecione <span className="inline-block align-middle bg-white/20 p-1 rounded"><PlusSquare size={11} className="inline" /> Adicionar à Tela de Início</span>.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-purple-100 font-bold">
              Instale o aplicativo em seu celular para ter acesso rápido, visual limpo e melhor performance.
            </p>
          )}
        </div>
      </div>

      {platform !== 'ios' && (
        <div className="mt-4 flex justify-end gap-3">
          <button 
            onClick={handleDismiss}
            className="px-4 py-2 text-xs font-bold text-white/80 hover:text-white transition-all"
          >
            Agora não
          </button>
          <button 
            onClick={handleInstall}
            className="bg-white text-purple-700 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Instalar
          </button>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
