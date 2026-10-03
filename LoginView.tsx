import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { User } from './crm';
import { crmFetch, supabase } from './supabaseApi';
import { InstallAppButton } from './InstallAppButton';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User, token: string) => void;
  darkMode: boolean;
}

type AccessMode = 'login' | 'signup' | 'recovery' | 'reset';

export const LoginView: React.FC<LoginViewProps> = ({
  users: _users,
  onLoginSuccess,
  darkMode: _darkMode,
}) => {
  const [mode, setMode] = useState<AccessMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search);
    const recoveryFromUrl =
      searchParams.get('recovery') === '1' || hashParams.get('type') === 'recovery';

    if (recoveryFromUrl) {
      setMode('reset');
      setError(null);
      setMessage('Defina uma nova senha para concluir a recuperação.');
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setError(null);
        setMessage('Defina uma nova senha para concluir a recuperação.');
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const clearFeedback = () => {
    setError(null);
    setMessage(null);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const response = await crmFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          password,
          deviceInfo: 'Navegador',
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Não foi possível entrar.');
        return;
      }
      onLoginSuccess(data.user, data.sessionToken);
    } catch {
      setError('Não foi possível conectar ao Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();

    if (password.length < 8) {
      setError('Use uma senha com pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('A confirmação da senha não confere.');
      return;
    }

    setLoading(true);
    try {
      const response = await crmFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 202) {
        setError(data.error || 'Não foi possível criar a conta.');
        return;
      }
      if (data.user && data.sessionToken) {
        onLoginSuccess(data.user, data.sessionToken);
        return;
      }

      setMessage(data.message || 'Cadastro realizado. Seu acesso já está liberado.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();
    setLoading(true);
    try {
      const response = await crmFetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Não foi possível solicitar a recuperação.');
        return;
      }
      setMessage(data.message);
    } catch {
      setError('Não foi possível solicitar a recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFeedback();

    if (password.length < 8) {
      setError('Use uma senha com pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('A confirmação da senha não confere.');
      return;
    }

    setLoading(true);
    try {
      const response = await crmFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Não foi possível alterar a senha.');
        return;
      }
      setMessage('Senha atualizada. Você já pode entrar normalmente.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      await supabase.auth.signOut();
      window.history.replaceState(
        {},
        document.title,
        `${window.location.origin}${window.location.pathname}`
      );
    } catch {
      setError('Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'signup'
      ? 'Criar acesso'
      : mode === 'recovery'
        ? 'Recuperar senha'
        : mode === 'reset'
          ? 'Definir nova senha'
          : 'Acessar o CRM';

  const subtitle =
    mode === 'signup'
      ? 'Crie sua conta. O acesso é liberado automaticamente, sem aprovação do administrador.'
      : mode === 'recovery'
        ? 'Enviaremos um link seguro para o seu e-mail.'
        : mode === 'reset'
          ? 'Escolha uma nova senha para sua conta.'
          : 'Prospecção, carteira, atendimento e vendas em um só lugar.';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <section className="p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-10">
            <img
              src={`${import.meta.env.BASE_URL}icons/truinexa-192.png`}
              alt="TRUINEXA DIGITAL"
              className="w-11 h-11 rounded-2xl object-cover shadow-sm"
            />
            <div>
              <div className="font-bold tracking-tight">TRUINEXA DIGITAL</div>
              <div className="text-xs text-slate-500">CRM COMERCIAL</div>
            </div>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Supabase conectado
            </div>

            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>

            <div className="mt-4">
              <InstallAppButton className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 hover:bg-slate-100 transition cursor-pointer" />
              <p className="mt-2 text-[11px] text-slate-400">
                Instale no celular e abra a TRUINEXA como aplicativo, sem precisar entrar pelo navegador.
              </p>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form
              onSubmit={
                mode === 'signup'
                  ? handleSignup
                  : mode === 'recovery'
                    ? handleRecovery
                    : mode === 'reset'
                      ? handleReset
                      : handleLogin
              }
              className="mt-7 space-y-4"
            >
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              )}

              {mode !== 'reset' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="voce@empresa.com.br"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {mode !== 'recovery' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">
                      {mode === 'reset' ? 'Nova senha' : 'Senha'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {(mode === 'signup' || mode === 'reset') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? 'Aguarde...'
                  : mode === 'signup'
                    ? 'Criar minha conta'
                    : mode === 'recovery'
                      ? 'Enviar recuperação'
                      : mode === 'reset'
                        ? 'Salvar nova senha'
                        : 'Entrar'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs">
              {mode !== 'login' && (
                <button
                  onClick={() => {
                    clearFeedback();
                    setMode('login');
                  }}
                  className="font-semibold text-slate-700 hover:text-slate-950"
                >
                  Voltar ao login
                </button>
              )}
              {mode === 'login' && (
                <>
                  <button
                    onClick={() => {
                      clearFeedback();
                      setMode('signup');
                    }}
                    className="font-semibold text-slate-700 hover:text-slate-950 inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Primeiro acesso
                  </button>
                  <button
                    onClick={() => {
                      clearFeedback();
                      setMode('recovery');
                    }}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    Esqueci minha senha
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="bg-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
              Ambiente interno
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Um CRM simples para transformar oportunidade em cliente.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Leads disponíveis entram sem responsável. Quando um membro da equipe assume a oportunidade,
              ela passa para a carteira dele e o histórico fica sincronizado em tempo real.
            </p>
          </div>

          <div className="mt-10 space-y-3 text-sm text-slate-300">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Administrador</strong>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Acesso total ao funil, equipe, serviços, projetos e configurações.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <strong className="text-white">Comercial</strong>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Visualiza oportunidades livres e os clientes da própria carteira.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
