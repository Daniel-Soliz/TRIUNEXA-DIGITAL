export type ArtDirectionFamily =
  | 'editorial-premium'
  | 'corporate-professional'
  | 'luxury-experience'
  | 'modern-minimal'
  | 'creative-studio'
  | 'technology-premium'
  | 'local-business-pro'
  | 'visual-showcase';

export type SiteBlockType =
  | 'hero'
  | 'intro'
  | 'services'
  | 'gallery'
  | 'reviews'
  | 'stats'
  | 'projects'
  | 'team'
  | 'faq'
  | 'cta'
  | 'contact';

export type AssetRef = {
  url: string;
  alt: string;
  source: 'official-site' | 'google-places' | 'instagram' | 'licensed' | 'crm';
  attribution?: string;
  verified: boolean;
  illustrative?: boolean;
  width?: number;
  height?: number;
};

export type DesignTokensV2 = {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    muted: string;
    primary: string;
    accent: string;
    border: string;
  };
  typography: {
    display: string;
    body: string;
    scale: 'compact' | 'balanced' | 'expressive';
  };
  radius: 'sharp' | 'soft' | 'rounded';
  density: 'airy' | 'balanced' | 'compact';
  imageTreatment: 'natural' | 'cinematic' | 'editorial' | 'soft' | 'high-contrast';
  motion: 'none' | 'subtle' | 'expressive';
};

export type SiteAction = {
  label: string;
  kind: 'whatsapp' | 'phone' | 'email' | 'url' | 'page';
  value: string;
  message?: string;
};

export type SiteBlockV2 = {
  id: string;
  type: SiteBlockType;
  variant: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  items?: Array<Record<string, unknown>>;
  media?: AssetRef[];
  primaryAction?: SiteAction;
  secondaryAction?: SiteAction;
  options?: Record<string, unknown>;
};

export type SitePageV2 = {
  id: string;
  slug: string;
  label: string;
  title: string;
  description?: string;
  blocks: SiteBlockV2[];
};

export type SiteSpecV2 = {
  version: 2;
  brand: {
    name: string;
    tagline: string;
    logo?: AssetRef;
    segment: string;
    location?: string;
  };
  direction: {
    id: string;
    family: ArtDirectionFamily;
    name: string;
    rationale: string;
    score: number;
  };
  tokens: DesignTokensV2;
  navigation: Array<{ pageId: string; label: string }>;
  pages: SitePageV2[];
  seo: {
    title: string;
    description: string;
  };
  contact: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    instagram?: string;
    website?: string;
    address?: string;
    mapsUrl?: string;
    openingHours?: string[];
  };
  assets: AssetRef[];
  disclosure: string;
};

export type LegacySiteSpec = Record<string, any>;

export type CompanyBriefing = {
  company: string;
  segment: string;
  location: string;
  summary: string;
  audience: string;
  positioning: string;
  tone: string;
  opportunity: string;
  recommendedService: string;
  differentiators: string[];
  services: Array<{ name: string; description: string }>;
  verifiedFacts: string[];
  reviews: Array<{ author: string; rating: number; text: string; source: string }>;
  assets: AssetRef[];
  logo?: AssetRef;
  contact: SiteSpecV2['contact'];
  sourceCoverage: {
    crm: boolean;
    officialSite: boolean;
    instagram: boolean;
    googlePlaces: boolean;
  };
};

export type ArtDirectionProposal = SiteSpecV2['direction'] & {
  tokens: DesignTokensV2;
  heroVariant: 'cinematic' | 'editorial' | 'fullscreen' | 'asymmetric';
  servicesVariant: 'editorial-list' | 'grid' | 'alternating' | 'spotlight';
  galleryVariant: 'mosaic' | 'carousel' | 'filmstrip';
  navStyle: 'minimal' | 'floating' | 'solid';
};

export type QualityReport = {
  score: number;
  passed: boolean;
  checks: Array<{
    id: string;
    label: string;
    score: number;
    passed: boolean;
    detail: string;
  }>;
  fixes: string[];
};

export function isSiteSpecV2(value: unknown): value is SiteSpecV2 {
  if (!value || typeof value !== 'object') return false;
  const spec = value as Partial<SiteSpecV2>;
  return (
    spec.version === 2 &&
    !!spec.brand?.name &&
    !!spec.tokens?.colors?.background &&
    Array.isArray(spec.pages) &&
    spec.pages.length > 0 &&
    spec.pages.every((page) => Array.isArray(page.blocks))
  );
}

