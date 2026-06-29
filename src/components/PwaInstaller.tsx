import { useEffect, useState } from 'react';

export const PwaInstaller = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            
            // Verifica se já foi mostrado anteriormente
            const hasShown = localStorage.getItem('pwa_prompt_shown');
            if (!hasShown) {
                setDeferredPrompt(e);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                localStorage.setItem('pwa_prompt_shown', 'true');
            }
            setDeferredPrompt(null);
        }
    };

    if (!deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg z-[9999] border border-purple-200 animate-in slide-in-from-bottom-10">
            <h3 className="font-bold text-gray-900">Instalar Aplicativo</h3>
            <p className="text-sm text-gray-600 mb-4">Tenha o Conquista App direto no seu celular!</p>
            <div className="flex gap-2">
                <button onClick={install} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex-1 font-semibold">Instalar</button>
                <button onClick={() => setDeferredPrompt(null)} className="text-gray-500 px-4 py-2 rounded-lg">Agora não</button>
            </div>
        </div>
    );
};
