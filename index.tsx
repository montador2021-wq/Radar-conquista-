
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initMechanicalTouch } from './src/mechanicalTouch';

// Global error listener to handle module loading or unhandled promise rejection failures
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error("Global unhandled error caught:", event.error);
    const rootEl = document.getElementById('root');
    if (rootEl && (!rootEl.innerHTML || rootEl.innerHTML.trim() === "")) {
      rootEl.innerHTML = `
        <div style="padding: 24px; font-family: sans-serif; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; max-width: 500px; margin: 40px auto; color: #991b1b;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">Erro de Inicialização</h2>
          <p style="margin: 0 0 10px 0; font-size: 14px;">Ocorreu um erro ao carregar a aplicação. Por favor, recarregue a página.</p>
          <pre style="background: #f87171; color: white; padding: 10px; border-radius: 6px; font-size: 12px; overflow-x: auto; margin: 0;">${event.message || 'Erro desconhecido'}</pre>
          <button onclick="window.location.reload()" style="margin-top: 15px; padding: 8px 16px; background-color: #991b1b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">Recarregar</button>
        </div>
      `;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });
}

// Initialize PWA Service Worker with safety guard
try {
  registerSW({ immediate: true });
} catch (e) {
  console.warn("PWA Service Worker registration skipped or blocked in this environment.", e);
}

// Initialize Realistic Mechanical Touch (Sound & Reflection Hover Tracking)
try {
  initMechanicalTouch();
} catch (e) {
  console.warn("Mechanical touch initialization skipped.", e);
}

// React Error Boundary Component
interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-red-100 p-8 space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">Algo deu errado</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Conquista App - Diagnóstico</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left font-mono text-[10px] text-red-600 max-h-40 overflow-y-auto">
              {this.state.error?.toString() || 'Erro desconhecido'}
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Limpar Dados Locais e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
