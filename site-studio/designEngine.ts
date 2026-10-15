import {
  ArtDirectionFamily,
  ArtDirectionProposal,
  CompanyBriefing,
  DesignTokensV2,
  SiteBlockV2,
  SitePageV2,
  SiteSpecV2,
} from './types';

const families: ArtDirectionFamily[] = [
  'editorial-premium',
  'corporate-professional',
  'luxury-experience',
  'modern-minimal',
  'creative-studio',
  'technology-premium',
  'local-business-pro',
  'visual-showcase',
];

function hash(input: string) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

function segmentFamilies(segmentRaw: string): ArtDirectionFamily[] {
  const segment = segmentRaw.toLowerCase();
  if (/construtora|engenharia|imobili|arquitet/.test(segment)) {
    return ['corporate-professional', 'editorial-premium', 'visual-showcase'];
  }
  if (/odonto|cl[ií]nica|dermato|est[eé]tica|sa[uú]de/.test(segment)) {
    return ['modern-minimal', 'luxury-experience', 'editorial-premium'];
  }
  if (/barbearia|sal[aã]o|beleza|tattoo|moda/.test(segment)) {
    return ['visual-showcase', 'creative-studio', 'editorial-premium'];
  }
  if (/restaurante|gastronomia|caf[eé]|pizz|hamb/.test(segment)) {
    return ['visual-showcase', 'editorial-premium', 'local-business-pro'];
  }
  if (/tecnologia|software|saas|digital|ti\b/.test(segment)) {
    return ['technology-premium', 'creative-studio', 'modern-minimal'];
  }
  if (/advoc|contab|consult|finance|seguro/.test(segment)) {
    return ['corporate-professional', 'modern-minimal', 'editorial-premium'];
  }
  if (/pet|barbearia|academia|pilates|oficina|auto/.test(segment)) {
    return ['local-business-pro', 'visual-showcase', 'modern-minimal'];
  }
  return ['local-business-pro', 'modern-minimal', 'corporate-professional'];
}

