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
} from 'lucide-react';
import { Lead, User } from './crm';
import { supabase } from './supabaseApi';

type TemplateKey = 'premium' | 'clean' | 'bold' | 'local';

type SiteSpec = {
  brandName: string;
  tagline: string;
  templateKey: TemplateKey;
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
    secondaryCta: string;
  };
  about: { title: string; text: string };
  services: Array<{ name: string; description: string }>;
  benefits: string[];
  socialProof: { ratingText: string; reviewText: string };
  gallery: Array<{ url: string; alt: string; attribution: string }>;
  contact: {
    whatsapp: string;
    phone: string;
    email: string;
    instagram: string;
    address: string;
    website: string;
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
  const whatsapp = normalizeWhatsApp(spec.contact.whatsapp);
  const p = spec.palette;

  return (
    <div
      className="site-print-root min-h-full overflow-hidden"
      style={{ background: p.background, color: p.text }}
    >
      <header
        className="sticky top-0 z-10 border-b px-5 py-4 backdrop-blur-xl sm:px-8"
        style={{ background: `${p.background}E8`, borderColor: `${p.muted}28` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <div className="text-base font-black tracking-tight">{spec.brandName}</div>
            <div className="text-[10px]" style={{ color: p.muted }}>{spec.tagline}</div>
          </div>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-4 py-2 text-xs font-bold text-white"
              style={{ background: p.primary }}
            >
              Falar agora
            </a>
          )}
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
          <div
            className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full blur-3xl"
            style={{ background: `${p.primary}28` }}
          />
          <div
            className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full blur-3xl"
            style={{ background: `${p.accent}22` }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.12fr_.88fr] lg:items-center">
            <div>
              <div
                className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ background: `${p.primary}18`, color: p.accent }}
              >
                {spec.hero.eyebrow}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.04em] sm:text-6xl">
                {spec.hero.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: p.muted }}>
                {spec.hero.subtitle}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl px-5 py-3 text-sm font-bold text-white"
                    style={{ background: p.primary }}
                  >
                    {spec.hero.primaryCta}
                  </a>
                )}
                <a
                  href="#servicos"
                  className="rounded-xl border px-5 py-3 text-sm font-bold"
                  style={{ borderColor: `${p.muted}40`, color: p.text }}
                >
                  {spec.hero.secondaryCta}
                </a>
              </div>
              {(spec.socialProof.ratingText || spec.socialProof.reviewText) && (
                <div className="mt-6 flex gap-2 text-xs" style={{ color: p.muted }}>
                  <span>{spec.socialProof.ratingText}</span>
                  <span>{spec.socialProof.reviewText}</span>
                </div>
              )}
            </div>

            <div
              className="relative min-h-[330px] overflow-hidden rounded-[28px] border p-5"
              style={{ background: p.surface, borderColor: `${p.muted}24` }}
            >
              {spec.gallery[0]?.url ? (
                <img
                  src={spec.gallery[0].url}
                  alt={spec.gallery[0].alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 25% 20%, ${p.primary}55, transparent 34%), radial-gradient(circle at 80% 70%, ${p.accent}42, transparent 38%), linear-gradient(145deg, ${p.surface}, ${p.background})`,
                    }}
                  />
                  <div className="relative flex h-full min-h-[290px] flex-col justify-end">
                    <div
                      className="w-fit rounded-2xl border px-4 py-3 text-xs font-semibold backdrop-blur-xl"
                      style={{ borderColor: `${p.muted}30`, background: `${p.surface}CC` }}
                    >
                      <div style={{ color: p.muted }}>Demonstração criada para</div>
                      <div className="mt-1 text-lg font-black">{spec.brandName}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section id="servicos" className="px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <div className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: p.accent }}>
                Serviços
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">O que você encontra aqui</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {spec.services.map((service, index) => (
                <article
                  key={`${service.name}-${index}`}
                  className="rounded-2xl border p-5"
                  style={{ background: p.surface, borderColor: `${p.muted}20` }}
                >
                  <div
                    className="grid h-9 w-9 place-items-center rounded-xl text-xs font-black"
                    style={{ background: `${p.primary}20`, color: p.accent }}
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
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8">
          <div
            className="mx-auto grid max-w-6xl gap-8 rounded-[28px] border p-6 sm:p-10 lg:grid-cols-2"
            style={{ background: p.surface, borderColor: `${p.muted}20` }}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: p.accent }}>
                Sobre
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{spec.about.title}</h2>
              <p className="mt-4 text-sm leading-7" style={{ color: p.muted }}>{spec.about.text}</p>
            </div>
            <div className="space-y-3">
              {spec.benefits.map((benefit, index) => (
                <div
                  key={`${benefit}-${index}`}
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold"
                  style={{ borderColor: `${p.muted}20`, background: `${p.background}88` }}
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: p.primary }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </section>

        {spec.gallery.length > 1 && (
          <section className="px-5 py-14 sm:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-3xl font-black tracking-tight">Conheça de perto</h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {spec.gallery.slice(0, 6).map((image, index) => (
                  <figure key={`${image.url}-${index}`} className="overflow-hidden rounded-2xl">
                    <img src={image.url} alt={image.alt} className="aspect-[4/3] w-full object-cover" />
                    {image.attribution && (
                      <figcaption className="px-2 py-1 text-[9px]" style={{ color: p.muted }}>
                        Foto: {image.attribution}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="px-5 py-16 sm:px-8">
          <div
            className="mx-auto max-w-6xl overflow-hidden rounded-[28px] p-7 text-center sm:p-12"
            style={{ background: p.primary, color: '#fff' }}
          >
            <h2 className="text-3xl font-black tracking-tight">Pronto para conversar?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
              Fale diretamente com a equipe e tire suas dúvidas de forma rápida.
            </p>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black"
                style={{ color: p.primary }}
              >
                Chamar no WhatsApp
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t px-5 py-8 text-center text-xs sm:px-8" style={{ borderColor: `${p.muted}20`, color: p.muted }}>
        <div>{spec.footerText}</div>
        <div className="mt-1 text-[9px]">Demonstração visual criada pela TRUINEXA • não é o site oficial da empresa</div>
      </footer>
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
