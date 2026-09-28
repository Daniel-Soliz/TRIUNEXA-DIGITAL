import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

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

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
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
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setInstallPrompt(null);
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      window.alert(
        'Para instalar a TRUINEXA no iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.'
      );
      return;
    }

    window.alert(
      'Para instalar a TRUINEXA: abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.'
    );
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={
        className ||
        'px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition cursor-pointer'
      }
      title="Instalar TRUINEXA DIGITAL no celular"
    >
      {compact ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      <span>{compact ? 'App' : 'Instalar App'}</span>
    </button>
  );
};
