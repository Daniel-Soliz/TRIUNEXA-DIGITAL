import { createClient } from '@supabase/supabase-js';
import {
  CRMState,
  User,
  Lead,
  ServiceItem,
  Interaction,
  Appointment,
  NotificationItem,
  ActivityLog,
  ProjectItem,
  WhatsAppTemplate,
  SystemConfig,
  KanbanStage,
  InteractionType,
  AppointmentType,
  ProjectStage,
  ClosedDealDetails,
  LostDetails,
} from './crm';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://wsyxykfhxguhyojitpbl.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzeXh5a2ZoeGd1aHlvaml0cGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ5MjcsImV4cCI6MjA3MzYzMDkyN30.m2Vla7lLLbmIuzvYqfYZK10yUWabuWH4D2Nj8T1yEw8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const PRODUCTION_APP_URL = 'https://daniel-soliz.github.io/TRIUNEXA-DIGITAL/';

function getAppUrl() {
  const configured = String(import.meta.env.VITE_APP_URL || '').trim();
  if (configured) return configured.endsWith('/') ? configured : `${configured}/`;

  if (window.location.hostname.endsWith('github.io')) {
    return PRODUCTION_APP_URL;
  }

  const current = `${window.location.origin}${window.location.pathname}`;
  return current.endsWith('/') ? current : `${current}/`;
}

function getRecoveryRedirectUrl() {
  const url = new URL(getAppUrl());
  url.searchParams.set('recovery', '1');
  return url.toString();
}

const defaultPermissions = {
  canViewAllLeads: false,
  canEditAnyLead: false,
  canDeleteLeads: false,
  canDistributeLeads: false,
  canManageServices: false,
  canViewFinancialReports: false,
  canManageUsers: false,
  canConfigureSystem: false,
  canManageTeamAgenda: false,
};

const defaultConfig: SystemConfig = {
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
};

export function emptyCRMState(): CRMState {
  return {
    users: [],
    leads: [],
    services: [],
    interactions: [],
    appointments: [],
    notifications: [],
    activityLogs: [],
    projects: [],
    whatsappTemplates: [],
    config: defaultConfig,
  };
}

function toUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    role: row.role,
    roleTitle: row.role_title,
    status: row.status,
    avatarColor: row.avatar_color,
    mustChangePassword: Boolean(row.must_change_password),
    permissions: { ...defaultPermissions, ...(row.permissions || {}) },
    lastLoginAt: row.last_login_at || undefined,
    activeDevice: row.active_device || undefined,
  };
}

function toLead(row: any): Lead {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    segment: row.segment,
    profession: row.profession,
    city: row.city,
    neighborhood: row.neighborhood,
    state: row.state,
    phone: row.phone,
    whatsapp: row.whatsapp,
    phoneNormalized: row.phone_normalized || undefined,
    contactType: row.contact_type || undefined,
    contactValidationMethod: row.contact_validation_method || undefined,
    sourceProvider: row.source_provider || undefined,
    sourceUrl: row.source_url || undefined,
    sourceVerifiedAt: row.source_verified_at || undefined,
    address: row.address || undefined,
    instagramUrl: row.instagram_url || undefined,
    companySummary: row.company_summary || undefined,
    opportunityReason: row.opportunity_reason || undefined,
    validationSources: Array.isArray(row.validation_sources) ? row.validation_sources : [],
    researchedAt: row.researched_at || undefined,
    assignedAt: row.claimed_at || undefined,
    contactStartedAt: row.contact_started_at || undefined,
    lastContactAt: row.last_contact_at || undefined,
    opportunitySummary: row.opportunity_summary || undefined,
    recommendedService: row.recommended_service || undefined,
    recommendedBenefit: row.recommended_benefit || undefined,
    whatsappMessage: row.whatsapp_message || undefined,
    email: row.email,
    instagram: row.instagram,
    website: row.website,
    origin: row.origin,
    serviceInterest: row.service_interest,
    serviceCategory: row.service_category,
    estimatedValue: Number(row.estimated_value || 0),
    closingProbability: Number(row.closing_probability || 0),
    responsibleId: row.responsible_id,
    responsibleName: row.responsible_name,
    createdAt: row.created_at,
    stageChangedAt: row.stage_changed_at,
    lastInteractionAt: row.last_interaction_at,
    nextAction: row.next_action,
    nextContactDate: row.next_contact_date || '',
    stage: row.stage,
    observations: row.observations || '',
    closedDetails: row.closed_details || undefined,
    lostDetails: row.lost_details || undefined,
  };
}

