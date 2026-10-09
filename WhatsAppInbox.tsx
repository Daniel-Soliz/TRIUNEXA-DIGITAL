import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ExternalLink,
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { CRMState, User } from './crm';
import { supabase } from './supabaseApi';

type ConversationRow = {
  id: string;
  lead_id: string | null;
  wa_id: string;
  contact_name: string;
  status: 'open' | 'archived';
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
};

type Props = {
  state: CRMState;
  currentUser: User;
  onSelectLead: (leadId: string) => void;
};

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

function MessageStatus({ status }: { status: MessageRow['status'] }) {
  if (status === 'read') {
    return <CheckCheck className="h-3.5 w-3.5 text-sky-500" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-3.5 w-3.5 text-slate-500" />;
  }
  if (status === 'failed') {
    return <span className="text-[10px] font-semibold text-rose-600">Falhou</span>;
  }
  return <Check className="h-3.5 w-3.5 text-slate-500" />;
}

export const WhatsAppInbox: React.FC<Props> = ({
  state,
  currentUser,
  onSelectLead,
}) => {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'mine'>('all');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>({ connected: false });
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

  const unreadTotal = conversations.reduce(
    (sum, conversation) => sum + Number(conversation.unread_count || 0),
    0
  );

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const lead = conversation.lead_id ? leadById.get(conversation.lead_id) : null;

      if (filter === 'unread' && conversation.unread_count <= 0) return false;
      if (
        filter === 'mine' &&
        lead &&
        lead.responsibleId !== currentUser.id
      ) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        conversation.contact_name,
        conversation.wa_id,
        conversation.last_message,
        lead?.company,
        lead?.name,
        lead?.whatsapp,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, search, filter, leadById, currentUser.id]);

  const loadConnection = async () => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'truinexa-whatsapp',
        { body: { action: 'status' } }
      );
      if (invokeError) throw invokeError;
      setConnection({
        connected: Boolean(data?.connected),
        phoneNumberConfigured: Boolean(data?.phoneNumberConfigured),
        tokenConfigured: Boolean(data?.tokenConfigured),
        webhookConfigured: Boolean(data?.webhookConfigured),
      });
    } catch {
      setConnection({ connected: false });
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

    const rows = (data || []) as ConversationRow[];
    setConversations(rows);
    setLoadingConversations(false);

    if (!selectedId && rows[0]) {
      setSelectedId(rows[0].id);
    }
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
    setMobileChatOpen(true);
    setError(null);
    await markConversationRead(conversation);
    await loadMessages(conversation.id);
    void loadConversations();
  };

  useEffect(() => {
    void Promise.all([loadConversations(), loadConnection()]);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const channel = supabase
      .channel(`truinexa-whatsapp-inbox-${selectedId || 'none'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'truinexa_whatsapp_conversations' },
        () => {
          void loadConversations();
        }
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

  const sendMessage = async () => {
    const text = draft.trim();
    if (!selectedConversation || !text || sending) return;

    if (!connection.connected) {
      setError(
        'O WhatsApp Business ainda não está conectado. A estrutura do chat está pronta, mas falta conectar a conta da Meta para enviar e receber aqui.'
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
      if (data?.error) throw new Error(data?.message || 'Não foi possível enviar a mensagem.');

      setDraft('');
      await Promise.all([
        loadMessages(selectedConversation.id),
        loadConversations(),
      ]);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Não foi possível enviar a mensagem agora.'
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

  return (
    <div className="mx-auto h-[calc(100dvh-10.25rem)] min-h-[560px] max-w-[1500px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100dvh-7.5rem)]">
      <div className="flex h-full min-h-0">
        <aside
          className={`${
            mobileChatOpen ? 'hidden lg:flex' : 'flex'
          } w-full shrink-0 flex-col border-r border-slate-200 bg-white lg:w-[340px] xl:w-[380px]`}
        >
          <div className="border-b border-slate-200 px-4 pb-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Conversas
                  </h2>
                  {unreadTotal > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Atendimento WhatsApp da TRUINEXA
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  connection.connected
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {connection.connected ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {connection.connected ? 'Conectado' : 'Pendente'}
              </span>
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar conversa..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
              />
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto">
              {[
                { id: 'all' as const, label: 'Todas' },
                { id: 'unread' as const, label: 'Não lidas' },
                { id: 'mine' as const, label: 'Minhas' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                    filter === item.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingConversations && (
              <div className="p-6 text-center text-sm text-slate-400">
                Carregando conversas...
              </div>
            )}

            {!loadingConversations && visibleConversations.length === 0 && (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nenhuma conversa encontrada
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  As novas respostas aparecerão aqui quando a API oficial estiver conectada.
                </p>
              </div>
            )}

            {visibleConversations.map((conversation) => {
              const lead = conversation.lead_id
                ? leadById.get(conversation.lead_id)
                : null;
              const active = selectedId === conversation.id;
              const title =
                lead?.company ||
                conversation.contact_name ||
                conversation.wa_id;

              return (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => void openConversation(conversation)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${
                    active
                      ? 'bg-emerald-50/70'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white">
                    {initials(title)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                        {title}
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {formatListTime(conversation.last_message_at)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <p
                        className={`min-w-0 flex-1 truncate text-xs ${
                          conversation.unread_count > 0
                            ? 'font-semibold text-slate-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {conversation.last_direction === 'outbound' && 'Você: '}
                        {conversation.last_message || 'Conversa iniciada'}
                      </p>

                      {conversation.unread_count > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                          {conversation.unread_count > 99
                            ? '99+'
                            : conversation.unread_count}
                        </span>
                      )}
                    </div>

                    {lead?.responsibleName && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Responsável: {lead.responsibleName}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section
          className={`${
            mobileChatOpen ? 'flex' : 'hidden lg:flex'
          } min-w-0 flex-1 flex-col bg-[#efeae2]`}
        >
          {!selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-sm">
                <MessageCircle className="h-9 w-9 text-emerald-500" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-slate-800">
                Selecione uma conversa
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Quando o cliente responder no WhatsApp, a mensagem aparecerá aqui em tempo real.
              </p>
            </div>
          ) : (
            <>
              <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-4">
                <button
                  type="button"
                  onClick={() => setMobileChatOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden"
                  aria-label="Voltar para conversas"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white">
                  {initials(
                    selectedLead?.company ||
                      selectedConversation.contact_name ||
                      selectedConversation.wa_id
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {selectedLead?.company ||
                      selectedConversation.contact_name ||
                      selectedConversation.wa_id}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    {selectedLead?.name
                      ? `${selectedLead.name} • ${selectedConversation.wa_id}`
                      : selectedConversation.wa_id}
                  </div>
                </div>

                {selectedLead && (
                  <button
                    type="button"
                    onClick={() => onSelectLead(selectedLead.id)}
                    className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:inline-flex"
                  >
                    Ver cliente
                  </button>
                )}

                <button
                  type="button"
                  onClick={openNativeWhatsApp}
                  className="grid h-9 w-9 place-items-center rounded-full text-emerald-600 hover:bg-emerald-50"
                  title="Abrir no WhatsApp"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
                  aria-label="Mais opções"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </header>

              {!connection.connected && (
                <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <Smartphone className="h-4 w-4" />
                    Conexão da API oficial pendente
                  </div>
                  <p className="mt-1 leading-5 text-amber-700">
                    O histórico já está organizado. Para enviar e receber mensagens aqui dentro,
                    falta conectar o número da empresa à WhatsApp Business Cloud API.
                  </p>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
                {loadingMessages && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Carregando mensagens...
                  </div>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white/80 p-4 text-center text-xs leading-5 text-slate-500 shadow-sm">
                    Ainda não há mensagens nesta conversa.
                  </div>
                )}

                <div className="space-y-2">
                  {messages.map((message) => {
                    const outbound = message.direction === 'outbound';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          outbound ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[72%] ${
                            outbound
                              ? 'rounded-br-md bg-[#d9fdd3] text-slate-900'
                              : 'rounded-bl-md bg-white text-slate-900'
                          }`}
                        >
                          {message.message_type !== 'text' && (
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              {message.message_type}
                            </div>
                          )}

                          <p className="whitespace-pre-wrap break-words text-[13px] leading-5">
                            {message.body}
                          </p>

                          <div className="mt-1 flex items-center justify-end gap-1.5">
                            {outbound && message.sent_by_user_name && (
                              <span className="mr-auto truncate pr-3 text-[9px] text-slate-500">
                                {message.sent_by_user_name}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500">
                              {formatTime(message.created_at)}
                            </span>
                            {outbound && <MessageStatus status={message.status} />}
                          </div>

                          {message.error_message && (
                            <div className="mt-1 text-[10px] text-rose-600">
                              {message.error_message}
                            </div>
                          )}
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

              <div className="shrink-0 border-t border-slate-200 bg-white px-2 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:px-4">
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
                      connection.connected
                        ? 'Digite uma mensagem...'
                        : 'Conecte a API para responder aqui'
                    }
                    disabled={!connection.connected || sending}
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {connection.connected ? (
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!draft.trim() || sending}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Enviar mensagem"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openNativeWhatsApp}
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden sm:inline">Abrir WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
