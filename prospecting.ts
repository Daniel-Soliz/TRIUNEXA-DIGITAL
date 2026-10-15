import { Lead, SystemConfig } from './crm';

export interface ProspectingMessageOptions {
  includePortfolio: boolean;
  mentionNeighborhood: boolean;
  includePresentation: boolean;
  includeRecommendedService: boolean;
}

type SegmentRule = {
  opportunity: string;
  service: string;
  benefit: string;
};

const RULES: Array<{ match: string[]; rule: SegmentRule }> = [
  {
    match: ['barbearia', 'barber'],
    rule: {
      opportunity: 'Centralizar agendamento, apresentação dos cortes, atendimento e venda de produtos em uma estrutura própria da barbearia.',
      service: 'Site completo para barbearia com agendamento, portfólio, loja e painel administrativo',
      benefit: 'reduzir a dependência de ferramentas mensais de atendimento, facilitar agendamentos e ainda criar um novo canal para vender produtos',
    },
  },
  {
    match: ['salao', 'salão', 'beleza'],
    rule: {
      opportunity: 'Apresentar serviços e trabalhos realizados e facilitar novos agendamentos.',
      service: 'Site com serviços, trabalhos realizados e agendamento',
      benefit: 'ajudar novos clientes a conhecer os serviços, visualizar trabalhos e marcar um horário',
    },
  },
  {
    match: ['estetica', 'estética'],
    rule: {
      opportunity: 'Apresentar procedimentos e facilitar novos agendamentos.',
      service: 'Site de procedimentos com agendamento',
      benefit: 'dar mais clareza aos procedimentos e reduzir o atrito para solicitar um agendamento',
    },
  },
  {
    match: ['pet shop', 'petshop', 'pet '],
    rule: {
      opportunity: 'Facilitar solicitações de banho, tosa e outros serviços pelo celular.',
      service: 'Site de serviços com agendamento e WhatsApp',
      benefit: 'facilitar consultas sobre banho, tosa, horários e solicitações de serviço',
    },
  },
  {
    match: ['academia', 'fitness'],
    rule: {
      opportunity: 'Gerar contatos de potenciais alunos da região e facilitar aula experimental.',
      service: 'Landing page de planos e aula experimental',
      benefit: 'transformar interesse local em conversas sobre planos e aulas experimentais',
    },
  },
  {
    match: ['restaurante'],
    rule: {
      opportunity: 'Facilitar acesso ao cardápio, reservas e pedidos pelo WhatsApp.',
      service: 'Cardápio digital com pedidos e WhatsApp',
      benefit: 'diminuir o caminho entre encontrar o restaurante, ver o cardápio e fazer um pedido ou reserva',
    },
  },
  {
    match: ['pizzaria', 'pizza'],
    rule: {
      opportunity: 'Facilitar pedidos, promoções e delivery pelo WhatsApp.',
      service: 'Cardápio digital com delivery e WhatsApp',
      benefit: 'facilitar a escolha do pedido e levar o cliente rapidamente ao WhatsApp ou delivery',
    },
  },
  {
    match: ['odontologia', 'odonto', 'dentista'],
    rule: {
      opportunity: 'Apresentar tratamentos e facilitar avaliações e agendamentos.',
      service: 'Site de tratamentos com avaliação e agendamento',
      benefit: 'ajudar pacientes a entender tratamentos e solicitar avaliação ou agendamento',
    },
  },
  {
    match: ['clinica', 'clínica'],
    rule: {
      opportunity: 'Apresentar especialidades, profissionais e facilitar o agendamento.',
      service: 'Site de especialidades com agendamento',
      benefit: 'ajudar pacientes a encontrar especialidades, profissionais e solicitar agendamento',
    },
  },
  {
    match: ['oficina mecanica', 'oficina mecânica', 'oficina'],
    rule: {
      opportunity: 'Facilitar pedidos de orçamento e contato rápido com a oficina.',
      service: 'Site com serviços, orçamento e WhatsApp',
      benefit: 'facilitar o pedido de orçamento e o contato de quem precisa de um serviço automotivo',
    },
  },
  {
    match: ['auto eletrica', 'auto elétrica'],
    rule: {
      opportunity: 'Facilitar solicitações de orçamento e contato rápido pelo WhatsApp.',
      service: 'Site com orçamento rápido e WhatsApp',
      benefit: 'reduzir o tempo entre a necessidade do cliente e o pedido de orçamento',
    },
  },
  {
    match: ['imobiliaria', 'imobiliária'],
    rule: {
      opportunity: 'Apresentar imóveis e captar interessados diretamente pelo WhatsApp.',
      service: 'Site de imóveis com captação pelo WhatsApp',
      benefit: 'facilitar a descoberta de imóveis e a entrada de interessados no atendimento',
    },
  },
  {
    match: ['escola', 'curso'],
    rule: {
      opportunity: 'Facilitar matrículas, informações sobre cursos e atendimento pelo WhatsApp.',
      service: 'Landing page de cursos e matrículas',
      benefit: 'facilitar o acesso a informações e transformar dúvidas em contatos de matrícula',
    },
  },
  {
    match: ['loja', 'varejo'],
    rule: {
      opportunity: 'Apresentar produtos e facilitar pedidos pelo WhatsApp.',
      service: 'Catálogo digital com pedidos pelo WhatsApp',
      benefit: 'ajudar clientes a conhecer produtos e pedir informações ou comprar pelo WhatsApp',
    },
  },
];

