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
  SystemConfig,
} from './crm';
import {
  generateProspectingMessage,
  sanitizeWhatsAppNumber,
  ProspectingMessageOptions,
} from './prospecting';

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
  const [contactError, setContactError] = useState<string | null>(null);
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
  const [stage, setStage] = useState<KanbanStage>('NOVO LEAD');
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

  const normalizeWhatsAppMobile = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const withCountry = digits.length === 11 ? `55${digits}` : digits;
    return /^55\d{2}9\d{8}$/.test(withCountry) ? withCountry : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    const normalizedMobile = normalizeWhatsAppMobile(phone);
    if (!normalizedMobile) {
      setContactError('Informe somente celular com DDD e WhatsApp, por exemplo: (11) 99999-9999.');
      return;
    }

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
        whatsapp: normalizedMobile,
        contactType: 'whatsapp',
        contactValidationMethod: 'Cadastro manual: número informado como celular com WhatsApp',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-5 max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Celular com WhatsApp *
              </label>
              <input
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setContactError(null);
                }}
                placeholder="(11) 99999-9999"
                className={`w-full px-3.5 py-2 rounded-xl bg-slate-950 border text-sm text-white focus:outline-none ${
                  contactError ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                }`}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Apenas celular brasileiro com WhatsApp. Telefone fixo não é aceito.
              </p>
              {contactError && (
                <p className="mt-1 text-[11px] font-medium text-rose-400">{contactError}</p>
              )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
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
  settings: SystemConfig;
  onRegisterWhatsAppContact: (
    leadId: string,
    message: string,
    nextStage?: KanbanStage
  ) => Promise<void>;
  onContactStarted: (leadId: string, message: string) => Promise<Lead>;
  onMessageCopied: (leadId: string, message: string) => Promise<void>;
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
  settings,
  onRegisterWhatsAppContact,
  onContactStarted,
  onMessageCopied,
}) => {
  const [activeStep, setActiveStep] = useState<SalesScriptStep>('abertura');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentFeedback, setSentFeedback] = useState<string | null>(null);
  const [options, setOptions] = useState<ProspectingMessageOptions>({
    includePortfolio: false,
    mentionNeighborhood: true,
    includePresentation: false,
    includeRecommendedService: false,
  });

  const formatTemplate = (raw: string, l: Lead) =>
    raw
      .replace(/\{nome\}/g, l.name)
      .replace(/\{empresa\}/g, l.company)
      .replace(/\{vendedor\}/g, settings.senderName || currentUser.name)
      .replace(/\{servico\}/g, l.recommendedService || l.serviceInterest)
      .replace(/\{cidade\}/g, l.city)
      .replace(/\{valor\}/g, `R$ ${l.estimatedValue.toLocaleString('pt-BR')}`);

  const buildFollowUpScript = (step: SalesScriptStep, l: Lead) => {
    const service = l.recommendedService || l.serviceInterest;
    const benefit =
      l.recommendedBenefit ||
      'facilitar o contato com potenciais clientes e apresentar melhor o negócio';
    const price = `R$ ${l.estimatedValue.toLocaleString('pt-BR')}`;

    if (step === 'qualificacao') {
      return `Perfeito. Para eu não te mandar algo genérico, posso entender duas coisas rápidas?

1. Hoje os novos clientes chegam mais por indicação, Instagram, Google ou WhatsApp?
2. Vocês já têm alguma estrutura para ${service.toLowerCase()} ou isso ainda é feito manualmente pela equipe?

Com essas duas respostas eu consigo te mostrar uma ideia mais alinhada à realidade da ${l.company}.`;
    }

    if (step === 'valor') {
      return `Pensando no perfil da ${l.company}, eu trabalharia a solução com foco em ${benefit}.

A ideia é deixar o processo simples para quem encontra vocês pelo celular e facilitar o próximo passo, sem criar uma estrutura complicada para a equipe usar no dia a dia.`;
    }

    if (step === 'proposta') {
      return `Posso montar uma proposta objetiva para ${l.company}, detalhando a solução de ${service}, prazo, entregas e valor final.

A referência inicial cadastrada no CRM é ${price}, mas o valor definitivo depende do escopo que fizer sentido para vocês. Se quiser, eu preparo de forma bem direta para você avaliar.`;
    }

    return `Se eu te enviar uma proposta curta, com escopo, prazo e valor final para a ${l.company}, você consegue avaliar?

Se fizer sentido, alinhamos os detalhes e seguimos. Se não fizer, sem problema.`;
  };

  const buildMessage = (step: SalesScriptStep, l: Lead) => {
    if (step === 'abertura') {
      return generateProspectingMessage(l, settings, options);
    }
    return buildFollowUpScript(step, l);
  };

  const objectionScripts = {
    preco: `Entendo. Podemos começar pelo essencial e priorizar só o que fizer sentido agora para a ${lead?.company || 'empresa'}. Se eu ajustar para uma versão mais enxuta, você gostaria de avaliar?`,
    pensar: 'Claro, sem problema. Posso deixar a proposta organizada com escopo, prazo e valor para você analisar com calma, sem compromisso.',
    fornecedor: 'Perfeito. Não quero substituir algo que já esteja funcionando. Posso te mostrar uma ideia complementar e você avalia se existe algum ponto em que podemos somar?',
    agoraNao: 'Tranquilo. Posso deixar meu contato e uma ideia resumida para vocês terem como referência quando isso virar prioridade?',
  };

  useEffect(() => {
    if (!lead) return;
    setActiveStep('abertura');
    setSelectedTemplateId('');
    setOptions({
      includePortfolio: false,
      mentionNeighborhood: true,
      includePresentation: false,
      includeRecommendedService: false,
    });
    setCustomMessage(
      generateProspectingMessage(lead, settings, {
        includePortfolio: false,
        mentionNeighborhood: true,
        includePresentation: false,
        includeRecommendedService: false,
      })
    );
    setSentFeedback(null);
  }, [lead?.id, settings.portfolioUrl, settings.presentationUrl, settings.senderName, settings.brandName]);

  if (!lead) return null;

  const isAssigned = Boolean(lead.responsibleId);
  const canContact =
    isAssigned &&
    (lead.responsibleId === currentUser.id || currentUser.role === 'admin');
  const cleanPhone = sanitizeWhatsAppNumber(lead.whatsapp || '');
  const hasVerifiedWhatsApp = Boolean(cleanPhone);
  const waUrl = hasVerifiedWhatsApp
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`
    : '';

  const selectStep = (step: SalesScriptStep) => {
    setActiveStep(step);
    setSelectedTemplateId('');
    setCustomMessage(buildMessage(step, lead));
  };

  const toggleOption = (key: keyof ProspectingMessageOptions) => {
    const next = { ...options, [key]: !options[key] };
    setOptions(next);
    if (activeStep === 'abertura' && !selectedTemplateId) {
      setCustomMessage(generateProspectingMessage(lead, settings, next));
    }
  };

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (template) setCustomMessage(formatTemplate(template.content, lead));
  };

  const handleCopy = async () => {
    if (!canContact) return;
    await navigator.clipboard.writeText(customMessage);
    await onMessageCopied(lead.id, customMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleManualLog = async () => {
    if (!canContact) return;
    setSending(true);
    try {
      await onRegisterWhatsAppContact(
        lead.id,
        `Contato registrado manualmente: "${customMessage.slice(0, 110)}..."`
      );
      setSentFeedback('Contato registrado no histórico comercial.');
      window.setTimeout(() => setSentFeedback(null), 2200);
    } finally {
      setSending(false);
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!canContact || !hasVerifiedWhatsApp) return;

    const popup = window.open('', '_blank');
    setSending(true);
    try {
      await onContactStarted(lead.id, customMessage);
      if (popup) {
        popup.location.href = waUrl;
      } else {
        window.location.href = waUrl;
      }
      onClose();
    } catch (error) {
      if (popup) popup.close();
      setSentFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar o início do contato.'
      );
    } finally {
      setSending(false);
    }
  };

  const optionItems: Array<{
    key: keyof ProspectingMessageOptions;
    label: string;
  }> = [
    { key: 'includePortfolio', label: 'Incluir portfólio' },
    { key: 'mentionNeighborhood', label: 'Mencionar bairro' },
    { key: 'includePresentation', label: 'Incluir apresentação/cartaz' },
    { key: 'includeRecommendedService', label: 'Incluir solução sugerida' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-2 sm:p-5 overflow-y-auto overscroll-contain">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl my-4 text-slate-900">
        <div className="px-5 sm:px-7 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-[0.15em] text-emerald-700 font-bold block">
              Contato preparado
            </span>
            <h2 className="text-lg font-display font-bold text-slate-900 truncate">
              {lead.company}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lead.segment} • {lead.neighborhood || lead.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr]">
          <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Oportunidade identificada
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {lead.opportunitySummary || lead.opportunityReason || 'Melhorar o contato digital com potenciais clientes.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Solução sugerida
              </p>
              <p className="mt-2 text-sm font-semibold text-indigo-700">
                {lead.recommendedService || lead.serviceInterest}
              </p>
              {lead.recommendedBenefit && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {lead.recommendedBenefit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {optionItems.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={options[item.key]}
                    onChange={() => toggleOption(item.key)}
                    disabled={!canContact}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {!isAssigned ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Assuma o cliente para liberar o contato.
              </div>
            ) : !canContact ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                Este cliente está na carteira de {lead.responsibleName}.
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                Cliente na carteira de {lead.responsibleName}. Ao abrir o WhatsApp, a etapa será registrada como <strong>Contato iniciado</strong>.
              </div>
            )}
          </aside>

          <section className="p-5 sm:p-6 space-y-5">
            {sentFeedback && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {sentFeedback}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Mensagem curta para iniciar a conversa</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  ['abertura', '1. Abertura'],
                  ['qualificacao', '2. Qualificar'],
                  ['valor', '3. Valor'],
                  ['proposta', '4. Proposta'],
                  ['fechamento', '5. Fechamento'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectStep(id as SalesScriptStep)}
                    disabled={!canContact}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition disabled:opacity-40 ${
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
              <select
                value={selectedTemplateId}
                onChange={(e) => selectTemplate(e.target.value)}
                disabled={!canContact}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
              >
                <option value="">Usar mensagem inteligente da TRIUNEXA</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} — {template.category}
                  </option>
                ))}
              </select>
            )}

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Edite qualquer parte antes de enviar
                </label>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  disabled={!canContact}
                  className="text-xs text-emerald-700 flex items-center gap-1.5 disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <textarea
                rows={12}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={!canContact}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-6 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Respostas rápidas</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['preco', 'Está caro'],
                  ['pensar', 'Vou pensar'],
                  ['fornecedor', 'Já tenho alguém'],
                  ['agoraNao', 'Agora não'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={!canContact}
                    onClick={() => {
                      setSelectedTemplateId('');
                      setCustomMessage(objectionScripts[key as keyof typeof objectionScripts]);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => void handleManualLog()}
                disabled={sending || !canContact}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40"
              >
                Registrar contato manualmente
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  disabled={!canContact}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold flex items-center gap-2 disabled:opacity-40"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </button>

                <button
                  type="button"
                  onClick={() => void handleOpenWhatsApp()}
                  disabled={sending || !canContact || !hasVerifiedWhatsApp}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {sending ? 'Preparando...' : 'ABRIR WHATSAPP'}
                </button>
              </div>
            </div>

            {!hasVerifiedWhatsApp && canContact && (
              <p className="text-xs text-rose-600">
                O número do lead não passou pela validação de celular/WhatsApp.
              </p>
            )}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
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
