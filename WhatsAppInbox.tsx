import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronRight,
  Columns3,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  Unplug,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { CRMState, User } from './crm';
import { supabase } from './supabaseApi';

type QueueStatus = 'queue' | 'attending' | 'pending' | 'done';

type ConversationRow = {
  id: string;
  lead_id: string | null;
  wa_id: string;
  contact_name: string;
  status: 'open' | 'archived';
  queue_status: QueueStatus;
  unread_count: number;
  last_message: string;
  last_message_at: string | null;
  last_direction: 'inbound' | 'outbound' | null;
  last_read_at: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  lead_id: string | null;
  meta_message_id: string | null;
  direction: 'inbound' | 'outbound';
  sender_wa_id: string | null;
  recipient_wa_id: string | null;
  message_type: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'received' | 'failed';
  sent_by_user_id: string | null;
  sent_by_user_name: string | null;
  error_message: string | null;
  created_at: string;
};

type ConnectionState = {
  connected: boolean;
  phoneNumberConfigured?: boolean;
  tokenConfigured?: boolean;
  webhookConfigured?: boolean;
  webhookVerified?: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  businessAccountId?: string;
  callbackUrl?: string;
};

type Props = {
  state: CRMState;
  currentUser: User;
  onSelectLead: (leadId: string) => void;
};

