export type UserRole = 'admin' | 'comercial';

export interface UserPermissions {
  canViewAllLeads: boolean;
  canEditAnyLead: boolean;
  canDeleteLeads: boolean;
  canDistributeLeads: boolean;
  canManageServices: boolean;
  canViewFinancialReports: boolean;
  canManageUsers: boolean;
  canConfigureSystem: boolean;
  canManageTeamAgenda: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  status: 'active' | 'inactive';
  avatarColor: string;
  mustChangePassword: boolean;
  tempPasswordHint?: string;
  permissions: UserPermissions;
  lastLoginAt?: string;
  activeDevice?: string;
}

export type KanbanStage =
  | 'NOVOS LEADS'
  | 'AGUARDANDO CONTATO'
  | 'CONTATO REALIZADO'
  | 'INTERESSADO'
  | 'PROPOSTA ENVIADA'
  | 'NEGOCIAÇÃO'
  | 'AGUARDANDO RESPOSTA'
  | 'FECHADO'
  | 'PERDIDO';

export const KANBAN_STAGES: {
  id: KanbanStage;
  label: string;
  description: string;
  color: string;
  badgeClass: string;
  dotClass: string;
}[] = [
  {
    id: 'NOVOS LEADS',
    label: 'Novos Leads',
    description: 'Clientes que acabaram de entrar',
    color: '#38bdf8',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-400',
  },
  {
    id: 'AGUARDANDO CONTATO',
    label: 'Aguardando Contato',
    description: 'Ainda não houve tentativa de contato',
    color: '#fbbf24',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  {
    id: 'CONTATO REALIZADO',
    label: 'Contato Realizado',
    description: 'A equipe já conversou com o cliente',
    color: '#60a5fa',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  {
    id: 'INTERESSADO',
    label: 'Interessado',
    description: 'O cliente demonstrou interesse',
    color: '#f97316',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotClass: 'bg-orange-400',
  },
  {
    id: 'PROPOSTA ENVIADA',
    label: 'Proposta Enviada',
    description: 'Orçamento ou proposta comercial enviada',
    color: '#a855f7',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dotClass: 'bg-purple-400',
  },
  {
    id: 'NEGOCIAÇÃO',
    label: 'Negociação',
    description: 'Cliente está avaliando valores ou condições',
    color: '#6366f1',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    dotClass: 'bg-indigo-400',
  },
  {
    id: 'AGUARDANDO RESPOSTA',
    label: 'Aguardando Resposta',
    description: 'A equipe está aguardando retorno',
    color: '#eab308',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    dotClass: 'bg-yellow-400',
  },
  {
    id: 'FECHADO',
    label: 'Fechado',
    description: 'Cliente aceitou contratar a TRUINEXA DIGITAL',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'PERDIDO',
    label: 'Perdido',
    description: 'Cliente recusou ou negociação não avançou',
    color: '#f43f5e',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
];

export type ServiceCategory =
  | 'Desenvolvimento Digital'
  | 'Design'
  | 'Marketing Digital'
  | 'Consultoria'
  | 'Suporte Técnico';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  basePrice: number;
  status: 'active' | 'inactive';
}

export interface ClosedDealDetails {
  contractedService: string;
  soldValue: number;
  paymentMethod: string;
  closedAt: string;
  responsibleId: string;
  responsibleName: string;
  observation: string;
  expectedStartDate: string;
  expectedDeliveryDate: string;
}

export const LOST_REASON_OPTIONS = [
  'Achou caro',
  'Sem orçamento',
  'Não respondeu',
  'Já possui fornecedor',
  'Não possui interesse',
  'Vai analisar futuramente',
  'Fechou com concorrente',
  'Serviço não necessário',
  'Telefone inválido',
  'Empresa encerrada',
  'Outro',
] as const;

export type LostReasonType = (typeof LOST_REASON_OPTIONS)[number];

export interface LostDetails {
  reason: LostReasonType;
  description: string;
  lostAt: string;
  responsibleId: string;
  responsibleName: string;
  archived: boolean;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  segment: string;
  profession: string;
  city: string;
  neighborhood: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  website: string;
  origin: string;
  serviceInterest: string;
  serviceCategory: ServiceCategory;
  estimatedValue: number;
  closingProbability: number;
  responsibleId: string | null; // null means available to claim
  responsibleName: string;
  createdAt: string;
  stageChangedAt: string;
  lastInteractionAt: string;
  nextAction: string;
  nextContactDate: string;
  stage: KanbanStage;
  observations: string;
  closedDetails?: ClosedDealDetails;
  lostDetails?: LostDetails;
}

export type InteractionType =
  | 'criacao'
  | 'visualizacao'
  | 'whatsapp'
  | 'ligacao'
  | 'email'
  | 'proposta'
  | 'agendamento'
  | 'status'
  | 'observacao'
  | 'fechamento'
  | 'perda';

export interface Interaction {
  id: string;
  leadId: string;
  leadCompany: string;
  userId: string;
  userName: string;
  type: InteractionType;
  message: string;
  createdAt: string;
}

export type AppointmentType =
  | 'Ligação'
  | 'WhatsApp'
  | 'Reunião'
  | 'Apresentação'
  | 'Envio de proposta'
  | 'Follow-up'
  | 'Cobrança'
  | 'Retorno';

export interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  responsibleId: string;
  responsibleName: string;
  type: AppointmentType;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'pendente' | 'concluido' | 'cancelado';
  notes?: string;
}

export interface NotificationItem {
  id: string;
  userId: string | 'all';
  type: 'novo_lead' | 'cliente_assumido' | 'sem_contato' | 'followup_hoje' | 'proposta_pendente' | 'contrato_fechado' | 'agendamento_proximo';
  title: string;
  message: string;
  leadId?: string;
  readBy: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  leadId?: string;
  leadName?: string;
  fromStage?: string;
  toStage?: string;
  details: string;
  createdAt: string;
}

export type ProjectStage =
  | 'Contrato fechado'
  | 'Briefing'
  | 'Desenvolvimento'
  | 'Revisão'
  | 'Aprovação'
  | 'Entrega'
  | 'Manutenção';

export const PROJECT_STAGES: ProjectStage[] = [
  'Contrato fechado',
  'Briefing',
  'Desenvolvimento',
  'Revisão',
  'Aprovação',
  'Entrega',
  'Manutenção',
];

export interface ProjectItem {
  id: string;
  leadId: string;
  clientName: string;
  companyName: string;
  service: string;
  responsibleId: string;
  responsibleName: string;
  value: number;
  stage: ProjectStage;
  startDate: string;
  deadline: string;
  notes: string;
  createdAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'Primeiro Contato' | 'Follow-up' | 'Proposta Comercial' | 'Fechamento' | 'Reativação';
  content: string;
  isOfficialBusinessTemplate: boolean;
}

export interface SystemConfig {
  distributionMode: 'manual' | 'capture' | 'automatic';
  roundRobinOrder: string[]; // ['arthur', 'pedro', 'daniel']
  lastAssignedIndex: number;
  whatsappMode: 'common' | 'business_api';
  whatsappBusinessConfig: {
    phoneNumberId: string;
    businessAccountId: string;
    displayPhoneNumber: string;
    webhookVerifyToken: string;
    connected: boolean;
    autoStageUpdateOnReply: boolean;
    autoFollowUpDays: number;
  };
  stalledAlertDays: number;
}

export interface CRMState {
  users: User[];
  leads: Lead[];
  services: ServiceItem[];
  interactions: Interaction[];
  appointments: Appointment[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  projects: ProjectItem[];
  whatsappTemplates: WhatsAppTemplate[];
  config: SystemConfig;
}
