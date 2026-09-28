import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  Calendar,
  CheckSquare,
  Briefcase,
  BarChart3,
  Bell,
  UserCog,
  Settings,
  Search,
  Plus,
  LogOut,
  TrendingUp,
  DollarSign,
  PhoneCall,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  FolderKanban,
  Hand,
  MapPin,
  Menu,
  X,
  Wifi,
} from 'lucide-react';
import {
  CRMState,
  User,
  Lead,
  KanbanStage,
  KANBAN_STAGES,
  ClosedDealDetails,
  LostDetails,
  InteractionType,
  AppointmentType,
  ServiceItem,
  ProjectStage,
} from './crm';
import { LoginView } from './LoginView';
import { KanbanBoard } from './KanbanBoard';
import { LeadDetailModal } from './LeadDetailModal';
import {
  NewLeadModal,
  CloseDealModal,
  LostLeadModal,
  WhatsAppModal,
  QuickAppointmentModal,
} from './ActionModals';
import {
  AtendimentoModule,
  AgendaModule,
  ServicesModule,
  ProjectsModule,
  ReportsModule,
  TeamAndSettingsModule,
} from './ModulesView';

type NavTab =
  | 'dashboard'
  | 'leads'
  | 'kanban'
  | 'atendimento'
  | 'agenda'
  | 'tarefas'
  | 'servicos'
  | 'projetos'
  | 'relatorios'
  | 'notificacoes'
  | 'equipe'
  | 'configuracoes';

const QUICK_FILTERS = [
  'Todos',
  'Sites',
  'Flyers',
  'Marketing',
  'Consultoria',
  'Suporte',
  'Novos',
  'Interessados',
  'Propostas',
  'Fechados',
  'Perdidos',
] as const;

type QuickFilterType = (typeof QUICK_FILTERS)[number];

