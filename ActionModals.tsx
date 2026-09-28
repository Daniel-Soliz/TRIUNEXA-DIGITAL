import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Copy,
  Check,
  Send,
  Calendar,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  Lead,
  User,
  ServiceItem,
  KanbanStage,
  KANBAN_STAGES,
  LOST_REASON_OPTIONS,
  LostReasonType,
  ClosedDealDetails,
  LostDetails,
  WhatsAppTemplate,
  ServiceCategory,
  AppointmentType,
} from './crm';

/* ============================================================================
   1. NEW LEAD MODAL (Section 4)
============================================================================ */
interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  services: ServiceItem[];
  distributionMode: 'manual' | 'capture' | 'automatic';
  onSubmit: (leadData: Partial<Lead>) => Promise<void>;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  services,
  distributionMode,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [segment, setSegment] = useState('');
  const [profession, setProfession] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('SP');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('Não possui');
  const [origin, setOrigin] = useState('Prospecção Ativa (Instagram)');
  const [serviceInterest, setServiceInterest] = useState(
    services[0]?.name || 'Site institucional'
  );
  const [estimatedValue, setEstimatedValue] = useState<number>(
    services[0]?.basePrice || 1200
  );
  const [responsibleId, setResponsibleId] = useState<string>(
    distributionMode === 'capture' || distributionMode === 'automatic'
      ? ''
      : currentUser.id
  );
  const [stage, setStage] = useState<KanbanStage>('NOVOS LEADS');
  const [nextAction, setNextAction] = useState('Realizar primeiro contato via WhatsApp');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleServiceChange = (srvName: string) => {
    setServiceInterest(srvName);
    const found = services.find((s) => s.name === srvName);
    if (found) {
      setEstimatedValue(found.basePrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const selectedSrv = services.find((s) => s.name === serviceInterest);
    const category: ServiceCategory = selectedSrv?.category || 'Desenvolvimento Digital';

    try {
      await onSubmit({
        name,
        company,
        segment,
        profession,
        city,
        neighborhood,
        state,
        phone,
        whatsapp: whatsapp || phone,
        email,
        instagram,
        website,
        origin,
        serviceInterest,
        serviceCategory: category,
        estimatedValue,
        responsibleId: responsibleId || null,
        stage,
        nextAction,
        observations,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl my-8">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 block">
              Entrada Diária de Clientes
            </span>
            <h2 className="text-lg font-display font-bold text-white">
              Cadastrar Novo Lead Comercial
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Barbearia Black Style"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Cliente / Decisor *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Carlos"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Segmento da Empresa
              </label>
              <input
                type="text"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Ex: Barbearia, Odontologia, Advocacia..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Profissão ou Atividade
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Ex: Empresário / Barbeiro"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Localização */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex: Brasilândia"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Estado (UF)</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="SP"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Contatos e Redes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telefone / Celular *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                WhatsApp (com DDD)
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5511999999999"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com.br"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@empresa"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Site Atual</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Não possui ou www..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Origem do Lead
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Prospecção Ativa (Instagram)">Prospecção Ativa (Instagram)</option>
                <option value="Google Maps / Meu Negócio">Google Maps / Meu Negócio</option>
                <option value="Indicação Comercial">Indicação Comercial</option>
                <option value="Tráfego Pago / Anúncio">Tráfego Pago / Anúncio</option>
                <option value="Prospecção Presencial">Prospecção Presencial</option>
                <option value="Site TRUINEXA">Site TRUINEXA</option>
              </select>
            </div>
          </div>

          {/* Oportunidade e Distribuição */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Serviço de Interesse
              </label>
              <select
                value={serviceInterest}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Responsável pelo Atendimento
              </label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">
                  {distributionMode === 'automatic'
                    ? '⚡ Automático (Fila Arthur → Pedro → Daniel)'
                    : '🔓 Disponível para Captura (ASSUMIR CLIENTE)'}
                </option>
                {users
                  .filter((u) => u.status === 'active')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Etapa Inicial no Kanban
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as KanbanStage)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {KANBAN_STAGES.slice(0, 7).map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Próxima Ação Comercial
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações Comerciais
            </label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Cliente possui Instagram ativo, mas ainda não possui site. Possível oportunidade para criação de site institucional e identidade visual."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Salvando Lead...' : 'Registrar Lead no CRM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   2. CLOSE DEAL MODAL ("VENDA FECHADA" - Section 17 & 30)
============================================================================ */
interface CloseDealModalProps {
  lead: Lead | null;
  onClose: () => void;
  currentUser: User;
  users: User[];
  services: ServiceItem[];
  onConfirmClose: (leadId: string, details: ClosedDealDetails) => Promise<void>;
}

export const CloseDealModal: React.FC<CloseDealModalProps> = ({
  lead,
  onClose,
  currentUser,
  users,
  services,
  onConfirmClose,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const defaultDelivery = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

  const [contractedService, setContractedService] = useState(
    lead?.serviceInterest || 'Site institucional'
  );
  const [soldValue, setSoldValue] = useState<number>(lead?.estimatedValue || 900);
  const [paymentMethod, setPaymentMethod] = useState('PIX (50% entrada + 50% entrega)');
  const [closedAt, setClosedAt] = useState(today);
  const [responsibleId, setResponsibleId] = useState(
    lead?.responsibleId || currentUser.id
  );
  const [observation, setObservation] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState(today);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(defaultDelivery);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      setContractedService(lead.serviceInterest);
      setSoldValue(lead.estimatedValue);
      setResponsibleId(lead.responsibleId || currentUser.id);
      setObservation('');
    }
  }, [lead, currentUser.id]);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const respUser = users.find((u) => u.id === responsibleId) || currentUser;
    try {
      await onConfirmClose(lead.id, {
        contractedService,
        soldValue: Number(soldValue),
        paymentMethod,
        closedAt: new Date(closedAt).toISOString(),
        responsibleId: respUser.id,
        responsibleName: respUser.name,
        observation,
        expectedStartDate,
        expectedDeliveryDate,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block">
                Contrato Fechado • TRUINEXA DIGITAL
              </span>
              <h2 className="text-base font-display font-bold text-white">
                Registrar Fechamento — {lead.company}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Serviço Contratado *
              </label>
              <select
                value={contractedService}
                onChange={(e) => setContractedService(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Valor Vendido (R$) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min={1}
                  value={soldValue}
                  onChange={(e) => setSoldValue(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Forma de Pagamento *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="PIX à vista">PIX à vista</option>
                <option value="PIX (50% entrada + 50% entrega)">
                  PIX (50% entrada + 50% entrega)
                </option>
                <option value="Cartão de Crédito Parcelado">Cartão de Crédito Parcelado</option>
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="Recorrência Mensal">Recorrência Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Responsável pela Venda *
              </label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleTitle})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data de Fechamento *
              </label>
              <input
                type="date"
                required
                value={closedAt}
                onChange={(e) => setClosedAt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data Prevista de Início *
              </label>
              <input
                type="date"
                required
                value={expectedStartDate}
                onChange={(e) => setExpectedStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Data Prevista de Entrega do Projeto *
            </label>
            <input
              type="date"
              required
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Observações de Produção / Briefing Inicial
            </label>
            <textarea
              rows={2}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Detalhes acordados no contrato, escopo ou prioridades de entrega..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Ao confirmar, o sistema atualizará Receita, Conversão, Ranking do responsável e criará
              automaticamente o projeto na área <strong>Gestão de Projetos</strong>.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Confirmando...' : 'Confirmar Venda Fechada'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   3. LOST LEAD MODAL ("CLIENTE PERDIDO" - Section 18 & 19)
============================================================================ */
interface LostLeadModalProps {
  lead: Lead | null;
  onClose: () => void;
  currentUser: User;
  onConfirmLost: (leadId: string, details: LostDetails) => Promise<void>;
}

export const LostLeadModal: React.FC<LostLeadModalProps> = ({
  lead,
  onClose,
  currentUser,
  onConfirmLost,
}) => {
  const [reason, setReason] = useState<LostReasonType>('Achou caro');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (reason === 'Outro' && !description.trim()) {
      setError('Para o motivo "Outro", é obrigatório descrever o motivo detalhado.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmLost(lead.id, {
        reason,
        description: description.trim(),
        lostAt: new Date().toISOString(),
        responsibleId: lead.responsibleId || currentUser.id,
        responsibleName: lead.responsibleName || currentUser.name,
        archived: true,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-rose-500/10">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-5 h-5 text-rose-400" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 block">
                Arquivo de Perdidos • Registro Obrigatório
              </span>
              <h2 className="text-base font-display font-bold text-white">
                Marcar como Perdido — {lead.company}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Selecione o motivo obrigatório da perda *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LOST_REASON_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setReason(opt)}
                  className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    reason === opt
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descrição / Detalhes {reason === 'Outro' ? '(Obrigatório *)' : '(Opcional)'}
            </label>
            <textarea
              rows={3}
              required={reason === 'Outro'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o contexto da objeção ou quando podemos retomar o contato futuramente..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            O cliente <strong>não será apagado</strong> do banco. Ele será movido para o{' '}
            <strong className="text-slate-200">ARQUIVO DE PERDIDOS</strong> para alimentar os
            relatórios de conversão e motivos de recusa.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>{submitting ? 'Arquivando...' : 'Confirmar e Mover para Arquivo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   4. WHATSAPP DIRECT & BUSINESS MODAL (Section 9 & 10)
============================================================================ */
interface WhatsAppModalProps {
  lead: Lead | null;
  onClose: () => void;
  currentUser: User;
  templates: WhatsAppTemplate[];
  whatsappMode: 'common' | 'business_api';
  onRegisterWhatsAppContact: (
    leadId: string,
    message: string,
    nextStage?: KanbanStage
  ) => Promise<void>;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  lead,
  onClose,
  currentUser,
  templates,
  whatsappMode,
  onRegisterWhatsAppContact,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoAdvanceStage, setAutoAdvanceStage] = useState<KanbanStage | ''>('CONTATO REALIZADO');
  const [sending, setSending] = useState(false);
  const [sentFeedback, setSentFeedback] = useState<string | null>(null);

  const formatTemplate = (raw: string, l: Lead) => {
    return raw
      .replace(/\{nome\}/g, l.name)
      .replace(/\{empresa\}/g, l.company)
      .replace(/\{vendedor\}/g, currentUser.name)
      .replace(/\{servico\}/g, l.serviceInterest)
      .replace(/\{cidade\}/g, l.city)
      .replace(/\{valor\}/g, `R$ ${l.estimatedValue.toLocaleString('pt-BR')}`);
  };

  useEffect(() => {
    if (lead && templates.length > 0) {
      const tpl = templates.find((t) => t.id === selectedTemplateId) || templates[0];
      setCustomMessage(formatTemplate(tpl.content, lead));
      if (lead.stage === 'NOVOS LEADS' || lead.stage === 'AGUARDANDO CONTATO') {
        setAutoAdvanceStage('CONTATO REALIZADO');
      } else {
        setAutoAdvanceStage('');
      }
    }
  }, [lead, selectedTemplateId, templates]);

  if (!lead) return null;

  const cleanPhone = (lead.whatsapp || lead.phone).replace(/\D/g, '');
  const formattedWaPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const waUrl = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(customMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendAndLog = async (mode: 'wa_link' | 'business_api' | 'manual_log') => {
    setSending(true);
    try {
      const summary =
        mode === 'business_api'
          ? `Mensagem enviada via WhatsApp Business Platform API: "${customMessage.slice(0, 90)}..."`
          : `Contato realizado via WhatsApp: "${customMessage.slice(0, 90)}..."`;

      await onRegisterWhatsAppContact(
        lead.id,
        summary,
        autoAdvanceStage ? (autoAdvanceStage as KanbanStage) : undefined
      );

      if (mode === 'business_api') {
        setSentFeedback('Mensagem disparada e registrada via WhatsApp Business Cloud API!');
        setTimeout(() => {
          setSentFeedback(null);
          onClose();
        }, 1200);
      } else {
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block">
                {whatsappMode === 'business_api'
                  ? 'WhatsApp Business Platform (Oficial)'
                  : 'WhatsApp Comercial Direto'}
              </span>
              <h2 className="text-base font-display font-bold text-white">
                Conversar com {lead.name} ({lead.company})
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {sentFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{sentFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Template de Mensagem Pré-Preenchida
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Atualizar Etapa Automaticamente Após Contato
              </label>
              <select
                value={autoAdvanceStage}
                onChange={(e) => setAutoAdvanceStage(e.target.value as KanbanStage | '')}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Manter etapa atual ({lead.stage})</option>
                <option value="CONTATO REALIZADO">Mover para: CONTATO REALIZADO</option>
                <option value="INTERESSADO">Mover para: INTERESSADO</option>
                <option value="PROPOSTA ENVIADA">Mover para: PROPOSTA ENVIADA</option>
                <option value="AGUARDANDO RESPOSTA">Mover para: AGUARDANDO RESPOSTA</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Mensagem Personalizada para {lead.name} ({lead.phone})
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Mensagem copiada!' : 'Copiar mensagem'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 leading-relaxed focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleSendAndLog('manual_log')}
              disabled={sending}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
            >
              Apenas Registrar Contato no Histórico
            </button>

            <div className="flex items-center gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSendAndLog('wa_link')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp Comum</span>
              </a>

              <button
                type="button"
                onClick={() => handleSendAndLog('business_api')}
                disabled={sending}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Disparar via WhatsApp Business API</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. QUICK APPOINTMENT MODAL (Section 13 & 14)
============================================================================ */
interface QuickAppointmentModalProps {
  lead: Lead | null;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onCreateAppointment: (data: {
    leadId: string;
    responsibleId: string;
    type: AppointmentType;
    title: string;
    date: string;
    time: string;
    notes: string;
  }) => Promise<void>;
}

export const QuickAppointmentModal: React.FC<QuickAppointmentModalProps> = ({
  lead,
  onClose,
  currentUser,
  users,
  onCreateAppointment,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<AppointmentType>('Follow-up');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('14:00');
  const [responsibleId, setResponsibleId] = useState(currentUser.id);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      setTitle(`Follow-up ${lead.company}`);
      setResponsibleId(lead.responsibleId || currentUser.id);
    }
  }, [lead, currentUser.id]);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreateAppointment({
        leadId: lead.id,
        responsibleId,
        type,
        title: title || `${type} — ${lead.company}`,
        date,
        time,
        notes,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const APPOINTMENT_TYPES: AppointmentType[] = [
    'Ligação',
    'WhatsApp',
    'Reunião',
    'Apresentação',
    'Envio de proposta',
    'Follow-up',
    'Cobrança',
    'Retorno',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 block">
                Agendamento Vinculado ao CRM
              </span>
              <h2 className="text-base font-display font-bold text-white">
                Agendar Contato — {lead.company}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Compromisso
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as AppointmentType;
                  setType(newType);
                  setTitle(`${newType} — ${lead.company}`);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Responsável</label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título do Compromisso *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Horário *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pauta da conversa ou lembrete..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              {submitting ? 'Agendando...' : 'Salvar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