function leadPatch(updates: Partial<Lead>) {
  const row: Record<string, unknown> = {};
  const map: Record<string, string> = {
    name: 'name',
    company: 'company',
    segment: 'segment',
    profession: 'profession',
    city: 'city',
    neighborhood: 'neighborhood',
    state: 'state',
    phone: 'phone',
    whatsapp: 'whatsapp',
    contactType: 'contact_type',
    contactValidationMethod: 'contact_validation_method',
    sourceProvider: 'source_provider',
    sourceUrl: 'source_url',
    sourceVerifiedAt: 'source_verified_at',
    address: 'address',
    instagramUrl: 'instagram_url',
    companySummary: 'company_summary',
    opportunityReason: 'opportunity_reason',
    validationSources: 'validation_sources',
    researchedAt: 'researched_at',
    assignedAt: 'claimed_at',
    contactStartedAt: 'contact_started_at',
    lastContactAt: 'last_contact_at',
    opportunitySummary: 'opportunity_summary',
    recommendedService: 'recommended_service',
    recommendedBenefit: 'recommended_benefit',
    whatsappMessage: 'whatsapp_message',
    email: 'email',
    instagram: 'instagram',
    website: 'website',
    origin: 'origin',
    serviceInterest: 'service_interest',
    serviceCategory: 'service_category',
    estimatedValue: 'estimated_value',
    closingProbability: 'closing_probability',
    responsibleId: 'responsible_id',
    responsibleName: 'responsible_name',
    stageChangedAt: 'stage_changed_at',
    lastInteractionAt: 'last_interaction_at',
    nextAction: 'next_action',
    nextContactDate: 'next_contact_date',
    stage: 'stage',
    observations: 'observations',
    closedDetails: 'closed_details',
    lostDetails: 'lost_details',
  };
  for (const [key, value] of Object.entries(updates)) {
    const dbKey = map[key];
    if (dbKey) row[dbKey] = value;
  }
  return row;
}

function toService(row: any): ServiceItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    basePrice: Number(row.base_price || 0),
    status: row.status,
  };
}

function toInteraction(row: any): Interaction {
  return {
    id: row.id,
    leadId: row.lead_id,
    leadCompany: row.lead_company,
    userId: row.user_id || '',
    userName: row.user_name,
    type: row.type,
    message: row.message,
    createdAt: row.created_at,
  };
}

function toAppointment(row: any): Appointment {
  return {
    id: row.id,
    leadId: row.lead_id,
    leadName: row.lead_name,
    leadCompany: row.lead_company,
    responsibleId: row.responsible_id,
    responsibleName: row.responsible_name,
    type: row.type,
    title: row.title,
    date: row.date,
    time: String(row.time || '').slice(0, 5),
    status: row.status,
    notes: row.notes || undefined,
  };
}

function toNotification(row: any): NotificationItem {
  return {
    id: row.id,
    userId: row.target_user_id || 'all',
    type: row.type,
    title: row.title,
    message: row.message,
    leadId: row.lead_id || undefined,
    readBy: row.read_by || [],
    createdAt: row.created_at,
  };
}

