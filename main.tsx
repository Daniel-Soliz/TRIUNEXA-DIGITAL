import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class CRMErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error?.message || 'Falha inesperada ao carregar o CRM.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TRUINEXA CRM render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold mb-5">
            T
          </div>
          <p className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
            TRUINEXA DIGITAL
          </p>
          <h1 className="mt-2 text-2xl font-bold">Não foi possível abrir esta tela.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Seus dados permanecem no Supabase. Atualize a página para tentar novamente.
          </p>
          <details className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
            <summary className="cursor-pointer font-semibold">Detalhes técnicos</summary>
            <p className="mt-2 break-words">{this.state.message}</p>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Recarregar CRM
          </button>
        </div>
      </div>
    );
  }
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Elemento principal do CRM não encontrado.');
}

createRoot(root).render(
  <StrictMode>
    <CRMErrorBoundary>
      <App />
    </CRMErrorBoundary>
  </StrictMode>,
);


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch((error) => {
        console.warn('TRUINEXA PWA service worker:', error);
      });
  });
}
