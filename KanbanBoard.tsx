import React, { useState } from 'react';
import {
  MapPin,
  Briefcase,
  Phone,
  Globe,
  UserCheck,
  Clock,
  MessageSquare,
  AlertCircle,
  Hand,
  ChevronRight,
} from 'lucide-react';
import { Lead, User, KANBAN_STAGES, KanbanStage } from './crm';

interface KanbanBoardProps {
  leads: Lead[];
  currentUser: User;
  stalledAlertDays: number;
  onSelectLead: (lead: Lead) => void;
  onMoveStage: (lead: Lead, targetStage: KanbanStage) => Promise<void>;
  onClaimLead: (lead: Lead) => Promise<void>;
  onOpenWhatsApp: (lead: Lead) => void;
  darkMode: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  currentUser,
  stalledAlertDays,
  onSelectLead,
  onMoveStage,
  onClaimLead,
  onOpenWhatsApp,
  darkMode,
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<KanbanStage | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: KanbanStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: KanbanStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    setDraggedLeadId(null);
    setDragOverStage(null);

    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;

    await onMoveStage(lead, targetStage);
  };

  const formatLastContact = (isoDate: string) => {
    const d = new Date(isoDate);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Hoje — ${time}`;
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — ${time}`;
  };

  const getDaysInStage = (lead: Lead) => {
    const diffMs = Date.now() - new Date(lead.stageChangedAt).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[calc(100vh-230px)] select-none">
      {KANBAN_STAGES.map((stage) => {
        const columnLeads = leads.filter((l) => l.stage === stage.id);
        const columnTotalValue = columnLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
        const isOver = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, stage.id)}
            className={`w-[305px] shrink-0 rounded-2xl border flex flex-col transition ${
              isOver
                ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                : darkMode
                ? 'bg-slate-900/60 border-slate-800/80'
                : 'bg-slate-100/80 border-slate-200'
            }`}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-800/70 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dotClass}`} />
                  <h3 className="font-display font-bold text-xs tracking-wide uppercase">
                    {stage.id}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-xs font-semibold">
                  {columnLeads.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{stage.description}</span>
                <span className="font-mono text-slate-300 font-medium shrink-0 ml-2">
                  R$ {columnTotalValue.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Cards Stack */}
            <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-310px)]">
              {columnLeads.length === 0 ? (
                <div className="h-32 rounded-xl border border-dashed border-slate-800/70 flex items-center justify-center text-xs text-slate-500 px-4 text-center">
                  Arraste um card para {stage.label}
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const daysStalled = getDaysInStage(lead);
                  const isStalled =
                    lead.stage !== 'FECHADO' &&
                    lead.stage !== 'PERDIDO' &&
                    daysStalled >= stalledAlertDays;

                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => onSelectLead(lead)}
                      className={`group rounded-xl border p-3.5 transition cursor-grab active:cursor-grabbing shadow-sm hover:border-indigo-500/60 ${
                        darkMode
                          ? 'bg-slate-950/90 border-slate-800/90 hover:bg-slate-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {/* Stalled Funnel Alert Banner (Section 20) */}
                      {isStalled && (
                        <div className="mb-2 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-[11px] text-amber-300">
                          <span className="flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0 text-amber-400" />
                            Parado há {daysStalled} dias
                          </span>
                          <span className="font-mono underline">Follow-up</span>
                        </div>
                      )}

                      {/* Company & Client Name (Section 7 exact structure) */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <h4 className="font-display font-bold text-sm uppercase tracking-tight text-white group-hover:text-indigo-300 transition">
                            {lead.company}
                          </h4>
                          <p className="text-xs text-slate-300 font-medium">{lead.name}</p>
                        </div>
                        <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">
                          R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      {/* Location, Segment, Phone */}
                      <div className="space-y-1 text-xs text-slate-400 my-2.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">
                            {lead.neighborhood ? `${lead.neighborhood} — ` : ''}
                            {lead.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{lead.segment}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      </div>

                      {/* Service & Status */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Serviço:</span>
                          <span className="font-medium text-indigo-300 flex items-center gap-1 truncate max-w-[180px]">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.serviceInterest}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Status:</span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                            <span className={`w-2 h-2 rounded-full ${stage.dotClass}`} />
                            <span>{stage.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Responsável:</span>
                          {lead.responsibleId ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-200">
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>{lead.responsibleName}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClaimLead(lead);
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Hand className="w-3 h-3" />
                              <span>ASSUMIR CLIENTE</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Último contato:</span>
                          </span>
                          <span className="font-mono text-slate-300">
                            {formatLastContact(lead.lastInteractionAt)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions Footer */}
                      <div
                        className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.responsibleId ? (
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(lead)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Roteiro / WhatsApp</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onClaimLead(lead)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Hand className="w-3 h-3" />
                            <span>Assumir</span>
                          </button>
                        )}

                        <select
                          value={lead.stage}
                          onChange={(e) => onMoveStage(lead, e.target.value as KanbanStage)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {KANBAN_STAGES.map((st) => (
                            <option key={st.id} value={st.id}>
                              → {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
