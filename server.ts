import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  KanbanStage,
  ClosedDealDetails,
  LostDetails,
} from './crm.ts';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'truinexa-db.json');

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derivedKey, salt: usedSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

interface StoredUser extends User {
  passwordHash: string;
  passwordSalt: string;
}

interface PersistedDatabase extends Omit<CRMState, 'users'> {
  users: StoredUser[];
}

function sanitizeUser(u: StoredUser): User {
  const { passwordHash, passwordSalt, ...safeUser } = u;
  return safeUser;
}

function createInitialDatabase(): PersistedDatabase {
  const danielPass = hashPassword('Truinexa@Daniel2026');
  const arthurPass = hashPassword('Truinexa@Arthur2026');
  const pedroPass = hashPassword('Truinexa@Pedro2026');

  const users: StoredUser[] = [
    {
      id: 'daniel',
      username: 'daniel',
      name: 'Daniel',
      email: 'daniel@truinexa.com.br',
      role: 'admin',
      roleTitle: 'Administrador',
      status: 'active',
      avatarColor: 'from-indigo-500 to-violet-600',
      mustChangePassword: false,
      tempPasswordHint: 'Truinexa@Daniel2026',
      lastLoginAt: '2026-09-28T08:15:00-03:00',
      activeDevice: 'Notebook • São Paulo',
      passwordHash: danielPass.hash,
      passwordSalt: danielPass.salt,
      permissions: {
        canViewAllLeads: true,
        canEditAnyLead: true,
        canDeleteLeads: true,
        canDistributeLeads: true,
        canManageServices: true,
        canViewFinancialReports: true,
        canManageUsers: true,
        canConfigureSystem: true,
        canManageTeamAgenda: true,
      },
    },
    {
      id: 'arthur',
      username: 'arthur',
      name: 'Arthur',
      email: 'arthur@truinexa.com.br',
      role: 'comercial',
      roleTitle: 'Comercial',
      status: 'active',
      avatarColor: 'from-emerald-500 to-teal-600',
      mustChangePassword: false,
      tempPasswordHint: 'Truinexa@Arthur2026',
      lastLoginAt: '2026-09-28T08:40:00-03:00',
      activeDevice: 'Celular • São Paulo',
      passwordHash: arthurPass.hash,
      passwordSalt: arthurPass.salt,
      permissions: {
        canViewAllLeads: false,
        canEditAnyLead: false,
        canDeleteLeads: false,
        canDistributeLeads: false,
        canManageServices: false,
        canViewFinancialReports: false,
        canManageUsers: false,
        canConfigureSystem: false,
        canManageTeamAgenda: false,
      },
    },
    {
      id: 'pedro',
      username: 'pedro',
      name: 'Pedro',
      email: 'pedro@truinexa.com.br',
      role: 'comercial',
      roleTitle: 'Comercial',
      status: 'active',
      avatarColor: 'from-sky-500 to-blue-600',
      mustChangePassword: false,
      tempPasswordHint: 'Truinexa@Pedro2026',
      lastLoginAt: '2026-09-28T08:52:00-03:00',
      activeDevice: 'Computador • São Paulo',
      passwordHash: pedroPass.hash,
      passwordSalt: pedroPass.salt,
      permissions: {
        canViewAllLeads: false,
        canEditAnyLead: false,
        canDeleteLeads: false,
        canDistributeLeads: false,
        canManageServices: false,
        canViewFinancialReports: false,
        canManageUsers: false,
        canConfigureSystem: false,
        canManageTeamAgenda: false,
      },
    },
  ];

  const services: ServiceItem[] = [
    // Desenvolvimento Digital
    { id: 'srv-1', name: 'Site institucional', category: 'Desenvolvimento Digital', description: 'Site profissional completo para apresentação da empresa, serviços e captação de orçamentos.', basePrice: 1200, status: 'active' },
    { id: 'srv-2', name: 'Landing Page', category: 'Desenvolvimento Digital', description: 'Página de alta conversão focada em vendas diretas, lançamentos ou captação de leads.', basePrice: 800, status: 'active' },
    { id: 'srv-3', name: 'Loja virtual', category: 'Desenvolvimento Digital', description: 'E-commerce completo com catálogo de produtos, carrinho, checkout e integração de pagamentos.', basePrice: 2400, status: 'active' },
    { id: 'srv-4', name: 'Portfólio profissional', category: 'Desenvolvimento Digital', description: 'Vitrine digital elegante para arquitetos, fotógrafos, médicos e profissionais liberais.', basePrice: 900, status: 'active' },
    { id: 'srv-5', name: 'Site para negócios locais', category: 'Desenvolvimento Digital', description: 'Site otimizado para Google Meu Negócio e buscas locais com botão rápido de WhatsApp.', basePrice: 850, status: 'active' },
    { id: 'srv-6', name: 'Manutenção de sites', category: 'Desenvolvimento Digital', description: 'Atualizações mensais, backup, segurança, otimização de velocidade e suporte.', basePrice: 250, status: 'active' },
    // Design
    { id: 'srv-7', name: 'Flyer', category: 'Design', description: 'Arte comercial de alto impacto para divulgação digital ou impressa.', basePrice: 150, status: 'active' },
    { id: 'srv-8', name: 'Banner', category: 'Design', description: 'Banners profissionais para sites, eventos, fachadas ou campanhas promocionais.', basePrice: 180, status: 'active' },
    { id: 'srv-9', name: 'Cartaz', category: 'Design', description: 'Design de cartaz promocional ou informativo em alta resolução.', basePrice: 160, status: 'active' },
    { id: 'srv-10', name: 'Artes para redes sociais', category: 'Design', description: 'Pacote de criativos estratégicos para feed, stories e carrosséis no Instagram.', basePrice: 450, status: 'active' },
    { id: 'srv-11', name: 'Material promocional', category: 'Design', description: 'Cardápios, catálogos em PDF, apresentações comerciais e materiais de ponto de venda.', basePrice: 350, status: 'active' },
    { id: 'srv-12', name: 'Identidade visual', category: 'Design', description: 'Criação de logotipo, paleta de cores, tipografia e manual completo da marca.', basePrice: 950, status: 'active' },
    // Marketing Digital
    { id: 'srv-13', name: 'Gestão de redes sociais', category: 'Marketing Digital', description: 'Planejamento mensal, calendário editorial, design, legendas e acompanhamento de métricas.', basePrice: 900, status: 'active' },
    { id: 'srv-14', name: 'Divulgação', category: 'Marketing Digital', description: 'Campanhas de alcance local e impulsionamento estratégico para atrair clientes.', basePrice: 600, status: 'active' },
    { id: 'srv-15', name: 'Criação de conteúdo', category: 'Marketing Digital', description: 'Roteiros de Reels, textos persuasivos e linha editorial voltada para autoridade.', basePrice: 550, status: 'active' },
    { id: 'srv-16', name: 'Estratégia digital', category: 'Marketing Digital', description: 'Plano completo de posicionamento, funil de aquisição e metas comerciais.', basePrice: 1100, status: 'active' },
    // Consultoria
    { id: 'srv-17', name: 'Consultoria digital', category: 'Consultoria', description: 'Diagnóstico 360º do negócio com plano de ação prático para vendas online.', basePrice: 500, status: 'active' },
    { id: 'srv-18', name: 'Consultoria de presença online', category: 'Consultoria', description: 'Auditoria de Instagram, Google Perfil da Empresa e WhatsApp Comercial.', basePrice: 400, status: 'active' },
    // Suporte Técnico
    { id: 'srv-19', name: 'Manutenção', category: 'Suporte Técnico', description: 'Correção de erros em páginas, hospedagem, SSL e ajustes estruturais.', basePrice: 200, status: 'active' },
    { id: 'srv-20', name: 'Configuração', category: 'Suporte Técnico', description: 'Configuração de domínio, DNS, e-mails profissionais e ferramentas comerciais.', basePrice: 220, status: 'active' },
    { id: 'srv-21', name: 'Suporte tecnológico', category: 'Suporte Técnico', description: 'Atendimento técnico dedicado para infraestrutura digital da empresa.', basePrice: 300, status: 'active' },
  ];

  const leads: Lead[] = [
    {
      id: 'lead-1',
      name: 'João Carlos',
      company: 'Barbearia Black Style',
      segment: 'Barbearia & Estética Masculina',
      profession: 'Empresário / Barbeiro Mestre',
      city: 'São Paulo',
      neighborhood: 'Brasilândia',
      state: 'SP',
      phone: '(11) 99876-5432',
      whatsapp: '5511998765432',
      email: 'contato@barbeariablackstyle.com.br',
      instagram: '@barbeariablackstyle',
      website: 'Não possui',
      origin: 'Prospecção Ativa (Instagram)',
      serviceInterest: 'Site para negócios locais',
      serviceCategory: 'Desenvolvimento Digital',
      estimatedValue: 850,
      closingProbability: 75,
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      createdAt: '2026-09-28T09:30:00-03:00',
      stageChangedAt: '2026-09-28T10:25:00-03:00',
      lastInteractionAt: '2026-09-28T10:35:00-03:00',
      nextAction: 'Apresentar modelo de agendamento e fechar pacote com Identidade Visual',
      nextContactDate: '2026-09-28',
      stage: 'INTERESSADO',
      observations: 'Cliente possui Instagram ativo, mas ainda não possui site. Possível oportunidade para criação de site institucional e identidade visual.',
    },
    {
      id: 'lead-2',
      name: 'Camila Andrade',
      company: 'Studio Black',
      segment: 'Beleza & Estética Avançada',
      profession: 'Esteticista / Diretora',
      city: 'São Paulo',
      neighborhood: 'Santana',
      state: 'SP',
      phone: '(11) 99123-4455',
      whatsapp: '5511991234455',
      email: 'camila@studioblacksp.com.br',
      instagram: '@studioblack.estetica',
      website: 'www.studioblacksp.com.br',
      origin: 'Indicação Comercial',
      serviceInterest: 'Site institucional',
      serviceCategory: 'Desenvolvimento Digital',
      estimatedValue: 900,
      closingProbability: 100,
      responsibleId: 'daniel',
      responsibleName: 'Daniel',
      createdAt: '2026-09-25T10:00:00-03:00',
      stageChangedAt: '2026-09-28T09:10:00-03:00',
      lastInteractionAt: '2026-09-28T09:10:00-03:00',
      nextAction: 'Reunião de alinhamento de Briefing às 11:00',
      nextContactDate: '2026-09-28',
      stage: 'FECHADO',
      observations: 'Contrato fechado para reformulação completa do site institucional com foco em agendamentos via WhatsApp.',
      closedDetails: {
        contractedService: 'Site institucional',
        soldValue: 900,
        paymentMethod: 'PIX (50% entrada + 50% entrega)',
        closedAt: '2026-09-28T09:10:00-03:00',
        responsibleId: 'daniel',
        responsibleName: 'Daniel',
        observation: 'Cliente solicitou paleta preta e dourada e botão flutuante do WhatsApp.',
        expectedStartDate: '2026-09-28',
        expectedDeliveryDate: '2026-10-15',
      },
    },
    {
      id: 'lead-3',
      name: 'Roberto Mendes',
      company: 'Empresa XPTO Logística',
      segment: 'Transporte & Logística',
      profession: 'Diretor Comercial',
      city: 'Guarulhos',
      neighborhood: 'Centro',
      state: 'SP',
      phone: '(11) 98444-7788',
      whatsapp: '5511984447788',
      email: 'roberto@xptologistica.com.br',
      instagram: '@xpto.logistica',
      website: 'Não possui',
      origin: 'Google Maps',
      serviceInterest: 'Site institucional',
      serviceCategory: 'Desenvolvimento Digital',
      estimatedValue: 1500,
      closingProbability: 80,
      responsibleId: 'daniel',
      responsibleName: 'Daniel',
      createdAt: '2026-09-24T14:20:00-03:00',
      stageChangedAt: '2026-09-26T08:00:00-03:00',
      lastInteractionAt: '2026-09-26T08:00:00-03:00',
      nextAction: 'Realizar follow-up da proposta enviada há 2 dias',
      nextContactDate: '2026-09-28',
      stage: 'PROPOSTA ENVIADA',
      observations: 'Proposta de R$ 1.500 enviada para site corporativo com área de cotação de frete. Está há 2 dias na etapa Proposta Enviada.',
    },
    {
      id: 'lead-4',
      name: 'Maria Fernanda',
      company: 'Clínica Sorriso Perfeito',
      segment: 'Odontologia',
      profession: 'Cirurgiã-Dentista',
      city: 'São Paulo',
      neighborhood: 'Tatuapé',
      state: 'SP',
      phone: '(11) 97654-3210',
      whatsapp: '5511976543210',
      email: 'dra.maria@sorrisoperfeito.odo.br',
      instagram: '@clinicasorrisoperfeito',
      website: 'Não possui',
      origin: 'Instagram',
      serviceInterest: 'Landing Page',
      serviceCategory: 'Desenvolvimento Digital',
      estimatedValue: 1100,
      closingProbability: 85,
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      createdAt: '2026-09-26T11:15:00-03:00',
      stageChangedAt: '2026-09-27T16:00:00-03:00',
      lastInteractionAt: '2026-09-27T16:40:00-03:00',
      nextAction: 'Follow-up cliente Maria às 10:00 sobre condições de parcelamento',
      nextContactDate: '2026-09-28',
      stage: 'NEGOCIAÇÃO',
      observations: 'Quer uma Landing Page focada em Implantes e Lentes de Contato Dental + pacote de flyers digitais.',
    },
    {
      id: 'lead-5',
      name: 'Marcos Vinícius',
      company: 'Auto Center Marcos Turbo',
      segment: 'Oficina Mecânica & Estética Automotiva',
      profession: 'Proprietário',
      city: 'São Paulo',
      neighborhood: 'Mooca',
      state: 'SP',
      phone: '(11) 96543-2198',
      whatsapp: '5511965432198',
      email: 'contato@marcosturbo.com.br',
      instagram: '@marcosturbo.oficial',
      website: 'Não possui',
      origin: 'Google Meu Negócio',
      serviceInterest: 'Gestão de redes sociais',
      serviceCategory: 'Marketing Digital',
      estimatedValue: 950,
      closingProbability: 65,
      responsibleId: 'pedro',
      responsibleName: 'Pedro',
      createdAt: '2026-09-25T09:00:00-03:00',
      stageChangedAt: '2026-09-25T15:00:00-03:00',
      lastInteractionAt: '2026-09-25T15:00:00-03:00',
      nextAction: 'Ligação cliente Marcos às 09:30 e retorno de proposta às 15:00',
      nextContactDate: '2026-09-28',
      stage: 'AGUARDANDO RESPOSTA',
      observations: 'Proposta de gestão mensal de Instagram + pacote de flyers promocionais enviada. Aguardando aprovação do sócio.',
    },
    {
      id: 'lead-6',
      name: 'Patrícia Oliveira',
      company: 'Padaria & Confeitaria Pão Dourado',
      segment: 'Gastronomia & Alimentação',
      profession: 'Comerciante',
      city: 'São Paulo',
      neighborhood: 'Vila Mariana',
      state: 'SP',
      phone: '(11) 95432-1098',
      whatsapp: '5511954321098',
      email: 'patricia@paodouradosp.com.br',
      instagram: '@padariapaodourado',
      website: 'Não possui',
      origin: 'Prospecção Local',
      serviceInterest: 'Artes para redes sociais',
      serviceCategory: 'Design',
      estimatedValue: 550,
      closingProbability: 50,
      responsibleId: null,
      responsibleName: 'Disponível',
      createdAt: '2026-09-28T08:05:00-03:00',
      stageChangedAt: '2026-09-28T08:05:00-03:00',
      lastInteractionAt: '2026-09-28T08:05:00-03:00',
      nextAction: 'Assumir lead e realizar primeiro contato via WhatsApp',
      nextContactDate: '2026-09-28',
      stage: 'NOVOS LEADS',
      observations: 'Entrou hoje cedo. Precisa de cardápio digital interativo e artes semanais para ofertas da padaria.',
    },
    {
      id: 'lead-7',
      name: 'Lucas Ferreira',
      company: 'Academia Iron Fit 24h',
      segment: 'Fitness & Saúde',
      profession: 'Gestor Esportivo',
      city: 'Osasco',
      neighborhood: 'Bela Vista',
      state: 'SP',
      phone: '(11) 94321-8765',
      whatsapp: '5511943218765',
      email: 'lucas@ironfit24h.com.br',
      instagram: '@ironfit.osasco',
      website: 'Não possui',
      origin: 'Instagram',
      serviceInterest: 'Flyer',
      serviceCategory: 'Design',
      estimatedValue: 680,
      closingProbability: 45,
      responsibleId: 'pedro',
      responsibleName: 'Pedro',
      createdAt: '2026-09-28T08:30:00-03:00',
      stageChangedAt: '2026-09-28T08:30:00-03:00',
      lastInteractionAt: '2026-09-28T08:30:00-03:00',
      nextAction: 'Iniciar abordagem sobre campanha de verão',
      nextContactDate: '2026-09-28',
      stage: 'AGUARDANDO CONTATO',
      observations: 'Procurando flyers promocionais e landing page de matrículas para o plano trimestral.',
    },
    {
      id: 'lead-8',
      name: 'Dr. Henrique Bastos',
      company: 'Bastos & Associados Advocacia',
      segment: 'Jurídico',
      profession: 'Advogado Sócio',
      city: 'São Paulo',
      neighborhood: 'Pinheiros',
      state: 'SP',
      phone: '(11) 93210-9876',
      whatsapp: '5511932109876',
      email: 'henrique@bastosadvocacia.com.br',
      instagram: '@bastos.advocacia',
      website: 'Não possui',
      origin: 'LinkedIn / Indicação',
      serviceInterest: 'Site institucional',
      serviceCategory: 'Desenvolvimento Digital',
      estimatedValue: 1800,
      closingProbability: 60,
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      createdAt: '2026-09-27T11:00:00-03:00',
      stageChangedAt: '2026-09-28T09:15:00-03:00',
      lastInteractionAt: '2026-09-28T09:15:00-03:00',
      nextAction: 'Apresentação de site às 13:00',
      nextContactDate: '2026-09-28',
      stage: 'CONTATO REALIZADO',
      observations: 'Conversamos por WhatsApp hoje cedo. Tem interesse em site sóbrio e consultoria de presença online.',
    },
    {
      id: 'lead-9',
      name: 'Renata Góes',
      company: 'Boutique Elegance Moda Feminina',
      segment: 'Moda & Varejo',
      profession: 'Lojista',
      city: 'São Paulo',
      neighborhood: 'Moema',
      state: 'SP',
      phone: '(11) 92109-8765',
      whatsapp: '5511921098765',
      email: 'renata@boutiqueelegance.com.br',
      instagram: '@boutique.elegancesp',
      website: 'www.boutiqueelegance.com.br',
      origin: 'Instagram',
      serviceInterest: 'Loja virtual',
      serviceCategory: 'Desenvolvimento Digital',
      estimatedValue: 2600,
      closingProbability: 100,
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      createdAt: '2026-09-20T10:00:00-03:00',
      stageChangedAt: '2026-09-26T17:30:00-03:00',
      lastInteractionAt: '2026-09-26T17:30:00-03:00',
      nextAction: 'Acompanhar entrega das fotos dos produtos',
      nextContactDate: '2026-09-30',
      stage: 'FECHADO',
      observations: 'Fechou Loja Virtual completa + Identidade Visual.',
      closedDetails: {
        contractedService: 'Loja virtual',
        soldValue: 2600,
        paymentMethod: 'Cartão de Crédito (6x)',
        closedAt: '2026-09-26T17:30:00-03:00',
        responsibleId: 'arthur',
        responsibleName: 'Arthur',
        observation: 'Integração com Correios, Melhor Envio e checkout transparente PIX.',
        expectedStartDate: '2026-09-27',
        expectedDeliveryDate: '2026-10-22',
      },
    },
    {
      id: 'lead-10',
      name: 'Gustavo Paiva',
      company: 'Pizzaria Forno Nobre',
      segment: 'Restaurante & Delivery',
      profession: 'Restaurateur',
      city: 'São Bernardo do Campo',
      neighborhood: 'Centro',
      state: 'SP',
      phone: '(11) 91098-7654',
      whatsapp: '5511910987654',
      email: 'gustavo@fornonobre.com.br',
      instagram: '@pizzariafornonobre',
      website: 'Não possui',
      origin: 'Prospecção Ativa',
      serviceInterest: 'Identidade visual',
      serviceCategory: 'Design',
      estimatedValue: 1350,
      closingProbability: 100,
      responsibleId: 'pedro',
      responsibleName: 'Pedro',
      createdAt: '2026-09-21T14:00:00-03:00',
      stageChangedAt: '2026-09-27T12:00:00-03:00',
      lastInteractionAt: '2026-09-27T12:00:00-03:00',
      nextAction: 'Apresentar prévias das embalagens de pizza',
      nextContactDate: '2026-09-29',
      stage: 'FECHADO',
      observations: 'Contratou Identidade Visual completa + Cardápio Digital + Flyers de inauguração.',
      closedDetails: {
        contractedService: 'Identidade visual',
        soldValue: 1350,
        paymentMethod: 'PIX à vista',
        closedAt: '2026-09-27T12:00:00-03:00',
        responsibleId: 'pedro',
        responsibleName: 'Pedro',
        observation: 'Prioridade na arte da caixa de pizza e avatar do WhatsApp.',
        expectedStartDate: '2026-09-27',
        expectedDeliveryDate: '2026-10-08',
      },
    },
    {
      id: 'lead-11',
      name: 'Carlos Eduardo',
      company: ' Lava Rápido Brilho Max',
      segment: 'Serviços Automotivos',
      profession: 'Microempresário',
      city: 'São Paulo',
      neighborhood: 'Penha',
      state: 'SP',
      phone: '(11) 98811-2233',
      whatsapp: '5511988112233',
      email: 'carlosedu@brilhomax.com',
      instagram: '@brilhomax.lavarapido',
      website: 'Não possui',
      origin: 'Google Maps',
      serviceInterest: 'Site para negócios locais',
      serviceCategory: 'Desenvolvimento Digital',
      estimatedValue: 850,
      closingProbability: 0,
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      createdAt: '2026-09-18T09:00:00-03:00',
      stageChangedAt: '2026-09-23T16:20:00-03:00',
      lastInteractionAt: '2026-09-23T16:20:00-03:00',
      nextAction: 'Retomar contato em 60 dias com oferta de flyer',
      nextContactDate: '2026-11-20',
      stage: 'PERDIDO',
      observations: 'Cliente gostou do modelo, mas informou que está reformando o galpão este mês.',
      lostDetails: {
        reason: 'Achou caro',
        description: 'Achou o investimento de R$ 850 alto no momento por conta de obras no ponto físico.',
        lostAt: '2026-09-23T16:20:00-03:00',
        responsibleId: 'arthur',
        responsibleName: 'Arthur',
        archived: true,
      },
    },
    {
      id: 'lead-12',
      name: 'Fernanda Nunes',
      company: 'PetShop Amigo Fiel',
      segment: 'Pet Shop & Veterinária',
      profession: 'Médica Veterinária',
      city: 'Santo André',
      neighborhood: 'Jardim',
      state: 'SP',
      phone: '(11) 97722-3344',
      whatsapp: '5511977223344',
      email: 'fernanda@petamigofiel.com.br',
      instagram: '@petshopamigofiel',
      website: 'Não possui',
      origin: 'Instagram',
      serviceInterest: 'Gestão de redes sociais',
      serviceCategory: 'Marketing Digital',
      estimatedValue: 900,
      closingProbability: 0,
      responsibleId: 'pedro',
      responsibleName: 'Pedro',
      createdAt: '2026-09-19T11:30:00-03:00',
      stageChangedAt: '2026-09-25T18:00:00-03:00',
      lastInteractionAt: '2026-09-25T18:00:00-03:00',
      nextAction: 'Arquivado para campanha de reativação',
      nextContactDate: '2026-10-25',
      stage: 'PERDIDO',
      observations: 'Enviamos proposta e realizamos 3 tentativas de follow-up sem retorno.',
      lostDetails: {
        reason: 'Não respondeu',
        description: 'Visualizou a proposta no WhatsApp mas não respondeu após 3 follow-ups.',
        lostAt: '2026-09-25T18:00:00-03:00',
        responsibleId: 'pedro',
        responsibleName: 'Pedro',
        archived: true,
      },
    },
    {
      id: 'lead-13',
      name: 'Juliana Martins',
      company: 'Imobiliária Horizonte Prime',
      segment: 'Mercado Imobiliário',
      profession: 'Corretora / Diretora',
      city: 'São Paulo',
      neighborhood: 'Itaim Bibi',
      state: 'SP',
      phone: '(11) 96655-4433',
      whatsapp: '5511966554433',
      email: 'juliana@horizonteprime.com.br',
      instagram: '@horizonteprime.imoveis',
      website: 'www.horizonteprime.com.br',
      origin: 'Indicação',
      serviceInterest: 'Consultoria de presença online',
      serviceCategory: 'Consultoria',
      estimatedValue: 750,
      closingProbability: 55,
      responsibleId: null,
      responsibleName: 'Disponível',
      createdAt: '2026-09-28T09:10:00-03:00',
      stageChangedAt: '2026-09-28T09:10:00-03:00',
      lastInteractionAt: '2026-09-28T09:10:00-03:00',
      nextAction: 'Aguardando distribuição ou captura pela equipe comercial',
      nextContactDate: '2026-09-28',
      stage: 'NOVOS LEADS',
      observations: 'Deseja diagnóstico completo do site atual + pacote de suporte técnico para configuração de e-mails corporativos.',
    },
  ];

  const interactions: Interaction[] = [
    {
      id: 'int-1',
      leadId: 'lead-1',
      leadCompany: 'Barbearia Black Style',
      userId: 'arthur',
      userName: 'Arthur',
      type: 'criacao',
      message: '09:30 — Lead criado a partir de prospecção ativa no Instagram',
      createdAt: '2026-09-28T09:30:00-03:00',
    },
    {
      id: 'int-2',
      leadId: 'lead-1',
      leadCompany: 'Barbearia Black Style',
      userId: 'arthur',
      userName: 'Arthur',
      type: 'visualizacao',
      message: '09:45 — Arthur abriu o cliente e assumiu o atendimento',
      createdAt: '2026-09-28T09:45:00-03:00',
    },
    {
      id: 'int-3',
      leadId: 'lead-1',
      leadCompany: 'Barbearia Black Style',
      userId: 'arthur',
      userName: 'Arthur',
      type: 'whatsapp',
      message: '10:02 — Contato realizado via WhatsApp com mensagem de apresentação da TRUINEXA DIGITAL',
      createdAt: '2026-09-28T10:02:00-03:00',
    },
    {
      id: 'int-4',
      leadId: 'lead-1',
      leadCompany: 'Barbearia Black Style',
      userId: 'arthur',
      userName: 'Arthur',
      type: 'whatsapp',
      message: '10:15 — Cliente respondeu solicitando exemplos de sites para barbearia',
      createdAt: '2026-09-28T10:15:00-03:00',
    },
    {
      id: 'int-5',
      leadId: 'lead-1',
      leadCompany: 'Barbearia Black Style',
      userId: 'arthur',
      userName: 'Arthur',
      type: 'status',
      message: '10:25 — Cliente demonstrou interesse em site e foi movido para INTERESSADO',
      createdAt: '2026-09-28T10:25:00-03:00',
    },
    {
      id: 'int-6',
      leadId: 'lead-1',
      leadCompany: 'Barbearia Black Style',
      userId: 'arthur',
      userName: 'Arthur',
      type: 'proposta',
      message: '10:35 — Pré-orçamento de R$ 850 apresentado pelo WhatsApp',
      createdAt: '2026-09-28T10:35:00-03:00',
    },
    {
      id: 'int-7',
      leadId: 'lead-2',
      leadCompany: 'Studio Black',
      userId: 'daniel',
      userName: 'Daniel',
      type: 'fechamento',
      message: '09:10 — Contrato fechado! Site institucional por R$ 900 (PIX)',
      createdAt: '2026-09-28T09:10:00-03:00',
    },
  ];

  const appointments: Appointment[] = [
    // Daniel
    {
      id: 'app-1',
      leadId: 'lead-1',
      leadName: 'João Carlos',
      leadCompany: 'Barbearia Black Style',
      responsibleId: 'daniel',
      responsibleName: 'Daniel',
      type: 'Retorno',
      title: 'Retornar cliente João (apoio comercial)',
      date: '2026-09-28',
      time: '09:00',
      status: 'concluido',
      notes: 'Validar condição especial do combo Site + Identidade Visual.',
    },
    {
      id: 'app-2',
      leadId: 'lead-2',
      leadName: 'Camila Andrade',
      leadCompany: 'Studio Black',
      responsibleId: 'daniel',
      responsibleName: 'Daniel',
      type: 'Reunião',
      title: 'Reunião Studio Black — Briefing do Site',
      date: '2026-09-28',
      time: '11:00',
      status: 'pendente',
      notes: 'Definir estrutura de páginas e coleta de fotos.',
    },
    {
      id: 'app-3',
      leadId: 'lead-3',
      leadName: 'Roberto Mendes',
      leadCompany: 'Empresa XPTO Logística',
      responsibleId: 'daniel',
      responsibleName: 'Daniel',
      type: 'Envio de proposta',
      title: 'Enviar revisão de proposta Empresa XPTO',
      date: '2026-09-28',
      time: '14:30',
      status: 'pendente',
      notes: 'Incluir módulo de rastreio e formulário de cotação rápida.',
    },
    // Arthur
    {
      id: 'app-4',
      leadId: 'lead-4',
      leadName: 'Maria Fernanda',
      leadCompany: 'Clínica Sorriso Perfeito',
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      type: 'Follow-up',
      title: 'Follow-up cliente Maria',
      date: '2026-09-28',
      time: '10:00',
      status: 'pendente',
      notes: 'Confirmar fechamento da Landing Page de Implantes.',
    },
    {
      id: 'app-5',
      leadId: 'lead-8',
      leadName: 'Dr. Henrique Bastos',
      leadCompany: 'Bastos & Associados Advocacia',
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      type: 'Apresentação',
      title: 'Apresentação de site institucional',
      date: '2026-09-28',
      time: '13:00',
      status: 'pendente',
      notes: 'Mostrar referências de escritórios de advocacia.',
    },
    // Pedro
    {
      id: 'app-6',
      leadId: 'lead-5',
      leadName: 'Marcos Vinícius',
      leadCompany: 'Auto Center Marcos Turbo',
      responsibleId: 'pedro',
      responsibleName: 'Pedro',
      type: 'Ligação',
      title: 'Ligação cliente Marcos',
      date: '2026-09-28',
      time: '09:30',
      status: 'pendente',
      notes: 'Alinhar dúvidas sobre o pacote mensal de redes sociais.',
    },
    {
      id: 'app-7',
      leadId: 'lead-5',
      leadName: 'Marcos Vinícius',
      leadCompany: 'Auto Center Marcos Turbo',
      responsibleId: 'pedro',
      responsibleName: 'Pedro',
      type: 'Retorno',
      title: 'Retorno de proposta Auto Center Marcos',
      date: '2026-09-28',
      time: '15:00',
      status: 'pendente',
      notes: 'Receber resposta final após conversa com o sócio.',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'all',
      type: 'novo_lead',
      title: 'Novo lead recebido',
      message: 'Imobiliária Horizonte Prime (Juliana Martins) entrou em NOVOS LEADS.',
      leadId: 'lead-13',
      readBy: [],
      createdAt: '2026-09-28T09:10:00-03:00',
    },
    {
      id: 'notif-2',
      userId: 'all',
      type: 'cliente_assumido',
      title: 'Arthur assumiu um cliente',
      message: 'Arthur assumiu o atendimento de Barbearia Black Style (João Carlos).',
      leadId: 'lead-1',
      readBy: ['arthur'],
      createdAt: '2026-09-28T09:45:00-03:00',
    },
    {
      id: 'notif-3',
      userId: 'all',
      type: 'sem_contato',
      title: 'Cliente sem contato há 2 dias',
      message: 'Empresa XPTO Logística está em PROPOSTA ENVIADA há 2 dias. Realizar follow-up.',
      leadId: 'lead-3',
      readBy: [],
      createdAt: '2026-09-28T08:00:00-03:00',
    },
    {
      id: 'notif-4',
      userId: 'all',
      type: 'followup_hoje',
      title: 'Follow-up marcado para hoje',
      message: 'Clínica Sorriso Perfeito (Maria Fernanda) tem follow-up agendado hoje às 10:00.',
      leadId: 'lead-4',
      readBy: [],
      createdAt: '2026-09-28T08:30:00-03:00',
    },
    {
      id: 'notif-5',
      userId: 'all',
      type: 'proposta_pendente',
      title: 'Proposta aguardando resposta',
      message: 'Auto Center Marcos Turbo está em AGUARDANDO RESPOSTA há 3 dias.',
      leadId: 'lead-5',
      readBy: [],
      createdAt: '2026-09-28T08:45:00-03:00',
    },
    {
      id: 'notif-6',
      userId: 'all',
      type: 'contrato_fechado',
      title: 'Cliente fechou contrato!',
      message: 'Studio Black fechou Site Institucional por R$ 900 com Daniel.',
      leadId: 'lead-2',
      readBy: ['daniel'],
      createdAt: '2026-09-28T09:10:00-03:00',
    },
    {
      id: 'notif-7',
      userId: 'all',
      type: 'agendamento_proximo',
      title: 'Novo agendamento em 30 minutos',
      message: 'Reunião Studio Black e Follow-up Clínica Sorriso Perfeito programados para a manhã.',
      leadId: 'lead-2',
      readBy: [],
      createdAt: '2026-09-28T09:30:00-03:00',
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'log-1',
      userId: 'arthur',
      userName: 'Arthur',
      action: 'Movimentação de Funil',
      leadId: 'lead-1',
      leadName: 'Barbearia Black Style',
      fromStage: 'CONTATO REALIZADO',
      toStage: 'INTERESSADO',
      details: 'Arthur alterou o cliente Barbearia Black Style de "CONTATO REALIZADO" para "INTERESSADO".',
      createdAt: '2026-09-28T10:25:00-03:00',
    },
    {
      id: 'log-2',
      userId: 'daniel',
      userName: 'Daniel',
      action: 'Contrato Fechado',
      leadId: 'lead-2',
      leadName: 'Studio Black',
      fromStage: 'NEGOCIAÇÃO',
      toStage: 'FECHADO',
      details: 'Daniel fechou contrato de Site institucional (R$ 900) com Studio Black e iniciou projeto.',
      createdAt: '2026-09-28T09:10:00-03:00',
    },
    {
      id: 'log-3',
      userId: 'pedro',
      userName: 'Pedro',
      action: 'Login no Sistema',
      details: 'Pedro iniciou sessão no CRM (Computador • São Paulo).',
      createdAt: '2026-09-28T08:52:00-03:00',
    },
    {
      id: 'log-4',
      userId: 'arthur',
      userName: 'Arthur',
      action: 'Login no Sistema',
      details: 'Arthur iniciou sessão no CRM (Celular • São Paulo).',
      createdAt: '2026-09-28T08:40:00-03:00',
    },
    {
      id: 'log-5',
      userId: 'daniel',
      userName: 'Daniel',
      action: 'Login no Sistema',
      details: 'Daniel iniciou sessão no CRM (Notebook • São Paulo).',
      createdAt: '2026-09-28T08:15:00-03:00',
    },
  ];

  const projects: ProjectItem[] = [
    {
      id: 'proj-1',
      leadId: 'lead-2',
      clientName: 'Camila Andrade',
      companyName: 'Studio Black',
      service: 'Site institucional',
      responsibleId: 'daniel',
      responsibleName: 'Daniel',
      value: 900,
      stage: 'Desenvolvimento',
      startDate: '2026-09-28',
      deadline: '2026-10-15',
      notes: 'Layout em desenvolvimento com paleta dark/gold e agendamento rápido.',
      createdAt: '2026-09-28T09:10:00-03:00',
    },
    {
      id: 'proj-2',
      leadId: 'lead-9',
      clientName: 'Renata Góes',
      companyName: 'Boutique Elegance Moda Feminina',
      service: 'Loja virtual',
      responsibleId: 'arthur',
      responsibleName: 'Arthur',
      value: 2600,
      stage: 'Briefing',
      startDate: '2026-09-27',
      deadline: '2026-10-22',
      notes: 'Cadastrando categorias de produtos e gateway de pagamento PIX/Cartão.',
      createdAt: '2026-09-26T17:30:00-03:00',
    },
    {
      id: 'proj-3',
      leadId: 'lead-10',
      clientName: 'Gustavo Paiva',
      companyName: 'Pizzaria Forno Nobre',
      service: 'Identidade visual',
      responsibleId: 'pedro',
      responsibleName: 'Pedro',
      value: 1350,
      stage: 'Revisão',
      startDate: '2026-09-27',
      deadline: '2026-10-08',
      notes: 'Logotipo aprovado, finalizando mockups das embalagens e cardápio digital.',
      createdAt: '2026-09-27T12:00:00-03:00',
    },
  ];

  const whatsappTemplates: WhatsAppTemplate[] = [
    {
      id: 'tpl-1',
      name: 'Apresentação Inicial TRUINEXA',
      category: 'Primeiro Contato',
      content: 'Olá {nome}, tudo bem?\n\nSou {vendedor}, da TRUINEXA DIGITAL.\n\nConheci o trabalho da sua empresa ({empresa}) e gostaria de conversar sobre algumas soluções digitais de {servico} que podem fortalecer sua presença online e atrair mais clientes.',
      isOfficialBusinessTemplate: true,
    },
    {
      id: 'tpl-2',
      name: 'Oportunidade Site + Presença Google',
      category: 'Primeiro Contato',
      content: 'Olá {nome}, tudo bem? Aqui é {vendedor} da TRUINEXA DIGITAL.\n\nVi o perfil da {empresa} e notei que vocês têm um ótimo potencial em {cidade}, mas um site profissional pode multiplicar os orçamentos vindos do Google. Posso te enviar 2 exemplos do que fizemos para o seu segmento?',
      isOfficialBusinessTemplate: false,
    },
    {
      id: 'tpl-3',
      name: 'Envio de Proposta Comercial',
      category: 'Proposta Comercial',
      content: 'Olá {nome}! Conforme conversamos, preparei a proposta comercial personalizada da TRUINEXA DIGITAL para o projeto de {servico} da {empresa}.\n\nValor do investimento: {valor}\n\nQualquer dúvida sobre os itens ou condições de pagamento, estou à disposição por aqui!',
      isOfficialBusinessTemplate: true,
    },
    {
      id: 'tpl-4',
      name: 'Follow-up de Proposta (48h)',
      category: 'Follow-up',
      content: 'Olá {nome}, tudo bem? Passando para saber se você conseguiu avaliar a proposta de {servico} para a {empresa}.\n\nConseguimos reservar uma condição especial na agenda de produção desta semana. Como podemos avançar?',
      isOfficialBusinessTemplate: true,
    },
    {
      id: 'tpl-5',
      name: 'Última Tentativa / Encerramento Cordial',
      category: 'Reativação',
      content: 'Olá {nome}! Como não tivemos retorno sobre o projeto de {servico} da {empresa}, vou pausar o seu chamado por enquanto para não te incomodar.\n\nQuando quiser retomar a evolução digital da sua empresa, pode contar com a TRUINEXA DIGITAL!',
      isOfficialBusinessTemplate: false,
    },
  ];

  return {
    users,
    leads,
    services,
    interactions,
    appointments,
    notifications,
    activityLogs,
    projects,
    whatsappTemplates,
    config: {
      distributionMode: 'capture',
      roundRobinOrder: ['arthur', 'pedro', 'daniel'],
      lastAssignedIndex: 0,
      whatsappMode: 'common',
      whatsappBusinessConfig: {
        phoneNumberId: '109283746519283',
        businessAccountId: '987654321012345',
        displayPhoneNumber: '+55 (11) 99000-2026',
        webhookVerifyToken: 'truinexa_webhook_verify_2026',
        connected: true,
        autoStageUpdateOnReply: true,
        autoFollowUpDays: 2,
      },
      stalledAlertDays: 2,
    },
  };
}

