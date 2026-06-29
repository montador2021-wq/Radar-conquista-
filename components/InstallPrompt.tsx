import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      
      const hasShown = localStorage.getItem('pwa_prompt_shown');
      if (!hasShown) {
        setDeferredPrompt(e);
        setShowInstallBtn(true);
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
      localStorage.setItem('pwa_prompt_shown', 'true');
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBtn) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-purple-600 text-white rounded-2xl shadow-xl flex items-center justify-between">
      <div>
        <h3 className="font-bold">Instalar Conquista App</h3>
        <p className="text-sm opacity-90">Tenha o CRM sempre à mão.</p>
      </div>
      <button 
        onClick={handleInstall}
        className="bg-white text-purple-600 px-4 py-2 rounded-full font-bold flex items-center gap-2"
      >
        <Download size={18} /> Instalar
      </button>
    </div>
  );
};

export default InstallPrompt;