const QUEUES: Array<{
  id: QueueStatus;
  title: string;
  subtitle: string;
  dot: string;
}> = [
  { id: 'queue', title: 'Fila / Novas', subtitle: 'Chegaram e aguardam atendimento', dot: 'bg-cyan-500' },
  { id: 'attending', title: 'Em atendimento', subtitle: 'Conversas em andamento', dot: 'bg-amber-500' },
  { id: 'pending', title: 'Pendentes', subtitle: 'Aguardando retorno', dot: 'bg-violet-500' },
  { id: 'done', title: 'Concluídas', subtitle: 'Atendimentos finalizados', dot: 'bg-emerald-500' },
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'WA';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function formatTime(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatListTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (sameDay) return formatTime(value);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function createVerifyToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return 'TRX-WA-' + Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

function MessageStatus({ status }: { status: MessageRow['status'] }) {
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-sky-500" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-slate-500" />;
  if (status === 'failed') return <span className="text-[10px] font-semibold text-rose-600">Falhou</span>;
  return <Check className="h-3.5 w-3.5 text-slate-500" />;
}

export const WhatsAppInbox: React.FC<Props> = ({
  state,
  currentUser,
  onSelectLead,
}) => {
  const [screen, setScreen] = useState<'board' | 'connect'>('connect');
  const [connectionLoaded, setConnectionLoaded] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>({ connected: false });
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState(() => createVerifyToken());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const leadById = useMemo(
    () => new Map(state.leads.map((lead) => [lead.id, lead])),
    [state.leads]
  );

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) || null;

  const selectedLead = selectedConversation?.lead_id
    ? leadById.get(selectedConversation.lead_id) || null
    : null;

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const lead = conversation.lead_id ? leadById.get(conversation.lead_id) : null;
      return [
        conversation.contact_name,
        conversation.wa_id,
        conversation.last_message,
        lead?.company,
        lead?.name,
        lead?.whatsapp,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [conversations, search, leadById]);

  const loadConnection = async (chooseScreen = false) => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'truinexa-whatsapp',
        { body: { action: 'status' } }
      );
      if (invokeError) throw invokeError;

      const next: ConnectionState = {
        connected: Boolean(data?.connected),
        phoneNumberConfigured: Boolean(data?.phoneNumberConfigured),
        tokenConfigured: Boolean(data?.tokenConfigured),
        webhookConfigured: Boolean(data?.webhookConfigured),
        webhookVerified: Boolean(data?.webhookVerified),
        displayPhoneNumber: String(data?.displayPhoneNumber || ''),
        verifiedName: String(data?.verifiedName || ''),
        businessAccountId: String(data?.businessAccountId || ''),
        callbackUrl: String(data?.callbackUrl || ''),
      };

      setConnection(next);
      if (chooseScreen) {
        setScreen(next.connected && next.webhookVerified ? 'board' : 'connect');
      }
    } catch {
      setConnection({ connected: false });
    } finally {
      setConnectionLoaded(true);
    }
  };

  const loadConversations = async () => {
    const { data, error: queryError } = await supabase
      .from('truinexa_whatsapp_conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (queryError) {
      setError('Não foi possível carregar as conversas.');
      setLoadingConversations(false);
      return;
    }

    setConversations((data || []) as ConversationRow[]);
    setLoadingConversations(false);
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    const { data, error: queryError } = await supabase
      .from('truinexa_whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (queryError) {
      setError('Não foi possível carregar as mensagens desta conversa.');
      setMessages([]);
    } else {
      setMessages((data || []) as MessageRow[]);
    }
    setLoadingMessages(false);
  };

  const copyValue = async (label: string, value: string) => {
    if (!value) return;
    await navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const connectWhatsApp = async () => {
    if (currentUser.role !== 'admin') {
      setConnectError('Somente o acesso ADM pode configurar a conexão do WhatsApp.');
      return;
    }

    setConnecting(true);
    setConnectError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'truinexa-whatsapp',
        {
          body: {
            action: 'connect',
            phoneNumberId,
            businessAccountId,
            accessToken,
            appSecret,
            verifyToken,
          },
        }
      );

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data?.message || 'Não foi possível conectar.');

      setAccessToken('');
      setAppSecret('');
      await loadConnection(false);
    } catch (connectFailure) {
      setConnectError(
        connectFailure instanceof Error
          ? connectFailure.message
          : 'Não foi possível validar a conta na Meta.'
      );
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (currentUser.role !== 'admin') return;
    setDisconnecting(true);
    setConnectError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'truinexa-whatsapp',
        { body: { action: 'disconnect' } }
      );
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data?.message || 'Não foi possível desconectar.');

      setConnection({ connected: false });
      setPhoneNumberId('');
      setBusinessAccountId('');
      setAccessToken('');
      setAppSecret('');
      setVerifyToken(createVerifyToken());
    } catch (disconnectFailure) {
      setConnectError(
        disconnectFailure instanceof Error
          ? disconnectFailure.message
          : 'Não foi possível desconectar.'
      );
    } finally {
      setDisconnecting(false);
    }
  };

  const markConversationRead = async (conversation: ConversationRow) => {
    if (conversation.unread_count <= 0) return;

    await supabase
      .from('truinexa_whatsapp_conversations')
      .update({
        unread_count: 0,
        last_read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);
  };

  const openConversation = async (conversation: ConversationRow) => {
    setSelectedId(conversation.id);
    setError(null);
    await markConversationRead(conversation);
    await loadMessages(conversation.id);
    void loadConversations();
  };

  const closeConversation = () => {
    setSelectedId(null);
    setMessages([]);
    setDraft('');
    setError(null);
  };

  const moveConversation = async (
    conversationId: string,
    queueStatus: QueueStatus
  ) => {
    const { error: moveError } = await supabase
      .from('truinexa_whatsapp_conversations')
      .update({
        queue_status: queueStatus,
        status: queueStatus === 'done' ? 'archived' : 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (moveError) {
      setError('Não foi possível mover a conversa.');
      return;
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              queue_status: queueStatus,
              status: queueStatus === 'done' ? 'archived' : 'open',
            }
          : conversation
      )
    );
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!selectedConversation || !text || sending) return;

    if (!connection.connected || !connection.webhookVerified) {
      setError(
        'Finalize a conexão oficial do WhatsApp antes de responder pela TRUINEXA.'
      );
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'truinexa-whatsapp',
        {
          body: {
            action: 'send',
            conversationId: selectedConversation.id,
            text,
          },
        }
      );

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data?.message || 'Não foi possível enviar.');

      setDraft('');
      if (selectedConversation.queue_status === 'queue') {
        await moveConversation(selectedConversation.id, 'attending');
      }
      await Promise.all([
        loadMessages(selectedConversation.id),
        loadConversations(),
      ]);
    } catch (sendFailure) {
      setError(
        sendFailure instanceof Error
          ? sendFailure.message
          : 'Não foi possível enviar a mensagem.'
      );
    } finally {
      setSending(false);
    }
  };

  const openNativeWhatsApp = () => {
    if (!selectedConversation) return;
    const phone = onlyDigits(selectedConversation.wa_id);
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    void Promise.all([loadConnection(true), loadConversations()]);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`truinexa-whatsapp-board-${selectedId || 'none'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'truinexa_whatsapp_conversations' },
        () => void loadConversations()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'truinexa_whatsapp_messages' },
        (payload: any) => {
          void loadConversations();
          const conversationId =
            payload?.new?.conversation_id || payload?.old?.conversation_id || null;
          if (selectedId && conversationId === selectedId) {
            void loadMessages(selectedId);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (!connectionLoaded) {
    return (
      <div className="grid min-h-[440px] place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">Carregando Atendimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setScreen('board')}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition ${
              screen === 'board'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Columns3 className="h-4 w-4" />
            Atendimentos
          </button>

          <button
            type="button"
            onClick={() => setScreen('connect')}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition ${
              screen === 'connect'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Link2 className="h-4 w-4" />
            Conectar WhatsApp
          </button>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
            connection.connected && connection.webhookVerified
              ? 'bg-emerald-50 text-emerald-700'
              : connection.connected
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-600'
          }`}
        >
          {connection.connected && connection.webhookVerified ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          {connection.connected && connection.webhookVerified
            ? `WhatsApp conectado${connection.displayPhoneNumber ? ` • ${connection.displayPhoneNumber}` : ''}`
            : connection.connected
              ? 'Credenciais conectadas • falta confirmar webhook'
              : 'WhatsApp não conectado'}
        </div>
      </div>

      {screen === 'connect' ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f7f2ea] shadow-sm">
          <div className="grid min-h-[620px] lg:grid-cols-[0.9fr_1.1fr]">
            <section className="border-b border-slate-200 bg-white p-5 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    Conectar WhatsApp
                  </h2>
                  <p className="text-xs text-slate-500">
                    Integração oficial com a WhatsApp Business Platform
                  </p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-900">
                      Conexão segura
                    </div>
                    <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                      O QR do WhatsApp Web serve para abrir sua conta no navegador. Para um CRM
                      receber e responder mensagens de verdade, a conexão correta é pela API oficial
                      da Meta. Seus tokens ficam guardados no servidor, não no navegador.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  ['1', 'Abra a Meta', 'Use sua conta empresarial e configure o WhatsApp Business Platform.'],
                  ['2', 'Cadastre os dados abaixo', 'Informe o número/Phone Number ID e as credenciais do app.'],
                  ['3', 'Configure o webhook', 'Na Meta, use a URL e o Verify Token mostrados aqui.'],
                  ['4', 'Receba as mensagens', 'Depois da confirmação, respostas entram na TRUINEXA em tempo real.'],
                ].map(([number, title, description]) => (
                  <div key={number} className="flex gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700">
                      {number}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{title}</div>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open('https://business.facebook.com/', '_blank', 'noopener,noreferrer')
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-semibold text-white hover:bg-emerald-600"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Meta Business
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.open('https://developers.facebook.com/apps/', '_blank', 'noopener,noreferrer')
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Settings2 className="h-4 w-4" />
                  Painel de Apps
                </button>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Credenciais da Meta</span>
                    <span className={connection.connected ? 'font-semibold text-emerald-600' : 'font-semibold text-slate-400'}>
                      {connection.connected ? 'OK' : 'Pendente'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Webhook confirmado</span>
                    <span className={connection.webhookVerified ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>
                      {connection.webhookVerified ? 'OK' : 'Pendente'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">Receber respostas</span>
                    <span className={connection.connected && connection.webhookVerified ? 'font-semibold text-emerald-600' : 'font-semibold text-slate-400'}>
                      {connection.connected && connection.webhookVerified ? 'Pronto' : 'Ainda não'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-5 sm:p-8">
              <div className="mx-auto max-w-2xl">
                <h3 className="text-lg font-bold text-slate-900">
                  {connection.connected ? 'Finalizar conexão' : 'Dados da conexão'}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Essas informações ficam protegidas no backend da TRUINEXA.
                </p>

                {currentUser.role !== 'admin' && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Somente o acesso ADM pode configurar ou desconectar o WhatsApp.
                  </div>
                )}

                {!connection.connected && currentUser.role === 'admin' && (
                  <div className="mt-5 grid gap-4">
                    <label className="text-xs font-semibold text-slate-600">
                      Phone Number ID *
                      <input
                        value={phoneNumberId}
                        onChange={(event) => setPhoneNumberId(event.target.value)}
                        placeholder="Ex.: 123456789012345"
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-600">
                      WhatsApp Business Account ID
                      <input
                        value={businessAccountId}
                        onChange={(event) => setBusinessAccountId(event.target.value)}
                        placeholder="WABA ID"
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-600">
                      Access Token *
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(event) => setAccessToken(event.target.value)}
                        placeholder="Token permanente da Meta"
                        autoComplete="off"
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-600">
                      App Secret *
                      <input
                        type="password"
                        value={appSecret}
                        onChange={(event) => setAppSecret(event.target.value)}
                        placeholder="App Secret do aplicativo Meta"
                        autoComplete="off"
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-600">
                      Verify Token *
                      <div className="mt-1.5 flex gap-2">
                        <input
                          value={verifyToken}
                          onChange={(event) => setVerifyToken(event.target.value)}
                          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        />
                        <button
                          type="button"
                          onClick={() => void copyValue('verify', verifyToken)}
                          className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"
                          title="Copiar Verify Token"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </label>

                    {connectError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        {connectError}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={connecting}
                      onClick={() => void connectWhatsApp()}
                      className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {connecting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                      {connecting ? 'Validando na Meta...' : 'Conectar e validar'}
                    </button>
                  </div>
                )}

                {connection.connected && (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                          <Wifi className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900">
                            Credenciais validadas
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {connection.verifiedName || 'Conta WhatsApp Business'}
                            {connection.displayPhoneNumber
                              ? ` • ${connection.displayPhoneNumber}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-bold text-slate-900">
                        Configure o Webhook na Meta
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Copie estes dois valores para a configuração de Webhooks do seu app.
                        Depois clique em “Atualizar status”.
                      </p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Callback URL
                          </div>
                          <div className="flex gap-2">
                            <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-slate-950 px-3 py-2.5 text-[11px] text-emerald-300">
                              {connection.callbackUrl || 'Carregando...'}
                            </code>
                            <button
                              type="button"
                              onClick={() => void copyValue('callback', connection.callbackUrl || '')}
                              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Verify Token
                          </div>
                          <div className="flex gap-2">
                            <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-slate-950 px-3 py-2.5 text-[11px] text-emerald-300">
                              {verifyToken}
                            </code>
                            <button
                              type="button"
                              onClick={() => void copyValue('verify', verifyToken)}
                              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {copied && (
                        <p className="mt-2 text-[11px] font-semibold text-emerald-600">
                          Copiado.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => void loadConnection(false)}
                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-semibold text-white hover:bg-emerald-600"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Atualizar status
                      </button>

                      {connection.webhookVerified && (
                        <button
                          type="button"
                          onClick={() => setScreen('board')}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white"
                        >
                          Abrir atendimentos
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        disabled={disconnecting}
                        onClick={() => void disconnectWhatsApp()}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 disabled:opacity-60"
                      >
                        <Unplug className="h-4 w-4" />
                        {disconnecting ? 'Desconectando...' : 'Desconectar WhatsApp'}
                      </button>
                    )}

                    {connectError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        {connectError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {!connection.connected || !connection.webhookVerified ? (
            <button
              type="button"
              onClick={() => setScreen('connect')}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    Finalize a conexão do WhatsApp
                  </div>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    Você pode organizar o histórico agora; mensagens reais entram após a confirmação do webhook.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-amber-700" />
            </button>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Central de atendimento
                </h2>
                <p className="text-xs text-slate-500">
                  Fila separada por etapa, como um painel de atendimento.
                </p>
              </div>
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar cliente, telefone ou mensagem..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex min-h-[560px] gap-3 overflow-x-auto pb-3 snap-x snap-mandatory">
            {QUEUES.map((queue) => {
              const items = filteredConversations.filter(
                (conversation) => conversation.queue_status === queue.id
              );

              return (
                <section
                  key={queue.id}
                  className="w-[86vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] sm:w-[300px]"
                >
                  <header className="border-b border-slate-200 bg-white px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${queue.dot}`} />
                        <span className="text-sm font-bold text-slate-900">{queue.title}</span>
                      </div>
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
                        {items.length}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{queue.subtitle}</p>
                  </header>

                  <div className="max-h-[calc(100dvh-270px)] min-h-[500px] space-y-2 overflow-y-auto p-2">
                    {loadingConversations && (
                      <div className="p-5 text-center text-xs text-slate-400">
                        Carregando...
                      </div>
                    )}

                    {!loadingConversations && items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs text-slate-400">
                        Nenhuma conversa nesta etapa.
                      </div>
                    )}

                    {items.map((conversation) => {
                      const lead = conversation.lead_id
                        ? leadById.get(conversation.lead_id)
                        : null;
                      const title =
                        lead?.company ||
                        conversation.contact_name ||
                        conversation.wa_id;

                      return (
                        <article
                          key={conversation.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow"
                        >
                          <button
                            type="button"
                            onClick={() => void openConversation(conversation)}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white">
                              {initials(title)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="min-w-0 flex-1 truncate text-xs font-bold text-slate-900">
                                  {title}
                                </div>
                                <span className="text-[9px] text-slate-400">
                                  {formatListTime(conversation.last_message_at)}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                                {conversation.last_direction === 'outbound' ? 'Você: ' : ''}
                                {conversation.last_message || 'Conversa iniciada'}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                {conversation.unread_count > 0 && (
                                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
                                    {conversation.unread_count} nova{conversation.unread_count > 1 ? 's' : ''}
                                  </span>
                                )}
                                {lead?.responsibleName && (
                                  <span className="truncate text-[9px] text-slate-400">
                                    {lead.responsibleName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          <div className="mt-3 border-t border-slate-100 pt-2">
                            <select
                              value={conversation.queue_status}
                              onChange={(event) =>
                                void moveConversation(
                                  conversation.id,
                                  event.target.value as QueueStatus
                                )
                              }
                              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600 outline-none"
                            >
                              {QUEUES.map((option) => (
                                <option key={option.id} value={option.id}>
                                  Mover para: {option.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {selectedConversation && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/45 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Fechar conversa"
            onClick={closeConversation}
            className="absolute inset-0"
          />
          <section className="relative z-10 flex h-[100dvh] w-full flex-col bg-[#efeae2] shadow-2xl sm:max-w-[560px]">
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
              <button
                type="button"
                onClick={closeConversation}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5 sm:hidden" />
                <X className="hidden h-5 w-5 sm:block" />
              </button>

              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white">
                {initials(
                  selectedLead?.company ||
                    selectedConversation.contact_name ||
                    selectedConversation.wa_id
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-900">
                  {selectedLead?.company ||
                    selectedConversation.contact_name ||
                    selectedConversation.wa_id}
                </div>
                <div className="truncate text-[10px] text-slate-500">
                  {selectedLead?.name
                    ? `${selectedLead.name} • ${selectedConversation.wa_id}`
                    : selectedConversation.wa_id}
                </div>
              </div>

              {selectedLead && (
                <button
                  type="button"
                  onClick={() => onSelectLead(selectedLead.id)}
                  className="hidden rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-semibold text-slate-600 sm:block"
                >
                  Ver cliente
                </button>
              )}
            </header>

            <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
              <select
                value={selectedConversation.queue_status}
                onChange={(event) =>
                  void moveConversation(
                    selectedConversation.id,
                    event.target.value as QueueStatus
                  )
                }
                className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600"
              >
                {QUEUES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={openNativeWhatsApp}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-semibold text-emerald-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                WhatsApp
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
              {loadingMessages && (
                <div className="py-8 text-center text-xs text-slate-500">
                  Carregando mensagens...
                </div>
              )}

              {!loadingMessages && messages.length === 0 && (
                <div className="mx-auto mt-10 max-w-sm rounded-xl bg-white/90 p-4 text-center text-xs leading-5 text-slate-500 shadow-sm">
                  Ainda não há mensagens registradas nesta conversa.
                </div>
              )}

              <div className="space-y-2">
                {messages.map((message) => {
                  const outbound = message.direction === 'outbound';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3 py-2 shadow-sm ${
                          outbound
                            ? 'rounded-br-md bg-[#d9fdd3]'
                            : 'rounded-bl-md bg-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-900">
                          {message.body}
                        </p>
                        <div className="mt-1 flex items-center justify-end gap-1.5">
                          {outbound && message.sent_by_user_name && (
                            <span className="mr-auto pr-3 text-[9px] text-slate-500">
                              {message.sent_by_user_name}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500">
                            {formatTime(message.created_at)}
                          </span>
                          {outbound && <MessageStatus status={message.status} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {error && (
              <div className="shrink-0 border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="shrink-0 border-t border-slate-200 bg-white p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder={
                    connection.connected && connection.webhookVerified
                      ? 'Digite uma mensagem...'
                      : 'Finalize a conexão para responder aqui'
                  }
                  disabled={!connection.connected || !connection.webhookVerified || sending}
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={
                    !draft.trim() ||
                    sending ||
                    !connection.connected ||
                    !connection.webhookVerified
                  }
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