function toActivityLog(row: any): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id || '',
    userName: row.user_name,
    action: row.action,
    leadId: row.lead_id || undefined,
    leadName: row.lead_name || undefined,
    fromStage: row.from_stage || undefined,
    toStage: row.to_stage || undefined,
    details: row.details,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function toProject(row: any): ProjectItem {
  return {
    id: row.id,
    leadId: row.lead_id,
    clientName: row.client_name,
    companyName: row.company_name,
    service: row.service,
    responsibleId: row.responsible_id,
    responsibleName: row.responsible_name,
    value: Number(row.value || 0),
    stage: row.stage,
    startDate: row.start_date || '',
    deadline: row.deadline || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toTemplate(row: any): WhatsAppTemplate {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    content: row.content,
    isOfficialBusinessTemplate: Boolean(row.is_official_business_template),
  };
}

function toConfig(row: any): SystemConfig {
  if (!row) return defaultConfig;
  return {
    distributionMode: row.distribution_mode,
    roundRobinOrder: row.round_robin_order || [],
    lastAssignedIndex: row.last_assigned_index || 0,
    whatsappMode: row.whatsapp_mode,
    whatsappBusinessConfig: {
      ...defaultConfig.whatsappBusinessConfig,
      ...(row.whatsapp_business_config || {}),
    },
    stalledAlertDays: row.stalled_alert_days || 2,
    senderName: row.sender_name || defaultConfig.senderName,
    brandName: row.brand_name || defaultConfig.brandName,
    portfolioUrl: row.portfolio_url || defaultConfig.portfolioUrl,
    presentationUrl: row.presentation_url || defaultConfig.presentationUrl,
  };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

async function parseBody(init?: RequestInit) {
  if (!init?.body) return {};
  if (typeof init.body === 'string') {
    try {
      return JSON.parse(init.body);
    } catch {
      return {};
    }
  }
  return {};
}

async function currentProfile(): Promise<User | null> {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('truinexa_profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  return data ? toUser(data) : null;
}

export async function loadCRMState(): Promise<CRMState> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return emptyCRMState();

  const [
    usersR,
    leadsR,
    servicesR,
    interactionsR,
    appointmentsR,
    notificationsR,
    logsR,
    projectsR,
    templatesR,
    configR,
  ] = await Promise.all([
    supabase.from('truinexa_profiles').select('*').order('name'),
    supabase.from('truinexa_leads').select('*').order('created_at', { ascending: false }),
    supabase.from('truinexa_services').select('*').order('category').order('name'),
    supabase.from('truinexa_interactions').select('*').order('created_at', { ascending: false }),
    supabase.from('truinexa_appointments').select('*').order('date').order('time'),
    supabase.from('truinexa_notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('truinexa_activity_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('truinexa_projects').select('*').order('created_at', { ascending: false }),
    supabase.from('truinexa_whatsapp_templates').select('*').order('name'),
    supabase.from('truinexa_config').select('*').eq('id', true).maybeSingle(),
  ]);

  const all = [
    usersR,
    leadsR,
    servicesR,
    interactionsR,
    appointmentsR,
    notificationsR,
    logsR,
    projectsR,
    templatesR,
    configR,
  ];
  const failed = all.find((r: any) => r.error);
  if (failed?.error) throw failed.error;

  return {
    users: (usersR.data || []).map(toUser),
    leads: (leadsR.data || []).map(toLead),
    services: (servicesR.data || []).map(toService),
    interactions: (interactionsR.data || []).map(toInteraction),
    appointments: (appointmentsR.data || []).map(toAppointment),
    notifications: (notificationsR.data || []).map(toNotification),
    activityLogs: (logsR.data || []).map(toActivityLog),
    projects: (projectsR.data || []).map(toProject),
    whatsappTemplates: (templatesR.data || []).map(toTemplate),
    config: toConfig(configR.data),
  };
}

export function subscribeToCRMChanges(onChange: () => void) {
  let timer: number | null = null;
  const notify = () => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(onChange, 180);
  };

  const tables = [
    'truinexa_profiles',
    'truinexa_leads',
    'truinexa_interactions',
    'truinexa_appointments',
    'truinexa_services',
    'truinexa_projects',
    'truinexa_notifications',
    'truinexa_activity_logs',
    'truinexa_whatsapp_templates',
    'truinexa_config',
  ];

  let channel = supabase.channel('truinexa-crm-live');
  for (const table of tables) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      notify
    );
  }
  channel.subscribe();

  return () => {
    if (timer) window.clearTimeout(timer);
    void supabase.removeChannel(channel);
  };
}

