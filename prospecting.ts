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
  // An 11-digit local number can start with DDD 55: do not confuse it
  // with the international country prefix 55.
  const withCountry = digits.length === 11
    ? `55${digits}`
    : digits.length === 13 && digits.startsWith('55') ? digits : '';
  return /^55\d{2}9\d{8}$/.test(withCountry) ? withCountry : '';
}

/** Never build a WhatsApp URL with a landline/invalid number or empty copy. */
export function buildWhatsAppUrl(number: string, message: string): string {
  const phone = sanitizeWhatsAppNumber(number);
  const text = message.trim();
  return phone && text ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : '';
}

type WebsiteOffer = {
  idea: string;
  socialLink: string;
  hasRelevantExample: boolean;
};

function websiteOffer(segmentRaw: string): WebsiteOffer {
  const segment = normalizeText(segmentRaw || '');

  if (/barbearia|barber/.test(segment)) {
    return {
      idea: 'um site próprio para a barbearia, com os cortes, agendamento online e até espaço para vender produtos',
      socialLink: 'O link pode ficar na bio do Instagram, e o WhatsApp continua para quem quiser conversar.',
      hasRelevantExample: true,
    };
  }
  if (/salao|beleza/.test(segment)) {
    return {
      idea: 'um site do próprio salão, onde o cliente vê os serviços, fotos dos trabalhos e escolhe um horário para agendar',
      socialLink: 'O link pode ficar direto na bio do Instagram.',
      hasRelevantExample: true,
    };
  }
  if (/estetica/.test(segment)) {
    return {
      idea: 'um site com os procedimentos, fotos dos trabalhos e agendamento online',
      socialLink: 'Assim, quem chega pelo Instagram consegue ver tudo e solicitar um horário.',
      hasRelevantExample: true,
    };
  }
  if (/restaurante|pizzaria|hamburg|lanchonete|cafeteria/.test(segment)) {
    return {
      idea: 'um site com cardápio e pedidos, para o cliente escolher sem precisar perguntar item por item no WhatsApp',
      socialLink: 'Dá para divulgar o link na bio do Instagram.',
      hasRelevantExample: false,
    };
  }
  if (/loja|varejo|comercio|roupa|acessorio|boutique/.test(segment)) {
    return {
      idea: 'uma loja online própria, com fotos dos produtos e um jeito prático de receber pedidos',
      socialLink: 'A pessoa já encontra tudo pelo link na bio do Instagram.',
      hasRelevantExample: false,
    };
  }
  if (/clinica|odonto|dentist|consultorio|saude|psicolog/.test(segment)) {
    return {
      idea: 'um site com informações dos atendimentos, da equipe e opção de solicitar horários',
      socialLink: 'O link pode ficar na bio do Instagram, sem deixar de usar o WhatsApp.',
      hasRelevantExample: false,
    };
  }
  return {
    idea: 'um site próprio, com os serviços da empresa e um jeito mais fácil de pedir informação ou orçamento',
    socialLink: 'Vocês podem divulgar pelo link na bio do Instagram e continuar atendendo pelo WhatsApp.',
    hasRelevantExample: false,
  };
}

/**
 * Search data sometimes joins a short brand with its business category and
 * neighborhood. Use the short brand in casual WhatsApp copy; keep the full
 * registered company name unchanged everywhere else in CRM.
 */
function firstContactBrandName(companyRaw: string, segment: string): string {
  const full = (companyRaw || 'empresa de vocês').trim();
  if (!/barbearia|barber|salao|beleza/.test(normalizeText(segment || ''))) {
    return full;
  }
  const short = full.replace(/\s+(?:salão de beleza|salao de beleza|barbearia|barber shop)\b.*$/i, '').trim();
  return short.length >= 3 ? short : full;
}

export function generateProspectingMessage(
  lead: Lead,
  settings: SystemConfig,
  options: ProspectingMessageOptions = DEFAULT_PROSPECTING_OPTIONS
) {
  const firstName = (settings.senderName || 'Daniel').trim().split(/\s+/)[0];
  const brand = (settings.brandName || 'DS Digital').trim();
  const company = firstContactBrandName(lead.company, lead.segment);
  const location = options.mentionNeighborhood && (lead.neighborhood || lead.city)
    ? ` em ${lead.neighborhood || lead.city}`
    : '';
  const offer = websiteOffer(lead.segment);

  // First contact is a conversation, not a flyer: one idea, one benefit,
  // and one simple question. No emoji, long feature list, price or assumptions
  // about the software/robots the business currently uses.
  const parts = [
    `Oi, tudo bem? Aqui é o ${firstName}, da ${brand}.`,
    `Vi a ${company}${location} e pensei numa ideia que pode ser interessante para vocês: ${offer.idea}. ${offer.socialLink}`,
  ];

  if (options.includeRecommendedService) {
    const service = (lead.recommendedService || lead.serviceInterest || '').trim();
    if (service) parts.push(`Dá para adaptar o projeto para ${service}.`);
  }
  if (options.includePortfolio && settings.portfolioUrl?.trim()) {
    parts.push(`Meu portfólio: ${settings.portfolioUrl.trim()}`);
  }
  if (options.includePresentation && settings.presentationUrl?.trim()) {
    parts.push(`Uma apresentação rápida: ${settings.presentationUrl.trim()}`);
  }

  parts.push(offer.hasRelevantExample
    ? 'Já fiz algo parecido para uma barbearia. Posso te mandar o exemplo pra você dar uma olhada?'
    : 'Posso te mostrar uma ideia de como isso ficaria pra vocês?');

  return parts.join('\n\n');
}