function familyTokens(family: ArtDirectionFamily, seed: number): DesignTokensV2 {
  const warm = seed % 2 === 0;
  const tables: Record<ArtDirectionFamily, DesignTokensV2> = {
    'editorial-premium': {
      colors: {
        background: warm ? '#F2EEE7' : '#F4F2EF',
        surface: '#FAF8F4',
        surfaceAlt: '#E8E2D9',
        text: '#191816',
        muted: '#6F6A63',
        primary: warm ? '#6F3F2F' : '#2F403D',
        accent: warm ? '#C08B62' : '#8BA39E',
        border: 'rgba(25,24,22,.12)',
      },
      typography: {
        display: 'Georgia, "Times New Roman", serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'expressive',
      },
      radius: 'soft',
      density: 'airy',
      imageTreatment: 'editorial',
      motion: 'subtle',
    },
    'corporate-professional': {
      colors: {
        background: '#F5F7FA',
        surface: '#FFFFFF',
        surfaceAlt: '#E9EEF5',
        text: '#102033',
        muted: '#64748B',
        primary: seed % 3 === 0 ? '#164E63' : '#173B67',
        accent: seed % 3 === 0 ? '#0891B2' : '#2F6FB6',
        border: 'rgba(15,23,42,.10)',
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
    'luxury-experience': {
      colors: {
        background: warm ? '#0C0B0A' : '#0A0C0E',
        surface: warm ? '#17130F' : '#12171B',
        surfaceAlt: warm ? '#211A14' : '#172128',
        text: '#F7F2E8',
        muted: '#A69D90',
        primary: warm ? '#B5965E' : '#9BAEB6',
        accent: warm ? '#D9BC7A' : '#C3D0D4',
        border: 'rgba(255,255,255,.10)',
      },
      typography: {
        display: 'Georgia, "Times New Roman", serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'expressive',
      },
      radius: 'sharp',
      density: 'airy',
      imageTreatment: 'cinematic',
      motion: 'subtle',
    },
    'modern-minimal': {
      colors: {
        background: '#FAFAFA',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F3F5',
        text: '#111315',
        muted: '#71767C',
        primary: seed % 2 === 0 ? '#111827' : '#1E3A34',
        accent: seed % 2 === 0 ? '#4F46E5' : '#2D806B',
        border: 'rgba(17,19,21,.10)',
      },
      typography: {
        display: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'balanced',
      },
      radius: 'soft',
      density: 'airy',
      imageTreatment: 'natural',
      motion: 'subtle',
    },
    'creative-studio': {
      colors: {
        background: '#0E0E13',
        surface: '#181821',
        surfaceAlt: '#232331',
        text: '#F6F5FF',
        muted: '#9C9AAD',
        primary: seed % 2 === 0 ? '#7C3AED' : '#E11D48',
        accent: seed % 2 === 0 ? '#22D3EE' : '#F59E0B',
        border: 'rgba(255,255,255,.11)',
      },
      typography: {
        display: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'expressive',
      },
      radius: 'rounded',
      density: 'balanced',
      imageTreatment: 'high-contrast',
      motion: 'expressive',
    },
    'technology-premium': {
      colors: {
        background: '#070B12',
        surface: '#0F1623',
        surfaceAlt: '#151F30',
        text: '#F3F7FC',
        muted: '#8794A8',
        primary: '#4F6EF7',
        accent: '#21C7A8',
        border: 'rgba(148,163,184,.13)',
      },
      typography: {
        display: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'balanced',
      },
      radius: 'rounded',
      density: 'balanced',
      imageTreatment: 'high-contrast',
      motion: 'expressive',
    },
    'local-business-pro': {
      colors: {
        background: '#FCFBF8',
        surface: '#FFFFFF',
        surfaceAlt: '#F3F0E9',
        text: '#25231F',
        muted: '#777169',
        primary: seed % 2 === 0 ? '#1F5D50' : '#8B4E2F',
        accent: seed % 2 === 0 ? '#3E9D83' : '#D38B5D',
        border: 'rgba(37,35,31,.11)',
      },
      typography: {
        display: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        scale: 'balanced',
      },
      radius: 'rounded',
      density: 'balanced',
      imageTreatment: 'natural',
      motion: 'subtle',
    },
    'visual-showcase': {
      colors: {
        background: '#0C0C0D',
        surface: '#151516',
        surfaceAlt: '#202022',
        text: '#FAFAFA',
        muted: '#9A9A9D',
        primary: '#F5F5F5',
        accent: seed % 2 === 0 ? '#C7A06A' : '#8FB9B1',
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
  };
  return tables[family];
}

function proposalFor(
  family: ArtDirectionFamily,
  briefing: CompanyBriefing,
  index: number
): ArtDirectionProposal {
  const seed = hash(briefing.company + family);
  const assetCount = briefing.assets.filter((asset) => asset.verified).length;
  const photoFriendly = /barbearia|sal[aã]o|restaurante|construtora|arquitet|pet|moda|est[eé]tica/i.test(
    briefing.segment
  );
  const familyFit = segmentFamilies(briefing.segment).indexOf(family);
  const score =
    72 +
    Math.max(0, 12 - Math.max(0, familyFit) * 4) +
    Math.min(8, assetCount * 2) +
    (photoFriendly && ['visual-showcase', 'editorial-premium', 'luxury-experience'].includes(family)
      ? 6
      : 0);

  const heroVariants: ArtDirectionProposal['heroVariant'][] = [
    'cinematic',
    'editorial',
    'fullscreen',
    'asymmetric',
  ];
  const serviceVariants: ArtDirectionProposal['servicesVariant'][] = [
    'editorial-list',
    'grid',
    'alternating',
    'spotlight',
  ];
  const galleryVariants: ArtDirectionProposal['galleryVariant'][] = [
    'mosaic',
    'carousel',
    'filmstrip',
  ];

  return {
    id: `direction-${index + 1}-${family}`,
    family,
    name: family
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' '),
    rationale: `Direção selecionada para equilibrar ${briefing.segment}, quantidade de ativos visuais e objetivo comercial.`,
    score: Math.min(99, score),
    tokens: familyTokens(family, seed),
    heroVariant: heroVariants[(seed + index) % heroVariants.length],
    servicesVariant: serviceVariants[(seed + index * 2) % serviceVariants.length],
    galleryVariant: galleryVariants[(seed + index) % galleryVariants.length],
    navStyle: family === 'creative-studio' || family === 'technology-premium' ? 'floating' : family === 'corporate-professional' ? 'solid' : 'minimal',
  };
}

export function createArtDirections(briefing: CompanyBriefing): ArtDirectionProposal[] {
  const preferred = segmentFamilies(briefing.segment);
  const seed = hash(briefing.company + briefing.segment);
  const extra = families[(seed + 3) % families.length];
  const chosen = [...preferred, extra].filter(
    (family, index, list) => list.indexOf(family) === index
  );
  return chosen.slice(0, 3).map((family, index) => proposalFor(family, briefing, index));
}

function makeBlock(
  id: string,
  type: SiteBlockV2['type'],
  variant: string,
  partial: Partial<SiteBlockV2> = {}
): SiteBlockV2 {
  return { id, type, variant, ...partial };
}

function page(id: string, label: string, blocks: SiteBlockV2[], description = ''): SitePageV2 {
  return { id, slug: id === 'home' ? '/' : `/${id}`, label, title: label, description, blocks };
}

function cta(briefing: CompanyBriefing, label = 'Falar pelo WhatsApp') {
  if (!briefing.contact.whatsapp) return undefined;
  return {
    label,
    kind: 'whatsapp' as const,
    value: briefing.contact.whatsapp,
    message: `Olá! Conheci a ${briefing.company} e gostaria de mais informações.`,
  };
}

export function buildSiteSpecV2(
  briefing: CompanyBriefing,
  direction: ArtDirectionProposal
): SiteSpecV2 {
  const assets = briefing.assets.filter((asset) => asset.url);
  const heroMedia = assets.slice(0, direction.family === 'visual-showcase' ? 3 : 1);
  const servicesItems = briefing.services.map((service) => ({
    title: service.name,
    description: service.description,
  }));

  const homeBlocks: SiteBlockV2[] = [
    makeBlock('home-hero', 'hero', direction.heroVariant, {
      eyebrow: briefing.location || briefing.segment,
      title:
        direction.family === 'corporate-professional'
          ? `${briefing.company}: confiança, clareza e presença profissional.`
          : direction.family === 'visual-showcase'
            ? `${briefing.company} em destaque.`
            : `${briefing.company}: uma experiência digital feita para o seu negócio.`,
      body: briefing.positioning || briefing.summary,
      media: heroMedia,
      primaryAction: cta(briefing, briefing.segment.match(/cl[ií]nica|odonto|est[eé]tica/i) ? 'Agendar avaliação' : 'Falar agora'),
      secondaryAction: { label: 'Conhecer serviços', kind: 'page', value: 'services' },
      options: {
        navStyle: direction.navStyle,
        imageTreatment: direction.tokens.imageTreatment,
      },
    }),
    makeBlock('home-intro', 'intro', direction.family === 'editorial-premium' ? 'editorial' : 'split', {
      eyebrow: 'Sobre',
      title: `Conheça a ${briefing.company}`,
      body: briefing.summary,
      items: briefing.differentiators.map((text) => ({ text })),
      media: assets.slice(1, 2),
    }),
  ];

  if (direction.family === 'corporate-professional' && briefing.verifiedFacts.length >= 2) {
    homeBlocks.push(
      makeBlock('home-stats', 'stats', 'inline', {
        items: briefing.verifiedFacts.slice(0, 4).map((fact, index) => ({
          value: String(index + 1).padStart(2, '0'),
          label: fact,
        })),
      })
    );
  }

  homeBlocks.push(
    makeBlock('home-cta', 'cta', direction.family === 'luxury-experience' ? 'minimal' : 'banner', {
      title: briefing.recommendedService || 'Vamos conversar?',
      body: briefing.opportunity,
      primaryAction: cta(briefing),
    })
  );

  const pages: SitePageV2[] = [page('home', 'Início', homeBlocks)];

  const servicesBlocks: SiteBlockV2[] = [
    makeBlock('services-main', 'services', direction.servicesVariant, {
      eyebrow: 'Serviços',
      title:
        direction.servicesVariant === 'editorial-list'
          ? 'Especialidades apresentadas com clareza.'
          : 'Como podemos ajudar',
      body: briefing.recommendedService,
      items: servicesItems,
      media: assets.slice(0, Math.min(servicesItems.length, 4)),
      primaryAction: cta(briefing),
    }),
  ];

  if (direction.servicesVariant === 'alternating' && assets.length > 1) {
    servicesBlocks.push(
      makeBlock('services-gallery', 'gallery', 'filmstrip', {
        title: 'Experiência e estrutura',
        media: assets.slice(0, 5),
      })
    );
  }
  pages.push(page('services', /cl[ií]nica|odonto|est[eé]tica/i.test(briefing.segment) ? 'Tratamentos' : 'Serviços', servicesBlocks));

  if (briefing.assets.length >= 3) {
    pages.push(
      page('gallery', 'Galeria', [
        makeBlock('gallery-main', 'gallery', direction.galleryVariant, {
          title: direction.family === 'visual-showcase' ? 'Trabalhos em evidência' : 'Conheça de perto',
          media: assets.slice(0, 9),
        }),
      ])
    );
  }

  if (briefing.reviews.length) {
    pages.push(
      page('reviews', 'Avaliações', [
        makeBlock('reviews-main', 'reviews', briefing.reviews.length > 3 ? 'grid' : 'feature', {
          eyebrow: 'Avaliações verificadas',
          title: 'O que clientes dizem',
          items: briefing.reviews.map((review) => ({ ...review })),
        }),
      ])
    );
  }

  pages.push(
    page('contact', 'Contato', [
      makeBlock('contact-main', 'contact', direction.family === 'local-business-pro' ? 'map-split' : 'split', {
        eyebrow: 'Contato',
        title: /oficina|auto/i.test(briefing.segment)
          ? 'Solicite um orçamento'
          : /cl[ií]nica|odonto|est[eé]tica/i.test(briefing.segment)
            ? 'Agende sua avaliação'
            : 'Fale com a equipe',
        body: briefing.location,
        primaryAction: cta(briefing),
      }),
    ])
  );

  return {
    version: 2,
    brand: {
      name: briefing.company,
      tagline: briefing.positioning,
      logo: briefing.logo,
      segment: briefing.segment,
      location: briefing.location,
    },
    direction: {
      id: direction.id,
      family: direction.family,
      name: direction.name,
      rationale: direction.rationale,
      score: direction.score,
    },
    tokens: direction.tokens,
    navigation: pages.map((item) => ({ pageId: item.id, label: item.label })),
    pages,
    seo: {
      title: `${briefing.company} | ${briefing.segment}`,
      description: briefing.summary.slice(0, 155),
    },
    contact: briefing.contact,
    assets,
    disclosure: 'Demonstração comercial criada pela TRUINEXA • informações públicas verificadas quando disponíveis.',
  };
}

export function applyRuleBasedRefinement(spec: SiteSpecV2, instructionRaw: string): SiteSpecV2 {
  const instruction = instructionRaw.toLowerCase();
  const next = structuredClone(spec);

  if (/minimalista|minimal|mais limpo/.test(instruction)) {
    next.tokens.density = 'airy';
    next.tokens.radius = 'soft';
    next.tokens.motion = 'subtle';
    next.direction.family = 'modern-minimal';
    next.direction.name = 'Modern Minimal';
  }
  if (/sofistic|luxo|luxury|premium/.test(instruction)) {
    next.direction.family = 'luxury-experience';
    next.direction.name = 'Luxury Experience';
    next.tokens = familyTokens('luxury-experience', hash(next.brand.name));
  }
  if (/empresarial|corporativ/.test(instruction)) {
    next.direction.family = 'corporate-professional';
    next.direction.name = 'Corporate Professional';
    next.tokens = familyTokens('corporate-professional', hash(next.brand.name));
  }
  if (/foto|fotografia|imagem/.test(instruction) && /maior|grande|destaque/.test(instruction)) {
    for (const page of next.pages) {
      for (const block of page.blocks) {
        if (block.type === 'hero') block.variant = 'cinematic';
        if (block.type === 'gallery') block.variant = 'mosaic';
      }
    }
  }
  if (/hero/.test(instruction) && /mude|troque|altere/.test(instruction)) {
    const choices = ['cinematic', 'editorial', 'fullscreen', 'asymmetric'];
    const hero = next.pages.flatMap((page) => page.blocks).find((block) => block.type === 'hero');
    if (hero) {
      const current = choices.indexOf(hero.variant);
      hero.variant = choices[(current + 1 + choices.length) % choices.length];
    }
  }
  if (/galeria/.test(instruction) && /adic|crie|coloque/.test(instruction)) {
    if (!next.pages.some((page) => page.id === 'gallery')) {
      next.pages.splice(Math.max(1, next.pages.length - 1), 0, {
        id: 'gallery',
        slug: '/gallery',
        label: 'Galeria',
        title: 'Galeria',
        blocks: [
          makeBlock('gallery-added', 'gallery', 'mosaic', {
            title: 'Galeria',
            media: next.assets.slice(0, 9),
          }),
        ],
      });
      next.navigation = next.pages.map((page) => ({ pageId: page.id, label: page.label }));
    }
  }
  if (/projeto/.test(instruction) && /p[aá]gina|adic|crie/.test(instruction)) {
    if (!next.pages.some((page) => page.id === 'projects')) {
      next.pages.splice(Math.max(1, next.pages.length - 1), 0, {
        id: 'projects',
        slug: '/projects',
        label: 'Projetos',
        title: 'Projetos',
        blocks: [
          makeBlock('projects-added', 'projects', 'showcase', {
            title: 'Projetos em destaque',
            media: next.assets.slice(0, 8),
          }),
        ],
      });
      next.navigation = next.pages.map((page) => ({ pageId: page.id, label: page.label }));
    }
  }

  return next;
}
