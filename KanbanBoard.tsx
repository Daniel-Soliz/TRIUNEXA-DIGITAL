import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
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

const COLUMN_THEMES = [
  'bg-sky-50 border-sky-200 text-sky-700',
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-rose-50 border-rose-200 text-rose-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-violet-50 border-violet-200 text-violet-700',
  'bg-cyan-50 border-cyan-200 text-cyan-700',
  'bg-orange-50 border-orange-200 text-orange-700',
  'bg-lime-50 border-lime-200 text-lime-700',
  'bg-slate-100 border-slate-200 text-slate-700',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  currentUser,
  stalledAlertDays,
  onSelectLead,
  onMoveStage,
  onClaimLead: _onClaimLead,
  onOpenWhatsApp,
  darkMode: _darkMode,
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<KanbanStage | null>(null);

  const handleDragStart = (event: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    event.dataTransfer.setData('text/plain', leadId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent, stageId: KanbanStage) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDrop = async (event: React.DragEvent, targetStage: KanbanStage) => {
    event.preventDefault();
    const leadId = event.dataTransfer.getData('text/plain') || draggedLeadId;
    setDraggedLeadId(null);
    setDragOverStage(null);
    if (!leadId) return;

    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.stage === targetStage) return;
    await onMoveStage(lead, targetStage);
  };

  const daysInStage = (lead: Lead) => {
    const changedAt = new Date(lead.stageChangedAt).getTime();
    if (Number.isNaN(changedAt)) return 0;
    return Math.max(0, Math.floor((Date.now() - changedAt) / 86400000));
  };

  const visibleStages = KANBAN_STAGES.filter((stage) => stage.id !== 'ASSUMIDO');

  return (
    <div className="flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-4 min-h-[calc(100dvh-220px)] select-none touch-pan-x">
      {visibleStages.map((stage, index) => {
        const columnLeads = leads.filter((lead) =>
          stage.id === 'NOVO LEAD'
            ? lead.stage === 'NOVO LEAD' || lead.stage === 'ASSUMIDO'
            : lead.stage === stage.id
        );
        const total = columnLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
        const theme = COLUMN_THEMES[index % COLUMN_THEMES.length];
        const isOver = dragOverStage === stage.id;

        return (
          <section
            key={stage.id}
            onDragOver={(event) => handleDragOver(event, stage.id)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(event) => void handleDrop(event, stage.id)}
            className={`w-[86vw] max-w-[320px] sm:w-[292px] shrink-0 snap-start rounded-xl border bg-[#f8fafc] transition ${
              isOver ? 'border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/30' : 'border-slate-200'
            }`}
          >
            <div className={`m-2 mb-1 rounded-lg border px-3 py-2.5 ${theme}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-xs font-bold truncate">{stage.label}</h3>
                <span className="min-w-5 h-5 px-1.5 rounded-md bg-white/80 text-[10px] font-bold flex items-center justify-center">
                  {columnLeads.length}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
                <span className="truncate">{stage.description}</span>
                <span className="font-mono font-semibold ml-2 shrink-0">
                  R$ {total.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100dvh-310px)] overscroll-contain">
              {columnLeads.length === 0 ? (
                <div className="h-24 rounded-lg border border-dashed border-slate-200 bg-white/60 flex items-center justify-center px-4 text-center text-[11px] text-slate-400">
                  Arraste uma oportunidade para esta etapa
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const stalledDays = daysInStage(lead);
                  const stalled =
                    lead.stage !== 'FECHADO' &&
                    lead.stage !== 'PERDIDO' &&
                    stalledDays >= stalledAlertDays;
                  const mine = lead.responsibleId === currentUser.id;

                  return (
                    <article
                      key={lead.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, lead.id)}
                      onClick={() => onSelectLead(lead)}
                      className="group rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:border-indigo-300 hover:shadow-md transition cursor-grab active:cursor-grabbing"
                    >
                      {stalled && (
                        <div className="mb-2 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" />
                          Sem avanço há {stalledDays} dias
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-display text-[13px] font-bold text-slate-900 truncate">
                            {lead.company}
                          </h4>
                          <p className="mt-0.5 text-[10px] text-slate-400 truncate">
                            {lead.segment}
                          </p>
                        </div>
                        {lead.estimatedValue > 0 && (
                          <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-1 text-[10px] font-mono font-bold text-emerald-700">
                            R$ {lead.estimatedValue.toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded-md bg-indigo-50 px-1.5 py-1 text-[9px] font-semibold text-indigo-700 max-w-full truncate">
                          {lead.serviceInterest}
                        </span>
                        {lead.whatsapp && (
                          <span className="rounded-md bg-emerald-50 px-1.5 py-1 text-[9px] font-semibold text-emerald-700">
                            WhatsApp ✓
                          </span>
                        )}
                        {lead.instagramUrl && (
                          <span className="rounded-md bg-pink-50 px-1.5 py-1 text-[9px] font-semibold text-pink-700">
                            Instagram
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {lead.neighborhood || lead.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono truncate">{lead.phone}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="min-w-0 text-[10px] text-slate-400">
                          {lead.lastContactAt
                            ? `Último contato ${new Date(lead.lastContactAt).toLocaleDateString('pt-BR')}`
                            : 'Ainda sem contato'}
                        </div>

                        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(lead)}
                            disabled={!lead.whatsapp}
                            className="h-7 px-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold flex items-center gap-1 disabled:bg-slate-300"
                          >
                            <MessageSquare className="w-3 h-3" />
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectLead(lead)}
                            className="w-7 h-7 rounded-md border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                            title="Abrir cliente"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={lead.stage === 'ASSUMIDO' ? 'NOVO LEAD' : lead.stage}
                          onChange={(event) => void onMoveStage(lead, event.target.value as KanbanStage)}
                          className="h-7 flex-1 min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-medium text-slate-600 focus:outline-none focus:border-indigo-400"
                        >
                          {visibleStages.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <span className="inline-flex items-center gap-1 text-[9px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {stalledDays}d
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};
