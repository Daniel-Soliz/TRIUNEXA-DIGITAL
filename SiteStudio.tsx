import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileDown,
  Globe2,
  Laptop,
  Loader2,
  MonitorSmartphone,
  Palette,
  RefreshCw,
  Rocket,
  Smartphone,
  Sparkles,
  Unplug,
  Star,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Clock3,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { Lead, User } from './crm';
import { supabase } from './supabaseApi';

type TemplateKey = 'premium' | 'clean' | 'bold' | 'local';

type SiteSpec = {
  brandName: string;
  logoUrl?: string;
  tagline: string;
  templateKey: TemplateKey;
  businessType?: string;
  navigation?: Array<{ id: string; label: string }>;
  palette: {
    background: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    primaryMessage?: string;
    secondaryCta: string;
    imageUrl?: string;
  };
  about: { title: string; text: string };
  services: Array<{ name: string; description: string }>;
  benefits: string[];
  reviews?: Array<{
    author: string;
    rating: number;
    text: string;
    publishedAt?: string;
    source?: string;
  }>;
  socialProof: {
    rating?: number;
    ratingText: string;
    reviewCount?: number;
    reviewText: string;
    source?: string;
    mapsUrl?: string;
  };
  gallery: Array<{ url: string; alt: string; attribution: string; source?: string }>;
  contact: {
    whatsapp: string;
    phone: string;
    email: string;
    instagram: string;
    address: string;
    website: string;
    mapsUrl?: string;
    openingHours?: string[];
    actionLabel?: string;
    actionMessage?: string;
  };
  footerText: string;
};

type SiteProject = {
  id: string;
  lead_id: string;
  created_by: string;
  template_key: TemplateKey;
  status: 'draft' | 'generating' | 'ready' | 'published' | 'error';
  title: string;
  analysis: Record<string, any>;
  site_spec: SiteSpec;
  generation_mode: 'smart_template' | 'openai';
  model_name?: string | null;
  public_token: string;
  published: boolean;
  published_at?: string | null;
  updated_at: string;
};

const templates: Array<{
  key: TemplateKey;
  name: string;
  description: string;
}> = [
  { key: 'premium', name: 'Premium', description: 'Escuro, elegante e sofisticado.' },
  { key: 'clean', name: 'Clean', description: 'Claro, profissional e direto.' },
  { key: 'bold', name: 'Bold', description: 'Forte, moderno e impactante.' },
  { key: 'local', name: 'Local', description: 'Próximo, confiável e comercial.' },
];

