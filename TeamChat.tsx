import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Hash,
  Megaphone,
  Send,
  Trash2,
  Users,
  MessageCircleMore,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { User } from './crm';
import { supabase } from './supabaseApi';

type ChatChannel = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: 'text' | 'announcements';
  sort_order: number;
  created_at: string;
};

type ChatMessage = {
  id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  user_role: 'admin' | 'comercial';
  content: string;
  created_at: string;
  edited_at?: string | null;
};

type ChatRead = {
  channel_id: string;
  last_read_at: string;
};

type ChatPresence = {
  user_id: string;
  current_channel_id?: string | null;
  last_seen_at: string;
};

interface TeamChatProps {
  currentUser: User;
  users: User[];
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const key = date.toDateString();
  if (key === today.toDateString()) return 'Hoje';
  if (key === yesterday.toDateString()) return 'Ontem';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

export function TeamChat({ currentUser, users }: TeamChatProps) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presence, setPresence] = useState<ChatPresence[]>([]);
  const [reads, setReads] = useState<ChatRead[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId) || null,
    [channels, activeChannelId]
  );

  const activeUsers = useMemo(
    () => users.filter((user) => user.status === 'active'),
    [users]
  );

  const onlineUserIds = useMemo(() => {
    const threshold = Date.now() - 2 * 60 * 1000;
    return new Set(
      presence
        .filter((entry) => new Date(entry.last_seen_at).getTime() >= threshold)
        .map((entry) => entry.user_id)
    );
  }, [presence]);

  const loadPresence = useCallback(async () => {
    const { data, error: presenceError } = await supabase
      .from('truinexa_chat_presence')
      .select('user_id,current_channel_id,last_seen_at');

    if (!presenceError) setPresence((data || []) as ChatPresence[]);
  }, []);

  const loadReads = useCallback(async () => {
    const { data, error: readError } = await supabase
      .from('truinexa_chat_reads')
      .select('channel_id,last_read_at')
      .eq('user_id', currentUser.id);

    if (!readError) setReads((data || []) as ChatRead[]);
  }, [currentUser.id]);

  const loadChannels = useCallback(async () => {
    const { data, error: channelError } = await supabase
      .from('truinexa_chat_channels')
      .select('*')
      .order('sort_order', { ascending: true });

    if (channelError) {
      setError(channelError.message);
      setLoading(false);
      return;
    }

    const next = (data || []) as ChatChannel[];
    setChannels(next);
    setActiveChannelId((current) => current || next[0]?.id || null);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (channelId: string) => {
    const { data, error: messageError } = await supabase
      .from('truinexa_chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(120);

    if (messageError) {
      setError(messageError.message);
      return;
    }

    setMessages(((data || []) as ChatMessage[]).reverse());
  }, []);

  const markChannelRead = useCallback(
    async (channelId: string) => {
      const timestamp = new Date().toISOString();
      const { error: readError } = await supabase.from('truinexa_chat_reads').upsert(
        {
          user_id: currentUser.id,
          channel_id: channelId,
          last_read_at: timestamp,
        },
        { onConflict: 'user_id,channel_id' }
      );

      if (!readError) {
        setReads((current) => [
          ...current.filter((entry) => entry.channel_id !== channelId),
          { channel_id: channelId, last_read_at: timestamp },
        ]);
        setUnreadCounts((current) => ({ ...current, [channelId]: 0 }));
      }
    },
    [currentUser.id]
  );

  const refreshUnreadCounts = useCallback(async () => {
    if (!channels.length) return;

    const readMap = new Map(reads.map((entry) => [entry.channel_id, entry.last_read_at]));
    const entries = await Promise.all(
      channels.map(async (channel) => {
        if (channel.id === activeChannelId) return [channel.id, 0] as const;

        const lastRead = readMap.get(channel.id);
        let query = supabase
          .from('truinexa_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', channel.id);

        if (lastRead) query = query.gt('created_at', lastRead);

        const { count } = await query;
        return [channel.id, count || 0] as const;
      })
    );

    setUnreadCounts(Object.fromEntries(entries));
  }, [channels, reads, activeChannelId]);

  const heartbeat = useCallback(async () => {
    await supabase.from('truinexa_chat_presence').upsert(
      {
        user_id: currentUser.id,
        current_channel_id: activeChannelId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  }, [currentUser.id, activeChannelId]);

  useEffect(() => {
    void Promise.all([loadChannels(), loadPresence(), loadReads()]);
  }, [loadChannels, loadPresence, loadReads]);

  useEffect(() => {
    if (!activeChannelId) return;
    void loadMessages(activeChannelId).then(() => markChannelRead(activeChannelId));
    void heartbeat();
  }, [activeChannelId, loadMessages, markChannelRead, heartbeat]);

  useEffect(() => {
    void refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  useEffect(() => {
    if (!channels.length) return;

    const realtime = supabase
      .channel(`truinexa-team-chat-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'truinexa_chat_messages' },
        (payload) => {
          const nextChannelId =
            (payload.new as Partial<ChatMessage>)?.channel_id ||
            (payload.old as Partial<ChatMessage>)?.channel_id;

          if (nextChannelId === activeChannelId && activeChannelId) {
            void loadMessages(activeChannelId).then(() => markChannelRead(activeChannelId));
          } else {
            void refreshUnreadCounts();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'truinexa_chat_presence' },
        () => void loadPresence()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(realtime);
    };
  }, [
    channels.length,
    currentUser.id,
    activeChannelId,
    loadMessages,
    loadPresence,
    markChannelRead,
    refreshUnreadCounts,
  ]);

  useEffect(() => {
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 45_000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void heartbeat();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [heartbeat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!activeChannel || !content || sending) return;

    if (activeChannel.kind === 'announcements' && currentUser.role !== 'admin') {
      setError('Somente o ADM pode publicar no canal de avisos.');
      return;
    }

    setSending(true);
    setError(null);

    const { error: sendError } = await supabase.from('truinexa_chat_messages').insert({
      channel_id: activeChannel.id,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      content,
    });

    if (sendError) {
      setError(sendError.message);
    } else {
      setDraft('');
      await markChannelRead(activeChannel.id);
    }

    setSending(false);
  };

  const handleDelete = async (message: ChatMessage) => {
    const canDelete = message.user_id === currentUser.id || currentUser.role === 'admin';
    if (!canDelete) return;

    if (!window.confirm('Apagar esta mensagem do chat?')) return;

    const { error: deleteError } = await supabase
      .from('truinexa_chat_messages')
      .delete()
      .eq('id', message.id);

    if (deleteError) setError(deleteError.message);
  };

  const channelIcon = (channel: ChatChannel) =>
    channel.kind === 'announcements' ? Megaphone : Hash;

  if (loading) {
    return (
      <div className="grid min-h-[520px] place-items-center rounded-3xl border border-white/[0.06] bg-[#141414]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-400">Conectando o chat da equipe...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#101010] shadow-2xl shadow-black/20">
      <div className="grid min-h-[calc(100dvh-9.5rem)] lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_230px]">
        <aside className="hidden border-r border-white/[0.06] bg-[#111111] p-3 lg:flex lg:flex-col">
          <div className="px-2 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
                <MessageCircleMore className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">TRUINEXA Chat</h2>
                <p className="text-[10px] text-slate-500">Equipe conectada</p>
              </div>
            </div>
          </div>

          <div className="mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            Canais
          </div>

          <div className="mt-2 space-y-1">
            {channels.map((channel) => {
              const Icon = channelIcon(channel);
              const active = channel.id === activeChannelId;
              const unread = unreadCounts[channel.id] || 0;

              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-indigo-500/15 font-semibold text-indigo-300'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                  {unread > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-auto rounded-2xl border border-white/[0.06] bg-[#171717] p-3">
            <div className="flex items-center gap-2">
              <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                {initials(currentUser.name)}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#171717] bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-400">Online</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="border-b border-white/[0.06] bg-[#141414]/95 px-3 py-3 backdrop-blur-xl sm:px-5">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {channels.map((channel) => {
                const Icon = channelIcon(channel);
                const active = channel.id === activeChannelId;
                const unread = unreadCounts[channel.id] || 0;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setActiveChannelId(channel.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/[0.05] text-slate-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {channel.name}
                    {unread > 0 && (
                      <span className="rounded-full bg-white/15 px-1.5 text-[9px]">{unread}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeChannel && (
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-slate-300">
                  {activeChannel.kind === 'announcements' ? (
                    <Megaphone className="h-4 w-4" />
                  ) : (
                    <Hash className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white">{activeChannel.name}</h2>
                  <p className="truncate text-[11px] text-slate-500">{activeChannel.description}</p>
                </div>
                <div className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 sm:flex">
                  <Wifi className="h-3 w-3" />
                  {onlineUserIds.size} online
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-[#0D0D0D] px-3 py-4 sm:px-5">
            {messages.length === 0 ? (
              <div className="grid h-full min-h-[360px] place-items-center">
                <div className="max-w-sm text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <MessageCircleMore className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">
                    Comece a conversa em #{activeChannel?.name || 'geral'}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    As mensagens ficam salvas na TRUINEXA e chegam em tempo real para a equipe.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((message, index) => {
                  const previous = messages[index - 1];
                  const showDay =
                    !previous ||
                    new Date(previous.created_at).toDateString() !==
                      new Date(message.created_at).toDateString();
                  const grouped =
                    previous &&
                    previous.user_id === message.user_id &&
                    new Date(message.created_at).getTime() -
                      new Date(previous.created_at).getTime() <
                      5 * 60 * 1000 &&
                    !showDay;
                  const canDelete =
                    message.user_id === currentUser.id || currentUser.role === 'admin';

                  return (
                    <React.Fragment key={message.id}>
                      {showDay && (
                        <div className="flex items-center gap-3 py-4">
                          <div className="h-px flex-1 bg-white/[0.06]" />
                          <span className="text-[10px] font-semibold text-slate-600">
                            {formatDay(message.created_at)}
                          </span>
                          <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>
                      )}

                      <div
                        className={`group flex gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.025] ${
                          grouped ? 'mt-0' : 'mt-2'
                        }`}
                      >
                        <div className="w-9 shrink-0">
                          {!grouped && (
                            <div
                              className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold text-white ${
                                message.user_role === 'admin'
                                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                                  : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                              }`}
                            >
                              {initials(message.user_name)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          {!grouped && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-white">{message.user_name}</span>
                              {message.user_role === 'admin' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-semibold text-indigo-300">
                                  <ShieldCheck className="h-2.5 w-2.5" />
                                  ADM
                                </span>
                              )}
                              <span className="text-[9px] text-slate-600">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[13px] leading-5 text-slate-300">
                              {message.content}
                              {message.edited_at && (
                                <span className="ml-1 text-[9px] text-slate-600">(editada)</span>
                              )}
                            </p>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(message)}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                                title="Apagar mensagem"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] bg-[#111111] p-3 sm:p-4">
            {error && (
              <div className="mb-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
                {error}
              </div>
            )}

            {activeChannel?.kind === 'announcements' && currentUser.role !== 'admin' ? (
              <div className="rounded-2xl border border-white/[0.06] bg-[#171717] px-4 py-3 text-center text-xs text-slate-500">
                <Megaphone className="mx-auto mb-1.5 h-4 w-4 text-indigo-400" />
                Canal de comunicados. Somente o ADM pode publicar aqui.
              </div>
            ) : (
              <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#181818] p-2 focus-within:border-indigo-500/50">
                <textarea
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value.slice(0, 2000));
                    setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={1}
                  placeholder={`Mensagem em #${activeChannel?.name || 'geral'}`}
                  className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:ring-0"
                />
                <button
                  type="button"
                  disabled={!draft.trim() || sending}
                  onClick={() => void handleSend()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Enviar mensagem"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="mt-1.5 px-1 text-[9px] text-slate-600">
              Enter envia • Shift + Enter quebra linha • máximo 2.000 caracteres
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-white/[0.06] bg-[#111111] p-4 xl:block">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            <Users className="h-3.5 w-3.5" />
            Equipe — {activeUsers.length}
          </div>

          <div className="mt-4 space-y-2">
            {activeUsers
              .slice()
              .sort((a, b) => {
                const aOnline = onlineUserIds.has(a.id) ? 1 : 0;
                const bOnline = onlineUserIds.has(b.id) ? 1 : 0;
                return bOnline - aOnline || a.name.localeCompare(b.name);
              })
              .map((user) => {
                const online = onlineUserIds.has(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]"
                  >
                    <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] font-bold text-white">
                      {initials(user.name)}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111111] ${
                          online ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-300">{user.name}</div>
                      <div className={`text-[9px] ${online ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {online ? 'Online' : user.role === 'admin' ? 'Administrador' : 'Comercial'}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </aside>
      </div>
    </section>
  );
}
