import { SiteSpecV2 } from './types';

const illustrative = (url: string, alt: string) => ({
  url,
  alt,
  source: 'licensed' as const,
  attribution: 'Unsplash • imagem ilustrativa',
  verified: false,
  illustrative: true,
});

export const referenceDemos: Record<string, SiteSpecV2> = {
  'barbearia-premium': {
    version: 2,
    brand: {
      name: 'North Crown Barbearia — DEMO FICTÍCIA',
      tagline: 'Estilo, precisão e presença.',
      segment: 'Barbearia premium',
      location: 'São Paulo, SP',
    },
    direction: {
      id: 'ref-barber-visual',
      family: 'visual-showcase',
      name: 'Visual Showcase',
      rationale: 'Fotografia ampla, navegação curta e foco em portfólio/agendamento.',
      score: 94,
    },
    tokens: {
      colors: {
        background: '#0B0B0C',
        surface: '#151516',
        surfaceAlt: '#222223',
        text: '#FAFAFA',
        muted: '#A3A3A3',
        primary: '#F1EEE8',
        accent: '#C29B63',
        border: 'rgba(255,255,255,.10)',
      },
      typography: {
        display: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'expressive',
      },
      radius: 'soft',
      density: 'airy',
      imageTreatment: 'cinematic',
      motion: 'subtle',
    },
    navigation: [
      { pageId: 'home', label: 'Início' },
      { pageId: 'services', label: 'Serviços' },
      { pageId: 'gallery', label: 'Galeria' },
      { pageId: 'contact', label: 'Agendar' },
    ],
    pages: [
      {
        id: 'home',
        slug: '/',
        label: 'Início',
        title: 'Início',
        blocks: [
          {
            id: 'barber-hero',
            type: 'hero',
            variant: 'fullscreen',
            eyebrow: 'Barbearia contemporânea',
            title: 'Um corte que começa antes de você sentar na cadeira.',
            body: 'Uma presença visual forte para valorizar técnica, atmosfera e experiência.',
            media: [
              illustrative(
                'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1800&q=85',
                'Barbearia — imagem ilustrativa'
              ),
            ],
            primaryAction: {
              label: 'Agendar horário',
              kind: 'whatsapp',
              value: '5511999999999',
              message: 'Olá! Esta é uma demonstração fictícia da TRUINEXA.',
            },
            secondaryAction: { label: 'Ver serviços', kind: 'page', value: 'services' },
            options: { navStyle: 'minimal' },
          },
          {
            id: 'barber-intro',
            type: 'intro',
            variant: 'editorial',
            eyebrow: 'Experiência',
            title: 'Detalhes importam. Do ambiente ao acabamento.',
            body: 'Uma estrutura visual pensada para destacar personalidade, trabalhos e facilidade de agendamento.',
            items: [
              { text: 'Atendimento com hora marcada' },
              { text: 'Portfólio visual em destaque' },
              { text: 'Contato direto no celular' },
            ],
          },
        ],
      },
      {
        id: 'services',
        slug: '/servicos',
        label: 'Serviços',
        title: 'Serviços',
        blocks: [
          {
            id: 'barber-services',
            type: 'services',
            variant: 'alternating',
            title: 'Serviços',
            items: [
              { title: 'Corte Signature', description: 'Consultoria de estilo e acabamento preciso.' },
              { title: 'Barba completa', description: 'Preparação, desenho, acabamento e cuidado.' },
              { title: 'Combo Crown', description: 'Corte e barba em uma experiência completa.' },
            ],
            media: [
              illustrative('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=82', 'Corte — ilustrativo'),
              illustrative('https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=82', 'Barbeiro — ilustrativo'),
            ],
          },
        ],
      },
      {
        id: 'gallery',
        slug: '/galeria',
        label: 'Galeria',
        title: 'Galeria',
        blocks: [
          {
            id: 'barber-gallery',
            type: 'gallery',
            variant: 'filmstrip',
            title: 'Estilo em movimento',
            media: [
              illustrative('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=82', 'Barbearia — ilustrativo'),
              illustrative('https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1400&q=82', 'Profissional — ilustrativo'),
              illustrative('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=82', 'Corte masculino — ilustrativo'),
            ],
          },
        ],
      },
      {
        id: 'contact',
        slug: '/agendar',
        label: 'Agendar',
        title: 'Agendar',
        blocks: [
          {
            id: 'barber-contact',
            type: 'contact',
            variant: 'split',
            eyebrow: 'Agenda',
            title: 'Escolha seu horário.',
            body: 'Demonstração fictícia: o WhatsApp abaixo é ilustrativo.',
            primaryAction: {
              label: 'Agendar no WhatsApp',
              kind: 'whatsapp',
              value: '5511999999999',
              message: 'Olá! Esta é uma demonstração fictícia da TRUINEXA.',
            },
          },
        ],
      },
    ],
    seo: {
      title: 'North Crown Barbearia — Demo TRUINEXA',
      description: 'Demonstração fictícia de uma barbearia premium criada para validar o Design Engine.',
    },
    contact: {
      whatsapp: '5511999999999',
      phone: '(11) 99999-9999',
      address: 'Endereço fictício • São Paulo, SP',
    },
    assets: [],
    disclosure: 'DEMONSTRAÇÃO FICTÍCIA TRUINEXA • imagens ilustrativas licenciadas via Unsplash.',
  },

  construtora: {
    version: 2,
    brand: {
      name: 'Axis Engenharia — DEMO FICTÍCIA',
      tagline: 'Engenharia que transforma planejamento em entrega.',
      segment: 'Construtora e engenharia',
      location: 'São Paulo, SP',
    },
    direction: {
      id: 'ref-build-corporate',
      family: 'corporate-professional',
      name: 'Corporate Professional',
      rationale: 'Estrutura institucional, projetos em destaque e hierarquia orientada à credibilidade.',
      score: 96,
    },
    tokens: {
      colors: {
        background: '#F4F7FA',
        surface: '#FFFFFF',
        surfaceAlt: '#E8EEF4',
        text: '#102131',
        muted: '#607080',
        primary: '#123F68',
        accent: '#D38A42',
        border: 'rgba(16,33,49,.11)',
      },
      typography: {
        display: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'balanced',
      },
      radius: 'soft',
      density: 'balanced',
      imageTreatment: 'natural',
      motion: 'subtle',
    },
    navigation: [
      { pageId: 'home', label: 'Empresa' },
      { pageId: 'services', label: 'Soluções' },
      { pageId: 'projects', label: 'Projetos' },
      { pageId: 'contact', label: 'Contato' },
    ],
    pages: [
      {
        id: 'home',
        slug: '/',
        label: 'Empresa',
        title: 'Empresa',
        blocks: [
          {
            id: 'build-hero',
            type: 'hero',
            variant: 'editorial',
            eyebrow: 'Engenharia e construção',
            title: 'Estrutura para construir com clareza.',
            body: 'Uma demonstração institucional fictícia focada em confiança, processo e apresentação de projetos.',
            media: [
              illustrative(
                'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=85',
                'Arquitetura — imagem ilustrativa'
              ),
            ],
            primaryAction: { label: 'Solicitar contato', kind: 'page', value: 'contact' },
            secondaryAction: { label: 'Ver projetos', kind: 'page', value: 'projects' },
            options: { navStyle: 'solid' },
          },
          {
            id: 'build-stats',
            type: 'stats',
            variant: 'inline',
            items: [
              { value: '01', label: 'Planejamento' },
              { value: '02', label: 'Execução' },
              { value: '03', label: 'Controle' },
              { value: '04', label: 'Entrega' },
            ],
          },
          {
            id: 'build-intro',
            type: 'intro',
            variant: 'split',
            eyebrow: 'Método',
            title: 'Informação organizada para decisões importantes.',
            body: 'Nesta referência, a composição prioriza credibilidade, clareza e prova visual dos projetos.',
            items: [
              { text: 'Escopo apresentado com clareza' },
              { text: 'Projetos em página dedicada' },
              { text: 'Contato comercial objetivo' },
            ],
          },
        ],
      },
      {
        id: 'services',
        slug: '/solucoes',
        label: 'Soluções',
        title: 'Soluções',
        blocks: [
          {
            id: 'build-services',
            type: 'services',
            variant: 'editorial-list',
            eyebrow: 'Soluções',
            title: 'Capacidade apresentada sem excesso de ruído.',
            items: [
              { title: 'Gestão de obras', description: 'Organização de etapas, responsabilidades e acompanhamento.' },
              { title: 'Execução', description: 'Apresentação profissional das frentes de execução.' },
              { title: 'Projetos especiais', description: 'Espaço para destacar escopos e competências específicas.' },
            ],
          },
        ],
      },
      {
        id: 'projects',
        slug: '/projetos',
        label: 'Projetos',
        title: 'Projetos',
        blocks: [
          {
            id: 'build-projects',
            type: 'projects',
            variant: 'showcase',
            title: 'Projetos em perspectiva',
            media: [
              illustrative('https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=82', 'Projeto arquitetônico — ilustrativo'),
              illustrative('https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=82', 'Ambiente corporativo — ilustrativo'),
            ],
            items: [
              { title: 'Residencial contemporâneo' },
              { title: 'Ambiente corporativo' },
            ],
          },
        ],
      },
      {
        id: 'contact',
        slug: '/contato',
        label: 'Contato',
        title: 'Contato',
        blocks: [
          {
            id: 'build-contact',
            type: 'contact',
            variant: 'map-split',
            eyebrow: 'Novos projetos',
            title: 'Converse com nossa equipe.',
            body: 'Contatos fictícios usados somente nesta demonstração.',
          },
        ],
      },
    ],
    seo: {
      title: 'Axis Engenharia — Demo TRUINEXA',
      description: 'Demonstração fictícia corporativa para validar composição de construtora.',
    },
    contact: {
      phone: '(11) 3333-0000',
      email: 'contato@axis-demo.exemplo',
      address: 'Endereço fictício • São Paulo, SP',
    },
    assets: [],
    disclosure: 'DEMONSTRAÇÃO FICTÍCIA TRUINEXA • projetos e imagens são ilustrativos.',
  },

  'clinica-odontologica': {
    version: 2,
    brand: {
      name: 'Clínica Oris — DEMO FICTÍCIA',
      tagline: 'Cuidado, clareza e confiança em cada etapa.',
      segment: 'Clínica odontológica',
      location: 'São Paulo, SP',
    },
    direction: {
      id: 'ref-dental-minimal',
      family: 'modern-minimal',
      name: 'Modern Minimal',
      rationale: 'Composição clara, acolhedora e focada em confiança e agendamento.',
      score: 95,
    },
    tokens: {
      colors: {
        background: '#FAFCFC',
        surface: '#FFFFFF',
        surfaceAlt: '#EDF5F4',
        text: '#152322',
        muted: '#687B79',
        primary: '#276C65',
        accent: '#79B5AC',
        border: 'rgba(21,35,34,.10)',
      },
      typography: {
        display: 'Georgia, Times New Roman, serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'balanced',
      },
      radius: 'rounded',
      density: 'airy',
      imageTreatment: 'soft',
      motion: 'subtle',
    },
    navigation: [
      { pageId: 'home', label: 'Início' },
      { pageId: 'services', label: 'Tratamentos' },
      { pageId: 'faq', label: 'Dúvidas' },
      { pageId: 'contact', label: 'Agendar' },
    ],
    pages: [
      {
        id: 'home',
        slug: '/',
        label: 'Início',
        title: 'Início',
        blocks: [
          {
            id: 'dental-hero',
            type: 'hero',
            variant: 'asymmetric',
            eyebrow: 'Odontologia com acolhimento',
            title: 'Cuidar do sorriso também é cuidar da experiência.',
            body: 'Uma demonstração fictícia com linguagem tranquila, hierarquia clara e foco em agendamento de avaliação.',
            media: [
              illustrative(
                'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1600&q=85',
                'Atendimento odontológico — imagem ilustrativa'
              ),
            ],
            primaryAction: {
              label: 'Agendar avaliação',
              kind: 'whatsapp',
              value: '5511999999998',
              message: 'Olá! Esta é uma demonstração fictícia da TRUINEXA.',
            },
            secondaryAction: { label: 'Ver tratamentos', kind: 'page', value: 'services' },
            options: { navStyle: 'minimal' },
          },
          {
            id: 'dental-intro',
            type: 'intro',
            variant: 'split',
            eyebrow: 'Atendimento',
            title: 'Informação sem ansiedade.',
            body: 'O projeto organiza tratamentos, diferenciais e canais de contato em uma experiência leve.',
            items: [
              { text: 'Linguagem clara e acolhedora' },
              { text: 'Agendamento em poucos passos' },
              { text: 'Informações organizadas por tratamento' },
            ],
          },
          {
            id: 'dental-cta',
            type: 'cta',
            variant: 'minimal',
            title: 'Comece por uma avaliação.',
            body: 'Demonstração fictícia — nenhum atendimento real é oferecido por este link.',
            primaryAction: {
              label: 'Agendar avaliação',
              kind: 'whatsapp',
              value: '5511999999998',
            },
          },
        ],
      },
      {
        id: 'services',
        slug: '/tratamentos',
        label: 'Tratamentos',
        title: 'Tratamentos',
        blocks: [
          {
            id: 'dental-services',
            type: 'services',
            variant: 'spotlight',
            eyebrow: 'Tratamentos',
            title: 'Cuidado organizado por necessidade.',
            items: [
              { title: 'Avaliação odontológica', description: 'Primeiro contato para entender necessidades e próximos passos.' },
              { title: 'Prevenção', description: 'Espaço para apresentar acompanhamento e cuidado preventivo.' },
              { title: 'Estética do sorriso', description: 'Apresentação informativa de soluções estéticas disponíveis.' },
            ],
          },
        ],
      },
      {
        id: 'faq',
        slug: '/duvidas',
        label: 'Dúvidas',
        title: 'Dúvidas',
        blocks: [
          {
            id: 'dental-faq',
            type: 'faq',
            variant: 'accordion',
            title: 'Perguntas frequentes',
            items: [
              { question: 'Como funciona a primeira avaliação?', answer: 'Conteúdo ilustrativo: a clínica real definiria este processo.' },
              { question: 'Quais formas de contato estão disponíveis?', answer: 'A demonstração pode direcionar para telefone, WhatsApp ou formulário quando configurados.' },
              { question: 'O site pode apresentar a equipe?', answer: 'Sim. O componente de equipe é opcional e só deve usar informações verificadas.' },
            ],
          },
        ],
      },
      {
        id: 'contact',
        slug: '/agendar',
        label: 'Agendar',
        title: 'Agendar',
        blocks: [
          {
            id: 'dental-contact',
            type: 'contact',
            variant: 'split',
            eyebrow: 'Avaliação',
            title: 'Converse com a clínica.',
            body: 'Contatos abaixo são fictícios e servem apenas para validar o fluxo.',
            primaryAction: {
              label: 'Abrir WhatsApp',
              kind: 'whatsapp',
              value: '5511999999998',
              message: 'Olá! Esta é uma demonstração fictícia da TRUINEXA.',
            },
          },
        ],
      },
    ],
    seo: {
      title: 'Clínica Oris — Demo TRUINEXA',
      description: 'Demonstração fictícia odontológica para validar o Design Engine.',
    },
    contact: {
      whatsapp: '5511999999998',
      phone: '(11) 99999-9998',
      email: 'contato@oris-demo.exemplo',
      address: 'Endereço fictício • São Paulo, SP',
    },
    assets: [],
    disclosure: 'DEMONSTRAÇÃO FICTÍCIA TRUINEXA • conteúdo e contatos não representam uma clínica real.',
  },
};

export function getReferenceDemo(key: string | null) {
  if (!key) return null;
  return referenceDemos[key] || null;
}
