import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Laptop,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { User } from './crm';

interface LoginViewProps {
  users: User[];
  onLoginSuccess: (user: User, token: string) => void;
  darkMode: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess, darkMode }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState('Notebook • São Paulo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // First-access password creation state
  const [pendingFirstAccessUser, setPendingFirstAccessUser] = useState<{
    user: User;
    token: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoveryMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, deviceInfo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Falha na autenticação.');
      } else {
        if (data.user.mustChangePassword) {
          setPendingFirstAccessUser({ user: data.user, token: data.sessionToken });
        } else {
          onLoginSuccess(data.user, data.sessionToken);
        }
      }
    } catch {
      setError('Erro de conexão com o servidor da TRUINEXA DIGITAL.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (username: string, defaultPass: string, device: string) => {
    setRecoveryMode(false);
    setError(null);
    setIdentifier(username);
    setPassword(defaultPass);
    setDeviceInfo(device);
  };

  const handleCreatePersonalPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFirstAccessUser) return;
    setError(null);

    if (newPassword.length < 6) {
      setError('Sua nova senha pessoal deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingFirstAccessUser.user.id,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível salvar a nova senha.');
      } else {
        onLoginSuccess(data.user, pendingFirstAccessUser.token);
      }
    } catch {
      setError('Erro ao salvar nova senha criptografada.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoveryMessage(null);
    if (!identifier.trim()) {
      setError('Informe seu usuário ou e-mail corporativo para recuperar o acesso.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Usuário não encontrado.');
      } else {
        setRecoveryMessage(data.message);
      }
    } catch {
      setError('Erro ao solicitar recuperação de senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between relative overflow-hidden ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Subtle atmospheric radial gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-indigo-600/15 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="font-display font-extrabold text-white text-lg tracking-tight">T</span>
          </div>
          <div>
            <span className="font-display font-bold tracking-tight text-base block leading-none">
              TRUINEXA DIGITAL
            </span>
            <span className="text-xs text-slate-400 font-mono">
              CRM INTERNO • PROSPECÇÃO & VENDAS
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ACESSO EXCLUSIVO DA EQUIPE INTERNA</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Login Form */}
          <div className="lg:col-span-7">
            <div
              className={`rounded-2xl border p-8 sm:p-10 shadow-2xl ${
                darkMode
                  ? 'bg-slate-900/90 border-slate-800/90 backdrop-blur-xl'
                  : 'bg-white border-slate-200'
              }`}
            >
              {pendingFirstAccessUser ? (
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-4">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Primeiro Acesso • Criação de Senha Pessoal</span>
                  </div>
                  <h1 className="text-2xl font-display font-bold tracking-tight mb-2">
                    Olá, {pendingFirstAccessUser.user.name}! Crie sua senha definitiva
                  </h1>
                  <p className="text-sm text-slate-400 mb-6">
                    Você entrou com uma senha temporária. Por segurança, defina agora sua própria senha
                    pessoal criptografada. Somente você terá conhecimento dela.
                  </p>

                  {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreatePersonalPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Nova Senha Pessoal
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}</span>
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
                    >
                      <span>{loading ? 'Criptografando e salvando...' : 'SALVAR SENHA E ACESSAR CRM'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : recoveryMode ? (
                <div>
                  <h1 className="text-2xl font-display font-bold tracking-tight mb-2">
                    Recuperação de Senha
                  </h1>
                  <p className="text-sm text-slate-400 mb-6">
                    Informe seu usuário ou e-mail corporativo. O Administrador (Daniel) receberá o alerta
                    para liberar uma credencial temporária de primeiro acesso.
                  </p>

                  {error && (
                    <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {recoveryMessage && (
                    <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{recoveryMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordRecovery} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Usuário ou e-mail
                      </label>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Ex: arthur ou arthur@truinexa.com.br"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryMode(false);
                          setError(null);
                          setRecoveryMessage(null);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition cursor-pointer"
                      >
                        Voltar ao Login
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition cursor-pointer"
                      >
                        {loading ? 'Enviando...' : 'Solicitar Redefinição'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
                      TRUINEXA DIGITAL
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                      Acesso ao CRM Comercial
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Plataforma interna de prospecção, funil Kanban, atendimento e vendas.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Usuário ou e-mail
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="daniel, arthur ou pedro"
                          required
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-500 transition ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-slate-300">Senha</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                        >
                          {showPassword ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Ocultar senha</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Mostrar senha</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Digite sua senha individual"
                          required
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-indigo-500 transition ${
                            darkMode
                              ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Dispositivo Conectado (Sessão Simultânea)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Notebook', value: 'Notebook • São Paulo', icon: Laptop },
                          { label: 'Celular', value: 'Celular • São Paulo', icon: Smartphone },
                          { label: 'Computador', value: 'Computador • São Paulo', icon: Monitor },
                        ].map((dev) => {
                          const Icon = dev.icon;
                          const selected = deviceInfo === dev.value;
                          return (
                            <button
                              key={dev.label}
                              type="button"
                              onClick={() => setDeviceInfo(dev.value)}
                              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                                selected
                                  ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{dev.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
                      >
                        <span>{loading ? 'Autenticando...' : 'ENTRAR'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setRecoveryMode(true);
                          setError(null);
                        }}
                        className="text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                      <span className="text-slate-500 font-mono">Criptografia scrypt ativa</span>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Authorized Accounts Quick Selector for testing Daniel, Arthur & Pedro */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className={`rounded-2xl border p-6 ${
                darkMode
                  ? 'bg-slate-900/60 border-slate-800/80'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Contas Autorizadas • Equipe TRUINEXA</span>
              </div>
              <h2 className="text-base font-display font-semibold mb-1">
                Acesso Rápido por Perfil
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Clique em um dos 3 membros exclusivos da equipe para preencher as credenciais ou testar
                as permissões de Administrador e Comercial:
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    username: 'daniel',
                    name: 'Daniel',
                    role: 'Administrador',
                    device: 'Notebook • São Paulo',
                    defaultPass: 'Truinexa@Daniel2026',
                    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
                    desc: 'Acesso total, distribuição de leads, serviços, relatórios financeiros e equipe.',
                  },
                  {
                    username: 'arthur',
                    name: 'Arthur',
                    role: 'Comercial',
                    device: 'Celular • São Paulo',
                    defaultPass: 'Truinexa@Arthur2026',
                    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                    desc: 'Assumir clientes, Kanban, WhatsApp, propostas, agendamentos e fechamentos.',
                  },
                  {
                    username: 'pedro',
                    name: 'Pedro',
                    role: 'Comercial',
                    device: 'Computador • São Paulo',
                    defaultPass: 'Truinexa@Pedro2026',
                    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
                    desc: 'Atendimento comercial, gestão de leads próprios, follow-ups e vendas.',
                  },
                ].map((acct) => {
                  const dbUser = users.find((u) => u.username === acct.username);
                  const activePass = dbUser?.tempPasswordHint || acct.defaultPass;
                  const isInactive = dbUser?.status === 'inactive';

                  return (
                    <div
                      key={acct.username}
                      onClick={() =>
                        !isInactive && handleQuickFill(acct.username, activePass, acct.device)
                      }
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        identifier.toLowerCase() === acct.username
                          ? 'bg-indigo-500/10 border-indigo-500/50'
                          : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700'
                      } ${isInactive ? 'opacity-50 not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-sm text-white">
                            {acct.name}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            (@{acct.username})
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded border ${acct.badge}`}
                        >
                          {acct.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{acct.desc}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Dispositivo: {acct.device.split(' • ')[0]}</span>
                        <span className="text-indigo-400">Clique para preencher →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-900">
        <span>© 2026 TRUINEXA DIGITAL — Uso Exclusivo Interno (Clientes não possuem acesso)</span>
        <span className="font-mono">Sincronização Real-Time Ativa • Daniel • Arthur • Pedro</span>
      </footer>
    </div>
  );
};
