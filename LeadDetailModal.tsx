import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Globe,
  Instagram,
  MapPin,
  Briefcase,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Edit3,
  Save,
  Trash2,
  TrendingUp,
  FileText,
  ExternalLink,
  Search,
} from 'lucide-react';
import {
  Lead,
  User,
  Interaction,
  ActivityLog,
  ServiceItem,
  KANBAN_STAGES,
  KanbanStage,
  InteractionType,
} from './crm';

interface LeadDetailModalProps {
  lead: Lead | null;
  startEditing?: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  services: ServiceItem[];
  interactions: Interaction[];
  activityLogs: ActivityLog[];
  onClaimLead: (lead: Lead) => Promise<void>;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  onAddInteraction: (
    leadId: string,
    type: InteractionType,
    message: string,
    autoAdvanceStage?: KanbanStage
  ) => Promise<void>;
  onOpenWhatsApp: (lead: Lead) => void;
  onOpenAppointment: (lead: Lead) => void;
  onOpenCloseDeal: (lead: Lead) => void;
  onOpenLostDeal: (lead: Lead) => void;
  onDeleteLeadPermanently: (leadId: string) => Promise<void>;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  startEditing = false,
  onClose,
  currentUser,
  users: _users,
  services,
  interactions,
  activityLogs,
  onClaimLead: _onClaimLead,
  onUpdateLead,
  onAddInteraction,
  onOpenWhatsApp,
  onOpenAppointment,
  onOpenCloseDeal,
  onOpenLostDeal,
  onDeleteLeadPermanently,
}) => {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState<Partial<Lead>>({});
  const [noteType, setNoteType] = useState<InteractionType>('observacao');
  const [noteText, setNoteText] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormState(lead);
      setProposalAmount(String(lead.estimatedValue || ''));
      setEditing(startEditing);
      setConfirmDelete(false);
    }
  }, [lead, startEditing]);

  if (!lead) return null;

  const leadInteractions = interactions.filter((i) => i.leadId === lead.id);
  const leadActivityLogs = activityLogs.filter((item) => item.leadId === lead.id);
  const stageMeta = KANBAN_STAGES.find((s) => s.id === lead.stage) || KANBAN_STAGES[0];
  const canDelete = currentUser.role === 'admin' || currentUser.permissions.canDeleteLeads;
  const canContact =
    currentUser.role === 'admin' || lead.responsibleId === currentUser.id;

  const handleSaveEdits = async () => {
    await onUpdateLead(lead.id, formState);
    setEditing(false);
  };

  const handleClaimLead = async () => {
    await _onClaimLead(lead);
  };

  const handleStageSelect = async (newStage: KanbanStage) => {
    if (newStage === 'FECHADO') {
      onOpenCloseDeal(lead);
      return;
    }
    if (newStage === 'PERDIDO') {
      onOpenLostDeal(lead);
      return;
    }
    await onUpdateLead(lead.id, { stage: newStage });
  };

  const handleAddTimelineEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    let finalMessage = noteText.trim();
    let autoStage: KanbanStage | undefined;

    if (noteType === 'proposta') {
      const val = Number(proposalAmount) || lead.estimatedValue;
      finalMessage = `Proposta de R$ ${val.toLocaleString('pt-BR')} enviada — ${noteText.trim()}`;
      autoStage = 'PROPOSTA';
      await onUpdateLead(lead.id, { estimatedValue: val });
    } else if (noteType === 'ligacao') {
      finalMessage = `Ligação realizada: ${noteText.trim()}`;
      if (lead.stage === 'NOVO LEAD' || lead.stage === 'ASSUMIDO') {
        autoStage = 'CONTATO INICIADO';
      }
    }

    await onAddInteraction(lead.id, noteType, finalMessage, autoStage);
    setNoteText('');
  };

  const handleDirectEmail = async () => {
    await onAddInteraction(
      lead.id,
      'email',
      `Abriu envio de e-mail comercial para ${lead.email || 'cliente'}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-4xl h-[100dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-md border ${stageMeta.badgeClass}`}
              >
                {stageMeta.label}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Entrada: {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
              </span>

            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">
              {lead.company}
            </h2>
            <p className="text-xs text-slate-400">
              Cliente: <strong className="text-slate-200">{lead.name}</strong> • {lead.segment} •{' '}
              {lead.neighborhood}, {lead.city}/{lead.state}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {lead.stage !== 'FECHADO' && (
              <button
                onClick={() => onOpenCloseDeal(lead)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Fechar Venda</span>
              </button>
            )}
            {lead.stage !== 'PERDIDO' && (
              <button
                onClick={() => onOpenLostDeal(lead)}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Marcar como Perdido</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Direct Contact Action Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {canContact ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenWhatsApp(lead)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer ${
                  lead.whatsapp
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{lead.whatsapp ? 'WhatsApp' : 'Roteiro de abordagem'}</span>
              </button>

              {lead.phone && (
                <a
                  href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Ligar ({lead.phone})</span>
                </a>
              )}

              {lead.email && (
                <a
                  href={`mailto:${lead.email}?subject=${encodeURIComponent(
                    `Proposta Digital TRUINEXA — ${lead.company}`
                  )}`}
                  onClick={handleDirectEmail}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-medium flex items-center gap-2 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>E-mail</span>
                </a>
              )}

              <button
                onClick={() => onOpenAppointment(lead)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agendar contato</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              <div>
                <div className="font-semibold text-slate-200">Contato protegido</div>
                <div className="text-slate-500">
                  {lead.responsibleId
                    ? `Cliente atribuído a ${lead.responsibleName}.`
                    : 'Assuma o cliente para liberar ligação, roteiro e WhatsApp.'}
                </div>
              </div>
              {!lead.responsibleId && (
                <button
                  onClick={handleClaimLead}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  ASSUMIR CLIENTE
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => (editing ? handleSaveEdits() : setEditing(true))}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              {editing ? (
                <>
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Salvar Dados</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </>
              )}
            </button>

            {canDelete && (
              <>
                {confirmDelete ? (
                  <button
                    onClick={async () => {
                      await onDeleteLeadPermanently(lead.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Confirmar Exclusão
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    title="Excluir permanentemente (Daniel)"
                    className="p-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Body: Two Columns (Left: Informações & Oportunidade, Right: Histórico Timeline) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Oportunidade Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Oportunidade Comercial</span>
                </h3>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Status / Etapa no Funil</span>
                  <select
                    value={lead.stage}
                    onChange={(e) => handleStageSelect(e.target.value as KanbanStage)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium"
                  >
                    {KANBAN_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <span className="text-slate-500 block mb-1">Solução Sugerida</span>
                  {editing ? (
                    <input
                      type="text"
                      value={formState.recommendedService || lead.recommendedService || lead.serviceInterest}
                      onChange={(e) =>
                        setFormState({ ...formState, recommendedService: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  ) : (
                    <span className="text-slate-100 font-medium block">
                      {lead.recommendedService || lead.serviceInterest}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Probabilidade de Fechamento</span>
                  {editing ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formState.closingProbability ?? lead.closingProbability}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          closingProbability: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${lead.closingProbability}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-200">{lead.closingProbability}%</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Próximo Contato</span>
                  <span className="text-slate-200 font-mono">{lead.nextContactDate}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Origem</span>
                  <span className="text-slate-200">{lead.origin}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Validação do Contato</span>
                  <span className={`font-medium ${lead.sourceVerifiedAt ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {lead.sourceVerifiedAt ? 'Número comercial validado' : 'Validação não registrada'}
                  </span>
                  {lead.contactType && (
                    <span className="block mt-0.5 text-[11px] text-slate-500">
                      Tipo: {lead.contactType === 'whatsapp' ? 'celular / WhatsApp' : 'celular'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Oportunidade identificada</span>
                  {editing ? (
                    <textarea
                      rows={2}
                      value={formState.opportunitySummary || lead.opportunitySummary || ''}
                      onChange={(e) =>
                        setFormState({ ...formState, opportunitySummary: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  ) : (
                    <p className="text-slate-200">
                      {lead.opportunitySummary || lead.opportunityReason || 'Não informado'}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Benefício recomendado</span>
                  {editing ? (
                    <textarea
                      rows={2}
                      value={formState.recommendedBenefit || lead.recommendedBenefit || ''}
                      onChange={(e) =>
                        setFormState({ ...formState, recommendedBenefit: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                    />
                  ) : (
                    <p className="text-slate-200">{lead.recommendedBenefit || 'Não informado'}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-500 block mb-1">Próxima Ação Planejada</span>
                {editing ? (
                  <input
                    type="text"
                    value={formState.nextAction || ''}
                    onChange={(e) => setFormState({ ...formState, nextAction: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                ) : (
                  <p className="text-amber-300 font-medium">{lead.nextAction}</p>
                )}
              </div>
            </div>

            {/* Pesquisa prévia da empresa */}
            {(lead.companySummary ||
              lead.opportunityReason ||
              lead.address ||
              lead.website ||
              lead.instagramUrl ||
              (lead.validationSources && lead.validationSources.length > 0)) && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Pesquisa da Empresa
                  </h3>
                  {lead.researchedAt && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Pesquisado em {new Date(lead.researchedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {lead.companySummary && (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Resumo encontrado</span>
                    <p className="text-sm text-slate-200 leading-relaxed">{lead.companySummary}</p>
                  </div>
                )}

                {lead.opportunityReason && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <span className="text-[11px] text-emerald-400 block mb-1">Por que pode ser uma oportunidade</span>
                    <p className="text-xs text-slate-200 leading-relaxed">{lead.opportunityReason}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lead.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-700 bg-slate-900 p-3 hover:border-sky-500/50 transition"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                        <MapPin className="w-4 h-4" />
                        Ver no mapa
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{lead.address}</p>
                    </a>
                  )}

                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-700 bg-slate-900 p-3 hover:border-indigo-500/50 transition"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                        <Globe className="w-4 h-4" />
                        Site encontrado
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 truncate">{lead.website}</p>
                    </a>
                  )}

                  {lead.instagramUrl && (
                    <a
                      href={lead.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-700 bg-slate-900 p-3 hover:border-pink-500/50 transition"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-pink-300">
                        <Instagram className="w-4 h-4" />
                        Instagram encontrado
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 truncate">
                        {lead.instagram || lead.instagramUrl}
                      </p>
                    </a>
                  )}
                </div>

                {lead.validationSources && lead.validationSources.length > 0 && (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-2">Fontes conferidas</span>
                    <div className="flex flex-wrap gap-2">
                      {lead.validationSources.map((source, index) => (
                        <a
                          key={`${source.url}-${index}`}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-indigo-500/50 hover:text-white"
                        >
                          {source.label}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informações Cadastrais Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Informações Completas do Cliente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Nome do Cliente', key: 'name', icon: UserCheck },
                  { label: 'Empresa', key: 'company', icon: Briefcase },
                  { label: 'Segmento', key: 'segment', icon: Briefcase },
                  { label: 'Profissão', key: 'profession', icon: UserCheck },
                  { label: 'Celular / WhatsApp', key: 'phone', icon: MessageSquare },
                  { label: 'E-mail', key: 'email', icon: Mail },
                  { label: 'Instagram', key: 'instagram', icon: Instagram },
                  { label: 'Site Atual', key: 'website', icon: Globe },
                  { label: 'Bairro', key: 'neighborhood', icon: MapPin },
                  { label: 'Cidade', key: 'city', icon: MapPin },
                  { label: 'Estado', key: 'state', icon: MapPin },
                ].map((field) => {
                  const val = String((formState as Record<string, unknown>)[field.key] ?? '');
                  return (
                    <div key={field.key} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/70">
                      <span className="text-[11px] text-slate-500 block mb-0.5">{field.label}</span>
                      {editing ? (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setFormState({ ...formState, [field.key]: e.target.value })
                          }
                          className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-xs"
                        />
                      ) : (
                        <span className="text-slate-200 font-medium break-all">
                          {val || 'Não informado'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <span className="text-xs text-slate-400 block mb-1">Observações do Lead</span>
                {editing ? (
                  <textarea
                    rows={3}
                    value={formState.observations || ''}
                    onChange={(e) => setFormState({ ...formState, observations: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {lead.observations || 'Nenhuma observação cadastrada.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Histórico Timeline (Section 8) */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Registrar Atendimento / Proposta / Observação</span>
              </h3>

              <form onSubmit={handleAddTimelineEntry} className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'observacao', label: 'Observação' },
                    { id: 'whatsapp', label: 'Mensagem WhatsApp' },
                    { id: 'ligacao', label: 'Chamada Telefônica' },
                    { id: 'proposta', label: 'Proposta Enviada' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNoteType(tab.id as InteractionType)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        noteType === tab.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {noteType === 'proposta' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Valor da Proposta Comercial (R$)
                    </label>
                    <input
                      type="number"
                      value={proposalAmount}
                      onChange={(e) => setProposalAmount(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={
                      noteType === 'proposta'
                        ? 'Ex: Escopo Site Institucional + Identidade Visual enviado em PDF...'
                        : 'Ex: Cliente respondeu e demonstrou interesse em site...'
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Registrar</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Timeline History */}
            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Histórico Completo do Cliente (Timeline)</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {leadInteractions.length + leadActivityLogs.length} registros
                </span>
              </div>

              <div className="relative pl-5 border-l border-slate-800 space-y-4">
                {leadInteractions.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-950 absolute -left-[25px] top-1.5" />
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-indigo-300">{item.userName}</span>
                        <span className="font-mono">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')} •{' '}
                          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                ))}
                {leadActivityLogs.map((item) => (
                  <div key={`activity-${item.id}`} className="relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-950 absolute -left-[25px] top-1.5" />
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-emerald-300">{item.userName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                            {item.action}
                          </span>
                        </div>
                        <span className="font-mono shrink-0">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')} •{' '}
                          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{item.details}</p>
                      {item.fromStage && item.toStage && (
                        <p className="mt-1 text-[10px] font-mono text-amber-300">
                          {item.fromStage} → {item.toStage}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