export default function App() {
  const [crmState, setCrmState] = useState<CRMState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [darkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [realtimePulse, setRealtimePulse] = useState<string | null>(null);

  // Global Search & Quick Filters (Section 12)
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('Todos');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');

  // Active Modals
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [closeDealLead, setCloseDealLead] = useState<Lead | null>(null);
  const [lostDealLead, setLostDealLead] = useState<Lead | null>(null);
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
  const [appointmentLead, setAppointmentLead] = useState<Lead | null>(null);

  // Initial state fetch & Real-time SSE connection (Section 24)
  useEffect(() => {
    fetch('/api/state')
      .then((r) => r.json())
      .then((data: CRMState) => {
        setCrmState(data);
        const savedUserId = localStorage.getItem('truinexa_user_id');
        if (savedUserId) {
          const found = data.users.find((u) => u.id === savedUserId && u.status === 'active');
          if (found) setCurrentUser(found);
        }
      })
      .catch((err) => console.error('Initial state error:', err));

    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.state) {
          setCrmState(parsed.state);
          setRealtimePulse(new Date().toLocaleTimeString('pt-BR'));
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Keep currentUser synced with latest permissions/status from server
  useEffect(() => {
    if (crmState && currentUser) {
      const updated = crmState.users.find((u) => u.id === currentUser.id);
      if (updated) {
        if (updated.status === 'inactive') {
          setCurrentUser(null);
          localStorage.removeItem('truinexa_user_id');
        } else {
          setCurrentUser(updated);
        }
      }
    }
  }, [crmState]);

  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('truinexa_user_id', user.id);
    localStorage.setItem('truinexa_token', token);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    }
    setCurrentUser(null);
    localStorage.removeItem('truinexa_user_id');
    localStorage.removeItem('truinexa_token');
  };

  // Switch active user quickly for testing Daniel, Arthur, Pedro permissions
  const handleQuickSwitchUser = (userId: string) => {
    if (!crmState) return;
    const target = crmState.users.find((u) => u.id === userId && u.status === 'active');
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('truinexa_user_id', target.id);
    }
  };

  // Filtered Leads according to User Role Permissions + Search + Quick Filters
  const visibleLeads = useMemo(() => {
    if (!crmState || !currentUser) return [];

    return crmState.leads.filter((lead) => {
      // Role-based visibility (Section 2):
      // Daniel sees all; Arthur & Pedro see available leads (responsibleId === null) and their own leads (unless granted canViewAllLeads by Daniel)
      const canSeeAll =
        currentUser.role === 'admin' || currentUser.permissions.canViewAllLeads;
      if (
        !canSeeAll &&
        lead.responsibleId !== null &&
        lead.responsibleId !== currentUser.id
      ) {
        return false;
      }

      // Responsible filter
      if (responsibleFilter === 'unassigned' && lead.responsibleId !== null) return false;
      if (
        responsibleFilter !== 'all' &&
        responsibleFilter !== 'unassigned' &&
        lead.responsibleId !== responsibleFilter
      ) {
        return false;
      }

      // Quick Filter (Section 12)
      if (quickFilter !== 'Todos') {
        switch (quickFilter) {
          case 'Sites':
            if (lead.serviceCategory !== 'Desenvolvimento Digital') return false;
            break;
          case 'Flyers':
            if (lead.serviceCategory !== 'Design') return false;
            break;
          case 'Marketing':
            if (lead.serviceCategory !== 'Marketing Digital') return false;
            break;
          case 'Consultoria':
            if (lead.serviceCategory !== 'Consultoria') return false;
            break;
          case 'Suporte':
            if (lead.serviceCategory !== 'Suporte Técnico') return false;
            break;
          case 'Novos':
            if (lead.stage !== 'NOVOS LEADS' && lead.stage !== 'AGUARDANDO CONTATO')
              return false;
            break;
          case 'Interessados':
            if (lead.stage !== 'INTERESSADO' && lead.stage !== 'CONTATO REALIZADO')
              return false;
            break;
          case 'Propostas':
            if (
              lead.stage !== 'PROPOSTA ENVIADA' &&
              lead.stage !== 'NEGOCIAÇÃO' &&
              lead.stage !== 'AGUARDANDO RESPOSTA'
            )
              return false;
            break;
          case 'Fechados':
            if (lead.stage !== 'FECHADO') return false;
            break;
          case 'Perdidos':
            if (lead.stage !== 'PERDIDO') return false;
            break;
        }
      }

      // Search Query (Section 12: Nome, Empresa, Telefone, E-mail, Cidade, Bairro, Categoria, Serviço, Responsável, Status)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          lead.name,
          lead.company,
          lead.phone,
          lead.whatsapp,
          lead.email,
          lead.city,
          lead.neighborhood,
          lead.segment,
          lead.serviceCategory,
          lead.serviceInterest,
          lead.responsibleName,
          lead.stage,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [crmState, currentUser, searchQuery, quickFilter, responsibleFilter]);

  const selectedLead = useMemo(
    () => crmState?.leads.find((l) => l.id === selectedLeadId) || null,
    [crmState, selectedLeadId]
  );

  // API Handlers
  const handleCreateLead = async (leadData: Partial<Lead>) => {
    if (!currentUser) return;
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, leadData }),
    });
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    if (!currentUser) return;
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, updates }),
    });
  };

  const handleMoveStage = async (lead: Lead, targetStage: KanbanStage) => {
    if (targetStage === 'FECHADO') {
      setCloseDealLead(lead);
      return;
    }
    if (targetStage === 'PERDIDO') {
      setLostDealLead(lead);
      return;
    }
    await handleUpdateLead(lead.id, { stage: targetStage });
  };

  const handleClaimLead = async (lead: Lead) => {
    if (!currentUser) return;
    await handleUpdateLead(lead.id, {
      responsibleId: currentUser.id,
      responsibleName: currentUser.name,
    });
  };

  const handleConfirmCloseDeal = async (leadId: string, closedDetails: ClosedDealDetails) => {
    if (!currentUser) return;
    await fetch(`/api/leads/${leadId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, closedDetails }),
    });
  };

  const handleConfirmLostDeal = async (leadId: string, lostDetails: LostDetails) => {
    if (!currentUser) return;
    await fetch(`/api/leads/${leadId}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, lostDetails }),
    });
  };

  const handleDeleteLeadPermanently = async (leadId: string) => {
    if (!currentUser) return;
    await fetch(`/api/leads/${leadId}?actorId=${currentUser.id}`, {
      method: 'DELETE',
    });
  };

  const handleAddInteraction = async (
    leadId: string,
    type: InteractionType,
    message: string,
    autoAdvanceStage?: KanbanStage
  ) => {
    if (!currentUser) return;
    await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        leadId,
        type,
        message,
        autoAdvanceStage,
      }),
    });
  };

  const handleCreateAppointment = async (appointment: {
    leadId: string;
    responsibleId: string;
    type: AppointmentType;
    title: string;
    date: string;
    time: string;
    notes: string;
  }) => {
    if (!currentUser) return;
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, appointment }),
    });
  };

  const handleToggleAppointment = async (
    id: string,
    status: 'pendente' | 'concluido' | 'cancelado'
  ) => {
    if (!currentUser) return;
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, status }),
    });
  };

  const handleAddService = async (service: Partial<ServiceItem>) => {
    if (!currentUser) return;
    await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, service }),
    });
  };

  const handleUpdateService = async (id: string, updates: Partial<ServiceItem>) => {
    if (!currentUser) return;
    await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, updates }),
    });
  };

  const handleUpdateProjectStage = async (projectId: string, stage: ProjectStage) => {
    if (!currentUser) return;
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, updates: { stage } }),
    });
  };

  const handleUpdateUser = async (
    userId: string,
    updates: Partial<User>,
    resetTempPassword?: string
  ) => {
    if (!currentUser) return;
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, updates, resetTempPassword }),
    });
  };

  const handleUpdateConfig = async (configUpdates: Partial<CRMState['config']>) => {
    if (!currentUser) return;
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, configUpdates }),
    });
  };

  const handleMarkNotificationsRead = async (notificationId: string | 'all') => {
    if (!currentUser) return;
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, notificationId }),
    });
  };

  if (!crmState) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-mono text-slate-400">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Carregando TRUINEXA DIGITAL CRM...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        users={crmState.users}
        onLoginSuccess={handleLoginSuccess}
        darkMode={darkMode}
      />
    );
  }

  // Dashboard Metrics Calculation (Section 3)
  const todayStr = new Date().toISOString().slice(0, 10);
  const newLeadsToday = crmState.leads.filter(
    (l) => l.createdAt.slice(0, 10) === todayStr || l.stage === 'NOVOS LEADS'
  ).length;
  const awaitingContact = crmState.leads.filter(
    (l) => l.stage === 'NOVOS LEADS' || l.stage === 'AGUARDANDO CONTATO'
  ).length;
  const contactedCount = crmState.leads.filter(
    (l) =>
      l.stage !== 'NOVOS LEADS' &&
      l.stage !== 'AGUARDANDO CONTATO' &&
      l.stage !== 'PERDIDO'
  ).length;
  const proposalsSentCount = crmState.leads.filter(
    (l) =>
      l.stage === 'PROPOSTA ENVIADA' ||
      l.stage === 'NEGOCIAÇÃO' ||
      l.stage === 'AGUARDANDO RESPOSTA'
  ).length;
  const inNegotiationCount = crmState.leads.filter(
    (l) => l.stage === 'INTERESSADO' || l.stage === 'NEGOCIAÇÃO'
  ).length;
  const closedContracts = crmState.leads.filter((l) => l.stage === 'FECHADO');
  const lostClients = crmState.leads.filter((l) => l.stage === 'PERDIDO');

  const conversionRate =
    crmState.leads.length > 0
      ? ((closedContracts.length / crmState.leads.length) * 100).toFixed(1)
      : '0.0';

  const forecastedRevenue = crmState.leads
    .filter((l) => l.stage !== 'PERDIDO' && l.stage !== 'FECHADO')
    .reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

  const closedRevenue = closedContracts.reduce(
    (acc, l) => acc + (l.closedDetails?.soldValue || l.estimatedValue || 0),
    0
  );

  const averageContractValue =
    closedContracts.length > 0 ? Math.round(closedRevenue / closedContracts.length) : 0;

  const totalContactsMade = crmState.interactions.length;
  const unreadNotifications = crmState.notifications.filter(
    (n) =>
      (n.userId === 'all' || n.userId === currentUser.id) &&
      !n.readBy.includes(currentUser.id)
  );

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    adminOnly?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users, badge: visibleLeads.length },
    { id: 'kanban', label: 'Funil de Vendas', icon: Kanban },
    { id: 'atendimento', label: 'Atendimento', icon: MessageSquare },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      badge: crmState.appointments.filter((a) => a.status === 'pendente').length,
    },
    { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
    { id: 'servicos', label: 'Serviços', icon: Briefcase },
    {
      id: 'projetos',
      label: 'Gestão de Projetos',
      icon: FolderKanban,
      badge: crmState.projects.length,
    },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    {
      id: 'notificacoes',
      label: 'Notificações',
      icon: Bell,
      badge: unreadNotifications.length || undefined,
    },
    { id: 'equipe', label: 'Equipe', icon: UserCog },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div
      className={`truinexa-app min-h-screen flex ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Left Sidebar Navigation (Section 23) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r flex flex-col transition-transform lg:translate-x-0 lg:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          darkMode
            ? 'bg-slate-900/95 border-slate-800/90'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <span className="font-display font-extrabold text-white text-base">T</span>
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-tight block leading-none">
                TRUINEXA DIGITAL
              </span>
              <span className="text-[10px] font-mono text-indigo-400">
                GESTÃO COMERCIAL
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Connected User Card (Section 31: "Bem-vindo, Daniel — Perfil: Administrador") */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-white font-display font-bold text-sm shrink-0`}
            >
              {currentUser.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-display font-bold text-white truncate">
                Bem-vindo, {currentUser.name}
              </p>
              <p className="text-[11px] text-indigo-400 font-medium">
                Perfil: {currentUser.roleTitle}
              </p>
            </div>
          </div>

        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : darkMode
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : item.id === 'notificacoes'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
              <span>Sincronizado</span>
            </span>
            {realtimePulse && <span>{realtimePulse}</span>}
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Global Header & Advanced Search Bar (Section 12) */}
        <header
          className={`sticky top-0 z-30 border-b px-4 sm:px-6 py-3.5 flex flex-col gap-3 ${
            darkMode
              ? 'bg-slate-950/90 border-slate-800/90 backdrop-blur-xl'
              : 'bg-white/90 border-slate-200 backdrop-blur-xl'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-800 text-slate-300"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Global Search Input */}
              <div className="relative flex-1 max-w-xl">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== 'leads' && activeTab !== 'kanban') {
                      setActiveTab('kanban');
                    }
                  }}
                  placeholder="Pesquisar por Nome, Empresa, Telefone, E-mail, Cidade, Bairro, Serviço, Responsável ou Status..."
                  className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:border-indigo-500 transition ${
                    darkMode
                      ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500'
                      : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2.5">
              {/* Responsible Filter */}
              <select
                value={responsibleFilter}
                onChange={(e) => setResponsibleFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-indigo-500 ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">Responsável: Todos</option>
                <option value="unassigned">🔓 Disponíveis p/ Captura</option>
                {crmState.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name}
                  </option>
                ))}
              </select>

              {/* New Lead Primary CTA */}
              <button
                onClick={() => setNewLeadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Lead</span>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setActiveTab('notificacoes')}
                className="relative p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
                )}
              </button>


            </div>
          </div>

          {/* Quick Filters Bar (Section 12) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {QUICK_FILTERS.map((flt) => {
              const active = quickFilter === flt;
              return (
                <button
                  key={flt}
                  onClick={() => {
                    setQuickFilter(flt);
                    if (
                      flt !== 'Todos' &&
                      activeTab !== 'kanban' &&
                      activeTab !== 'leads'
                    ) {
                      setActiveTab('kanban');
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition cursor-pointer ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 font-semibold'
                      : darkMode
                      ? 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {flt}
                </button>
              );
            })}
          </div>
        </header>

        {/* Active View Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {/* =================================================================
              VIEW 1: DASHBOARD PRINCIPAL (Section 3 - All 15 Real-Time Metrics)
          ================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Welcome & Quick Actions Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                    Painel Executivo em Tempo Real • TRUINEXA DIGITAL
                  </span>
                  <h1 className="text-2xl font-display font-bold tracking-tight">
                    Olá, {currentUser.name} ({currentUser.roleTitle})
                  </h1>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab('kanban')}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    Abrir Funil Kanban →
                  </button>
                </div>
              </div>

              {/* Primary Financial & Conversion KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Receita Fechada</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-emerald-400">
                    R$ {closedRevenue.toLocaleString('pt-BR')}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 font-mono">
                    {closedContracts.length} contratos fechados • Ticket médio: R${' '}
                    {averageContractValue.toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Receita Prevista (Pipeline)</span>
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-white">
                    R$ {forecastedRevenue.toLocaleString('pt-BR')}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 font-mono">
                    {proposalsSentCount} propostas ativas em avaliação
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Taxa de Conversão Geral</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-indigo-400">
                    {conversionRate}%
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 font-mono">
                    Valor médio: R$ {averageContractValue.toLocaleString('pt-BR')} / contrato
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Contatos Realizados</span>
                    <PhoneCall className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-white">
                    {totalContactsMade}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 font-mono">
                    {contactedCount} clientes ativos contatados
                  </div>
                </div>
              </div>

              {/* Secondary Commercial Funnel Counts (All remaining metrics from Section 3) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  {
                    label: 'Novos leads hoje',
                    val: newLeadsToday,
                    color: 'text-sky-400',
                    stageFilter: 'Novos' as QuickFilterType,
                  },
                  {
                    label: 'Aguardando contato',
                    val: awaitingContact,
                    color: 'text-amber-400',
                    stageFilter: 'Novos' as QuickFilterType,
                  },
                  {
                    label: 'Clientes contatados',
                    val: contactedCount,
                    color: 'text-blue-400',
                    stageFilter: 'Interessados' as QuickFilterType,
                  },
                  {
                    label: 'Propostas enviadas',
                    val: proposalsSentCount,
                    color: 'text-purple-400',
                    stageFilter: 'Propostas' as QuickFilterType,
                  },
                  {
                    label: 'Negociações ativas',
                    val: inNegotiationCount,
                    color: 'text-indigo-400',
                    stageFilter: 'Propostas' as QuickFilterType,
                  },
                  {
                    label: 'Contratos fechados',
                    val: closedContracts.length,
                    color: 'text-emerald-400',
                    stageFilter: 'Fechados' as QuickFilterType,
                  },
                  {
                    label: 'Clientes perdidos',
                    val: lostClients.length,
                    color: 'text-rose-400',
                    stageFilter: 'Perdidos' as QuickFilterType,
                  },
                ].map((stat) => (
                  <button
                    key={stat.label}
                    onClick={() => {
                      setQuickFilter(stat.stageFilter);
                      setActiveTab('kanban');
                    }}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 text-left transition cursor-pointer"
                  >
                    <span className="text-[11px] text-slate-400 block truncate">
                      {stat.label}
                    </span>
                    <span className={`font-mono text-xl font-bold ${stat.color}`}>
                      {stat.val}
                    </span>
                  </button>
                ))}
              </div>

              {/* Lower Dashboard Grid: Agendamentos do Dia, Próximas Tarefas, Ranking da Equipe */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Agendamentos do Dia */}
                <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>Agendamentos do Dia</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('agenda')}
                        className="text-xs text-indigo-400 hover:underline cursor-pointer"
                      >
                        Ver agenda →
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {crmState.appointments.slice(0, 5).map((app) => (
                        <div
                          key={app.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-400">
                                {app.time}
                              </span>
                              <span className="font-semibold text-white truncate">
                                {app.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {app.leadCompany} • Resp: {app.responsibleName}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleToggleAppointment(
                                app.id,
                                app.status === 'concluido' ? 'pendente' : 'concluido'
                              )
                            }
                            className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer ${
                              app.status === 'concluido'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {app.status === 'concluido' ? 'Feito' : 'Pendente'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Próximas Tarefas & Clientes Aguardando Captura */}
                <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Próximas Tarefas Comerciais</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('tarefas')}
                      className="text-xs text-indigo-400 hover:underline cursor-pointer"
                    >
                      Ver todas →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {visibleLeads
                      .filter((l) => l.stage !== 'FECHADO' && l.stage !== 'PERDIDO')
                      .slice(0, 5)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white">{lead.company}</span>
                            <span className="font-mono text-[11px] text-amber-400">
                              {lead.responsibleName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">{lead.nextAction}</p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Desempenho da equipe (Daniel, Arthur, Pedro) */}
                <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Ranking de Atendimentos da Equipe</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('relatorios')}
                      className="text-xs text-indigo-400 hover:underline cursor-pointer"
                    >
                      Relatório →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {crmState.users.map((member, idx) => {
                      const mLeads = crmState.leads.filter(
                        (l) => l.responsibleId === member.id
                      );
                      const mClosed = mLeads.filter((l) => l.stage === 'FECHADO');
                      const mRevenue = mClosed.reduce(
                        (acc, l) =>
                          acc + (l.closedDetails?.soldValue || l.estimatedValue || 0),
                        0
                      );
                      return (
                        <div
                          key={member.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-indigo-400 flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <h4 className="font-display font-bold text-xs text-white">
                                {member.name}
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                {mLeads.length} clientes • {mClosed.length} fechados
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            R$ {mRevenue.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 2: FUNIL DE VENDAS KANBAN (Sections 5, 6, 7)
          ================================================================= */}
          {activeTab === 'kanban' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-lg font-display font-bold">
                    Funil de Vendas
                  </h1>
                  <p className="text-xs text-slate-400">
                    Arraste os cards entre as etapas ou abra um cliente para ver detalhes e histórico.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Exibindo {visibleLeads.length} oportunidades
                </span>
              </div>

              <KanbanBoard
                leads={visibleLeads}
                currentUser={currentUser}
                stalledAlertDays={crmState.config.stalledAlertDays}
                onSelectLead={(lead) => setSelectedLeadId(lead.id)}
                onMoveStage={handleMoveStage}
                onClaimLead={handleClaimLead}
                onOpenWhatsApp={(lead) => setWhatsAppLead(lead)}
                darkMode={darkMode}
              />
            </div>
          )}

          {/* =================================================================
              VIEW 3: LISTA DE LEADS & CAPTURA (Sections 4 & 16)
          ================================================================= */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-display font-bold">
                    Clientes e Leads ({visibleLeads.length})
                  </h1>
                  <p className="text-xs text-slate-400">
                    Modo de distribuição atual:{' '}
                    <strong className="text-indigo-400 uppercase font-mono">
                      {crmState.config.distributionMode}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase">
                      <th className="py-3.5 px-4">Empresa / Cliente</th>
                      <th className="py-3.5 px-4">Localização & Segmento</th>
                      <th className="py-3.5 px-4">Serviço de Interesse</th>
                      <th className="py-3.5 px-4">Etapa Kanban</th>
                      <th className="py-3.5 px-4">Responsável</th>
                      <th className="py-3.5 px-4 text-right">Contato Rápido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {visibleLeads.map((lead) => {
                      const stageMeta =
                        KANBAN_STAGES.find((s) => s.id === lead.stage) || KANBAN_STAGES[0];
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-display font-bold text-sm text-white">
                              {lead.company}
                            </div>
                            <div className="text-slate-400">
                              {lead.name} • <span className="font-mono">{lead.phone}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              <span>
                                {lead.neighborhood} — {lead.city}/{lead.state}
                              </span>
                            </div>
                            <div className="text-slate-400">{lead.segment}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-indigo-300">
                              {lead.serviceInterest}
                            </div>
                            <div className="font-mono text-emerald-400 font-bold">
                              R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-md border font-medium ${stageMeta.badgeClass}`}
                            >
                              {stageMeta.label}
                            </span>
                          </td>
                          <td
                            className="py-3.5 px-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.responsibleId ? (
                              <span className="font-semibold text-slate-200">
                                {lead.responsibleName}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleClaimLead(lead)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Hand className="w-3 h-3" />
                                <span>ASSUMIR CLIENTE</span>
                              </button>
                            )}
                          </td>
                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setWhatsAppLead(lead)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 4: ATENDIMENTO & WHATSAPP + FUNIL AUTOMATIZADO
          ================================================================= */}
          {activeTab === 'atendimento' && (
            <AtendimentoModule
              state={crmState}
              currentUser={currentUser}
              onOpenWhatsApp={(lead) => setWhatsAppLead(lead)}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
              onMoveStage={handleMoveStage}
              onCreateFollowUpTask={async (lead, suggestionText) => {
                await handleCreateAppointment({
                  leadId: lead.id,
                  responsibleId: lead.responsibleId || currentUser.id,
                  type: 'Follow-up',
                  title: `${suggestionText} — ${lead.company}`,
                  date: new Date().toISOString().slice(0, 10),
                  time: '15:00',
                  notes: 'Criado automaticamente pelo Funil Automatizado da TRUINEXA DIGITAL.',
                });
              }}
              onUpdateConfig={handleUpdateConfig}
            />
          )}

          {/* =================================================================
              VIEW 5 & 6: AGENDA & TAREFAS VINCULADAS
          ================================================================= */}
          {(activeTab === 'agenda' || activeTab === 'tarefas') && (
            <AgendaModule
              state={crmState}
              currentUser={currentUser}
              onToggleAppointment={handleToggleAppointment}
              onCreateAppointment={handleCreateAppointment}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
            />
          )}

          {/* =================================================================
              VIEW 7: SERVIÇOS DA TRUINEXA DIGITAL
          ================================================================= */}
          {activeTab === 'servicos' && (
            <ServicesModule
              services={crmState.services}
              leads={crmState.leads}
              currentUser={currentUser}
              onAddService={handleAddService}
              onUpdateService={handleUpdateService}
            />
          )}

          {/* =================================================================
              VIEW 8: GESTÃO DE PROJETOS (PÓS-VENDA)
          ================================================================= */}
          {activeTab === 'projetos' && (
            <ProjectsModule
              state={crmState}
              onUpdateProjectStage={handleUpdateProjectStage}
            />
          )}

          {/* =================================================================
              VIEW 9: RELATÓRIOS & ARQUIVO DE PERDIDOS
          ================================================================= */}
          {activeTab === 'relatorios' && (
            <ReportsModule
              state={crmState}
              currentUser={currentUser}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
              onReactivateLostLead={async (lead) => {
                await handleUpdateLead(lead.id, {
                  stage: 'CONTATO REALIZADO',
                  closingProbability: 50,
                  nextAction: 'Cliente reativado do Arquivo de Perdidos para nova abordagem',
                });
              }}
              onDeleteLeadPermanently={handleDeleteLeadPermanently}
            />
          )}

          {/* =================================================================
              VIEW 10: CENTRAL DE NOTIFICAÇÕES (Section 15)
          ================================================================= */}
          {activeTab === 'notificacoes' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-display font-bold">Central de Notificações</h1>
                  <p className="text-xs text-slate-400">
                    Alertas em tempo real sobre novos leads, clientes assumidos, follow-ups e
                    fechamentos.
                  </p>
                </div>
                <button
                  onClick={() => handleMarkNotificationsRead('all')}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-indigo-400 cursor-pointer"
                >
                  Marcar todas como lidas
                </button>
              </div>

              <div className="space-y-2.5">
                {crmState.notifications.map((n) => {
                  const isRead = n.readBy.includes(currentUser.id);
                  const linkedLead = crmState.leads.find((l) => l.id === n.leadId);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkNotificationsRead(n.id);
                        if (linkedLead) setSelectedLeadId(linkedLead.id);
                      }}
                      className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition cursor-pointer ${
                        isRead
                          ? 'bg-slate-900/40 border-slate-800/70 opacity-75'
                          : 'bg-slate-900 border-indigo-500/40 shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-sm text-white">
                              {n.title}
                            </h4>
                            {!isRead && (
                              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-mono">
                                NOVO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 11 & 12: EQUIPE & CONFIGURAÇÕES ADMINISTRATIVAS
          ================================================================= */}
          {(activeTab === 'equipe' || activeTab === 'configuracoes') && (
            <TeamAndSettingsModule
              state={crmState}
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onUpdateConfig={handleUpdateConfig}
            />
          )}
        </main>
      </div>

      {/* =====================================================================
          GLOBAL MODALS & DRAWERS
      ===================================================================== */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLeadId(null)}
        currentUser={currentUser}
        users={crmState.users}
        services={crmState.services}
        interactions={crmState.interactions}
        onUpdateLead={handleUpdateLead}
        onAddInteraction={handleAddInteraction}
        onOpenWhatsApp={(lead) => setWhatsAppLead(lead)}
        onOpenAppointment={(lead) => setAppointmentLead(lead)}
        onOpenCloseDeal={(lead) => setCloseDealLead(lead)}
        onOpenLostDeal={(lead) => setLostDealLead(lead)}
        onDeleteLeadPermanently={handleDeleteLeadPermanently}
      />

      <NewLeadModal
        isOpen={newLeadModalOpen}
        onClose={() => setNewLeadModalOpen(false)}
        currentUser={currentUser}
        users={crmState.users}
        services={crmState.services}
        distributionMode={crmState.config.distributionMode}
        onSubmit={handleCreateLead}
      />

      <CloseDealModal
        lead={closeDealLead}
        onClose={() => setCloseDealLead(null)}
        currentUser={currentUser}
        users={crmState.users}
        services={crmState.services}
        onConfirmClose={handleConfirmCloseDeal}
      />

      <LostLeadModal
        lead={lostDealLead}
        onClose={() => setLostDealLead(null)}
        currentUser={currentUser}
        onConfirmLost={handleConfirmLostDeal}
      />

      <WhatsAppModal
        lead={whatsAppLead}
        onClose={() => setWhatsAppLead(null)}
        currentUser={currentUser}
        templates={crmState.whatsappTemplates}
        whatsappMode={crmState.config.whatsappMode}
        onRegisterWhatsAppContact={async (leadId, message, nextStage) => {
          await handleAddInteraction(leadId, 'whatsapp', message, nextStage);
        }}
      />

      <QuickAppointmentModal
        lead={appointmentLead}
        onClose={() => setAppointmentLead(null)}
        currentUser={currentUser}
        users={crmState.users}
        onCreateAppointment={handleCreateAppointment}
      />
    </div>
  );
}
