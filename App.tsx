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
import { crmFetch, loadCRMState, subscribeToCRMChanges, supabase } from './supabaseApi';
import { InstallAppButton } from './InstallAppButton';

type NavTab =
  | 'dashboard'
  | 'leads'
  | 'carteira'
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
  const [activeTab, setActiveTab] = useState<NavTab>('kanban');
  const [darkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [realtimePulse, setRealtimePulse] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

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

  // Supabase bootstrap + Realtime
  useEffect(() => {
    let mounted = true;

    const refreshState = async () => {
      try {
        const state = await loadCRMState();
        if (!mounted) return;
        setBootError(null);
        setCrmState(state);

        const { data } = await supabase.auth.getUser();
        const authUser = data.user;
        if (!authUser) {
          setCurrentUser(null);
          return;
        }

        const profile = state.users.find((user) => user.id === authUser.id);
        if (profile?.status === 'active') {
          setCurrentUser(profile);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Supabase state error:', error);
        if (mounted) {
          setBootError('Não foi possível carregar o banco da TRUINEXA no Supabase.');
          setCrmState((previous) => previous || {
            users: [],
            leads: [],
            services: [],
            interactions: [],
            appointments: [],
            notifications: [],
            activityLogs: [],
            projects: [],
            whatsappTemplates: [],
            config: {
              distributionMode: 'capture',
              roundRobinOrder: [],
              lastAssignedIndex: 0,
              whatsappMode: 'common',
              whatsappBusinessConfig: {
                phoneNumberId: '',
                businessAccountId: '',
                displayPhoneNumber: '',
                webhookVerifyToken: '',
                connected: false,
                autoStageUpdateOnReply: true,
                autoFollowUpDays: 2,
              },
              stalledAlertDays: 2,
              senderName: 'Daniel Soliz',
              brandName: 'DS Digital',
              portfolioUrl: 'https://daniel-soliz.github.io/Daniel-Soliz-DS/',
              presentationUrl:
                'https://daniel-soliz.github.io/TRIUNEXA-DIGITAL/marketing/ds-digital-cartaz.jpg',
            },
          });
        }
      }
    };

    void refreshState();

    const unsubscribeRealtime = subscribeToCRMChanges(() => {
      setRealtimePulse(new Date().toLocaleTimeString('pt-BR'));
      void refreshState();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        void refreshState();
      }, 0);
    });

    return () => {
      mounted = false;
      unsubscribeRealtime();
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Keep current user synced with Supabase profile status/permissions
  useEffect(() => {
    if (!crmState || !currentUser) return;
    const updated = crmState.users.find((user) => user.id === currentUser.id);
    if (!updated || updated.status === 'inactive') {
      setCurrentUser(null);
      void supabase.auth.signOut();
      return;
    }
    setCurrentUser(updated);
  }, [crmState]);

  const handleLoginSuccess = async (user: User, _token: string) => {
    setCurrentUser(user);
    try {
      const state = await loadCRMState();
      setCrmState(state);
    } catch (error) {
      console.error('Failed to refresh CRM after login:', error);
    }
  };

  const handleLogout = async () => {
    await crmFetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setCrmState({
      users: [],
      leads: [],
      services: [],
      interactions: [],
      appointments: [],
      notifications: [],
      activityLogs: [],
      projects: [],
      whatsappTemplates: [],
      config: crmState?.config || {
        distributionMode: 'capture',
        roundRobinOrder: [],
        lastAssignedIndex: 0,
        whatsappMode: 'common',
        whatsappBusinessConfig: {
          phoneNumberId: '',
          businessAccountId: '',
          displayPhoneNumber: '',
          webhookVerifyToken: '',
          connected: false,
          autoStageUpdateOnReply: true,
          autoFollowUpDays: 2,
        },
        stalledAlertDays: 2,
        senderName: 'Daniel Soliz',
        brandName: 'DS Digital',
        portfolioUrl: 'https://daniel-soliz.github.io/Daniel-Soliz-DS/',
        presentationUrl:
          'https://daniel-soliz.github.io/TRIUNEXA-DIGITAL/marketing/ds-digital-cartaz.jpg',
      },
    });
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
            if (lead.stage !== 'NOVO LEAD' && lead.stage !== 'ASSUMIDO')
              return false;
            break;
          case 'Interessados':
            if (lead.stage !== 'RESPONDEU' && lead.stage !== 'CONTATO INICIADO')
              return false;
            break;
          case 'Propostas':
            if (
              lead.stage !== 'PROPOSTA' &&
              lead.stage !== 'NEGOCIAÇÃO' &&
              lead.stage !== 'SEM RETORNO'
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

  const availableLeads = useMemo(
    () => visibleLeads.filter((lead) => lead.responsibleId === null),
    [visibleLeads]
  );

  const portfolioLeads = useMemo(
    () => visibleLeads.filter((lead) => Boolean(lead.responsibleId)),
    [visibleLeads]
  );

  const myPortfolioCount = useMemo(
    () =>
      crmState?.leads.filter(
        (lead) => lead.responsibleId === currentUser?.id
      ).length || 0,
    [crmState, currentUser]
  );

  const portfolioEstimatedValue = useMemo(
    () =>
      portfolioLeads
        .filter((lead) => lead.stage !== 'PERDIDO')
        .reduce((total, lead) => total + lead.estimatedValue, 0),
    [portfolioLeads]
  );

  const portfolioPendingFollowUps = useMemo(
    () =>
      crmState?.appointments.filter(
        (appointment) =>
          appointment.status === 'pendente' &&
          (responsibleFilter === 'all'
            ? Boolean(appointment.responsibleId)
            : responsibleFilter === 'unassigned'
            ? false
            : appointment.responsibleId === responsibleFilter)
      ).length || 0,
    [crmState, responsibleFilter]
  );

  const selectedLead = useMemo(
    () => crmState?.leads.find((l) => l.id === selectedLeadId) || null,
    [crmState, selectedLeadId]
  );

  // API Handlers
  const handleCreateLead = async (leadData: Partial<Lead>) => {
    if (!currentUser) return;
    await crmFetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, leadData }),
    });
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    if (!currentUser) return;
    await crmFetch(`/api/leads/${leadId}`, {
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

  const claimLeadAtomically = async (lead: Lead): Promise<Lead | null> => {
    if (!currentUser) return null;

    const response = await crmFetch(`/api/leads/${lead.id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id }),
    });

    const payload = await response.json();
    if (!response.ok) {
      window.alert(payload?.error || 'Este lead acabou de ser assumido por outro usuário.');
      return null;
    }

    return payload as Lead;
  };

  const handleClaimLead = async (lead: Lead) => {
    const claimedLead = await claimLeadAtomically(lead);
    if (!claimedLead || !currentUser) return;

    setResponsibleFilter(currentUser.id);
    setActiveTab('carteira');
  };

  const handleConfirmCloseDeal = async (leadId: string, closedDetails: ClosedDealDetails) => {
    if (!currentUser) return;
    await crmFetch(`/api/leads/${leadId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, closedDetails }),
    });
  };

  const handleConfirmLostDeal = async (leadId: string, lostDetails: LostDetails) => {
    if (!currentUser) return;
    await crmFetch(`/api/leads/${leadId}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, lostDetails }),
    });
  };

  const handleDeleteLeadPermanently = async (leadId: string) => {
    if (!currentUser) return;
    await crmFetch(`/api/leads/${leadId}?actorId=${currentUser.id}`, {
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
    await crmFetch('/api/interactions', {
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

  const handleQuickWhatsApp = (lead: Lead) => {
    setWhatsAppLead(lead);
  };

  const handleClaimAndQuickWhatsApp = async (lead: Lead) => {
    if (!lead.whatsapp) {
      window.alert('Este lead não possui WhatsApp confirmado.');
      return;
    }

    const claimedLead = await claimLeadAtomically(lead);
    if (!claimedLead || !currentUser) return;

    setResponsibleFilter(currentUser.id);
    setWhatsAppLead(claimedLead);
  };

  const handleStartWhatsAppContact = async (leadId: string, message: string) => {
    const response = await crmFetch(`/api/leads/${leadId}/contact-started`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Não foi possível registrar o início do contato.');
    }
    return payload as Lead;
  };

  const handleMessageCopied = async (leadId: string, message: string) => {
    await crmFetch(`/api/leads/${leadId}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'message_copied',
        details: 'Mensagem de prospecção copiada.',
        metadata: { messageLength: message.length },
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
    await crmFetch('/api/appointments', {
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
    await crmFetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, status }),
    });
  };

  const handleAddService = async (service: Partial<ServiceItem>) => {
    if (!currentUser) return;
    await crmFetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, service }),
    });
  };

  const handleUpdateService = async (id: string, updates: Partial<ServiceItem>) => {
    if (!currentUser) return;
    await crmFetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, updates }),
    });
  };

  const handleUpdateProjectStage = async (projectId: string, stage: ProjectStage) => {
    if (!currentUser) return;
    await crmFetch(`/api/projects/${projectId}`, {
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
    await crmFetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, updates, resetTempPassword }),
    });
  };

  const handleUpdateConfig = async (configUpdates: Partial<CRMState['config']>) => {
    if (!currentUser) return;
    await crmFetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorId: currentUser.id, configUpdates }),
    });
  };

  const handleMarkNotificationsRead = async (notificationId: string | 'all') => {
    if (!currentUser) return;
    await crmFetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, notificationId }),
    });
  };

  if (!crmState) {
    if (bootError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-display font-extrabold mb-5">
              T
            </div>
            <p className="text-xs font-semibold tracking-[0.16em] text-indigo-600 uppercase">
              TRUINEXA DIGITAL
            </p>
            <h1 className="mt-2 text-2xl font-display font-bold text-slate-900">
              CRM conectado ao Supabase.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {bootError}
            </p>
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              O CRM usa Supabase para autenticação, banco de dados e sincronização em tempo real.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 cursor-pointer"
            >
              Tentar reconectar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
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
    (l) => l.createdAt.slice(0, 10) === todayStr || l.stage === 'NOVO LEAD'
  ).length;
  const awaitingContact = crmState.leads.filter(
    (l) => l.stage === 'NOVO LEAD' || l.stage === 'ASSUMIDO'
  ).length;
  const contactedCount = crmState.leads.filter(
    (l) =>
      l.stage !== 'NOVO LEAD' &&
      l.stage !== 'ASSUMIDO' &&
      l.stage !== 'PERDIDO'
  ).length;
  const proposalsSentCount = crmState.leads.filter(
    (l) =>
      l.stage === 'PROPOSTA' ||
      l.stage === 'NEGOCIAÇÃO' ||
      l.stage === 'SEM RETORNO'
  ).length;
  const inNegotiationCount = crmState.leads.filter(
    (l) => l.stage === 'RESPONDEU' || l.stage === 'NEGOCIAÇÃO'
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

  type NavigationItem = {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  };

  const railNavItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'kanban', label: 'Funil', icon: Kanban, badge: visibleLeads.length },
    { id: 'leads', label: 'Novos', icon: Users, badge: availableLeads.length },
    { id: 'carteira', label: 'Carteira', icon: Award, badge: myPortfolioCount },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      badge: crmState.appointments.filter((a) => a.status === 'pendente').length,
    },
    { id: 'atendimento', label: 'Atendimento', icon: MessageSquare },
    { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
    { id: 'servicos', label: 'Serviços', icon: Briefcase },
    { id: 'projetos', label: 'Projetos', icon: FolderKanban, badge: crmState.projects.length },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  const railBottomItems: NavigationItem[] = [
    { id: 'equipe', label: 'Equipe', icon: UserCog },
    { id: 'configuracoes', label: 'Ajustes', icon: Settings },
  ];

  const goToTab = (tab: NavTab) => {
    if (tab === 'leads') {
      setResponsibleFilter('unassigned');
    } else if (tab === 'carteira') {
      setResponsibleFilter(currentUser.id);
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const activeTitle: Record<NavTab, string> = {
    dashboard: 'Visão geral',
    leads: 'Oportunidades',
    carteira: 'Minha carteira',
    kanban: 'Oportunidades',
    atendimento: 'Atendimento',
    agenda: 'Agenda',
    tarefas: 'Tarefas',
    servicos: 'Serviços',
    projetos: 'Projetos',
    relatorios: 'Relatórios',
    notificacoes: 'Notificações',
    equipe: 'Equipe',
    configuracoes: 'Configurações',
  };

  return (
    <div
      className="min-h-screen flex bg-[#f5f7fb] text-slate-900"
    >
      {mobileMenuOpen && (
        <button
          aria-label="Fechar menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}

      {/* Barra lateral estilo CRM compacto */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[232px] lg:w-[76px] bg-[#171d2d] border-r border-slate-800/80 flex flex-col transition-transform lg:translate-x-0 lg:static ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-3 lg:px-0 lg:justify-center border-b border-white/5">
          <button
            onClick={() => goToTab('kanban')}
            className="flex items-center gap-3 lg:gap-0"
            title="TRUINEXA DIGITAL"
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/truinexa-192.png`}
              alt="TRUINEXA DIGITAL"
              className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-sky-500/15"
            />
            <div className="lg:hidden text-left">
              <div className="text-sm font-display font-bold text-white">TRUINEXA</div>
              <div className="text-[9px] tracking-[0.18em] text-sky-300">CRM COMERCIAL</div>
            </div>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto lg:hidden p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {railNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goToTab(item.id)}
                title={item.label}
                className={`relative w-full flex items-center gap-3 lg:flex-col lg:gap-1 px-3 lg:px-1 py-2.5 lg:py-2 rounded-xl transition ${
                  active
                    ? 'bg-[#635bff] text-white shadow-lg shadow-indigo-950/25'
                    : 'text-slate-400 hover:bg-white/7 hover:text-white'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="text-xs lg:text-[9px] font-medium leading-none">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-auto lg:absolute lg:right-1 lg:top-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    active ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-2 space-y-1 border-t border-white/5 pt-2">
          {railBottomItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goToTab(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 lg:flex-col lg:gap-1 px-3 lg:px-1 py-2.5 lg:py-2 rounded-xl transition ${
                  active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/7 hover:text-white'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-xs lg:text-[9px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 mt-1 border-t border-white/5">
            <div className="flex items-center gap-2 px-2 py-2 lg:justify-center">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${currentUser.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {currentUser.name[0]}
              </div>
              <div className="min-w-0 lg:hidden">
                <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  Online {realtimePulse ? `• ${realtimePulse}` : ''}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 lg:flex-col lg:gap-1 px-3 lg:px-1 py-2 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 transition"
              title="Sair"
            >
              <LogOut className="w-[17px] h-[17px]" />
              <span className="text-xs lg:text-[9px]">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topo do CRM */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="h-16 px-3 sm:px-5 flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold text-slate-900 truncate">
                  {activeTitle[activeTab]}
                </h1>
                {activeTab === 'kanban' && (
                  <span className="hidden sm:inline-flex px-2 py-1 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500">
                    Pipeline comercial
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400">
                TRUINEXA DIGITAL • dados em tempo real
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <InstallAppButton
                className="hidden md:inline-flex px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold items-center gap-2 hover:bg-slate-50 transition"
              />
              <button
                onClick={() => setNewLeadModalOpen(true)}
                className="inline-flex px-3.5 py-2 rounded-lg bg-[#635bff] hover:bg-indigo-600 text-white text-xs font-semibold items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Criar</span>
              </button>
              <button
                onClick={() => setActiveTab('notificacoes')}
                className="relative p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="px-3 sm:px-5 border-t border-slate-100">
            <div className="min-h-12 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 self-stretch">
                {[
                  { id: 'kanban' as NavTab, label: 'Quadro' },
                  { id: 'leads' as NavTab, label: 'Lista' },
                  { id: 'carteira' as NavTab, label: 'Carteira' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => goToTab(tab.id)}
                    className={`h-full px-3 text-xs font-semibold border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-[#635bff] text-[#635bff]'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1" />

              <div className="relative flex-1 min-w-[210px] max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab !== 'leads' && activeTab !== 'carteira' && activeTab !== 'kanban') {
                      setActiveTab('kanban');
                    }
                  }}
                  placeholder="Buscar empresa, serviço, bairro ou WhatsApp..."
                  className="w-full h-8 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                />
              </div>

              <select
                value={responsibleFilter}
                onChange={(e) => setResponsibleFilter(e.target.value)}
                className="hidden md:block h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-600 focus:outline-none"
              >
                <option value="all">Todos responsáveis</option>
                <option value="unassigned">Sem responsável</option>
                {crmState.users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {(activeTab === 'kanban' || activeTab === 'leads' || activeTab === 'carteira') && (
              <div className="pb-2 flex items-center gap-1.5 overflow-x-auto">
                {QUICK_FILTERS.map((flt) => {
                  const active = quickFilter === flt;
                  return (
                    <button
                      key={flt}
                      onClick={() => setQuickFilter(flt)}
                      className={`shrink-0 px-2.5 py-1 rounded-md border text-[10px] font-semibold transition ${
                        active
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {flt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        {/* Active View Body */}
        <main className="flex-1 p-3 sm:p-4 pb-24 lg:pb-4 overflow-x-hidden bg-[#f5f7fb]">
          {/* =================================================================
              INÍCIO SIMPLES — foco no que a equipe precisa fazer agora
          ================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  TRUINEXA DIGITAL
                </span>
                <h1 className="mt-1 text-2xl font-display font-bold text-slate-900">
                  Olá, {currentUser.name}. O que você quer fazer agora?
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  O fluxo é simples: escolha uma oportunidade, assuma o cliente e administre pela sua carteira.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => goToTab('leads')}
                  className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-left hover:border-indigo-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span className="text-2xl font-bold text-indigo-700">{availableLeads.length}</span>
                  </div>
                  <div className="mt-4 font-display font-bold text-slate-900">1. Ver oportunidades</div>
                  <div className="mt-1 text-xs text-slate-500">Escolha um novo cliente disponível.</div>
                </button>

                <button
                  onClick={() => goToTab('carteira')}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left hover:border-emerald-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span className="text-2xl font-bold text-emerald-700">{myPortfolioCount}</span>
                  </div>
                  <div className="mt-4 font-display font-bold text-slate-900">2. Minha carteira</div>
                  <div className="mt-1 text-xs text-slate-500">Ligue, mande mensagem e atualize a etapa.</div>
                </button>

                <button
                  onClick={() => goToTab('agenda')}
                  className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-left hover:border-sky-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <Calendar className="w-5 h-5 text-sky-600" />
                    <span className="text-2xl font-bold text-sky-700">{portfolioPendingFollowUps}</span>
                  </div>
                  <div className="mt-4 font-display font-bold text-slate-900">3. Retornos e agenda</div>
                  <div className="mt-1 text-xs text-slate-500">Veja quem precisa de contato ou follow-up.</div>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold text-slate-900">Próximos clientes</h2>
                    <p className="text-xs text-slate-500">Acesso rápido aos clientes da sua carteira.</p>
                  </div>
                  <button
                    onClick={() => goToTab('carteira')}
                    className="text-xs font-semibold text-indigo-600"
                  >
                    Ver carteira
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {crmState.leads
                    .filter((lead) => lead.responsibleId === currentUser.id && lead.stage !== 'FECHADO' && lead.stage !== 'PERDIDO')
                    .slice(0, 4)
                    .map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-slate-900 truncate">{lead.company}</div>
                          <div className="text-xs text-slate-500 truncate">{lead.nextAction || 'Definir próxima ação'}</div>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-indigo-600">Abrir →</span>
                      </button>
                    ))}

                  {crmState.leads.filter((lead) => lead.responsibleId === currentUser.id && lead.stage !== 'FECHADO' && lead.stage !== 'PERDIDO').length === 0 && (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                      Você ainda não tem clientes ativos. Vá em Oportunidades para assumir o primeiro.
                    </div>
                  )}
                </div>
              </div>

              {currentUser.role === 'admin' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => goToTab('relatorios')}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left"
                  >
                    <div className="text-xs text-slate-500">Receita fechada</div>
                    <div className="mt-1 font-mono text-lg font-bold text-emerald-600">
                      R$ {closedRevenue.toLocaleString('pt-BR')}
                    </div>
                  </button>
                  <button
                    onClick={() => goToTab('relatorios')}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left"
                  >
                    <div className="text-xs text-slate-500">Negociações ativas</div>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-900">{inNegotiationCount}</div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              VIEW 2: FUNIL DE VENDAS KANBAN (Sections 5, 6, 7)
          ================================================================= */}
          {activeTab === 'kanban' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {visibleLeads.length} oportunidades
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  R$ {forecastedRevenue.toLocaleString('pt-BR')} em pipeline
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  Atualização em tempo real
                </span>
              </div>

              <KanbanBoard
                leads={visibleLeads}
                currentUser={currentUser}
                stalledAlertDays={crmState.config.stalledAlertDays}
                onSelectLead={(lead) => setSelectedLeadId(lead.id)}
                onMoveStage={handleMoveStage}
                onClaimLead={handleClaimAndQuickWhatsApp}
                onOpenWhatsApp={(lead) => void handleQuickWhatsApp(lead)}
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
                    Oportunidades disponíveis ({availableLeads.length})
                  </h1>
                  <p className="text-xs text-slate-400">
                    Leads sem responsável ficam aqui até alguém assumir. Modo:{' '}
                    <strong className="text-indigo-400 uppercase font-mono">
                      {crmState.config.distributionMode}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {availableLeads.map((lead) => (
                  <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-slate-900 truncate">{lead.company}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {lead.neighborhood || lead.city} • {lead.segment}
                        </p>
                      </div>
                      {lead.sourceVerifiedAt && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Validado
                        </span>
                      )}
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Solução sugerida</div>
                      <div className="mt-0.5 text-sm font-semibold text-indigo-700">{lead.serviceInterest}</div>
                      {lead.estimatedValue > 0 && (
                        <div className="mt-1 text-xs font-mono font-bold text-emerald-600">
                          R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {lead.address && (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-600">Mapa ✓</span>
                        )}
                        {lead.website && (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-600">Site ✓</span>
                        )}
                        {lead.instagramUrl && (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-600">Instagram ✓</span>
                        )}
                        {lead.whatsapp && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">WhatsApp ✓</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700"
                      >
                        Ver análise
                      </button>
                      <button
                        onClick={() =>
                          lead.whatsapp
                            ? void handleClaimAndQuickWhatsApp(lead)
                            : handleClaimLead(lead)
                        }
                        className="rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white shadow-sm"
                      >
                        {lead.whatsapp ? 'Assumir + WhatsApp' : 'Assumir cliente'}
                      </button>
                    </div>
                  </div>
                ))}

                {availableLeads.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Nenhuma oportunidade disponível agora.
                  </div>
                )}
              </div>

              <div className="hidden md:block rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
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
                    {availableLeads.map((lead) => {
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
                            <div className="text-slate-400 flex flex-wrap items-center gap-1.5">
                              <span>{lead.name}</span>
                              <span>•</span>
                              <span className="font-mono">{lead.phone || 'Sem celular'}</span>
                              {lead.sourceVerifiedAt && lead.phone && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500"
                                  title={lead.contactValidationMethod || 'Contato comercial validado em fonte pública'}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Validado
                                </span>
                              )}
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
                              <div className="flex flex-col gap-1.5">
                                {lead.whatsapp && (
                                  <button
                                    onClick={() => void handleClaimAndQuickWhatsApp(lead)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                                    title="Assumir cliente e abrir o WhatsApp com a apresentação pronta"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>ASSUMIR + WHATSAPP</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleClaimLead(lead)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Hand className="w-3 h-3" />
                                  <span>SÓ ASSUMIR</span>
                                </button>
                              </div>
                            )}
                          </td>
                          <td
                            className="py-3.5 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.responsibleId ? (
                              <div className="inline-flex flex-wrap justify-end gap-1.5">
                                {lead.phone && (
                                  <a
                                    href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold inline-flex items-center gap-1.5"
                                    title="Ligar para o número comercial validado"
                                  >
                                    <PhoneCall className="w-3.5 h-3.5" />
                                    <span>Ligar</span>
                                  </a>
                                )}
                                <button
                                  onClick={() => setWhatsAppLead(lead)}
                                  className={`px-2.5 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                                    lead.whatsapp
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                  }`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{lead.whatsapp ? 'WhatsApp' : 'Roteiro'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-500">
                                Use “Assumir + WhatsApp” para iniciar em 1 clique
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {availableLeads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 px-4 text-center text-slate-500">
                          Nenhuma oportunidade disponível no momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW: MINHA CARTEIRA — CLIENTES JÁ ASSUMIDOS
          ================================================================= */}
          {activeTab === 'carteira' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Gestão da carteira comercial
                  </span>
                  <h1 className="text-xl font-display font-bold mt-1">
                    {responsibleFilter === currentUser.id
                      ? 'Minha Carteira'
                      : responsibleFilter === 'all'
                      ? 'Carteiras da Equipe'
                      : `Carteira de ${crmState.users.find((user) => user.id === responsibleFilter)?.name || 'Responsável'}`}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Aqui ficam somente oportunidades que já possuem responsável. Abra a ficha para registrar histórico,
                    mudar etapa, agendar retorno ou fechar a venda.
                  </p>
                </div>
                {currentUser.role === 'admin' && responsibleFilter !== 'all' && (
                  <button
                    onClick={() => setResponsibleFilter('all')}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Ver carteira da equipe
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-500">Clientes na carteira</div>
                  <div className="mt-1 text-2xl font-display font-bold">{portfolioLeads.length}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-500">Potencial em negociação</div>
                  <div className="mt-1 text-2xl font-mono font-bold text-emerald-600">
                    R$ {portfolioEstimatedValue.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-500">Follow-ups pendentes</div>
                  <div className="mt-1 text-2xl font-display font-bold">{portfolioPendingFollowUps}</div>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {portfolioLeads.map((lead) => {
                  const stageMeta = KANBAN_STAGES.find((stage) => stage.id === lead.stage) || KANBAN_STAGES[0];
                  return (
                    <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-slate-900 truncate">{lead.company}</h3>
                          <p className="text-xs text-slate-500 truncate">{lead.serviceInterest}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-md border text-[10px] font-semibold ${stageMeta.badgeClass}`}>
                          {stageMeta.label}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                            className="rounded-xl bg-sky-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
                          >
                            Ligar
                          </a>
                        )}
                        {lead.whatsapp ? (
                          <button
                            onClick={() => void handleQuickWhatsApp(lead)}
                            className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white"
                            title="Abrir WhatsApp com apresentação, portfólio e cartaz prontos"
                          >
                            WhatsApp 1 clique
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700"
                          >
                            Ver contato
                          </button>
                        )}
                      </div>

                      <div className="mt-3">
                        <label className="text-[11px] font-semibold text-slate-500">Alterar etapa</label>
                        <select
                          value={lead.stage}
                          onChange={(event) => handleMoveStage(lead, event.target.value as KanbanStage)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800"
                        >
                          {KANBAN_STAGES.map((stage) => (
                            <option key={stage.id} value={stage.id}>{stage.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setWhatsAppLead(lead)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-xs font-semibold text-emerald-700"
                        >
                          Roteiros
                        </button>
                        <button
                          onClick={() => setAppointmentLead(lead)}
                          className="rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-semibold text-slate-700"
                        >
                          Agendar
                        </button>
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="rounded-xl bg-slate-900 px-2 py-2.5 text-xs font-semibold text-white"
                        >
                          Ficha
                        </button>
                      </div>
                    </div>
                  );
                })}

                {portfolioLeads.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div className="font-display font-bold text-slate-700">Sua carteira está vazia.</div>
                    <button
                      onClick={() => goToTab('leads')}
                      className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Ver oportunidades
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono uppercase">
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Contato</th>
                      <th className="py-3.5 px-4">Serviço</th>
                      <th className="py-3.5 px-4">Etapa</th>
                      <th className="py-3.5 px-4">Próxima ação</th>
                      <th className="py-3.5 px-4">Responsável</th>
                      <th className="py-3.5 px-4 text-right">Administrar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {portfolioLeads.map((lead) => {
                      const stageMeta =
                        KANBAN_STAGES.find((stage) => stage.id === lead.stage) || KANBAN_STAGES[0];
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition">
                          <td
                            className="py-3.5 px-4 cursor-pointer"
                            onClick={() => setSelectedLeadId(lead.id)}
                          >
                            <div className="font-display font-bold text-sm text-slate-900">
                              {lead.company}
                            </div>
                            <div className="text-slate-500">
                              {lead.neighborhood} — {lead.city}/{lead.state}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-slate-700">{lead.phone || 'Sem telefone'}</div>
                            <div className="text-[11px] text-slate-500">
                              {lead.whatsapp ? 'Celular / WhatsApp confirmado' : 'Contato indisponível'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-indigo-600">{lead.serviceInterest}</div>
                            <div className="font-mono font-bold text-emerald-600">
                              R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-md border font-medium ${stageMeta.badgeClass}`}>
                              {stageMeta.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-700">{lead.nextAction || 'Definir próxima ação'}</div>
                            <div className="text-[11px] text-slate-500">
                              {lead.nextContactDate ? `Retorno: ${lead.nextContactDate}` : 'Sem data de retorno'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {lead.responsibleName}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {lead.phone && (
                                <a
                                  href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold inline-flex items-center gap-1.5"
                                  title="Ligar para o cliente"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  Ligar
                                </a>
                              )}
                              {lead.whatsapp && (
                                <>
                                  <button
                                    onClick={() => void handleQuickWhatsApp(lead)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                                    title="Abrir WhatsApp com apresentação, portfólio e cartaz prontos"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    WhatsApp 1 clique
                                  </button>
                                  <button
                                    onClick={() => setWhatsAppLead(lead)}
                                    className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold cursor-pointer"
                                  >
                                    Roteiros
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setSelectedLeadId(lead.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
                              >
                                Abrir ficha
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {portfolioLeads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 px-4 text-center">
                          <div className="font-display font-bold text-slate-700">Sua carteira está vazia.</div>
                          <p className="text-slate-500 mt-1">
                            Vá em Oportunidades e clique em “Assumir Cliente”.
                          </p>
                          <button
                            onClick={() => {
                              setResponsibleFilter('unassigned');
                              setActiveTab('leads');
                            }}
                            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                          >
                            Ver oportunidades disponíveis
                          </button>
                        </td>
                      </tr>
                    )}
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
                  stage: 'CONTATO INICIADO',
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

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: 'dashboard' as NavTab, label: 'Início', icon: LayoutDashboard },
            { id: 'leads' as NavTab, label: 'Novos', icon: Users, badge: availableLeads.length },
            { id: 'carteira' as NavTab, label: 'Carteira', icon: Award, badge: myPortfolioCount },
            { id: 'agenda' as NavTab, label: 'Agenda', icon: Calendar },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goToTab(item.id)}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute right-2 top-1 min-w-4 rounded-full bg-indigo-600 px-1 text-[9px] leading-4 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-slate-500"
          >
            <Menu className="w-5 h-5" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

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
        activityLogs={crmState.activityLogs}
        onClaimLead={handleClaimLead}
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
        settings={crmState.config}
        onRegisterWhatsAppContact={async (leadId, message, nextStage) => {
          await handleAddInteraction(leadId, 'whatsapp', message, nextStage);
        }}
        onContactStarted={handleStartWhatsAppContact}
        onMessageCopied={handleMessageCopied}
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