async function insertLog(
  profile: User,
  lead: Lead | null,
  action: string,
  details: string,
  fromStage?: string,
  toStage?: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from('truinexa_activity_logs').insert({
    user_id: profile.id,
    user_name: profile.name,
    action,
    lead_id: lead?.id || null,
    lead_name: lead?.company || null,
    from_stage: fromStage || null,
    to_stage: toStage || null,
    details,
    metadata,
  });
}

async function insertNotification(type: NotificationItem['type'], title: string, message: string, leadId?: string) {
  await supabase.from('truinexa_notifications').insert({
    target_user_id: null,
    type,
    title,
    message,
    lead_id: leadId || null,
    read_by: [],
  });
}

async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase.from('truinexa_leads').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toLead(data) : null;
}

export async function crmFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  const body: any = await parseBody(init);

  try {
    if (path === '/api/state' && method === 'GET') {
      return jsonResponse(await loadCRMState());
    }

    if (path === '/api/auth/signup' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || '').trim();
      if (!email || !password) return errorResponse('Informe e-mail e senha.', 400);
      if (password.length < 8) return errorResponse('A senha deve ter pelo menos 8 caracteres.', 400);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split('@')[0] },
          emailRedirectTo: getAppUrl(),
        },
      });
      if (error) return errorResponse(error.message, 400);

      return jsonResponse({
        message: data.session
          ? 'Conta criada e conectada.'
          : 'Conta criada. Confira seu e-mail para confirmar o acesso.',
        requiresEmailConfirmation: !data.session,
      }, data.session ? 200 : 202);
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const email = String(body.identifier || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email.includes('@')) {
        return errorResponse('Use seu e-mail para entrar no novo acesso seguro da TRUINEXA.', 400);
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) return errorResponse(error?.message || 'Falha na autenticação.', 401);

      const profile = await currentProfile();
      if (!profile) {
        await supabase.auth.signOut();
        return errorResponse('Perfil interno não encontrado.', 403);
      }
      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        return errorResponse('Cadastro recebido. Aguarde a aprovação do administrador para acessar o CRM.', 403);
      }

      const loginAt = new Date().toISOString();
      const deviceInfo = String(body.deviceInfo || 'Navegador');

      await supabase
        .from('truinexa_profiles')
        .update({ last_login_at: loginAt, active_device: deviceInfo })
        .eq('id', profile.id);

      await insertLog(
        profile,
        null,
        'LOGIN',
        'Acesso autenticado na plataforma',
        undefined,
        undefined,
        { deviceInfo }
      );

      const refreshedProfile = await currentProfile();
      return jsonResponse({
        user: refreshedProfile || profile,
        sessionToken: data.session.access_token,
      });
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      await supabase.auth.signOut();
      return jsonResponse({ ok: true });
    }

    if (path === '/api/auth/recover-password' && method === 'POST') {
      const email = String(body.identifier || '').trim().toLowerCase();
      if (!email.includes('@')) return errorResponse('Informe o e-mail da sua conta.', 400);
      const redirectTo = getRecoveryRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return errorResponse(error.message, 400);
      return jsonResponse({ message: 'Enviamos um link de recuperação para o seu e-mail.' });
    }

    if (path === '/api/auth/change-password' && method === 'POST') {
      const newPassword = String(body.newPassword || '');
      if (newPassword.length < 8) return errorResponse('A senha deve ter pelo menos 8 caracteres.', 400);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return errorResponse(error.message, 400);
      const profile = await currentProfile();
      return jsonResponse({ user: profile });
    }

    const profile = await currentProfile();
    if (!profile) return errorResponse('Sessão expirada. Entre novamente.', 401);

    if (path === '/api/leads' && method === 'POST') {
      const leadData: Partial<Lead> = body.leadData || {};
      const now = new Date().toISOString();
      const responsibleId =
        leadData.responsibleId ?? (profile.role === 'admin' ? null : profile.id);
      const responsibleName =
        responsibleId === profile.id ? profile.name : (leadData.responsibleName || 'Disponível');

      const row = {
        name: leadData.name || 'Contato comercial',
        company: leadData.company || leadData.name || 'Empresa',
        segment: leadData.segment || 'Comércio & Serviços',
        profession: leadData.profession || 'Responsável comercial / proprietário',
        city: leadData.city || 'São Paulo',
        neighborhood: leadData.neighborhood || '',
        state: leadData.state || 'SP',
        phone: leadData.phone || '',
        whatsapp: (leadData.whatsapp || leadData.phone || '').replace(/\D/g, ''),
        email: leadData.email || '',
        instagram: leadData.instagram || '',
        website: leadData.website || '',
        origin: leadData.origin || 'Cadastro manual',
        service_interest: leadData.serviceInterest || 'Site institucional',
        service_category: leadData.serviceCategory || 'Desenvolvimento Digital',
        estimated_value: Number(leadData.estimatedValue || 0),
        closing_probability: Number(leadData.closingProbability || 30),
        responsible_id: responsibleId,
        responsible_name: responsibleName,
        stage: (leadData.stage as KanbanStage) || 'NOVO LEAD',
        stage_changed_at: now,
        last_interaction_at: now,
        opportunity_summary: leadData.opportunitySummary || '',
        recommended_service: leadData.recommendedService || leadData.serviceInterest || '',
        recommended_benefit: leadData.recommendedBenefit || '',
        whatsapp_message: leadData.whatsappMessage || '',
        next_action: leadData.nextAction || 'Realizar primeiro contato comercial',
        next_contact_date: leadData.nextContactDate || now.slice(0, 10),
        observations: leadData.observations || '',
        created_by: profile.id,
      };
      const { data, error } = await supabase.from('truinexa_leads').insert(row).select('*').single();
      if (error) return errorResponse(error.message, 400);
      const lead = toLead(data);
      await insertLog(profile, lead, 'lead_created', `${profile.name} cadastrou ${lead.company}.`);
      return jsonResponse(lead);
    }

    const claimMatch = path.match(/^\/api\/leads\/([^/]+)\/claim$/);
    if (claimMatch && method === 'POST') {
      const id = claimMatch[1];
      const { data, error } = await supabase.rpc('truinexa_claim_lead', {
        p_lead_id: id,
      });
      if (error) return errorResponse(error.message, 400);

      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.success) {
        return errorResponse(
          result?.message || 'Este lead acabou de ser assumido por outro usuário.',
          409
        );
      }

      const lead = await getLead(id);
      if (!lead) return errorResponse('Cliente não encontrado após assumir.', 404);
      return jsonResponse(lead);
    }

    const contactMatch = path.match(/^\/api\/leads\/([^/]+)\/contact-started$/);
    if (contactMatch && method === 'POST') {
      const id = contactMatch[1];
      const message = String(body.message || '');
      const { data, error } = await supabase.rpc('truinexa_start_whatsapp_contact', {
        p_lead_id: id,
        p_message: message,
      });
      if (error) return errorResponse(error.message, 400);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return errorResponse('Cliente não encontrado após registrar contato.', 404);
      return jsonResponse(toLead(row));
    }

    const activityMatch = path.match(/^\/api\/leads\/([^/]+)\/activity$/);
    if (activityMatch && method === 'POST') {
      const lead = await getLead(activityMatch[1]);
      if (!lead) return errorResponse('Cliente não encontrado.', 404);
      if (
        profile.role !== 'admin' &&
        lead.responsibleId !== profile.id
      ) {
        return errorResponse('Este lead pertence a outro usuário.', 403);
      }
      const action = String(body.action || '').trim();
      if (!action) return errorResponse('Ação não informada.', 400);
      await insertLog(
        profile,
        lead,
        action,
        String(body.details || action),
        body.fromStage || undefined,
        body.toStage || undefined,
        body.metadata || {}
      );
      return jsonResponse({ ok: true });
    }

    const leadMatch = path.match(/^\/api\/leads\/([^/]+)$/);
    if (leadMatch && method === 'PUT') {
      const id = leadMatch[1];
      const previous = await getLead(id);
      if (!previous) return errorResponse('Cliente não encontrado.', 404);

      const patch = leadPatch(body.updates || {});
      const now = new Date().toISOString();
      patch.last_interaction_at = now;
      if ('stage' in patch && patch.stage !== previous.stage) patch.stage_changed_at = now;
      if ('responsible_id' in patch && patch.responsible_id) patch.claimed_at = now;

      const { data, error } = await supabase
        .from('truinexa_leads')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) return errorResponse(error.message, 400);
      const lead = toLead(data);

      if (previous.responsibleId !== lead.responsibleId && lead.responsibleId) {
        await insertNotification('cliente_assumido', 'Cliente adicionado à carteira', `${lead.company} agora está com ${lead.responsibleName}.`, lead.id);
        await insertLog(profile, lead, 'lead_assigned', `${profile.name} adicionou ${lead.company} à carteira.`);
      } else if (previous.stage !== lead.stage) {
        await insertLog(profile, lead, 'moved_stage', `${lead.company}: ${previous.stage} → ${lead.stage}.`, previous.stage, lead.stage);
      }
      return jsonResponse(lead);
    }

    if (leadMatch && method === 'DELETE') {
      const id = leadMatch[1];
      const { error } = await supabase.from('truinexa_leads').delete().eq('id', id);
      if (error) return errorResponse(error.message, 400);
      return jsonResponse({ ok: true });
    }

    const closeMatch = path.match(/^\/api\/leads\/([^/]+)\/close$/);
    if (closeMatch && method === 'POST') {
      const id = closeMatch[1];
      const lead = await getLead(id);
      if (!lead) return errorResponse('Cliente não encontrado.', 404);
      const details: ClosedDealDetails = body.closedDetails;
      const now = new Date().toISOString();

      const { data, error } = await supabase.from('truinexa_leads').update({
        stage: 'FECHADO',
        closed_details: details,
        stage_changed_at: now,
        last_interaction_at: now,
      }).eq('id', id).select('*').single();
      if (error) return errorResponse(error.message, 400);
      const closedLead = toLead(data);

      await supabase.from('truinexa_projects').insert({
        lead_id: closedLead.id,
        client_name: closedLead.name,
        company_name: closedLead.company,
        service: details?.contractedService || closedLead.serviceInterest,
        responsible_id: closedLead.responsibleId || profile.id,
        responsible_name: closedLead.responsibleName || profile.name,
        value: Number(details?.soldValue || closedLead.estimatedValue || 0),
        stage: 'Contrato fechado',
        start_date: details?.expectedStartDate || now.slice(0, 10),
        deadline: details?.expectedDeliveryDate || now.slice(0, 10),
        notes: details?.observation || '',
      });
      await supabase.from('truinexa_interactions').insert({
        lead_id: closedLead.id,
        lead_company: closedLead.company,
        user_id: profile.id,
        user_name: profile.name,
        type: 'fechamento',
        message: `Contrato fechado por ${profile.name}.`,
      });
      await insertNotification('contrato_fechado', 'Contrato fechado', `${closedLead.company} virou cliente da TRUINEXA.`, closedLead.id);
      await insertLog(profile, closedLead, 'Contrato Fechado', `${closedLead.company} fechado por ${profile.name}.`, lead.stage, 'FECHADO');
      return jsonResponse(closedLead);
    }

    const lostMatch = path.match(/^\/api\/leads\/([^/]+)\/lost$/);
    if (lostMatch && method === 'POST') {
      const id = lostMatch[1];
      const lead = await getLead(id);
      if (!lead) return errorResponse('Cliente não encontrado.', 404);
      const details: LostDetails = body.lostDetails;
      const now = new Date().toISOString();
      const { data, error } = await supabase.from('truinexa_leads').update({
        stage: 'PERDIDO',
        lost_details: details,
        stage_changed_at: now,
        last_interaction_at: now,
      }).eq('id', id).select('*').single();
      if (error) return errorResponse(error.message, 400);
      const lostLead = toLead(data);
      await insertLog(profile, lostLead, 'Lead Perdido', details?.description || details?.reason || 'Negociação encerrada.', lead.stage, 'PERDIDO');
      return jsonResponse(lostLead);
    }

    if (path === '/api/interactions' && method === 'POST') {
      const lead = await getLead(body.leadId);
      if (!lead) return errorResponse('Cliente não encontrado.', 404);
      const { data, error } = await supabase.from('truinexa_interactions').insert({
        lead_id: lead.id,
        lead_company: lead.company,
        user_id: profile.id,
        user_name: profile.name,
        type: body.type as InteractionType,
        message: String(body.message || ''),
      }).select('*').single();
      if (error) return errorResponse(error.message, 400);
      if (body.autoAdvanceStage) {
        const nextStage = body.autoAdvanceStage as KanbanStage;
        await supabase.from('truinexa_leads').update({
          stage: nextStage,
          stage_changed_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
        }).eq('id', lead.id);
        if (lead.stage !== nextStage) {
          await insertLog(
            profile,
            lead,
            'moved_stage',
            `${lead.company}: ${lead.stage} → ${nextStage}.`,
            lead.stage,
            nextStage
          );
        }
      } else {
        await supabase.from('truinexa_leads').update({
          last_interaction_at: new Date().toISOString(),
        }).eq('id', lead.id);
      }
      return jsonResponse(toInteraction(data));
    }

    if (path === '/api/appointments' && method === 'POST') {
      const a = body.appointment || {};
      const lead = await getLead(a.leadId);
      if (!lead) return errorResponse('Cliente não encontrado.', 404);
      const responsibleName =
        a.responsibleId === profile.id
          ? profile.name
          : (await supabase.from('truinexa_profiles').select('name').eq('id', a.responsibleId).maybeSingle()).data?.name || profile.name;
      const { data, error } = await supabase.from('truinexa_appointments').insert({
        lead_id: lead.id,
        lead_name: lead.name,
        lead_company: lead.company,
        responsible_id: a.responsibleId,
        responsible_name: responsibleName,
        type: a.type as AppointmentType,
        title: a.title,
        date: a.date,
        time: a.time,
        status: 'pendente',
        notes: a.notes || '',
      }).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse(toAppointment(data));
    }

    const appointmentMatch = path.match(/^\/api\/appointments\/([^/]+)$/);
    if (appointmentMatch && method === 'PUT') {
      const { data, error } = await supabase.from('truinexa_appointments')
        .update({ status: body.status })
        .eq('id', appointmentMatch[1])
        .select('*')
        .single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse(toAppointment(data));
    }

    if (path === '/api/services' && method === 'POST') {
      const s: Partial<ServiceItem> = body.service || {};
      const { data, error } = await supabase.from('truinexa_services').insert({
        name: s.name,
        category: s.category,
        description: s.description || '',
        base_price: Number(s.basePrice || 0),
        status: s.status || 'active',
      }).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse(toService(data));
    }

    const serviceMatch = path.match(/^\/api\/services\/([^/]+)$/);
    if (serviceMatch && method === 'PUT') {
      const s: Partial<ServiceItem> = body.updates || {};
      const patch: Record<string, unknown> = {};
      if (s.name !== undefined) patch.name = s.name;
      if (s.category !== undefined) patch.category = s.category;
      if (s.description !== undefined) patch.description = s.description;
      if (s.basePrice !== undefined) patch.base_price = Number(s.basePrice);
      if (s.status !== undefined) patch.status = s.status;
      const { data, error } = await supabase.from('truinexa_services')
        .update(patch).eq('id', serviceMatch[1]).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse(toService(data));
    }

    const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch && method === 'PUT') {
      const updates = body.updates || {};
      const patch: Record<string, unknown> = {};
      if (updates.stage !== undefined) patch.stage = updates.stage as ProjectStage;
      if (updates.notes !== undefined) patch.notes = updates.notes;
      if (updates.deadline !== undefined) patch.deadline = updates.deadline;
      const { data, error } = await supabase.from('truinexa_projects')
        .update(patch).eq('id', projectMatch[1]).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse(toProject(data));
    }

    const recoveryEmailMatch = path.match(/^\/api\/users\/([^/]+)\/recovery-email$/);
    if (recoveryEmailMatch && method === 'POST') {
      if (profile.role !== 'admin' && !profile.permissions.canManageUsers) {
        return errorResponse('Apenas o administrador pode redefinir acessos da equipe.', 403);
      }

      const { data: target, error: targetError } = await supabase
        .from('truinexa_profiles')
        .select('id,name,email')
        .eq('id', recoveryEmailMatch[1])
        .maybeSingle();

      if (targetError || !target?.email) {
        return errorResponse('Usuário não encontrado para recuperação.', 404);
      }

      const { error } = await supabase.auth.resetPasswordForEmail(target.email, {
        redirectTo: getRecoveryRedirectUrl(),
      });
      if (error) return errorResponse(error.message, 400);

      await insertLog(
        profile,
        null,
        'PASSWORD_RECOVERY_SENT',
        `Link de redefinição enviado por e-mail para ${target.name}.`,
        undefined,
        undefined,
        { targetUserId: target.id }
      );

      return jsonResponse({
        message: `Link de redefinição enviado para o e-mail cadastrado de ${target.name}.`,
      });
    }

    const userMatch = path.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && method === 'PUT') {
      const u: Partial<User> = body.updates || {};
      const patch: Record<string, unknown> = {};
      if (u.username !== undefined) patch.username = u.username;
      if (u.name !== undefined) patch.name = u.name;
      if (u.email !== undefined) patch.email = u.email;
      if (u.role !== undefined) patch.role = u.role;
      if (u.roleTitle !== undefined) patch.role_title = u.roleTitle;
      if (u.status !== undefined) patch.status = u.status;
      if (u.avatarColor !== undefined) patch.avatar_color = u.avatarColor;
      if (u.permissions !== undefined) patch.permissions = u.permissions;
      const { data, error } = await supabase.from('truinexa_profiles')
        .update(patch).eq('id', userMatch[1]).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse(toUser(data));
    }

    if (path === '/api/config' && method === 'PUT') {
      const c = body.configUpdates || {};
      const patch: Record<string, unknown> = {};
      if (c.distributionMode !== undefined) patch.distribution_mode = c.distributionMode;
      if (c.roundRobinOrder !== undefined) patch.round_robin_order = c.roundRobinOrder;
      if (c.lastAssignedIndex !== undefined) patch.last_assigned_index = c.lastAssignedIndex;
      if (c.whatsappMode !== undefined) patch.whatsapp_mode = c.whatsappMode;
      if (c.whatsappBusinessConfig !== undefined) patch.whatsapp_business_config = c.whatsappBusinessConfig;
      if (c.stalledAlertDays !== undefined) patch.stalled_alert_days = c.stalledAlertDays;
      if (c.senderName !== undefined) patch.sender_name = c.senderName;
      if (c.brandName !== undefined) patch.brand_name = c.brandName;
      if (c.portfolioUrl !== undefined) patch.portfolio_url = c.portfolioUrl;
      if (c.presentationUrl !== undefined) patch.presentation_url = c.presentationUrl;
      const { data, error } = await supabase.from('truinexa_config')
        .update(patch).eq('id', true).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return jsonResponse(toConfig(data));
    }

    if (path === '/api/notifications/read' && method === 'POST') {
      const id = body.notificationId;
      const { data, error } = await supabase.from('truinexa_notifications').select('id,read_by');
      if (error) return errorResponse(error.message, 400);
      const targets = id === 'all' ? (data || []) : (data || []).filter((n: any) => n.id === id);
      await Promise.all(targets.map((n: any) => {
        const readBy = Array.from(new Set([...(n.read_by || []), profile.id]));
        return supabase.from('truinexa_notifications').update({ read_by: readBy }).eq('id', n.id);
      }));
      return jsonResponse({ ok: true });
    }

    return errorResponse('Rota não encontrada.', 404);
  } catch (error: any) {
    console.error('Supabase CRM error:', error);
    return errorResponse(error?.message || 'Erro ao acessar o banco da TRUINEXA.', 500);
  }
}