export function adaptLegacySiteSpec(input: LegacySiteSpec): SiteSpecV2 {
  const p = input.palette || {};
  const services = Array.isArray(input.services) ? input.services : [];
  const gallery = Array.isArray(input.gallery) ? input.gallery : [];
  const reviews = Array.isArray(input.reviews) ? input.reviews : [];

  const pages: SitePageV2[] = [
    {
      id: 'home',
      slug: '/',
      label: 'Início',
      title: input.brandName || 'Início',
      blocks: [
        {
          id: 'legacy-hero',
          type: 'hero',
          variant: 'editorial',
          eyebrow: input.hero?.eyebrow || input.tagline || '',
          title: input.hero?.title || input.brandName || '',
          body: input.hero?.subtitle || '',
          media: gallery.slice(0, 1).map((asset: any) => ({
            url: asset.url,
            alt: asset.alt || input.brandName || '',
            attribution: asset.attribution,
            source: asset.source === 'google_places' ? 'google-places' : 'official-site',
            verified: true,
          })),
          primaryAction: input.contact?.whatsapp
            ? {
                label: input.hero?.primaryCta || 'WhatsApp',
                kind: 'whatsapp',
                value: input.contact.whatsapp,
                message: input.hero?.primaryMessage || input.contact?.actionMessage,
              }
            : undefined,
        },
        {
          id: 'legacy-intro',
          type: 'intro',
          variant: 'split',
          title: input.about?.title || 'Sobre',
          body: input.about?.text || '',
          items: (input.benefits || []).map((text: string) => ({ text })),
        },
      ],
    },
    {
      id: 'services',
      slug: '/servicos',
      label: input.businessType === 'clinic' ? 'Tratamentos' : 'Serviços',
      title: 'Serviços',
      blocks: [
        {
          id: 'legacy-services',
          type: 'services',
          variant: 'grid',
          title: 'Serviços',
          items: services,
        },
      ],
    },
    ...(reviews.length
      ? [
          {
            id: 'reviews',
            slug: '/avaliacoes',
            label: 'Avaliações',
            title: 'Avaliações',
            blocks: [
              {
                id: 'legacy-reviews',
                type: 'reviews' as const,
                variant: 'grid',
                title: 'Avaliações verificadas',
                items: reviews,
              },
            ],
          },
        ]
      : []),
    ...(gallery.length
      ? [
          {
            id: 'gallery',
            slug: '/galeria',
            label: 'Galeria',
            title: 'Galeria',
            blocks: [
              {
                id: 'legacy-gallery',
                type: 'gallery' as const,
                variant: 'mosaic',
                media: gallery.map((asset: any) => ({
                  url: asset.url,
                  alt: asset.alt || input.brandName || '',
                  attribution: asset.attribution,
                  source: asset.source === 'google_places' ? 'google-places' : 'official-site',
                  verified: true,
                })),
              },
            ],
          },
        ]
      : []),
    {
      id: 'contact',
      slug: '/contato',
      label: 'Contato',
      title: 'Contato',
      blocks: [
        {
          id: 'legacy-contact',
          type: 'contact',
          variant: 'split',
          title: input.contact?.actionLabel || 'Fale com a equipe',
        },
      ],
    },
  ];

  return {
    version: 2,
    brand: {
      name: input.brandName || 'Empresa',
      tagline: input.tagline || '',
      segment: input.businessType || '',
    },
    direction: {
      id: 'legacy-v1',
      family: 'local-business-pro',
      name: 'Compatibilidade V1',
      rationale: 'Projeto criado antes do Design Engine V2.',
      score: 70,
    },
    tokens: {
      colors: {
        background: p.background || '#0D0D0D',
        surface: p.surface || '#171717',
        surfaceAlt: p.surface || '#1E1E1E',
        text: p.text || '#F5F5F5',
        muted: p.muted || '#A3A3A3',
        primary: p.primary || '#6366F1',
        accent: p.accent || '#22C55E',
        border: 'rgba(255,255,255,.10)',
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
    navigation: pages.map((page) => ({ pageId: page.id, label: page.label })),
    pages,
    seo: {
      title: input.brandName || 'Empresa',
      description: input.about?.text || input.tagline || '',
    },
    contact: {
      whatsapp: input.contact?.whatsapp,
      phone: input.contact?.phone,
      email: input.contact?.email,
      instagram: input.contact?.instagram,
      website: input.contact?.website,
      address: input.contact?.address,
      mapsUrl: input.contact?.mapsUrl,
      openingHours: input.contact?.openingHours,
    },
    assets: gallery.map((asset: any) => ({
      url: asset.url,
      alt: asset.alt || input.brandName || '',
      attribution: asset.attribution,
      source: asset.source === 'google_places' ? 'google-places' : 'official-site',
      verified: true,
    })),
    disclosure: 'Demonstração visual criada pela TRUINEXA • não é o site oficial da empresa.',
  };
}