function normalizeWhatsApp(value: string) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function SiteRenderer({ spec }: { spec: SiteSpec }) {
  const navigation =
    spec.navigation && spec.navigation.length
      ? spec.navigation
      : [
          { id: 'home', label: 'Início' },
          { id: 'services', label: 'Serviços' },
          ...(spec.gallery?.length ? [{ id: 'gallery', label: 'Galeria' }] : []),
          { id: 'contact', label: 'Contato' },
        ];
  const [activePage, setActivePage] = useState(navigation[0]?.id || 'home');
  const whatsapp = normalizeWhatsApp(spec.contact.whatsapp);
  const whatsappHref = whatsapp
    ? 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(spec.contact.actionMessage || 'Olá! Gostaria de mais informações.')
    : '';
  const p = spec.palette;
  const reviews = spec.reviews || [];
  const openingHours = spec.contact.openingHours || [];

  const renderPage = (pageId: string, printMode = false) => {
    if (pageId === 'services') {
      return (
        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <div className="text-[10px] font-black uppercase tracking-[.18em]" style={{ color: p.accent }}>
                {spec.businessType === 'clinic' ? 'Tratamentos e experiência' : 'Serviços e experiência'}
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                Escolha com clareza e fale com a equipe sem complicação.
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: p.muted }}>
                Uma apresentação organizada para transformar interesse em contato e facilitar a decisão.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {spec.services.map((service, index) => (
                <article
                  key={service.name + index}
                  className="rounded-2xl border p-5"
                  style={{ background: p.surface, borderColor: p.muted + '22' }}
                >
                  <div
                    className="grid h-10 w-10 place-items-center rounded-xl text-xs font-black"
                    style={{ background: p.primary + '20', color: p.accent }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="mt-4 text-lg font-black">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: p.muted }}>
                    {service.description}
                  </p>
                </article>
              ))}
            </div>

            <div
              className="mt-8 rounded-[24px] border p-6 sm:flex sm:items-center sm:justify-between sm:gap-6"
              style={{ background: p.surface, borderColor: p.muted + '22' }}
            >
              <div>
                <div className="text-lg font-black">Quer entender qual opção combina com você?</div>
                <p className="mt-1 text-sm" style={{ color: p.muted }}>
                  Fale diretamente com a equipe e receba orientação.
                </p>
              </div>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-xl px-5 py-3 text-sm font-black text-white sm:mt-0"
                  style={{ background: p.primary }}
                >
                  {spec.contact.actionLabel || spec.hero.primaryCta}
                </a>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (pageId === 'reviews') {
      return (
        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside
                className="rounded-[24px] border p-6"
                style={{ background: p.surface, borderColor: p.muted + '22' }}
              >
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em]" style={{ color: p.accent }}>
                  <ShieldCheck className="h-4 w-4" />
                  Avaliações verificadas
                </div>
                {spec.socialProof.rating ? (
                  <>
                    <div className="mt-5 text-5xl font-black">{Number(spec.socialProof.rating).toFixed(1)}</div>
                    <div className="mt-2 flex gap-1" style={{ color: '#F59E0B' }}>
                      {[1,2,3,4,5].map((item) => <Star key={item} className="h-4 w-4 fill-current" />)}
                    </div>
                    <div className="mt-3 text-sm" style={{ color: p.muted }}>
                      {spec.socialProof.reviewText}
                    </div>
                    <div className="mt-1 text-[10px]" style={{ color: p.muted }}>
                      Fonte: {spec.socialProof.source || 'Google'}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-6" style={{ color: p.muted }}>
                    Nenhuma avaliação pública verificada foi importada para esta demonstração.
                  </p>
                )}
                {spec.socialProof.mapsUrl && (
                  <a
                    href={spec.socialProof.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-xs font-bold"
                    style={{ color: p.accent }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver fonte no Google
                  </a>
                )}
              </aside>

              <div className="grid gap-4 md:grid-cols-2">
                {reviews.length ? reviews.map((review, index) => (
                  <article
                    key={review.author + index}
                    className="rounded-2xl border p-5"
                    style={{ background: p.surface, borderColor: p.muted + '22' }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black">{review.author}</div>
                      <div className="flex" style={{ color: '#F59E0B' }}>
                        {Array.from({ length: Math.max(1, Math.min(5, review.rating || 5)) }).map((_, star) => (
                          <Star key={star} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6" style={{ color: p.muted }}>
                      {review.text}
                    </p>
                    <div className="mt-3 text-[9px]" style={{ color: p.muted }}>
                      {review.source || 'Google'}
                    </div>
                  </article>
                )) : (
                  <div
                    className="col-span-full grid min-h-[260px] place-items-center rounded-[24px] border p-8 text-center"
                    style={{ background: p.surface, borderColor: p.muted + '22' }}
                  >
                    <div>
                      <Star className="mx-auto h-8 w-8" style={{ color: p.accent }} />
                      <h3 className="mt-3 font-black">Sem avaliações importadas</h3>
                      <p className="mt-2 max-w-md text-sm leading-6" style={{ color: p.muted }}>
                        A TRUINEXA não inventa depoimentos. Quando o Google Places estiver conectado, avaliações reais podem aparecer aqui.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (pageId === 'gallery') {
      return (
        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em]" style={{ color: p.accent }}>
                  <ImageIcon className="h-4 w-4" />
                  Imagens vinculadas à empresa
                </div>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Galeria</h2>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {spec.gallery?.length ? spec.gallery.slice(0, 9).map((image, index) => (
                <figure
                  key={image.url + index}
                  className="overflow-hidden rounded-2xl border"
                  style={{ background: p.surface, borderColor: p.muted + '22' }}
                >
                  <img src={image.url} alt={image.alt} className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="px-3 py-2 text-[9px]" style={{ color: p.muted }}>
                    {image.attribution ? 'Foto: ' + image.attribution : 'Imagem pública vinculada à empresa'}
                  </figcaption>
                </figure>
              )) : (
                <div className="col-span-full rounded-[24px] border p-8 text-center" style={{ background: p.surface, borderColor: p.muted + '22' }}>
                  <ImageIcon className="mx-auto h-8 w-8" style={{ color: p.accent }} />
                  <p className="mt-3 text-sm" style={{ color: p.muted }}>Nenhuma imagem verificada foi encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (pageId === 'contact') {
      return (
        <section className="px-5 py-10 sm:px-8 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_.9fr]">
            <div
              className="rounded-[28px] p-7 sm:p-10"
              style={{ background: p.primary, color: '#fff' }}
            >
              <div className="text-[10px] font-black uppercase tracking-[.16em] text-white/65">Contato e agendamento</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em]">
                {spec.contact.actionLabel || 'Fale com a equipe'}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/75">
                Tire dúvidas, consulte disponibilidade e dê o próximo passo diretamente pelo celular.
              </p>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black"
                  style={{ color: p.primary }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir WhatsApp
                </a>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {spec.contact.phone && (
                <a href={'tel:' + spec.contact.phone.replace(/[^\d+]/g, '')} className="rounded-2xl border p-4" style={{ background: p.surface, borderColor: p.muted + '22' }}>
                  <Phone className="h-4 w-4" style={{ color: p.accent }} />
                  <div className="mt-3 text-[10px]" style={{ color: p.muted }}>Telefone</div>
                  <div className="mt-1 text-sm font-black">{spec.contact.phone}</div>
                </a>
              )}
              {spec.contact.email && (
                <a href={'mailto:' + spec.contact.email} className="rounded-2xl border p-4" style={{ background: p.surface, borderColor: p.muted + '22' }}>
                  <Mail className="h-4 w-4" style={{ color: p.accent }} />
                  <div className="mt-3 text-[10px]" style={{ color: p.muted }}>E-mail</div>
                  <div className="mt-1 break-all text-sm font-black">{spec.contact.email}</div>
                </a>
              )}
              {spec.contact.instagram && (
                <a href={spec.contact.instagram.startsWith('http') ? spec.contact.instagram : 'https://instagram.com/' + spec.contact.instagram.replace('@','')} target="_blank" rel="noreferrer" className="rounded-2xl border p-4" style={{ background: p.surface, borderColor: p.muted + '22' }}>
                  <Instagram className="h-4 w-4" style={{ color: p.accent }} />
                  <div className="mt-3 text-[10px]" style={{ color: p.muted }}>Instagram</div>
                  <div className="mt-1 truncate text-sm font-black">{spec.contact.instagram}</div>
                </a>
              )}
              {spec.contact.address && (
                <a href={spec.contact.mapsUrl || '#'} target={spec.contact.mapsUrl ? '_blank' : undefined} rel="noreferrer" className="rounded-2xl border p-4" style={{ background: p.surface, borderColor: p.muted + '22' }}>
                  <MapPin className="h-4 w-4" style={{ color: p.accent }} />
                  <div className="mt-3 text-[10px]" style={{ color: p.muted }}>Local</div>
                  <div className="mt-1 text-sm font-black">{spec.contact.address}</div>
                </a>
              )}
            </div>

            {openingHours.length > 0 && (
              <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: p.surface, borderColor: p.muted + '22' }}>
                <div className="flex items-center gap-2 font-black">
                  <Clock3 className="h-4 w-4" style={{ color: p.accent }} />
                  Horários
                </div>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2" style={{ color: p.muted }}>
                  {openingHours.map((item, index) => <div key={item + index}>{item}</div>)}
                </div>
              </div>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em]" style={{ background: p.primary + '18', color: p.accent }}>
              {spec.hero.eyebrow}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-6xl">
              {spec.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: p.muted }}>
              {spec.hero.subtitle}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-xl px-5 py-3 text-sm font-black text-white" style={{ background: p.primary }}>
                  {spec.hero.primaryCta}
                </a>
              )}
              {!printMode && (
                <button
                  type="button"
                  onClick={() => setActivePage('services')}
                  className="rounded-xl border px-5 py-3 text-sm font-black"
                  style={{ borderColor: p.muted + '40', color: p.text }}
                >
                  {spec.hero.secondaryCta}
                </button>
              )}
            </div>
            {(spec.socialProof.ratingText || spec.socialProof.reviewText) && (
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs" style={{ color: p.muted }}>
                <span className="font-black" style={{ color: '#F59E0B' }}>{spec.socialProof.ratingText}</span>
                <span>{spec.socialProof.reviewText}</span>
              </div>
            )}
          </div>

          <div
            className="relative min-h-[330px] overflow-hidden rounded-[28px] border"
            style={{ background: p.surface, borderColor: p.muted + '24' }}
          >
            {spec.hero.imageUrl || spec.gallery?.[0]?.url ? (
              <img src={spec.hero.imageUrl || spec.gallery[0].url} alt={spec.brandName} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(circle at 25% 20%, ' + p.primary + '55, transparent 34%), radial-gradient(circle at 80% 70%, ' + p.accent + '42, transparent 38%), linear-gradient(145deg, ' + p.surface + ', ' + p.background + ')' }}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16">
              {spec.logoUrl ? (
                <img src={spec.logoUrl} alt={'Logo ' + spec.brandName} className="mb-3 max-h-14 max-w-[180px] rounded-lg bg-white/90 object-contain p-1.5" />
              ) : (
                <div className="mb-3 text-xs font-black uppercase tracking-[.16em] text-white/65">{spec.brandName}</div>
              )}
              <div className="text-lg font-black text-white">{spec.tagline}</div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[24px] border p-6" style={{ background: p.surface, borderColor: p.muted + '22' }}>
            <div className="text-[10px] font-black uppercase tracking-[.16em]" style={{ color: p.accent }}>Sobre</div>
            <h2 className="mt-2 text-2xl font-black">{spec.about.title}</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: p.muted }}>{spec.about.text}</p>
          </div>
          <div className="space-y-2">
            {spec.benefits.map((benefit, index) => (
              <div key={benefit + index} className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold" style={{ background: p.surface, borderColor: p.muted + '22' }}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white" style={{ background: p.primary }}>
                  <Check className="h-3.5 w-3.5" />
                </span>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const header = (
    <header className="border-b px-4 py-3 sm:px-6" style={{ background: p.background, borderColor: p.muted + '22' }}>
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {spec.logoUrl ? (
            <img src={spec.logoUrl} alt={'Logo ' + spec.brandName} className="h-9 w-9 rounded-lg bg-white object-contain p-1" />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-lg text-sm font-black text-white" style={{ background: p.primary }}>
              {spec.brandName.slice(0,2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-black">{spec.brandName}</div>
            <div className="truncate text-[9px]" style={{ color: p.muted }}>{spec.tagline}</div>
          </div>
        </div>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className="rounded-lg px-3 py-2 text-xs font-bold"
              style={{
                background: activePage === item.id ? p.primary + '20' : 'transparent',
                color: activePage === item.id ? p.accent : p.muted,
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="ml-auto rounded-lg px-3 py-2 text-[11px] font-black text-white md:ml-2" style={{ background: p.primary }}>
            {spec.contact.actionLabel || 'WhatsApp'}
          </a>
        )}
      </div>

      <div className="mx-auto mt-3 flex max-w-6xl gap-1 overflow-x-auto pb-1 md:hidden">
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActivePage(item.id)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold"
            style={{
              background: activePage === item.id ? p.primary : p.surface,
              color: activePage === item.id ? '#fff' : p.muted,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );

  return (
    <div className="site-print-root min-h-full overflow-hidden" style={{ background: p.background, color: p.text }}>
      <div className="site-screen">
        {header}
        <main className="min-h-[520px]">{renderPage(activePage)}</main>
        <footer className="border-t px-5 py-5 text-center text-[10px]" style={{ borderColor: p.muted + '20', color: p.muted }}>
          <div>{spec.footerText}</div>
          <div className="mt-1 text-[8px]">Demonstração visual criada pela TRUINEXA • não é o site oficial da empresa</div>
        </footer>
      </div>

      <div className="site-print-all">
        {navigation.map((item, index) => (
          <section key={item.id} className="site-print-page" style={{ background: p.background, color: p.text }}>
            <div className="border-b px-6 py-4" style={{ borderColor: p.muted + '22' }}>
              <div className="text-lg font-black">{spec.brandName}</div>
              <div className="text-xs" style={{ color: p.muted }}>{item.label}</div>
            </div>
            {renderPage(item.id, true)}
            {index === navigation.length - 1 && (
              <footer className="border-t px-5 py-5 text-center text-[10px]" style={{ borderColor: p.muted + '20', color: p.muted }}>
                {spec.footerText} • Demonstração TRUINEXA
              </footer>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

interface SiteStudioProps {
  lead: Lead;
  currentUser: User;
  onClose: () => void;
}

export function SiteStudio({ lead, currentUser: _currentUser, onClose }: SiteStudioProps) {
  const [project, setProject] = useState<SiteProject | null>(null);
  const [template, setTemplate] = useState<TemplateKey>('premium');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('truinexa_site_projects')
        .select('*')
        .eq('lead_id', lead.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;
      if (queryError) setError(queryError.message);
      if (data) {
        setProject(data as SiteProject);
        setTemplate((data.template_key as TemplateKey) || 'premium');
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [lead.id]);

  const publicUrl = useMemo(() => {
    if (!project?.published) return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?demo=${project.public_token}`;
  }, [project]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke('truinexa-site-studio', {
      body: {
        action: 'generate',
        leadId: lead.id,
        projectId: project?.id || null,
        templateKey: template,
      },
    });

    if (invokeError) {
      setError(invokeError.message);
    } else if (data?.error) {
      setError(data.message || 'Não foi possível gerar a demonstração.');
    } else if (data?.project) {
      setProject(data.project as SiteProject);
    }
    setGenerating(false);
  };

  const togglePublish = async () => {
    if (!project) return;
    setPublishing(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('truinexa-site-studio', {
      body: {
        action: project.published ? 'unpublish' : 'publish',
        projectId: project.id,
      },
    });

    if (invokeError) {
      setError(invokeError.message);
    } else if (data?.error) {
      setError(data.message || 'Não foi possível atualizar a publicação.');
    } else if (data?.project) {
      setProject(data.project as SiteProject);
    }
    setPublishing(false);
  };

  const copyPublicUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#080808] text-white">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .site-print-root, .site-print-root * { visibility: visible !important; }
          .site-print-root { position: absolute !important; inset: 0 !important; width: 100% !important; min-height: 100vh !important; }
        }
      `}</style>

      <div className="flex h-[100dvh] flex-col">
        <header className="flex min-h-16 items-center gap-3 border-b border-white/[0.07] bg-[#101010] px-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="truncate text-sm font-black">Site Studio • {lead.company}</h2>
            </div>
            <p className="truncate text-[10px] text-slate-500">
              Demonstração comercial criada a partir dos dados do cliente
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 sm:flex">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`grid h-8 w-8 place-items-center rounded-lg ${device === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                title="Desktop"
              >
                <Laptop className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`grid h-8 w-8 place-items-center rounded-lg ${device === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                title="Celular"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>

            {project && (
              <button
                type="button"
                onClick={exportPdf}
                className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] sm:inline-flex"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </button>
            )}

            {project && (
              <button
                type="button"
                disabled={publishing}
                onClick={() => void togglePublish()}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-white disabled:opacity-50 ${
                  project.published ? 'bg-slate-700 hover:bg-slate-600' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : project.published ? <Unplug className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
                {project.published ? 'Despublicar' : 'Publicar'}
              </button>
            )}
          </div>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-r border-white/[0.07] bg-[#101010] p-4">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <MonitorSmartphone className="h-4 w-4" />
                Gerar demonstração
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                A TRUINEXA usa segmento, localização, oportunidade, serviços recomendados e fontes do lead para montar o site.
              </p>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-600">
                <Palette className="h-3.5 w-3.5" />
                Estilo
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {templates.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTemplate(item.key)}
                    className={`rounded-xl border p-3 text-left transition ${
                      template === item.key
                        ? 'border-indigo-500/60 bg-indigo-500/10'
                        : 'border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="mt-1 text-[9px] leading-4 text-slate-500">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={generating}
              onClick={() => void handleGenerate()}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : project ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'Montando site...' : project ? 'Regenerar site' : 'Gerar site'}
            </button>

            {error && (
              <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] leading-5 text-rose-300">
                {error}
              </div>
            )}

            {project && (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-600">Análise</div>
                  <div className="mt-3 space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-600">Segmento</span>
                      <div className="font-semibold text-slate-300">{project.analysis?.segment || lead.segment}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Oportunidade</span>
                      <div className="leading-5 text-slate-400">{project.analysis?.opportunity || lead.opportunityReason || 'Presença digital e conversão.'}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Recomendação</span>
                      <div className="leading-5 text-slate-400">{project.analysis?.recommendedService || lead.recommendedService || lead.serviceInterest}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-600">Motor</div>
                      <div className="mt-1 text-xs font-semibold text-slate-300">
                        {project.generation_mode === 'openai' ? 'IA conectada' : 'Gerador inteligente'}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-400">
                      Ativo
                    </span>
                  </div>
                </div>

                {project.published && publicUrl && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-400">
                      <Globe2 className="h-3.5 w-3.5" />
                      Link publicado
                    </div>
                    <div className="mt-2 break-all text-[10px] leading-4 text-slate-400">{publicUrl}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void copyPublicUrl()}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] text-[10px] font-bold text-white"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copiado' : 'Copiar link'}
                      </button>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[10px] font-bold text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          <main className="min-w-0 overflow-auto bg-[#080808] p-3 sm:p-6">
            {loading ? (
              <div className="grid h-full min-h-[480px] place-items-center">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              </div>
            ) : project?.site_spec ? (
              <div
                className={`mx-auto overflow-hidden rounded-2xl border border-white/[0.08] bg-white shadow-2xl shadow-black/40 transition-all ${
                  device === 'mobile' ? 'max-w-[390px]' : 'max-w-[1280px]'
                }`}
              >
                <SiteRenderer spec={project.site_spec} />
              </div>
            ) : (
              <div className="grid h-full min-h-[520px] place-items-center">
                <div className="max-w-md text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-xl font-black">Crie uma demonstração para {lead.company}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Escolha um estilo e toque em <strong className="text-slate-300">Gerar site</strong>. O preview aparecerá aqui pronto para apresentar ao cliente.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export function PublicSiteDemo({ token }: { token: string }) {
  const [demo, setDemo] = useState<{ title:string; siteSpec:SiteSpec } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const url = `https://wsyxykfhxguhyojitpbl.supabase.co/functions/v1/truinexa-site-public?token=${encodeURIComponent(token)}`;
    fetch(url)
      .then(async (response) => {
        if (!response.ok) throw new Error('not found');
        return response.json();
      })
      .then((data) => {
        if (active) setDemo(data.demo || null);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [token]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0D0D0D] px-5 text-center text-white">
        <div>
          <Globe2 className="mx-auto h-10 w-10 text-slate-600" />
          <h1 className="mt-4 text-xl font-black">Demonstração indisponível</h1>
          <p className="mt-2 text-sm text-slate-500">Este link pode ter sido despublicado ou não existe mais.</p>
        </div>
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0D0D0D]">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  return <SiteRenderer spec={demo.siteSpec} />;
}
