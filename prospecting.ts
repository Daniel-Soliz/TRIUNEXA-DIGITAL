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

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function choose<T>(items: T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length];
}

export function sanitizeWhatsAppNumber(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return /^55\d{2}9\d{8}$/.test(withCountry) ? withCountry : '';
}

export function generateProspectingMessage(
  lead: Lead,
  settings: SystemConfig,
  options: ProspectingMessageOptions
) {
  const rule = getSegmentRule(lead.segment);
  const seed = hashSeed(`${lead.id}:${lead.company}:${lead.segment}`);
  const sender = settings.senderName || 'Daniel Soliz';
  const brand = settings.brandName || 'DS Digital';
  const location = options.mentionNeighborhood
    ? lead.neighborhood || lead.city
    : lead.city;
  const recommendedService =
    lead.recommendedService || lead.serviceInterest || rule.service;
  const opportunity = lead.opportunitySummary || rule.opportunity;
  const benefit = lead.recommendedBenefit || rule.benefit;

  const isBarbershop =
    normalizeText(lead.segment).includes('barbear') ||
    normalizeText(lead.segment).includes('barber');

  if (isBarbershop) {
    const openings = [
      `Olá, tudo bem? Sou ${sender}, da ${brand}. Encontrei a ${lead.company}${location ? ` em ${location}` : ''}.`,
      `Oi, tudo bem? Aqui é ${sender}, da ${brand}. Conheci a ${lead.company}${location ? ` pesquisando barbearias em ${location}` : ''}.`,
      `Olá! Sou ${sender}, da ${brand}. Vi a ${lead.company}${location ? ` aqui na região de ${location}` : ''} e tive uma ideia para vocês.`,
    ];

    const pitches = [
      'Eu desenvolvo um site próprio para barbearia com agendamento, portfólio dos cortes, serviços, WhatsApp e até loja de produtos. Se vocês usam bot pago principalmente para agenda, em muitos casos dá para reduzir essa mensalidade levando esse fluxo para o próprio site.',
      'Faço uma estrutura própria para barbearia com agenda, serviços, portfólio, WhatsApp e venda de produtos. Para quem paga bot mensal só para organizar horários, o site pode assumir boa parte desse processo.',
      'Trabalho com site completo para barbearia: agendamento, serviços, portfólio, WhatsApp, produtos e painel de administração. Isso pode diminuir a dependência de ferramentas mensais usadas só para agenda e atendimento inicial.',
    ];

    const ctas = [
      `Posso te mostrar um exemplo de como isso ficaria para a ${lead.company}?`,
      `Quer que eu te mostre uma ideia rápida aplicada à ${lead.company}?`,
      'Posso te mandar um exemplo para você ver em menos de 2 minutos?',
    ];

    const parts = [
      choose(openings, seed),
      '',
      choose(pitches, seed, 1),
    ];

    if (options.includeRecommendedService && recommendedService) {
      parts.push('', `A ideia seria: ${recommendedService}.`);
    }

    if (options.includePortfolio && settings.portfolioUrl) {
      parts.push('', `Portfólio: ${settings.portfolioUrl}`);
    }

    if (options.includePresentation && settings.presentationUrl) {
      parts.push('', `Apresentação: ${settings.presentationUrl}`);
    }

    parts.push('', choose(ctas, seed, 2));
    return parts.join('\n').trim();
  }

  const openings = [
    `Olá, tudo bem? Sou ${sender}, da ${brand}. Encontrei a ${lead.company}${location ? ` em ${location}` : ''}.`,
    `Oi, tudo bem? Aqui é ${sender}, da ${brand}. Conheci a ${lead.company}${location ? ` pesquisando empresas em ${location}` : ''}.`,
    `Olá! Sou ${sender}, da ${brand}. Vi a ${lead.company}${location ? ` na região de ${location}` : ''} e identifiquei uma oportunidade.`,
  ];

  const pitches = [
    `Vi uma oportunidade para ${opportunity.charAt(0).toLowerCase() + opportunity.slice(1)} Eu consigo montar ${recommendedService} para ${benefit}.`,
    `Acho que dá para melhorar um ponto simples: ${opportunity.charAt(0).toLowerCase() + opportunity.slice(1)} Minha sugestão seria ${recommendedService}.`,
    `Pelo perfil do negócio, pensei em ${recommendedService} para ${benefit}.`,
  ];

  const ctas = [
    `Posso te mostrar uma ideia rápida para a ${lead.company}?`,
    'Posso te mandar um exemplo para você avaliar?',
    'Quer que eu te mostre como isso poderia funcionar no seu negócio?',
  ];

  const parts = [
    choose(openings, seed),
    '',
    choose(pitches, seed, 1),
  ];

  if (options.includePortfolio && settings.portfolioUrl) {
    parts.push('', `Portfólio: ${settings.portfolioUrl}`);
  }

  if (options.includePresentation && settings.presentationUrl) {
    parts.push('', `Apresentação: ${settings.presentationUrl}`);
  }

  parts.push('', choose(ctas, seed, 2));
  return parts.join('\n').trim();
}
