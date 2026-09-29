import React, { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, Compass } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppButtonProps {
  className?: string;
  compact?: boolean;
}

function isStandalone() {
  const iosStandalone =
    'standalone' in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isIOSSafari() {
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) &&
    /safari/i.test(ua) &&
    !/crios|fxios|edgios|opios/i.test(ua)
  );
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  const isiOS = useMemo(() => isIOSDevice(), []);
  const isiOSSafari = useMemo(() => isIOSSafari(), []);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowIOSHelp(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (isiOS) {
      setShowIOSHelp(true);
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setInstallPrompt(null);
      return;
    }

    window.alert(
      'Para instalar a TRUINEXA: abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.'
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className={
          className ||
          'px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer'
        }
        title={isiOS ? 'Instalar TRUINEXA DIGITAL no iPhone' : 'Instalar TRUINEXA DIGITAL no celular'}
      >
        {compact ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
        <span>{compact ? 'App' : isiOS ? 'Instalar no iPhone' : 'Instalar App'}</span>
      </button>

      {showIOSHelp && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/45 p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={`${import.meta.env.BASE_URL}icons/truinexa-192.png`}
                  alt="TRUINEXA DIGITAL"
                  className="h-12 w-12 rounded-2xl object-cover"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    TRUINEXA DIGITAL
                  </p>
                  <h2 className="text-lg font-display font-bold text-slate-900">
                    Instalar no iPhone
                  </h2>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setShowIOSHelp(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isiOSSafari && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Compass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Abra primeiro no Safari</p>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Se este link abriu no Chrome, WhatsApp, Instagram ou outro navegador, use a opção
                      “Abrir no Safari”. A instalação no iPhone é feita pelo Safari.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 space-y-3">
              <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                  1
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Toque em Compartilhar</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    No Safari, toque no ícone de compartilhar na barra do navegador.
                  </p>
                  <Share2 className="mt-2 h-5 w-5 text-indigo-600" />
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                  2
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Escolha “Adicionar à Tela de Início”</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Role a lista de opções até encontrar “Adicionar à Tela de Início”.
                  </p>
                  <PlusSquare className="mt-2 h-5 w-5 text-indigo-600" />
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">
                  3
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Toque em “Adicionar”</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    O ícone da TRUINEXA aparecerá na tela inicial e abrirá como aplicativo.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Entendi
            </button>

            <p className="mt-3 text-center text-[11px] leading-4 text-slate-400">
              No iPhone não existe download de APK. A instalação desse app é feita pela Tela de Início do iOS.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
