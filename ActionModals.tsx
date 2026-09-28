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

type SalesScriptStep =
  | 'abertura'
  | 'qualificacao'
  | 'valor'
  | 'proposta'
  | 'fechamento';

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  lead,
  onClose,
  currentUser,
  templates,
  whatsappMode: _whatsappMode,
  onRegisterWhatsAppContact,
}) => {
  const [activeStep, setActiveStep] = useState<SalesScriptStep>('abertura');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoAdvanceStage, setAutoAdvanceStage] = useState<KanbanStage | ''>('CONTATO REALIZADO');
  const [sending, setSending] = useState(false);
  const [sentFeedback, setSentFeedback] = useState<string | null>(null);

  const formatTemplate = (raw: string, l: Lead) =>
    raw
      .replace(/\{nome\}/g, l.name)
      .replace(/\{empresa\}/g, l.company)
      .replace(/\{vendedor\}/g, currentUser.name)
      .replace(/\{servico\}/g, l.serviceInterest)
      .replace(/\{cidade\}/g, l.city)
      .replace(/\{valor\}/g, `R$ ${l.estimatedValue.toLocaleString('pt-BR')}`);

  const serviceBenefit = (l: Lead) => {
    const service = l.serviceInterest.toLowerCase();

    if (service.includes('site') || service.includes('landing')) {
      return 'apresentar os serviços com mais confiança, facilitar pedidos de orçamento e transformar visitas do Google e das redes sociais em conversas comerciais';
    }
    if (
      service.includes('rede') ||
      service.includes('conteúdo') ||
      service.includes('marketing') ||
      service.includes('divulgação')
    ) {
      return 'organizar a comunicação da marca, mostrar melhor os serviços e gerar mais conversas com potenciais clientes';
    }
    if (
      service.includes('identidade') ||
      service.includes('design') ||
      service.includes('flyer') ||
      service.includes('banner')
    ) {
      return 'deixar a comunicação mais profissional e tornar ofertas, promoções e serviços mais fáceis de entender';
    }
    return 'fortalecer a presença digital e transformar mais pessoas interessadas em contatos comerciais';
  };

  const buildScript = (step: SalesScriptStep, l: Lead) => {
    const firstName =
      l.name && l.name.toLowerCase() !== 'contato comercial'
        ? l.name.split(' ')[0]
        : 'tudo bem';
    const location = l.neighborhood || l.city;
    const benefit = serviceBenefit(l);
    const price = `R$ ${l.estimatedValue.toLocaleString('pt-BR')}`;

    if (step === 'abertura') {
      return `Olá, ${firstName}! Meu nome é ${currentUser.name}, falo pela TRUINEXA DIGITAL. Encontrei a ${l.company} enquanto pesquisava negócios de ${l.segment} em ${location} e vi uma oportunidade de fortalecer a presença digital de vocês.

Nós trabalhamos com ${l.serviceInterest} e a ideia seria ajudar a ${l.company} a ${benefit}.

Posso te mostrar em 2 minutos uma ideia prática para o negócio de vocês? Sem compromisso.`;
    }

    if (step === 'qualificacao') {
      return `Perfeito! Para eu não te mandar uma proposta genérica, posso entender duas coisas rápidas?

1. Hoje a maior parte dos novos clientes chega por indicação, Instagram, Google ou WhatsApp?
2. Vocês já têm alguém cuidando de ${l.serviceInterest.toLowerCase()} ou isso ainda fica por conta da própria equipe?

Com essas duas respostas eu consigo te mostrar algo bem mais alinhado à realidade da ${l.company}.`;
    }

    if (step === 'valor') {
      return `Entendi. Pensando no perfil da ${l.company}, eu estruturaria o trabalho de ${l.serviceInterest} com foco em três pontos:

• deixar a apresentação da empresa mais profissional;
• facilitar o caminho entre a pessoa interessada e o contato pelo WhatsApp;
• criar uma estrutura que vocês consigam continuar usando no dia a dia.

O objetivo não é só “ficar bonito”, e sim facilitar a entrada de novas conversas comerciais e apresentar melhor o valor do negócio.`;
    }

    if (step === 'proposta') {
      return `Para você ter uma referência, um projeto de ${l.serviceInterest} nesse perfil parte de aproximadamente ${price} na TRUINEXA, dependendo do escopo final.

Antes de fechar qualquer coisa, eu posso te mandar uma proposta objetiva com:
• o que será entregue;
• prazo;
• valor final;
• forma de pagamento;
• como funcionam ajustes e suporte.

Se fizer sentido para vocês, a gente avança. Se não fizer, sem problema.`;
    }

    return `Se eu te enviar hoje uma proposta curta, com escopo, prazo e valor final para a ${l.company}, você consegue avaliar?

Se a estrutura fizer sentido, alinhamos os detalhes e já deixamos o próximo passo definido. Posso preparar isso para você?`;
  };

  const objectionScripts = {
    preco: `Entendo totalmente. A ideia não é colocar um custo que não faça sentido para a ${lead?.company || 'empresa'}. Podemos começar pelo essencial, priorizando o que gera mais valor agora, e deixar melhorias adicionais para uma segunda etapa. Se eu ajustar o escopo para uma versão mais enxuta, você gostaria de avaliar?`,
    pensar: `Claro, sem problema. Para facilitar sua decisão, posso te deixar a proposta organizada com escopo, prazo e valor, sem compromisso. Assim você consegue avaliar com calma e comparar exatamente o que está incluído. Posso te mandar?`,
    fornecedor: `Perfeito — isso é até um bom sinal, porque vocês já valorizam a presença digital. Não quero substituir algo que esteja funcionando. Posso te mostrar uma ideia complementar e você avalia se existe algum ponto em que a TRUINEXA possa somar?`,
    agoraNao: `Tranquilo. Posso deixar meu contato e uma proposta resumida para vocês terem como referência? Assim, quando surgir a prioridade, vocês já sabem exatamente o que conseguimos entregar e em qual faixa de investimento.`,
  };

  useEffect(() => {
    if (!lead) return;
    setActiveStep('abertura');
    setSelectedTemplateId('');
    setCustomMessage(buildScript('abertura', lead));
    setSentFeedback(null);

    if (lead.stage === 'NOVOS LEADS' || lead.stage === 'AGUARDANDO CONTATO') {
      setAutoAdvanceStage('CONTATO REALIZADO');
    } else {
      setAutoAdvanceStage('');
    }
  }, [lead?.id]);

  if (!lead) return null;

  const isAssigned = Boolean(lead.responsibleId);
  const canContact =
    isAssigned &&
    (lead.responsibleId === currentUser.id || currentUser.role === 'admin');
  const hasVerifiedWhatsApp = Boolean(lead.whatsapp?.trim());
  const cleanPhone = (lead.whatsapp || '').replace(/\D/g, '');
  const formattedWaPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const waUrl = hasVerifiedWhatsApp
    ? `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(customMessage)}`
    : '';

  const selectStep = (step: SalesScriptStep) => {
    setActiveStep(step);
    setSelectedTemplateId('');
    setCustomMessage(buildScript(step, lead));
  };

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (template) setCustomMessage(formatTemplate(template.content, lead));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSendAndLog = async (mode: 'wa_link' | 'manual_log') => {
    if (!canContact) return;
    setSending(true);
    try {
      const summary =
        mode === 'wa_link'
          ? `Contato iniciado pelo WhatsApp: "${customMessage.slice(0, 110)}..."`
          : `Contato registrado manualmente: "${customMessage.slice(0, 110)}..."`;

      await onRegisterWhatsAppContact(
        lead.id,
        summary,
        autoAdvanceStage ? (autoAdvanceStage as KanbanStage) : undefined
      );

      if (mode === 'manual_log') {
        setSentFeedback('Contato registrado no histórico comercial.');
        setTimeout(() => setSentFeedback(null), 2200);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl my-4 text-slate-900">
        <div className="px-5 sm:px-7 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] uppercase tracking-[0.15em] text-emerald-700 font-bold block">
                Painel de abordagem comercial
              </span>
              <h2 className="text-lg font-display font-bold text-slate-900 truncate">
                {lead.company}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr]">
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-5 sm:p-6 space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                Cliente
              </p>
              <h3 className="font-display font-bold text-slate-900">{lead.company}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {lead.segment} • {lead.neighborhood || lead.city}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                Oportunidade sugerida
              </p>
              <p className="font-semibold text-slate-900 mt-2">{lead.serviceInterest}</p>
              <div className="mt-2 flex items-center gap-2 text-emerald-700 font-bold">
                <DollarSign className="w-4 h-4" />
                <span>Referência: R$ {lead.estimatedValue.toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-xs leading-5 text-slate-500 mt-2">
                Valor de referência. O preço final deve seguir o escopo aprovado pelo cliente.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                Diagnóstico disponível
              </p>
              <p className="text-xs leading-5 text-slate-600">
                {lead.observations || 'Lead encontrado em fonte comercial pública. Confirme a necessidade durante a conversa antes de apresentar uma solução.'}
              </p>
            </div>

            {!isAssigned ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Assuma o cliente primeiro
                </div>
                <p className="text-xs leading-5 mt-2">
                  O contato comercial só é liberado depois que o lead entra na carteira de um vendedor.
                </p>
              </div>
            ) : !canContact ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-600">
                <p className="text-sm font-semibold">Cliente em outra carteira</p>
                <p className="text-xs leading-5 mt-1">
                  Responsável atual: {lead.responsibleName}.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Cliente na carteira
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Responsável: {lead.responsibleName}
                </p>
              </div>
            )}

            {canContact && !hasVerifiedWhatsApp && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  WhatsApp não confirmado
                </div>
                <p className="text-xs leading-5 text-amber-700 mt-1">
                  Existe telefone público ({lead.phone || 'não informado'}), mas ainda não há confirmação de que esse número aceita WhatsApp. O roteiro pode ser copiado normalmente.
                </p>
              </div>
            )}
          </aside>

          <section className="p-5 sm:p-7 space-y-6">
            {sentFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{sentFeedback}</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Roteiro de venda por etapa</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  ['abertura', '1. Abertura'],
                  ['qualificacao', '2. Qualificar'],
                  ['valor', '3. Mostrar valor'],
                  ['proposta', '4. Proposta'],
                  ['fechamento', '5. Fechamento'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectStep(id as SalesScriptStep)}
                    disabled={!canContact}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      activeStep === id && !selectedTemplateId
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {templates.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                  Ou usar template salvo:
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => selectTemplate(e.target.value)}
                  disabled={!canContact}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-slate-400 disabled:opacity-50"
                >
                  <option value="">Roteiro inteligente acima</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} — {template.category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Mensagem pronta para editar
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!canContact}
                  className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
                </button>
              </div>
              <textarea
                rows={10}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={!canContact}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-6 focus:outline-none focus:border-slate-400 disabled:opacity-50"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">
                Respostas rápidas para objeções
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['preco', '“Está caro”'],
                  ['pensar', '“Vou pensar”'],
                  ['fornecedor', '“Já tenho alguém”'],
                  ['agoraNao', '“Agora não”'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={!canContact}
                    onClick={() => {
                      setSelectedTemplateId('');
                      setCustomMessage(objectionScripts[key as keyof typeof objectionScripts]);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition disabled:opacity-40 cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Depois do contato
                </label>
                <select
                  value={autoAdvanceStage}
                  onChange={(e) => setAutoAdvanceStage(e.target.value as KanbanStage | '')}
                  disabled={!canContact}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-slate-400 disabled:opacity-50"
                >
                  <option value="">Manter etapa atual</option>
                  <option value="CONTATO REALIZADO">Contato realizado</option>
                  <option value="INTERESSADO">Cliente interessado</option>
                  <option value="PROPOSTA ENVIADA">Proposta enviada</option>
                  <option value="AGUARDANDO RESPOSTA">Aguardando resposta</option>
                </select>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                <p className="text-xs font-semibold text-slate-700">Regra comercial</p>
                <p className="text-xs leading-5 text-slate-500 mt-1">
                  Seja objetivo, personalize o contexto e faça perguntas. Não prometa resultado garantido nem use urgência falsa.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleSendAndLog('manual_log')}
                disabled={sending || !canContact}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
              >
                Registrar contato no histórico
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!canContact}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-40"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar roteiro
                </button>

                {hasVerifiedWhatsApp && canContact ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      void handleSendAndLog('wa_link');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir conversa no WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold flex items-center gap-2 cursor-not-allowed"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {!canContact ? 'Assuma o cliente para contatar' : 'WhatsApp ainda não confirmado'}
                  </button>
                )}
              </div>
            </div>
          </section>
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