function loadDatabase(): PersistedDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as PersistedDatabase;
  } catch (err) {
    console.error('Failed to read DB file, recreating:', err);
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

let db: PersistedDatabase = loadDatabase();

function saveDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function getPublicState(): CRMState {
  return {
    ...db,
    users: db.users.map(sanitizeUser),
  };
}

// SSE Clients for real-time updates across Daniel, Arthur, and Pedro
const sseClients = new Set<Response>();

function broadcastState(eventType = 'state_updated', meta?: Record<string, unknown>) {
  const payload = JSON.stringify({
    type: eventType,
    state: getPublicState(),
    meta,
    timestamp: new Date().toISOString(),
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Real-time SSE stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const initialPayload = JSON.stringify({
      type: 'connected',
      state: getPublicState(),
      timestamp: new Date().toISOString(),
    });
    res.write(`data: ${initialPayload}\n\n`);

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get full CRM state
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json(getPublicState());
  });

  // Auth: Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password, deviceInfo } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: 'Informe o usuário/e-mail e a senha.' });
      return;
    }

    const normalized = String(identifier).trim().toLowerCase();
    const user = db.users.find(
      (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
    );

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado. Somente membros autorizados da TRUINEXA DIGITAL possuem acesso.' });
      return;
    }

    if (user.status === 'inactive') {
      res.status(403).json({ error: 'Esta conta foi desativada pelo Administrador (Daniel).' });
      return;
    }

    const isValid = verifyPassword(String(password), user.passwordHash, user.passwordSalt);
    if (!isValid) {
      res.status(401).json({ error: 'Senha incorreta. Verifique suas credenciais.' });
      return;
    }

    const now = new Date().toISOString();
    user.lastLoginAt = now;
    if (deviceInfo) {
      user.activeDevice = deviceInfo;
    }

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: 'Login no Sistema',
      details: `${user.name} iniciou sessão no CRM (${user.activeDevice || 'Acesso Web'}).`,
      createdAt: now,
    });

    saveDatabase();
    broadcastState('user_logged_in', { userId: user.id, userName: user.name });

    res.json({
      user: sanitizeUser(user),
      sessionToken: crypto.randomBytes(24).toString('hex'),
    });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      db.activityLogs.unshift({
        id: `log-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        action: 'Logout do Sistema',
        details: `${user.name} encerrou a sessão no CRM.`,
        createdAt: new Date().toISOString(),
      });
      saveDatabase();
      broadcastState('user_logged_out', { userId: user.id });
    }
    res.json({ ok: true });
  });

  // Auth: First access / Change password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'A nova senha deve possuir pelo menos 6 caracteres.' });
      return;
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const { hash, salt } = hashPassword(String(newPassword));
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.mustChangePassword = false;
    user.tempPasswordHint = undefined;

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: 'Senha Atualizada',
      details: `${user.name} definiu uma nova senha pessoal criptografada.`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    broadcastState('user_updated', { userId: user.id });
    res.json({ user: sanitizeUser(user) });
  });

  // Auth: Recover password request
  app.post('/api/auth/recover-password', (req: Request, res: Response) => {
    const { identifier } = req.body;
    const normalized = String(identifier || '').trim().toLowerCase();
    const user = db.users.find(
      (u) => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
    );

    if (!user) {
      res.status(404).json({ error: 'Usuário não localizado na base da TRUINEXA DIGITAL.' });
      return;
    }

    const now = new Date().toISOString();
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: 'daniel',
      type: 'novo_lead',
      title: 'Solicitação de Recuperação de Senha',
      message: `${user.name} (${user.email}) solicitou redefinição de senha na tela de login.`,
      readBy: [],
      createdAt: now,
    });

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action: 'Recuperação de Senha Solicitada',
      details: `${user.name} solicitou recuperação de acesso. Notificação enviada ao Administrador Daniel.`,
      createdAt: now,
    });

    saveDatabase();
    broadcastState('password_recovery_requested', { userId: user.id });
    res.json({
      message: `Solicitação registrada para ${user.name}. O administrador Daniel foi notificado e uma credencial temporária pode ser gerada no painel Equipe.`,
    });
  });

  // Create new Lead (with automatic distribution if enabled)
  app.post('/api/leads', (req: Request, res: Response) => {
    const { actorId, leadData } = req.body;
    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const now = new Date().toISOString();

    let assignedId: string | null = leadData.responsibleId ?? null;
    let assignedName = 'Disponível';

    if (!assignedId && db.config.distributionMode === 'automatic') {
      const activePool = db.config.roundRobinOrder.filter((uid) => {
        const u = db.users.find((usr) => usr.id === uid);
        return u && u.status === 'active';
      });
      if (activePool.length > 0) {
        const nextIdx = db.config.lastAssignedIndex % activePool.length;
        assignedId = activePool[nextIdx];
        db.config.lastAssignedIndex = (nextIdx + 1) % activePool.length;
      }
    }

    if (assignedId) {
      const respUser = db.users.find((u) => u.id === assignedId);
      assignedName = respUser ? respUser.name : 'Disponível';
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: leadData.name || 'Cliente Sem Nome',
      company: leadData.company || leadData.name || 'Empresa',
      segment: leadData.segment || 'Comércio & Serviços',
      profession: leadData.profession || 'Empresário(a)',
      city: leadData.city || 'São Paulo',
      neighborhood: leadData.neighborhood || 'Centro',
      state: leadData.state || 'SP',
      phone: leadData.phone || '',
      whatsapp: (leadData.whatsapp || leadData.phone || '').replace(/\D/g, ''),
      email: leadData.email || '',
      instagram: leadData.instagram || '',
      website: leadData.website || 'Não possui',
      origin: leadData.origin || 'Prospecção Ativa',
      serviceInterest: leadData.serviceInterest || 'Site institucional',
      serviceCategory: leadData.serviceCategory || 'Desenvolvimento Digital',
      estimatedValue: Number(leadData.estimatedValue) || 850,
      closingProbability: Number(leadData.closingProbability) || 40,
      responsibleId: assignedId,
      responsibleName: assignedName,
      createdAt: now,
      stageChangedAt: now,
      lastInteractionAt: now,
      nextAction: leadData.nextAction || 'Realizar primeiro contato comercial',
      nextContactDate: leadData.nextContactDate || now.slice(0, 10),
      stage: (leadData.stage as KanbanStage) || 'NOVOS LEADS',
      observations: leadData.observations || '',
    };

    db.leads.unshift(newLead);

    const timeFormatted = new Date(now).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    db.interactions.unshift({
      id: `int-${Date.now()}`,
      leadId: newLead.id,
      leadCompany: newLead.company,
      userId: actor.id,
      userName: actor.name,
      type: 'criacao',
      message: `${timeFormatted} — Lead criado por ${actor.name}${assignedId ? ` (Responsável: ${assignedName})` : ' (Disponível para captura)'}`,
      createdAt: now,
    });

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: 'all',
      type: 'novo_lead',
      title: 'Novo lead recebido',
      message: `${newLead.company} (${newLead.name}) entrou em ${newLead.stage}.`,
      leadId: newLead.id,
      readBy: [actor.id],
      createdAt: now,
    });

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Novo Lead Cadastrado',
      leadId: newLead.id,
      leadName: newLead.company,
      toStage: newLead.stage,
      details: `${actor.name} cadastrou o cliente ${newLead.company} (${newLead.serviceInterest}).`,
      createdAt: now,
    });

    saveDatabase();
    broadcastState('lead_created', { leadId: newLead.id, actorName: actor.name });
    res.json(newLead);
  });

  // Update Lead (details, responsible, or stage)
  app.put('/api/leads/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, updates } = req.body;
    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const lead = db.leads.find((l) => l.id === id);

    if (!lead) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const now = new Date().toISOString();
    const timeFormatted = new Date(now).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const previousStage = lead.stage;
    const previousResponsible = lead.responsibleId;

    Object.assign(lead, updates);
    lead.lastInteractionAt = now;

    if (updates.responsibleId !== undefined && updates.responsibleId !== previousResponsible) {
      const respUser = db.users.find((u) => u.id === updates.responsibleId);
      lead.responsibleName = respUser ? respUser.name : 'Disponível';

      db.interactions.unshift({
        id: `int-${Date.now()}-resp`,
        leadId: lead.id,
        leadCompany: lead.company,
        userId: actor.id,
        userName: actor.name,
        type: 'visualizacao',
        message: `${timeFormatted} — Responsável alterado para ${lead.responsibleName} por ${actor.name}`,
        createdAt: now,
      });

      db.notifications.unshift({
        id: `notif-${Date.now()}-claim`,
        userId: 'all',
        type: 'cliente_assumido',
        title: `${lead.responsibleName} assumiu um cliente`,
        message: `${lead.company} agora está sob responsabilidade de ${lead.responsibleName}.`,
        leadId: lead.id,
        readBy: [actor.id],
        createdAt: now,
      });

      db.activityLogs.unshift({
        id: `log-${Date.now()}-resp`,
        userId: actor.id,
        userName: actor.name,
        action: 'Atribuição de Responsável',
        leadId: lead.id,
        leadName: lead.company,
        details: `${actor.name} definiu ${lead.responsibleName} como responsável pelo cliente ${lead.company}.`,
        createdAt: now,
      });
    }

    if (updates.stage && updates.stage !== previousStage) {
      lead.stageChangedAt = now;

      db.interactions.unshift({
        id: `int-${Date.now()}-stage`,
        leadId: lead.id,
        leadCompany: lead.company,
        userId: actor.id,
        userName: actor.name,
        type: 'status',
        message: `${timeFormatted} — ${actor.name} moveu de "${previousStage}" para "${lead.stage}"`,
        createdAt: now,
      });

      db.activityLogs.unshift({
        id: `log-${Date.now()}-stage`,
        userId: actor.id,
        userName: actor.name,
        action: 'Movimentação de Funil',
        leadId: lead.id,
        leadName: lead.company,
        fromStage: previousStage,
        toStage: lead.stage,
        details: `${actor.name} alterou o cliente ${lead.company} de "${previousStage}" para "${lead.stage}".`,
        createdAt: now,
      });
    }

    saveDatabase();
    broadcastState('lead_updated', { leadId: lead.id, actorName: actor.name });
    res.json(lead);
  });

  // Close Deal ("FECHADO") -> Records closedDetails + Automatically creates Project
  app.post('/api/leads/:id/close', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, closedDetails } = req.body as {
      actorId: string;
      closedDetails: ClosedDealDetails;
    };

    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const lead = db.leads.find((l) => l.id === id);

    if (!lead) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const now = new Date().toISOString();
    const timeFormatted = new Date(now).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const previousStage = lead.stage;

    lead.stage = 'FECHADO';
    lead.stageChangedAt = now;
    lead.lastInteractionAt = now;
    lead.closingProbability = 100;
    lead.estimatedValue = Number(closedDetails.soldValue) || lead.estimatedValue;
    lead.serviceInterest = closedDetails.contractedService || lead.serviceInterest;
    lead.responsibleId = closedDetails.responsibleId || lead.responsibleId || actor.id;

    const respUser = db.users.find((u) => u.id === lead.responsibleId);
    lead.responsibleName = respUser ? respUser.name : closedDetails.responsibleName || actor.name;

    lead.closedDetails = {
      ...closedDetails,
      soldValue: Number(closedDetails.soldValue) || lead.estimatedValue,
      responsibleName: lead.responsibleName,
    };

    // Create automatic Project in "GESTÃO DE PROJETOS" (Section 30)
    const existingProject = db.projects.find((p) => p.leadId === lead.id);
    if (!existingProject) {
      const newProject: ProjectItem = {
        id: `proj-${Date.now()}`,
        leadId: lead.id,
        clientName: lead.name,
        companyName: lead.company,
        service: lead.closedDetails.contractedService,
        responsibleId: lead.responsibleId || actor.id,
        responsibleName: lead.responsibleName,
        value: lead.closedDetails.soldValue,
        stage: 'Contrato fechado',
        startDate: lead.closedDetails.expectedStartDate || now.slice(0, 10),
        deadline: lead.closedDetails.expectedDeliveryDate || now.slice(0, 10),
        notes: lead.closedDetails.observation || 'Projeto criado automaticamente após fechamento no CRM.',
        createdAt: now,
      };
      db.projects.unshift(newProject);
    }

    db.interactions.unshift({
      id: `int-${Date.now()}`,
      leadId: lead.id,
      leadCompany: lead.company,
      userId: actor.id,
      userName: actor.name,
      type: 'fechamento',
      message: `${timeFormatted} — VENDA FECHADA! ${lead.closedDetails.contractedService} por R$ ${lead.closedDetails.soldValue.toLocaleString('pt-BR')} (${lead.closedDetails.paymentMethod}). Projeto iniciado automaticamente.`,
      createdAt: now,
    });

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: 'all',
      type: 'contrato_fechado',
      title: 'Cliente fechou contrato!',
      message: `${lead.company} fechou ${lead.closedDetails.contractedService} (R$ ${lead.closedDetails.soldValue.toLocaleString('pt-BR')}) com ${lead.responsibleName}.`,
      leadId: lead.id,
      readBy: [actor.id],
      createdAt: now,
    });

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Contrato Fechado',
      leadId: lead.id,
      leadName: lead.company,
      fromStage: previousStage,
      toStage: 'FECHADO',
      details: `${actor.name} fechou venda com ${lead.company}: ${lead.closedDetails.contractedService} — R$ ${lead.closedDetails.soldValue.toLocaleString('pt-BR')}.`,
      createdAt: now,
    });

    saveDatabase();
    broadcastState('lead_closed', { leadId: lead.id, actorName: actor.name });
    res.json(lead);
  });

  // Mark Lead as Lost ("PERDIDO") -> Moves to Lost Archive with mandatory reason
  app.post('/api/leads/:id/lost', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, lostDetails } = req.body as {
      actorId: string;
      lostDetails: LostDetails;
    };

    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const lead = db.leads.find((l) => l.id === id);

    if (!lead) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    if (!lostDetails?.reason) {
      res.status(400).json({ error: 'O motivo de perda é obrigatório.' });
      return;
    }

    const now = new Date().toISOString();
    const timeFormatted = new Date(now).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const previousStage = lead.stage;

    lead.stage = 'PERDIDO';
    lead.stageChangedAt = now;
    lead.lastInteractionAt = now;
    lead.closingProbability = 0;
    lead.lostDetails = {
      reason: lostDetails.reason,
      description: lostDetails.description || '',
      lostAt: now,
      responsibleId: lead.responsibleId || actor.id,
      responsibleName: lead.responsibleName || actor.name,
      archived: true,
    };

    db.interactions.unshift({
      id: `int-${Date.now()}`,
      leadId: lead.id,
      leadCompany: lead.company,
      userId: actor.id,
      userName: actor.name,
      type: 'perda',
      message: `${timeFormatted} — Marcado como PERDIDO por ${actor.name}. Motivo: ${lostDetails.reason}${lostDetails.description ? ` (${lostDetails.description})` : ''}`,
      createdAt: now,
    });

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Negociação Perdida (Arquivada)',
      leadId: lead.id,
      leadName: lead.company,
      fromStage: previousStage,
      toStage: 'PERDIDO',
      details: `${actor.name} arquivou ${lead.company} como PERDIDO. Motivo: ${lostDetails.reason}.`,
      createdAt: now,
    });

    saveDatabase();
    broadcastState('lead_lost', { leadId: lead.id, actorName: actor.name });
    res.json(lead);
  });

  // Permanent Delete Lead (Admin Daniel only)
  app.delete('/api/leads/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorId = String(req.query.actorId || '');
    const actor = db.users.find((u) => u.id === actorId);

    if (!actor || (!actor.permissions.canDeleteLeads && actor.role !== 'admin')) {
      res.status(403).json({ error: 'Somente o Administrador (Daniel) pode excluir clientes permanentemente.' });
      return;
    }

    const index = db.leads.findIndex((l) => l.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const removed = db.leads[index];
    db.leads.splice(index, 1);

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Exclusão Permanente',
      leadName: removed.company,
      details: `${actor.name} excluiu permanentemente o registro de ${removed.company} (${removed.name}).`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    broadcastState('lead_deleted', { leadId: id, actorName: actor.name });
    res.json({ ok: true });
  });

  // Add Interaction (WhatsApp, Call, Email, Proposal, Observation)
  app.post('/api/interactions', (req: Request, res: Response) => {
    const { actorId, leadId, type, message, autoAdvanceStage } = req.body;
    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const lead = db.leads.find((l) => l.id === leadId);

    if (!lead) {
      res.status(404).json({ error: 'Cliente não encontrado.' });
      return;
    }

    const now = new Date().toISOString();
    const timeFormatted = new Date(now).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newInteraction: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      leadCompany: lead.company,
      userId: actor.id,
      userName: actor.name,
      type: type || 'observacao',
      message: message.includes('—') ? message : `${timeFormatted} — ${message}`,
      createdAt: now,
    };

    db.interactions.unshift(newInteraction);
    lead.lastInteractionAt = now;

    if (autoAdvanceStage && autoAdvanceStage !== lead.stage) {
      const prevStage = lead.stage;
      lead.stage = autoAdvanceStage;
      lead.stageChangedAt = now;

      db.activityLogs.unshift({
        id: `log-${Date.now()}-auto`,
        userId: actor.id,
        userName: actor.name,
        action: 'Atualização Automática de Etapa',
        leadId: lead.id,
        leadName: lead.company,
        fromStage: prevStage,
        toStage: autoAdvanceStage,
        details: `${actor.name} registrou contato (${type}) e o cliente ${lead.company} avançou de "${prevStage}" para "${autoAdvanceStage}".`,
        createdAt: now,
      });
    } else {
      db.activityLogs.unshift({
        id: `log-${Date.now()}`,
        userId: actor.id,
        userName: actor.name,
        action: 'Interação Registrada',
        leadId: lead.id,
        leadName: lead.company,
        details: `${actor.name} registrou ${type.toUpperCase()} em ${lead.company}: "${message}"`,
        createdAt: now,
      });
    }

    saveDatabase();
    broadcastState('interaction_added', { leadId: lead.id, actorName: actor.name });
    res.json(newInteraction);
  });

  // Appointments (Create / Toggle Status / Delete)
  app.post('/api/appointments', (req: Request, res: Response) => {
    const { actorId, appointment } = req.body;
    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const lead = db.leads.find((l) => l.id === appointment.leadId);
    const respUser = db.users.find((u) => u.id === appointment.responsibleId) || actor;

    const now = new Date().toISOString();
    const timeFormatted = new Date(now).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      leadId: lead ? lead.id : appointment.leadId || '',
      leadName: lead ? lead.name : appointment.leadName || 'Cliente',
      leadCompany: lead ? lead.company : appointment.leadCompany || 'Empresa',
      responsibleId: respUser.id,
      responsibleName: respUser.name,
      type: appointment.type || 'Follow-up',
      title: appointment.title || `${appointment.type} — ${lead?.company || ''}`,
      date: appointment.date || now.slice(0, 10),
      time: appointment.time || '10:00',
      status: 'pendente',
      notes: appointment.notes || '',
    };

    db.appointments.push(newApp);

    if (lead) {
      lead.nextAction = `${newApp.type}: ${newApp.title} (${newApp.time})`;
      lead.nextContactDate = newApp.date;
      lead.lastInteractionAt = now;

      db.interactions.unshift({
        id: `int-${Date.now()}`,
        leadId: lead.id,
        leadCompany: lead.company,
        userId: actor.id,
        userName: actor.name,
        type: 'agendamento',
        message: `${timeFormatted} — Agendamento criado (${newApp.type}): "${newApp.title}" para ${newApp.date} às ${newApp.time}`,
        createdAt: now,
      });
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: respUser.id,
      type: 'agendamento_proximo',
      title: 'Novo compromisso na agenda',
      message: `${newApp.title} agendado para ${newApp.date} às ${newApp.time} (${respUser.name}).`,
      leadId: lead?.id,
      readBy: [actor.id],
      createdAt: now,
    });

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Compromisso Agendado',
      leadId: lead?.id,
      leadName: lead?.company,
      details: `${actor.name} agendou "${newApp.title}" (${newApp.date} às ${newApp.time}) para ${respUser.name}.`,
      createdAt: now,
    });

    saveDatabase();
    broadcastState('appointment_created', { appointmentId: newApp.id });
    res.json(newApp);
  });

  app.put('/api/appointments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, status, updates } = req.body;
    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const appItem = db.appointments.find((a) => a.id === id);

    if (!appItem) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }

    if (status) appItem.status = status;
    if (updates) Object.assign(appItem, updates);

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Agenda Atualizada',
      leadId: appItem.leadId,
      leadName: appItem.leadCompany,
      details: `${actor.name} alterou o status do compromisso "${appItem.title}" para ${appItem.status.toUpperCase()}.`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    broadcastState('appointment_updated', { appointmentId: appItem.id });
    res.json(appItem);
  });

  // Services Management (Admin Daniel)
  app.post('/api/services', (req: Request, res: Response) => {
    const { actorId, service } = req.body;
    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || (!actor.permissions.canManageServices && actor.role !== 'admin')) {
      res.status(403).json({ error: 'Permissão restrita ao Administrador.' });
      return;
    }

    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: service.name,
      category: service.category || 'Desenvolvimento Digital',
      description: service.description || '',
      basePrice: Number(service.basePrice) || 0,
      status: 'active',
    };

    db.services.push(newService);
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Serviço Criado',
      details: `${actor.name} adicionou o serviço "${newService.name}" (${newService.category}) — R$ ${newService.basePrice}.`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    broadcastState('service_created', { serviceId: newService.id });
    res.json(newService);
  });

  app.put('/api/services/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, updates } = req.body;
    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || (!actor.permissions.canManageServices && actor.role !== 'admin')) {
      res.status(403).json({ error: 'Permissão restrita ao Administrador.' });
      return;
    }

    const srv = db.services.find((s) => s.id === id);
    if (!srv) {
      res.status(404).json({ error: 'Serviço não encontrado.' });
      return;
    }

    Object.assign(srv, updates);
    saveDatabase();
    broadcastState('service_updated', { serviceId: srv.id });
    res.json(srv);
  });

  // Projects Management (Section 30)
  app.put('/api/projects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, updates } = req.body;
    const actor = db.users.find((u) => u.id === actorId) || db.users[0];
    const proj = db.projects.find((p) => p.id === id);

    if (!proj) {
      res.status(404).json({ error: 'Projeto não encontrado.' });
      return;
    }

    const prevStage = proj.stage;
    Object.assign(proj, updates);

    if (updates.stage && updates.stage !== prevStage) {
      db.activityLogs.unshift({
        id: `log-${Date.now()}`,
        userId: actor.id,
        userName: actor.name,
        action: 'Etapa de Projeto Atualizada',
        leadId: proj.leadId,
        leadName: proj.companyName,
        fromStage: prevStage,
        toStage: proj.stage,
        details: `${actor.name} avançou o projeto de ${proj.companyName} (${proj.service}) de "${prevStage}" para "${proj.stage}".`,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase();
    broadcastState('project_updated', { projectId: proj.id });
    res.json(proj);
  });

  // Users & Permissions Management (Admin Daniel only)
  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorId, updates, resetTempPassword } = req.body;
    const actor = db.users.find((u) => u.id === actorId);

    if (!actor || (!actor.permissions.canManageUsers && actor.role !== 'admin')) {
      res.status(403).json({ error: 'Somente Daniel (Administrador) pode gerenciar usuários e permissões.' });
      return;
    }

    const targetUser = db.users.find((u) => u.id === id);
    if (!targetUser) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    if (updates.status !== undefined) targetUser.status = updates.status;
    if (updates.role !== undefined) {
      targetUser.role = updates.role;
      targetUser.roleTitle = updates.role === 'admin' ? 'Administrador' : 'Comercial';
    }
    if (updates.permissions) {
      targetUser.permissions = { ...targetUser.permissions, ...updates.permissions };
    }
    if (updates.name) targetUser.name = updates.name;
    if (updates.email) targetUser.email = updates.email;

    if (resetTempPassword) {
      const { hash, salt } = hashPassword(String(resetTempPassword));
      targetUser.passwordHash = hash;
      targetUser.passwordSalt = salt;
      targetUser.mustChangePassword = true;
      targetUser.tempPasswordHint = String(resetTempPassword);
    }

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Gerenciamento de Equipe',
      details: `${actor.name} atualizou configurações/permissões do usuário ${targetUser.name}${resetTempPassword ? ' e gerou nova senha temporária de primeiro acesso' : ''}.`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    broadcastState('user_updated', { userId: targetUser.id });
    res.json(sanitizeUser(targetUser));
  });

  // Create new team user (Admin Daniel only)
  app.post('/api/users', (req: Request, res: Response) => {
    const { actorId, newUser } = req.body;
    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || actor.role !== 'admin') {
      res.status(403).json({ error: 'Somente o Administrador pode criar novos usuários.' });
      return;
    }

    const username = String(newUser.username || '').trim().toLowerCase();
    if (!username || db.users.some((u) => u.username === username)) {
      res.status(400).json({ error: 'Nome de usuário inválido ou já existente.' });
      return;
    }

    const tempPassword = newUser.tempPassword || `Truinexa@${ Math.floor(1000 + Math.random() * 9000) }`;
    const { hash, salt } = hashPassword(tempPassword);

    const created: StoredUser = {
      id: username,
      username,
      name: newUser.name || username,
      email: newUser.email || `${username}@truinexa.com.br`,
      role: newUser.role || 'comercial',
      roleTitle: newUser.role === 'admin' ? 'Administrador' : 'Comercial',
      status: 'active',
      avatarColor: 'from-purple-500 to-indigo-600',
      mustChangePassword: true,
      tempPasswordHint: tempPassword,
      passwordHash: hash,
      passwordSalt: salt,
      permissions: {
        canViewAllLeads: newUser.role === 'admin',
        canEditAnyLead: newUser.role === 'admin',
        canDeleteLeads: newUser.role === 'admin',
        canDistributeLeads: newUser.role === 'admin',
        canManageServices: newUser.role === 'admin',
        canViewFinancialReports: newUser.role === 'admin',
        canManageUsers: newUser.role === 'admin',
        canConfigureSystem: newUser.role === 'admin',
        canManageTeamAgenda: newUser.role === 'admin',
      },
    };

    db.users.push(created);
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Novo Usuário Criado',
      details: `${actor.name} criou a conta de ${created.name} (${created.roleTitle}) com senha temporária de primeiro acesso.`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    broadcastState('user_created', { userId: created.id });
    res.json(sanitizeUser(created));
  });

  // Update System Configuration & WhatsApp Templates
  app.put('/api/config', (req: Request, res: Response) => {
    const { actorId, configUpdates, whatsappTemplates } = req.body;
    const actor = db.users.find((u) => u.id === actorId);
    if (!actor || (!actor.permissions.canConfigureSystem && actor.role !== 'admin')) {
      res.status(403).json({ error: 'Somente o Administrador pode alterar configurações do sistema.' });
      return;
    }

    if (configUpdates) {
      db.config = { ...db.config, ...configUpdates };
    }
    if (whatsappTemplates) {
      db.whatsappTemplates = whatsappTemplates;
    }

    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      userId: actor.id,
      userName: actor.name,
      action: 'Configuração Atualizada',
      details: `${actor.name} atualizou as configurações de automação, distribuição de leads e WhatsApp Business.`,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    broadcastState('config_updated', { actorName: actor.name });
    res.json({ config: db.config, whatsappTemplates: db.whatsappTemplates });
  });

  // Notifications: Mark read
  app.post('/api/notifications/read', (req: Request, res: Response) => {
    const { userId, notificationId } = req.body;
    if (notificationId === 'all') {
      db.notifications.forEach((n) => {
        if (!n.readBy.includes(userId)) n.readBy.push(userId);
      });
    } else {
      const notif = db.notifications.find((n) => n.id === notificationId);
      if (notif && !notif.readBy.includes(userId)) {
        notif.readBy.push(userId);
      }
    }
    saveDatabase();
    broadcastState('notifications_updated');
    res.json({ ok: true });
  });

  // Vite middleware for development or static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRUINEXA DIGITAL CRM Server running on http://localhost:${PORT}`);
  });
}

startServer();