const FALLBACK_RULE: SegmentRule = {
  opportunity: 'Facilitar o contato e apresentar melhor o negócio para potenciais clientes da região.',
  service: 'Presença digital com contato pelo WhatsApp',
  benefit: 'facilitar o caminho entre descobrir a empresa e iniciar uma conversa pelo WhatsApp',
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getSegmentRule(segment: string): SegmentRule {
  const normalized = normalizeText(segment || '');
  return (
    RULES.find(({ match }) =>
      match.some((term) => normalized.includes(normalizeText(term)))
    )?.rule || FALLBACK_RULE
  );
}

/**
 * Shared message for every one-click WhatsApp action in the CRM.
 * Keep the first approach concise, specific and factual: we propose a website,
 * we don't pretend to know which bot/platform the lead currently uses.
 */
export const DEFAULT_PROSPECTING_OPTIONS: ProspectingMessageOptions = {
  includePortfolio: false,
  mentionNeighborhood: false,
  includePresentation: false,
  includeRecommendedService: false,
};

export function sanitizeWhatsAppNumber(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return /^55\d{2}9\d{8}$/.test(withCountry) ? withCountry : '';
}

/** Never build a WhatsApp URL with a landline/invalid number or empty copy. */
export function buildWhatsAppUrl(number: string, message: string): string {
  const phone = sanitizeWhatsAppNumber(number);
  const text = message.trim();
  return phone && text ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : '';
}

type WebsiteOffer = { features: string; result: string };

function websiteOffer(segmentRaw: string): WebsiteOffer {
  const segment = normalizeText(segmentRaw || '');
  if (/barbearia|barber/.test(segment)) {
    return {
      features: 'agendamentos online, serviços, fotos dos cortes e até uma loja para vender produtos',
      result: 'ver os cortes, escolher um horário e conhecer os produtos',
    };
  }
  if (/salao|beleza|estetica/.test(segment)) {
    return {
      features: 'agendamentos online, serviços, fotos dos trabalhos e até um catálogo de produtos',
      result: 'conhecer os serviços e escolher um horário',
    };
  }
  if (/restaurante|pizzaria|hamburg|lanchonete|cafeteria/.test(segment)) {
    return {
      features: 'cardápio digital, pedidos, reservas e todas as informações do local',
      result: 'consultar o cardápio e fazer pedidos ou reservas',
    };
  }
  if (/loja|varejo|comercio|roupa|acessorio|boutique/.test(segment)) {
    return {
      features: 'catálogo, vitrine de produtos e uma loja online para receber pedidos',
      result: 'conhecer os produtos e fazer pedidos',
    };
  }
  if (/clinica|odonto|dentist|consultorio|saude|psicolog/.test(segment)) {
    return {
      features: 'apresentação dos serviços, informações da equipe e solicitação de agendamentos',
      result: 'encontrar informações e solicitar um horário',
    };
  }
  return {
    features: 'serviços, informações, fotos dos trabalhos e recursos como agendamento ou catálogo, conforme a necessidade',
    result: 'conhecer o trabalho da empresa e encontrar o próximo passo',
  };
}

export function generateProspectingMessage(
  lead: Lead,
  settings: SystemConfig,
  options: ProspectingMessageOptions = DEFAULT_PROSPECTING_OPTIONS
) {
  const sender = (settings.senderName || 'Daniel Soliz').trim();
  const brand = (settings.brandName || 'DS Digital').trim();
  const company = (lead.company || 'sua empresa').trim();
  const location = options.mentionNeighborhood && (lead.neighborhood || lead.city)
    ? ` em ${lead.neighborhood || lead.city}`
    : '';
  const offer = websiteOffer(lead.segment);
  const parts = [
    `Oi, tudo bem? Sou ${sender}, da ${brand}! 👋`,
    `Conheci a ${company}${location} e queria te apresentar uma ideia.`,
    `Já pensou em ter um site exclusivo para seu negócio, com ${offer.features}?`,
    `O link pode ficar na bio do Instagram, para os clientes ${offer.result} sem depender só de mensagens ou robôs no WhatsApp.`,
  ];

  if (options.includeRecommendedService) {
    const service = (lead.recommendedService || lead.serviceInterest || '').trim();
    if (service) parts.push(`Também podemos adaptar o projeto para: ${service}.`);
  }
  if (options.includePortfolio && settings.portfolioUrl?.trim()) {
    parts.push(`Meu portfólio: ${settings.portfolioUrl.trim()}`);
  }
  if (options.includePresentation && settings.presentationUrl?.trim()) {
    parts.push(`Apresentação: ${settings.presentationUrl.trim()}`);
  }
  parts.push(`Posso te mostrar um exemplo de como ficaria para a ${company}?`);
  return parts.join('\n\n');
}
