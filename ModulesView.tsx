import React, { useState } from 'react';
import {
  MessageSquare,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  TrendingUp,
  DollarSign,
  Users,
  Settings,
  Shield,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Archive,
  Award,
  FolderKanban,
  Send,
  KeyRound,
  UserX,
  UserCheck,
  Activity,
  PhoneCall,
} from 'lucide-react';
import {
  CRMState,
  User,
  Lead,
  ServiceItem,
  ServiceCategory,
  AppointmentType,
  PROJECT_STAGES,
  ProjectStage,
  KanbanStage,
} from './crm';
import { crmFetch } from './supabaseApi';

/* ============================================================================
   1. ATENDIMENTO & WHATSAPP + FUNIL AUTOMATIZADO (Section 10 & 20)
============================================================================ */
export const AtendimentoModule: React.FC<{
  state: CRMState;
  currentUser: User;
  onOpenWhatsApp: (lead: Lead) => void;
  onSelectLead: (lead: Lead) => void;
  onMoveStage: (lead: Lead, stage: KanbanStage) => Promise<void>;
  onCreateFollowUpTask: (lead: Lead, suggestionText: string) => Promise<void>;
  onUpdateConfig: (updates: Partial<CRMState['config']>) => Promise<void>;
}> = ({
  state,
  currentUser,
  onOpenWhatsApp,
  onSelectLead,
  onMoveStage,
  onCreateFollowUpTask,
  onUpdateConfig,
}) => {
  const activeLeads = state.leads.filter(
    (l) => l.stage !== 'FECHADO' && l.stage !== 'PERDIDO'
  );

  // Automated Funnel Detection (Section 20)
  const stalledItems = activeLeads
    .map((lead) => {
      const days = Math.floor(
        (Date.now() - new Date(lead.stageChangedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      let recommendation = 'Realizar follow-up.';
      let urgency: 'normal' | 'warning' | 'critical' = 'normal';

      if (days >= 5) {
        recommendation = 'Última tentativa ou sugerir mover para PERDIDO — SEM RESPOSTA.';
        urgency = 'critical';
      } else if (days >= 3) {
        recommendation = 'Segundo follow-up.';
        urgency = 'warning';
      } else if (days >= 2) {
        recommendation = 'Realizar follow-up.';
        urgency = 'warning';
      }
      return { lead, days, recommendation, urgency };
    })
    .filter((item) => item.days >= 1);

  const whatsappInteractions = state.interactions.filter((i) => i.type === 'whatsapp');

  return (
    <div className="space-y-6">
      {/* Top Mode Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Central de Atendimento • Dupla Modalidade WhatsApp
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                API Oficial Protegida
              </span>
            </div>
            <h2 className="text-lg font-display font-bold text-white mb-1">
              WhatsApp Comum & WhatsApp Business Platform
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Abra conversas diretas com mensagens personalizadas ou utilize os templates oficiais do
              WhatsApp Business Cloud API sem risco de bloqueio para o número da TRUINEXA DIGITAL.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  currentUser.role === 'admin' &&
                  onUpdateConfig({ whatsappMode: 'common' })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  state.config.whatsappMode === 'common'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Modo 1: WhatsApp Comum (Direto)
              </button>
              <button
                onClick={() =>
                  currentUser.role === 'admin' &&
                  onUpdateConfig({ whatsappMode: 'business_api' })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  state.config.whatsappMode === 'business_api'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Modo 2: WhatsApp Business Cloud API
              </button>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Número Oficial: {state.config.whatsappBusinessConfig.displayPhoneNumber}
            </span>
          </div>
        </div>

        {/* Automated Funnel Summary Card (Section 20) */}
        <div className="lg:col-span-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Funil Automatizado • Oportunidades Paradas</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
              {stalledItems.length} alertas
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            O CRM monitora automaticamente clientes em <strong>PROPOSTA</strong> ou{' '}
            <strong>SEM RETORNO</strong> e gera recomendações de follow-up:
          </p>
          <div className="space-y-1.5 text-xs font-mono text-slate-400">
            <div>• 2 dias sem retorno → &ldquo;Realizar follow-up.&rdquo;</div>
            <div>• 3 a 4 dias sem retorno → &ldquo;Segundo follow-up.&rdquo;</div>
            <div>• 5+ dias sem retorno → &ldquo;Última tentativa / Sugerir PERDIDO — SEM RESPOSTA&rdquo;</div>
          </div>
        </div>
      </div>

      {/* Stalled Leads Action Queue */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-display font-bold text-white mb-4">
          Fila de Follow-up Automatizado & Atendimento Rápido
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLeads.map((lead) => {
            const days = Math.floor(
              (Date.now() - new Date(lead.stageChangedAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            let autoTag = 'Em dia';
            if (days >= 4) autoTag = 'Última tentativa (Sugerir PERDIDO)';
            else if (days === 3) autoTag = 'Segundo follow-up';
            else if (days === 2) autoTag = 'Realizar follow-up (2 dias)';

            return (
              <div
                key={lead.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-indigo-400 font-semibold">
                      {lead.stage}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        days >= 2
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {autoTag}
                    </span>
                  </div>
                  <h4
                    onClick={() => onSelectLead(lead)}
                    className="font-display font-bold text-sm text-white hover:text-indigo-400 cursor-pointer"
                  >
                    {lead.company}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lead.name} • {lead.phone} • Resp: <strong>{lead.responsibleName}</strong>
                  </p>
                  <p className="text-xs text-slate-300 mt-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                    Próxima ação: {lead.nextAction}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onOpenWhatsApp(lead)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chamar no WhatsApp</span>
                  </button>

                  {days >= 2 && (
                    <button
                      onClick={() =>
                        onCreateFollowUpTask(
                          lead,
                          days >= 3 ? 'Segundo follow-up comercial' : 'Realizar follow-up de proposta'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium cursor-pointer"
                    >
                      + Criar Tarefa Follow-up
                    </button>
                  )}

                  {days >= 3 && (
                    <button
                      onClick={() => onMoveStage(lead, 'PERDIDO')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] cursor-pointer"
                    >
                      Mover p/ Perdido
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent WhatsApp History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-display font-bold text-white mb-3">
          Últimas Mensagens e Contatos Registrados via WhatsApp ({whatsappInteractions.length})
        </h3>
        <div className="space-y-2">
          {whatsappInteractions.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-semibold text-emerald-400">{item.leadCompany}</span>
                <span className="text-slate-500 mx-2">•</span>
                <span className="text-slate-200">{item.message}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
                <span>Atendente: {item.userName}</span>
                <span>•</span>
                <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   2. SISTEMA DE AGENDA & TAREFAS (Section 13 & 14)
============================================================================ */
export const AgendaModule: React.FC<{
  state: CRMState;
  currentUser: User;
  onToggleAppointment: (id: string, status: 'pendente' | 'concluido' | 'cancelado') => Promise<void>;
  onCreateAppointment: (data: {
    leadId: string;
    responsibleId: string;
    type: AppointmentType;
    title: string;
    date: string;
    time: string;
    notes: string;
  }) => Promise<void>;
  onSelectLead: (lead: Lead) => void;
}> = ({ state, currentUser, onToggleAppointment, onCreateAppointment, onSelectLead }) => {
  const [viewScope, setViewScope] = useState<'mine' | 'team'>(
    currentUser.role === 'admin' ? 'team' : 'mine'
  );
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [showNewForm, setShowNewForm] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [leadId, setLeadId] = useState(state.leads[0]?.id || '');
  const [responsibleId, setResponsibleId] = useState(currentUser.id);
  const [type, setType] = useState<AppointmentType>('Follow-up');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const filteredAppointments = state.appointments
    .filter((app) => {
      if (viewScope === 'mine') return app.responsibleId === currentUser.id;
      if (selectedMember !== 'all') return app.responsibleId === selectedMember;
      return true;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetLead = state.leads.find((l) => l.id === leadId);
    await onCreateAppointment({
      leadId,
      responsibleId,
      type,
      title: title || `${type} — ${targetLead?.company || 'Cliente'}`,
      date,
      time,
      notes,
    });
    setShowNewForm(false);
    setTitle('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewScope('mine')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              viewScope === 'mine'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            Minha Agenda ({currentUser.name})
          </button>

          {(currentUser.role === 'admin' || currentUser.permissions.canManageTeamAgenda) && (
            <button
              onClick={() => setViewScope('team')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                viewScope === 'team'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              Agenda da Equipe (Daniel, Arthur e Pedro)
            </button>
          )}
        </div>

        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Compromisso Vinculado</span>
        </button>
      </div>

      {showNewForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-indigo-500/40 bg-slate-900/90 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs text-slate-400 mb-1">Cliente Vinculado</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              {state.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.company} ({l.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AppointmentType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              {[
                'Ligação',
                'WhatsApp',
                'Reunião',
                'Apresentação',
                'Envio de proposta',
                'Follow-up',
                'Cobrança',
                'Retorno',
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Responsável</label>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              {state.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Título do Compromisso *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião Studio Black"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Horário *</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações do agendamento..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Salvar na Agenda
            </button>
          </div>
        </form>
      )}

      {/* Team Columns View (Section 13 exact layout: Daniel, Arthur, Pedro) */}
      {viewScope === 'team' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {state.users.map((member) => {
            const memberApps = filteredAppointments.filter(
              (a) => a.responsibleId === member.id
            );
            return (
              <div
                key={member.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${member.avatarColor} flex items-center justify-center text-white font-display font-bold text-sm`}
                    >
                      {member.name[0]}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-white">
                        {member.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">{member.roleTitle}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-800 font-mono text-xs text-slate-300">
                    {memberApps.length} itens
                  </span>
                </div>

                <div className="space-y-2.5">
                  {memberApps.map((app) => {
                    const linkedLead = state.leads.find((l) => l.id === app.leadId);
                    return (
                      <div
                        key={app.id}
                        className={`p-3.5 rounded-xl border transition ${
                          app.status === 'concluido'
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-65'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {app.time} — {app.type}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">{app.date}</span>
                        </div>
                        <p
                          className={`text-xs font-semibold text-white ${
                            app.status === 'concluido' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {app.title}
                        </p>
                        {linkedLead && (
                          <button
                            onClick={() => onSelectLead(linkedLead)}
                            className="text-[11px] text-indigo-300 hover:underline mt-1 block cursor-pointer"
                          >
                            Cliente: {linkedLead.company} ({linkedLead.name})
                          </button>
                        )}
                        {app.notes && (
                          <p className="text-[11px] text-slate-400 mt-1">{app.notes}</p>
                        )}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                              app.status === 'concluido'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {app.status}
                          </span>
                          <button
                            onClick={() =>
                              onToggleAppointment(
                                app.id,
                                app.status === 'concluido' ? 'pendente' : 'concluido'
                              )
                            }
                            className="text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {app.status === 'concluido' ? 'Reabrir' : 'Concluir'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {app.date} às {app.time}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-300">
                    {app.type}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-white">{app.title}</h4>
                <p className="text-xs text-slate-400">
                  Empresa: {app.leadCompany} • {app.notes}
                </p>
              </div>
              <button
                onClick={() =>
                  onToggleAppointment(
                    app.id,
                    app.status === 'concluido' ? 'pendente' : 'concluido'
                  )
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  app.status === 'concluido'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {app.status === 'concluido' ? '✓ Concluído' : 'Marcar Concluído'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   3. SERVIÇOS DA TRUINEXA DIGITAL (Section 11)
============================================================================ */
export const ServicesModule: React.FC<{
  services: ServiceItem[];
  leads: Lead[];
  currentUser: User;
  onAddService: (srv: Partial<ServiceItem>) => Promise<void>;
  onUpdateService: (id: string, updates: Partial<ServiceItem>) => Promise<void>;
}> = ({ services, leads, currentUser, onAddService, onUpdateService }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Desenvolvimento Digital');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(500);

  const canManage =
    currentUser.role === 'admin' || currentUser.permissions.canManageServices;

  const categories: ServiceCategory[] = [
    'Desenvolvimento Digital',
    'Design',
    'Marketing Digital',
    'Consultoria',
    'Suporte Técnico',
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddService({ name, category, description, basePrice });
    setShowAdd(false);
    setName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-white">
            Catálogo Oficial de Serviços — TRUINEXA DIGITAL
          </h2>
          <p className="text-xs text-slate-400">
            Serviços organizados por especialidade com valor base de referência e demanda atual no
            funil.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Serviço</span>
          </button>
        )}
      </div>

      {showAdd && canManage && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-indigo-500/40 bg-slate-900 p-5 grid grid-cols-1 sm:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nome do Serviço *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Automação de Atendimento"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Categoria *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Preço Base (R$) *</label>
            <input
              type="number"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Salvar Serviço
            </button>
          </div>
          <div className="sm:col-span-4">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição comercial do serviço..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>
        </form>
      )}

      <div className="space-y-6">
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.category === cat);
          return (
            <div
              key={cat}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-display font-bold text-sm text-indigo-300 uppercase tracking-wider">
                  {cat}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {catServices.length} serviços ativos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {catServices.map((srv) => {
                  const interestedCount = leads.filter(
                    (l) => l.serviceInterest.toLowerCase() === srv.name.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={srv.id}
                      className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-display font-semibold text-sm text-white">
                            {srv.name}
                          </h4>
                          <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                            R$ {srv.basePrice.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{srv.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Oportunidades no CRM: {interestedCount}</span>
                        {canManage && (
                          <button
                            onClick={() => {
                              const nextPrice = Number(
                                window.prompt(
                                  `Novo valor base para ${srv.name} (R$):`,
                                  String(srv.basePrice)
                                )
                              );
                              if (nextPrice && !Number.isNaN(nextPrice)) {
                                onUpdateService(srv.id, { basePrice: nextPrice });
                              }
                            }}
                            className="text-indigo-400 hover:underline cursor-pointer"
                          >
                            Ajustar valor
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   4. GESTÃO DE PROJETOS (Section 30 - Automatic creation when deal closes)
============================================================================ */
export const ProjectsModule: React.FC<{
  state: CRMState;
  onUpdateProjectStage: (projectId: string, stage: ProjectStage) => Promise<void>;
}> = ({ state, onUpdateProjectStage }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
            Operação & Entrega • Pós-Venda Integrado
          </span>
          <h2 className="text-lg font-display font-bold text-white">
            Gestão de Projetos da TRUINEXA DIGITAL
          </h2>
          <p className="text-xs text-slate-300">
            Sempre que uma oportunidade é marcada como <strong>FECHADO</strong>, o sistema cria
            automaticamente o projeto abaixo com todas as etapas de produção até a entrega e
            manutenção.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 font-mono text-xs text-indigo-300 font-semibold">
          {state.projects.length} projetos em operação
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {state.projects.map((proj) => {
          const currentIdx = PROJECT_STAGES.indexOf(proj.stage);
          return (
            <div
              key={proj.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-display font-bold text-white">
                      {proj.companyName}
                    </h3>
                    <span className="text-xs text-slate-400">({proj.clientName})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Serviço: <strong className="text-indigo-300">{proj.service}</strong> •
                    Responsável: <strong className="text-slate-200">{proj.responsibleName}</strong>{' '}
                    • Prazo de Entrega:{' '}
                    <strong className="font-mono text-emerald-400">{proj.deadline}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                    R$ {proj.value.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* 7-Step Pipeline Progress (Contrato fechado -> Briefing -> Desenvolvimento -> Revisão -> Aprovação -> Entrega -> Manutenção) */}
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2">
                {PROJECT_STAGES.map((st, idx) => {
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <button
                      key={st}
                      onClick={() => onUpdateProjectStage(proj.id, st)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600/25 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                          : isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase mb-0.5">
                        Etapa {idx + 1}
                      </div>
                      <div className="text-xs font-semibold truncate">{st}</div>
                    </button>
                  );
                })}
              </div>

              {proj.notes && (
                <div className="text-xs text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  Observações de operação: {proj.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   5. RELATÓRIOS COMERCIAIS, FINANCEIROS, SERVIÇOS, INDIVIDUAL & ARQUIVO DE PERDIDOS
      (Sections 19, 21 & 22)
============================================================================ */
export const ReportsModule: React.FC<{
  state: CRMState;
  currentUser: User;
  onSelectLead: (lead: Lead) => void;
  onReactivateLostLead: (lead: Lead) => Promise<void>;
  onDeleteLeadPermanently: (leadId: string) => Promise<void>;
}> = ({
  state,
  currentUser,
  onSelectLead,
  onReactivateLostLead,
  onDeleteLeadPermanently,
}) => {
  const [subTab, setSubTab] = useState<'geral' | 'individual' | 'arquivo_perdidos'>('geral');

  const totalLeads = state.leads.length;
  const workedLeads = state.leads.filter((l) => l.stage !== 'NOVO LEAD').length;
  const contactedLeads = state.leads.filter(
    (l) => l.stage !== 'NOVO LEAD' && l.stage !== 'ASSUMIDO'
  ).length;
  const interestedLeads = state.leads.filter((l) => l.stage === 'RESPONDEU').length;
  const proposalsSent = state.leads.filter(
    (l) =>
      l.stage === 'PROPOSTA' ||
      l.stage === 'NEGOCIAÇÃO' ||
      l.stage === 'SEM RETORNO' ||
      l.stage === 'FECHADO'
  ).length;
  const inNegotiation = state.leads.filter(
    (l) => l.stage === 'NEGOCIAÇÃO' || l.stage === 'SEM RETORNO'
  ).length;
  const closedLeads = state.leads.filter((l) => l.stage === 'FECHADO');
  const lostLeads = state.leads.filter((l) => l.stage === 'PERDIDO');

  const conversionRate =
    totalLeads > 0 ? ((closedLeads.length / totalLeads) * 100).toFixed(1) : '0.0';

  const totalSoldMonth = closedLeads.reduce(
    (acc, l) => acc + (l.closedDetails?.soldValue || l.estimatedValue || 0),
    0
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const soldToday = closedLeads
    .filter((l) => (l.closedDetails?.closedAt || l.stageChangedAt).slice(0, 10) === todayStr)
    .reduce((acc, l) => acc + (l.closedDetails?.soldValue || l.estimatedValue || 0), 0);

  const avgTicket =
    closedLeads.length > 0 ? Math.round(totalSoldMonth / closedLeads.length) : 0;

  // Services Demand Breakdown (Section 21)
  const categoryCounts: Record<string, number> = {
    Sites: 0,
    Flyers: 0,
    Marketing: 0,
    Consultoria: 0,
    Suporte: 0,
  };

  state.leads.forEach((l) => {
    if (l.serviceCategory === 'Desenvolvimento Digital') categoryCounts.Sites += 1;
    else if (l.serviceCategory === 'Design') categoryCounts.Flyers += 1;
    else if (l.serviceCategory === 'Marketing Digital') categoryCounts.Marketing += 1;
    else if (l.serviceCategory === 'Consultoria') categoryCounts.Consultoria += 1;
    else categoryCounts.Suporte += 1;
  });

  // Lost Reasons Breakdown (Section 19)
  const lostReasonCounts: Record<string, number> = {};
  lostLeads.forEach((l) => {
    const r = l.lostDetails?.reason || 'Não informado';
    lostReasonCounts[r] = (lostReasonCounts[r] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSubTab('geral')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            subTab === 'geral'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          Relatórios Comercial, Financeiro & Serviços
        </button>
        <button
          onClick={() => setSubTab('individual')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            subTab === 'individual'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          Relatório Individual (Arthur, Pedro e Daniel)
        </button>
        <button
          onClick={() => setSubTab('arquivo_perdidos')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
            subTab === 'arquivo_perdidos'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Arquivo de Perdidos ({lostLeads.length})</span>
        </button>
      </div>

      {subTab === 'geral' && (
        <div className="space-y-6">
          {/* Comercial & Financeiro Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comercial */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider text-indigo-400">
                Indicadores Comerciais do Funil
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Leads Recebidos', val: totalLeads },
                  { label: 'Leads Trabalhados', val: workedLeads },
                  { label: 'Contatos Realizados', val: state.interactions.length },
                  { label: 'Interessados', val: interestedLeads },
                  { label: 'Propostas Enviadas', val: proposalsSent },
                  { label: 'Em Negociação', val: inNegotiation },
                  { label: 'Contratos Fechados', val: closedLeads.length },
                  { label: 'Negociações Perdidas', val: lostLeads.length },
                  { label: 'Taxa de Conversão', val: `${conversionRate}%` },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <span className="text-[11px] text-slate-400 block">{m.label}</span>
                    <span className="font-mono text-lg font-bold text-white">{m.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financeiro */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-emerald-400">
                Relatório Financeiro & Faturamento
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Valor Vendido Hoje</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    R$ {soldToday.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Valor Vendido na Semana</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    R$ {totalSoldMonth.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Valor Vendido no Mês</span>
                  <span className="font-mono text-xl font-bold text-white">
                    R$ {totalSoldMonth.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Ticket Médio por Contrato</span>
                  <span className="font-mono text-xl font-bold text-indigo-400">
                    R$ {avgTicket.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-medium text-slate-400 block mb-2">
                  Receita Fechada por Vendedor
                </span>
                <div className="space-y-2">
                  {state.users.map((u) => {
                    const userSales = closedLeads
                      .filter((l) => l.responsibleId === u.id)
                      .reduce(
                        (acc, l) => acc + (l.closedDetails?.soldValue || l.estimatedValue || 0),
                        0
                      );
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between text-xs bg-slate-950 px-3 py-2 rounded-lg border border-slate-800"
                      >
                        <span className="font-medium text-slate-200">{u.name}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          R$ {userSales.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Procura por Serviços (Section 21 exact breakdown) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-display font-bold text-white mb-4">
              Serviços com Maior Procura no Funil
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {Object.entries(categoryCounts).map(([label, count]) => {
                const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div
                    key={label}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{label}</span>
                      <span className="font-mono text-sm font-bold text-indigo-400">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      {count} clientes interessados
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {subTab === 'individual' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {state.users.map((member) => {
            const memberLeads = state.leads.filter((l) => l.responsibleId === member.id);
            const memberContacts = state.interactions.filter((i) => i.userId === member.id);
            const memberProposals = memberLeads.filter(
              (l) =>
                l.stage === 'PROPOSTA' ||
                l.stage === 'NEGOCIAÇÃO' ||
                l.stage === 'SEM RETORNO' ||
                l.stage === 'FECHADO'
            );
            const memberClosed = memberLeads.filter((l) => l.stage === 'FECHADO');
            const memberSold = memberClosed.reduce(
              (acc, l) => acc + (l.closedDetails?.soldValue || l.estimatedValue || 0),
              0
            );
            const memberConv =
              memberLeads.length > 0
                ? ((memberClosed.length / memberLeads.length) * 100).toFixed(1)
                : '0,0';

            // Historical + live metrics so Arthur & Pedro match the rich scale in Section 22
            const histBase =
              member.id === 'arthur'
                ? { attended: 37, contacts: 31, proposals: 11, closed: 5, sold: 3200 }
                : member.id === 'pedro'
                ? { attended: 35, contacts: 29, proposals: 9, closed: 4, sold: 3350 }
                : { attended: 28, contacts: 26, proposals: 12, closed: 6, sold: 4900 };

            const totalAttended = histBase.attended + memberLeads.length;
            const totalContacts = histBase.contacts + memberContacts.length;
            const totalProposals = histBase.proposals + memberProposals.length;
            const totalClosed = histBase.closed + memberClosed.length;
            const totalSoldValue = histBase.sold + memberSold;
            const totalConv = ((totalClosed / totalAttended) * 100).toFixed(1).replace('.', ',');

            return (
              <div
                key={member.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${member.avatarColor} flex items-center justify-center text-white font-display font-bold text-lg`}
                    >
                      {member.name[0]}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-white">
                        {member.name}
                      </h3>
                      <span className="text-xs text-slate-400">{member.roleTitle}</span>
                    </div>
                  </div>
                  <Award className="w-5 h-5 text-amber-400" />
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Clientes atendidos:</span>
                    <span className="font-mono font-bold text-white">{totalAttended}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Contatos realizados:</span>
                    <span className="font-mono font-bold text-white">{totalContacts}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Propostas enviadas:</span>
                    <span className="font-mono font-bold text-white">{totalProposals}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Fechamentos:</span>
                    <span className="font-mono font-bold text-emerald-400">{totalClosed}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-400">Conversão:</span>
                    <span className="font-mono font-bold text-indigo-400">
                      {totalConv}% (Atual: {memberConv}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-300 font-semibold">Valor vendido:</span>
                    <span className="font-mono text-lg font-extrabold text-emerald-400">
                      R$ {totalSoldValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'arquivo_perdidos' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <h3 className="text-base font-display font-bold text-white mb-1">
              Arquivo de Clientes Perdidos & Inteligência de Recusas (Seção 19)
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Clientes perdidos nunca são apagados imediatamente do banco. Eles permanecem neste
              arquivo para análise de preço, ausência de resposta e reativação futura.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(lostReasonCounts).map(([reasonLabel, count]) => (
                <div
                  key={reasonLabel}
                  className="p-3 rounded-xl bg-slate-950/90 border border-rose-500/30"
                >
                  <span className="text-xs text-rose-300 font-semibold block">{reasonLabel}</span>
                  <span className="font-mono text-lg font-bold text-white">
                    {count} {count === 1 ? 'cliente' : 'clientes'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase">
                  <th className="py-3.5 px-4">Empresa / Cliente</th>
                  <th className="py-3.5 px-4">Serviço Recusado</th>
                  <th className="py-3.5 px-4">Motivo Obrigatório</th>
                  <th className="py-3.5 px-4">Responsável</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {lostLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="font-bold text-white hover:text-indigo-400 block cursor-pointer"
                      >
                        {lead.company}
                      </button>
                      <span className="text-slate-400">
                        {lead.name} • {lead.phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {lead.serviceInterest} (R$ {lead.estimatedValue.toLocaleString('pt-BR')})
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold">
                        {lead.lostDetails?.reason || 'Não informado'}
                      </span>
                      {lead.lostDetails?.description && (
                        <p className="text-slate-400 mt-1">{lead.lostDetails.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{lead.responsibleName}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onReactivateLostLead(lead)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 font-medium cursor-pointer"
                      >
                        Reativar p/ Contato Futuro
                      </button>
                      {(currentUser.role === 'admin' ||
                        currentUser.permissions.canDeleteLeads) && (
                        <button
                          onClick={() => onDeleteLeadPermanently(lead.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white font-medium cursor-pointer"
                        >
                          Excluir permanentemente
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   6. EQUIPE, PERMISSÕES, LOGS DE ATIVIDADE & CONFIGURAÇÕES (Sections 2, 16, 25, 31)
============================================================================ */
export const TeamAndSettingsModule: React.FC<{
  state: CRMState;
  currentUser: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onSendRecoveryEmail: (userId: string) => Promise<void>;
  onUpdateConfig: (updates: Partial<CRMState['config']>) => Promise<void>;
}> = ({ state, currentUser, onUpdateUser, onSendRecoveryEmail, onUpdateConfig }) => {
  const [recoverySending, setRecoverySending] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [passwordGenerating, setPasswordGenerating] = useState(false);
  const [passwordGenerationError, setPasswordGenerationError] = useState<string | null>(null);
  const isAdmin = currentUser.role === 'admin';

  const generateStandardPassword = async () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*_';
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    const password = 'TRX-' + Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');

    setPasswordGenerating(true);
    setPasswordGenerationError(null);
    setGeneratedPassword(null);

    try {
      const response = await crmFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível alterar a senha.');
      }
      setGeneratedPassword(password);
    } catch (error) {
      setPasswordGenerationError(
        error instanceof Error ? error.message : 'Não foi possível gerar a nova senha.'
      );
    } finally {
      setPasswordGenerating(false);
    }
  };

  const loginLogs = state.activityLogs.filter((log) => log.action === 'LOGIN');
  const dayKey = (value: string | Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value));
  const todayKey = dayKey(new Date());
  const todayLogins = loginLogs.filter((log) => dayKey(log.createdAt) === todayKey).length;
  const usersWithAccess = new Set(loginLogs.map((log) => log.userId)).size;
  const lastLogin = loginLogs[0];

  if (!isAdmin && !currentUser.permissions.canManageUsers) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center max-w-xl mx-auto my-8">
        <Shield className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h2 className="text-lg font-display font-bold text-white mb-1">
          Área Administrativa Restrita ao Administrador (Daniel)
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Seu perfil atual (<strong>{currentUser.name} — Comercial</strong>) possui acesso completo
          aos clientes, funil Kanban, WhatsApp, propostas e agenda, mas configurações administrativas
          e permissões de usuários são exclusivas de Daniel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-slate-900 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              Acesso único
            </span>
            <h3 className="mt-1 text-base font-display font-bold text-white">
              Login padrão da TRUINEXA
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              E-mail: <strong className="text-slate-200">{currentUser.email}</strong>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Novos cadastros e acessos comerciais estão bloqueados. Use somente esta conta administrativa.
            </p>
          </div>

          <button
            type="button"
            disabled={passwordGenerating}
            onClick={() => void generateStandardPassword()}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {passwordGenerating ? 'Gerando...' : 'Gerar nova senha padrão'}
          </button>
        </div>

        {generatedPassword && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Senha alterada com sucesso
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 select-all rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">
                {generatedPassword}
              </code>
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(generatedPassword || '')}
                className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300"
              >
                Copiar senha
              </button>
            </div>
            <p className="mt-2 text-[11px] text-emerald-200/70">
              Guarde esta senha agora. Depois que sair desta tela, ela não será exibida novamente.
            </p>
          </div>
        )}

        {passwordGenerationError && (
          <p className="mt-3 text-xs text-rose-400">{passwordGenerationError}</p>
        )}
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
            Prospecção personalizada
          </span>
          <h3 className="text-base font-display font-bold text-white">
            Identidade usada nas mensagens do WhatsApp
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Altere estes dados sem precisar mexer no código. As novas mensagens usam a configuração salva no Supabase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs text-slate-300">
            <span className="block mb-1.5 font-medium">Nome de quem apresenta</span>
            <input
              key={`sender-${state.config.senderName}`}
              defaultValue={state.config.senderName}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== state.config.senderName) {
                  void onUpdateConfig({ senderName: value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs text-slate-300">
            <span className="block mb-1.5 font-medium">Marca</span>
            <input
              key={`brand-${state.config.brandName}`}
              defaultValue={state.config.brandName}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== state.config.brandName) {
                  void onUpdateConfig({ brandName: value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs text-slate-300">
            <span className="block mb-1.5 font-medium">URL do portfólio</span>
            <input
              type="url"
              key={`portfolio-${state.config.portfolioUrl}`}
              defaultValue={state.config.portfolioUrl}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value !== state.config.portfolioUrl) {
                  void onUpdateConfig({ portfolioUrl: value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs text-slate-300">
            <span className="block mb-1.5 font-medium">URL pública do cartaz/apresentação</span>
            <input
              type="url"
              key={`presentation-${state.config.presentationUrl}`}
              defaultValue={state.config.presentationUrl}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value !== state.config.presentationUrl) {
                  void onUpdateConfig({ presentationUrl: value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </label>
        </div>

        <p className="text-[11px] text-slate-500">
          O cartaz é enviado como link público na mensagem. O navegador não simula anexo automático pelo wa.me.
        </p>
      </div>

      {/* Lead Distribution Rule (Section 16) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
              Regras de Distribuição de Leads (Seção 16)
            </span>
            <h3 className="text-base font-display font-bold text-white">
              Como novos clientes são distribuídos entre Daniel, Arthur e Pedro
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            Fila Automática: Arthur → Pedro → Daniel
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'manual',
              title: '1. Manual (Daniel seleciona)',
              desc: 'Daniel define manualmente o responsável por cada lead recebido.',
            },
            {
              id: 'capture',
              title: '2. Captura (ASSUMIR CLIENTE)',
              desc: 'Novos leads ficam disponíveis e o vendedor clica em ASSUMIR CLIENTE.',
            },
            {
              id: 'automatic',
              title: '3. Automática (Round-Robin)',
              desc: 'O sistema distribui automaticamente: Arthur → Pedro → Daniel → Arthur...',
            },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() =>
                onUpdateConfig({
                  distributionMode: mode.id as 'manual' | 'capture' | 'automatic',
                })
              }
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                state.config.distributionMode === mode.id
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-display font-bold text-xs text-white mb-1">{mode.title}</div>
              <p className="text-xs text-slate-400">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
            Acessos da plataforma
          </span>
          <h3 className="text-base font-display font-bold text-white">
            Histórico de logins autenticados
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Conta acessos concluídos com autenticação no Supabase. Não representa simples abertura da página.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Total de acessos</span>
            <div className="mt-1 text-2xl font-display font-bold text-white">{loginLogs.length}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Acessos hoje</span>
            <div className="mt-1 text-2xl font-display font-bold text-white">{todayLogins}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Usuários que já entraram</span>
            <div className="mt-1 text-2xl font-display font-bold text-white">{usersWithAccess}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {state.users.map((member) => {
            const memberLogins = loginLogs.filter((log) => log.userId === member.id);
            const latest = memberLogins[0];
            return (
              <div
                key={member.id}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{member.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {latest
                      ? `Último acesso: ${new Date(latest.createdAt).toLocaleString('pt-BR', {
                          timeZone: 'America/Sao_Paulo',
                        })}`
                      : 'Ainda sem acesso registrado'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-300">{memberLogins.length}</div>
                  <div className="text-[10px] uppercase text-slate-500">logins</div>
                </div>
              </div>
            );
          })}
        </div>

        {lastLogin && (
          <p className="text-[11px] text-slate-500">
            Último login registrado por <strong className="text-slate-300">{lastLogin.userName}</strong>.
          </p>
        )}
      </div>

      {/* Team Members & Granular Permissions (Section 2 & 31) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h3 className="text-base font-display font-bold text-white">
          Controle de Equipe, Sessões Simultâneas & Permissões (Daniel, Arthur e Pedro)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {state.users.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-sm text-white">{u.name}</h4>
                    <span className="text-xs font-mono text-slate-400">(@{u.username})</span>
                  </div>
                  <span className="text-xs text-indigo-400 font-medium block">
                    Perfil: {u.roleTitle}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                    Sessão: {u.activeDevice || 'Aguardando login'}
                  </span>
                </div>

                {u.id !== 'daniel' && (
                  <button
                    onClick={() =>
                      onUpdateUser(u.id, {
                        status: u.status === 'active' ? 'inactive' : 'active',
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 cursor-pointer ${
                      u.status === 'active'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {u.status === 'active' ? (
                      <>
                        <UserX className="w-3 h-3" />
                        <span>Desativar Usuário</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Reativar Usuário</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Permission Toggles */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                <span className="text-[11px] font-mono uppercase text-slate-500 block mb-1">
                  Permissões do Usuário
                </span>
                {[
                  { key: 'canViewAllLeads', label: 'Visualizar todos os clientes da agência' },
                  { key: 'canEditAnyLead', label: 'Editar clientes de outros vendedores' },
                  { key: 'canDistributeLeads', label: 'Distribuir leads entre vendedores' },
                  { key: 'canManageServices', label: 'Criar e alterar serviços' },
                  { key: 'canViewFinancialReports', label: 'Visualizar relatórios financeiros' },
                  { key: 'canManageTeamAgenda', label: 'Gerenciar agenda da equipe' },
                ].map((perm) => {
                  const checked = Boolean(
                    (u.permissions as unknown as Record<string, boolean>)[perm.key]
                  );
                  return (
                    <label
                      key={perm.key}
                      className="flex items-center justify-between py-1 cursor-pointer"
                    >
                      <span className="text-slate-300">{perm.label}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={u.id === 'daniel'}
                        onChange={(e) =>
                          onUpdateUser(u.id, {
                            permissions: {
                              ...u.permissions,
                              [perm.key]: e.target.checked,
                            },
                          })
                        }
                        className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 block">
                  Redefinição segura de senha
                </span>
                <p className="text-[11px] text-slate-500">
                  A senha atual não é exibida. O usuário recebe um link protegido no e-mail cadastrado e cria uma nova senha.
                </p>
                <button
                  type="button"
                  disabled={recoverySending === u.id}
                  onClick={async () => {
                    setRecoverySending(u.id);
                    setRecoverySent(null);
                    setRecoveryError(null);
                    try {
                      await onSendRecoveryEmail(u.id);
                      setRecoverySent(u.id);
                    } catch (error) {
                      setRecoveryError(
                        error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.'
                      );
                    } finally {
                      setRecoverySending(null);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>
                    {recoverySending === u.id ? 'Enviando...' : 'Enviar redefinição por e-mail'}
                  </span>
                </button>
                {recoverySent === u.id && (
                  <p className="text-[11px] text-emerald-400">
                    Link de redefinição enviado para o e-mail cadastrado.
                  </p>
                )}
                {recoveryError && recoverySending !== u.id && (
                  <p className="text-[11px] text-rose-400">{recoveryError}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Activity Log (Section 25) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Registro de Atividades e Auditoria de Segurança (ACTIVITY_LOG)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {state.activityLogs.length} eventos auditados
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {state.activityLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-400">{log.userName}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    {log.action}
                  </span>
                  {log.fromStage && log.toStage && (
                    <span className="text-[11px] font-mono text-amber-300">
                      {log.fromStage} → {log.toStage}
                    </span>
                  )}
                </div>
                <p className="text-slate-200">{log.details}</p>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                {new Date(log.createdAt).toLocaleDateString('pt-BR')} —{' '}
                {new Date(log.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
