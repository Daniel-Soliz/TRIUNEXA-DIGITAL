import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Phone,
  Quote,
  Star,
} from 'lucide-react';
import { AssetRef, SiteAction, SiteBlockV2, SiteSpecV2 } from './types';

type RendererProps = {
  spec: SiteSpecV2;
  publicMode?: boolean;
  initialPageId?: string;
  forceAllPages?: boolean;
};

function contrastText(background: string) {
  const hex = String(background || '').trim();
  const normalized =
    /^#[0-9a-f]{3}$/i.test(hex)
      ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
      : hex;
  const match = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!match) return '#FFFFFF';
  const value = match[1];
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.68 ? '#111315' : '#FFFFFF';
}

function radiusClass(radius: SiteSpecV2['tokens']['radius']) {
  if (radius === 'sharp') return 'rounded-none';
  if (radius === 'soft') return 'rounded-xl';
  return 'rounded-[24px]';
}

function sectionSpacing(density: SiteSpecV2['tokens']['density']) {
  if (density === 'compact') return 'py-8 sm:py-10';
  if (density === 'airy') return 'py-14 sm:py-20';
  return 'py-10 sm:py-14';
}

function actionHref(action: SiteAction) {
  if (action.kind === 'whatsapp') {
    const digits = action.value.replace(/\D/g, '');
    const number = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${number}${action.message ? `?text=${encodeURIComponent(action.message)}` : ''}`;
  }
  if (action.kind === 'phone') return `tel:${action.value.replace(/[^\d+]/g, '')}`;
  if (action.kind === 'email') return `mailto:${action.value}`;
  return action.value;
}

function Action({
  action,
  spec,
  onPage,
  secondary = false,
  invert = false,
}: {
  action?: SiteAction;
  spec: SiteSpecV2;
  onPage: (id: string) => void;
  secondary?: boolean;
  invert?: boolean;
}) {
  if (!action) return null;
  const style = invert
    ? {
        color: spec.tokens.colors.primary,
        borderColor: contrastText(spec.tokens.colors.primary),
        background: contrastText(spec.tokens.colors.primary),
      }
    : secondary
      ? {
          color: spec.tokens.colors.text,
          borderColor: spec.tokens.colors.border,
          background: 'transparent',
        }
      : {
          color: contrastText(spec.tokens.colors.primary),
          borderColor: spec.tokens.colors.primary,
          background: spec.tokens.colors.primary,
        };
  const className =
    'inline-flex min-h-11 items-center justify-center gap-2 border px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ' +
    radiusClass(spec.tokens.radius);

  if (action.kind === 'page') {
    return (
      <button type="button" onClick={() => onPage(action.value)} className={className} style={style}>
        {action.label}
        <ArrowRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <a
      href={actionHref(action)}
      target={action.kind === 'url' || action.kind === 'whatsapp' ? '_blank' : undefined}
      rel="noreferrer"
      className={className}
      style={style}
    >
      {action.label}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function Picture({
  asset,
  className,
  treatment,
}: {
  asset?: AssetRef;
  className: string;
  treatment: SiteSpecV2['tokens']['imageTreatment'];
}) {
  const [failed, setFailed] = useState(false);
  if (!asset?.url) return null;

  const filter =
    treatment === 'cinematic'
      ? 'contrast(1.04) saturate(.88)'
      : treatment === 'high-contrast'
        ? 'contrast(1.12) saturate(1.05)'
        : treatment === 'soft'
          ? 'contrast(.96) saturate(.9)'
          : undefined;

  const absolute = className.includes('absolute');

  return (
    <figure
      className={`${absolute ? 'absolute inset-0' : 'relative'} h-full w-full overflow-hidden`}
    >
      {failed ? (
        <div
          role="img"
          aria-label={asset.alt || 'Imagem indisponível'}
          className="grid h-full min-h-[180px] w-full place-items-center bg-gradient-to-br from-slate-800 to-slate-950 px-5 text-center text-xs text-white/55"
        >
          <span>Imagem indisponível</span>
        </div>
      ) : (
        <img
          src={asset.url}
          alt={asset.alt}
          className={className}
          style={{ filter }}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      {asset.illustrative && !failed && (
        <figcaption className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-1 text-[9px] text-white/80 backdrop-blur">
          Imagem ilustrativa
        </figcaption>
      )}
    </figure>
  );
}

function Hero({
  block,
  spec,
  onPage,
}: {
  block: SiteBlockV2;
  spec: SiteSpecV2;
  onPage: (id: string) => void;
}) {
  const media = block.media || [];
  const p = spec.tokens.colors;
  const radius = radiusClass(spec.tokens.radius);
  const commonCopy = (
    <div className="relative z-10 max-w-3xl">
      {block.eyebrow && (
        <div
          className="mb-4 text-[10px] font-black uppercase tracking-[.2em]"
          style={{ color: p.accent }}
        >
          {block.eyebrow}
        </div>
      )}
      <h1
        className="text-4xl font-black leading-[.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
        style={{ fontFamily: spec.tokens.typography.display }}
      >
        {block.title}
      </h1>
      {block.body && (
        <p className="mt-5 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: p.muted }}>
          {block.body}
        </p>
      )}
      <div className="mt-7 flex flex-wrap gap-3">
        <Action action={block.primaryAction} spec={spec} onPage={onPage} />
        <Action action={block.secondaryAction} spec={spec} onPage={onPage} secondary />
      </div>
    </div>
  );

  if (block.variant === 'fullscreen') {
    return (
      <section className="relative min-h-[68vh] overflow-hidden sm:min-h-[76vh]">
        {media[0] ? (
          <Picture
            asset={media[0]}
            className="absolute inset-0 h-full w-full object-cover"
            treatment={spec.tokens.imageTreatment}
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: media[0]
              ? 'linear-gradient(90deg, rgba(0,0,0,.78), rgba(0,0,0,.22))'
              : `radial-gradient(circle at 80% 20%, ${p.primary}55, transparent 35%), ${p.background}`,
          }}
        />
        <div className="relative mx-auto flex min-h-[68vh] max-w-7xl items-end px-5 py-12 sm:min-h-[76vh] sm:px-8 sm:py-16">
          <div className="text-white [&_p]:text-white/70">{commonCopy}</div>
        </div>
      </section>
    );
  }

  if (block.variant === 'cinematic') {
    return (
      <section className={`px-4 ${sectionSpacing(spec.tokens.density)} sm:px-6`}>
        <div className="mx-auto max-w-7xl">
          <div className={`relative min-h-[520px] overflow-hidden ${radius}`}>
            {media[0] ? (
              <Picture
                asset={media[0]}
                className="absolute inset-0 h-full w-full object-cover"
                treatment={spec.tokens.imageTreatment}
              />
            ) : null}
            <div
              className="absolute inset-0"
              style={{
                background: media[0]
                  ? 'linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.12))'
                  : `linear-gradient(135deg, ${p.surface}, ${p.background})`,
              }}
            />
            <div className="relative flex min-h-[520px] items-end p-7 sm:p-10 lg:p-14">
              <div className={media[0] ? 'text-white [&_p]:text-white/70' : ''}>{commonCopy}</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (block.variant === 'asymmetric') {
    return (
      <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 lg:pr-8">{commonCopy}</div>
          <div className="grid min-h-[440px] grid-cols-7 grid-rows-7 gap-3 lg:col-span-5">
            <div className={`col-span-5 row-span-5 overflow-hidden ${radius}`} style={{ background: p.surface }}>
              <Picture asset={media[0]} className="h-full w-full object-cover" treatment={spec.tokens.imageTreatment} />
            </div>
            <div className={`col-span-4 col-start-4 row-span-4 row-start-4 overflow-hidden border ${radius}`} style={{ background: p.surfaceAlt, borderColor: p.border }}>
              <Picture asset={media[1] || media[0]} className="h-full w-full object-cover" treatment={spec.tokens.imageTreatment} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        {commonCopy}
        <div
          className={`min-h-[390px] overflow-hidden border ${radius}`}
          style={{ background: p.surface, borderColor: p.border }}
        >
          <Picture asset={media[0]} className="h-full min-h-[390px] w-full object-cover" treatment={spec.tokens.imageTreatment} />
        </div>
      </div>
    </section>
  );
}

function Intro({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const radius = radiusClass(spec.tokens.radius);
  const items = block.items || [];

  if (block.variant === 'editorial') {
    return (
      <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: p.accent }}>
            {block.eyebrow || 'Sobre'}
          </div>
          <div>
            <h2
              className="max-w-4xl text-3xl font-black tracking-[-.035em] sm:text-5xl"
              style={{ fontFamily: spec.tokens.typography.display }}
            >
              {block.title}
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 sm:text-base" style={{ color: p.muted }}>
              {block.body}
            </p>
            {items.length > 0 && (
              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                {items.map((item: any, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.accent }} />
                    <span>{String(item.text || item.title || '')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className={`mx-auto grid max-w-7xl gap-8 border p-6 sm:p-9 lg:grid-cols-2 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: p.accent }}>
            {block.eyebrow || 'Sobre'}
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-tight" style={{ fontFamily: spec.tokens.typography.display }}>
            {block.title}
          </h2>
          <p className="mt-4 text-sm leading-7" style={{ color: p.muted }}>{block.body}</p>
        </div>
        <div className="grid content-start gap-2">
          {items.map((item: any, index) => (
            <div key={index} className={`flex items-center gap-3 border px-4 py-3 ${radius}`} style={{ borderColor: p.border, background: p.background }}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white" style={{ background: p.primary }}>
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold">{String(item.text || item.title || '')}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services({
  block,
  spec,
  onPage,
}: {
  block: SiteBlockV2;
  spec: SiteSpecV2;
  onPage: (id: string) => void;
}) {
  const p = spec.tokens.colors;
  const items = block.items || [];
  const media = block.media || [];
  const radius = radiusClass(spec.tokens.radius);

  if (block.variant === 'editorial-list') {
    return (
      <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: p.accent }}>{block.eyebrow || 'Serviços'}</div>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl" style={{ fontFamily: spec.tokens.typography.display }}>{block.title}</h2>
              <p className="mt-4 text-sm leading-7" style={{ color: p.muted }}>{block.body}</p>
            </div>
            <div className="divide-y" style={{ borderColor: p.border }}>
              {items.map((item: any, index) => (
                <article key={index} className="grid gap-3 py-5 sm:grid-cols-[64px_1fr]">
                  <div className="font-mono text-xs" style={{ color: p.muted }}>{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <h3 className="text-xl font-black">{String(item.title || item.name || '')}</h3>
                    <p className="mt-2 text-sm leading-6" style={{ color: p.muted }}>{String(item.description || '')}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-7"><Action action={block.primaryAction} spec={spec} onPage={onPage} /></div>
        </div>
      </section>
    );
  }

  if (block.variant === 'alternating') {
    return (
      <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
        <div className="mx-auto max-w-7xl space-y-6">
          {items.map((item: any, index) => (
            <article
              key={index}
              className={`grid overflow-hidden border lg:grid-cols-2 ${radius}`}
              style={{ background: p.surface, borderColor: p.border }}
            >
              <div className={index % 2 ? 'lg:order-2' : ''}>
                {media[index] ? (
                  <Picture asset={media[index]} className="h-full min-h-[280px] w-full object-cover" treatment={spec.tokens.imageTreatment} />
                ) : (
                  <div className="h-full min-h-[280px]" style={{ background: p.surfaceAlt }} />
                )}
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <div className="font-mono text-[10px]" style={{ color: p.accent }}>0{index + 1}</div>
                <h3 className="mt-3 text-2xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>{String(item.title || item.name || '')}</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: p.muted }}>{String(item.description || '')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (block.variant === 'spotlight') {
    const [first, ...rest] = items;
    return (
      <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <article className={`border p-7 sm:p-10 ${radius}`} style={{ background: p.primary, borderColor: p.primary, color: '#fff' }}>
            <div className="text-[10px] font-black uppercase tracking-[.2em] text-white/60">Destaque</div>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">{String(first?.title || first?.name || block.title || '')}</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">{String(first?.description || block.body || '')}</p>
            <div className="mt-7"><Action action={block.primaryAction} spec={spec} onPage={onPage} invert /></div>
          </article>
          <div className="grid gap-4">
            {rest.map((item: any, index) => (
              <article key={index} className={`border p-5 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
                <h3 className="text-lg font-black">{String(item.title || item.name || '')}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: p.muted }}>{String(item.description || '')}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <div className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: p.accent }}>{block.eyebrow || 'Serviços'}</div>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl" style={{ fontFamily: spec.tokens.typography.display }}>{block.title}</h2>
          {block.body && <p className="mt-3 text-sm leading-7" style={{ color: p.muted }}>{block.body}</p>}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item: any, index) => (
            <article key={index} className={`border p-5 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
              <div className="font-mono text-[10px]" style={{ color: p.accent }}>0{index + 1}</div>
              <h3 className="mt-4 text-lg font-black">{String(item.title || item.name || '')}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: p.muted }}>{String(item.description || '')}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const media = block.media || [];
  const radius = radiusClass(spec.tokens.radius);
  const [index, setIndex] = useState(0);

  if (!media.length) return null;

  if (block.variant === 'carousel') {
    const current = media[index % media.length];
    return (
      <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>{block.title || 'Galeria'}</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIndex((value) => (value - 1 + media.length) % media.length)} className={`grid h-10 w-10 place-items-center border ${radius}`} style={{ borderColor: p.border }}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIndex((value) => (value + 1) % media.length)} className={`grid h-10 w-10 place-items-center border ${radius}`} style={{ borderColor: p.border }}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={`mt-6 overflow-hidden border ${radius}`} style={{ borderColor: p.border, background: p.surface }}>
            <Picture asset={current} className="aspect-[16/9] w-full object-cover" treatment={spec.tokens.imageTreatment} />
          </div>
          <div className="mt-3 text-[10px]" style={{ color: p.muted }}>{current.attribution}</div>
        </div>
      </section>
    );
  }

  if (block.variant === 'filmstrip') {
    return (
      <section className={sectionSpacing(spec.tokens.density)}>
        <div className="px-5 sm:px-8">
          <h2 className="mx-auto max-w-7xl text-3xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>{block.title || 'Galeria'}</h2>
        </div>
        <div className="mt-6 flex snap-x gap-3 overflow-x-auto px-5 pb-3 sm:px-8">
          {media.map((asset, idx) => (
            <div key={asset.url + idx} className={`w-[72vw] max-w-xl shrink-0 snap-center overflow-hidden border ${radius}`} style={{ borderColor: p.border, background: p.surface }}>
              <Picture asset={asset} className="aspect-[4/3] w-full object-cover" treatment={spec.tokens.imageTreatment} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>{block.title || 'Galeria'}</h2>
        <div className="mt-6 grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] lg:grid-cols-4">
          {media.slice(0, 9).map((asset, idx) => (
            <div
              key={asset.url + idx}
              className={`overflow-hidden ${radius} ${idx === 0 ? 'col-span-2 row-span-2' : idx % 5 === 0 ? 'col-span-2' : ''}`}
              style={{ background: p.surface }}
            >
              <Picture asset={asset} className="h-full w-full object-cover" treatment={spec.tokens.imageTreatment} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reviews({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const items = block.items || [];
  const radius = radiusClass(spec.tokens.radius);
  if (!items.length) return null;

  if (block.variant === 'feature') {
    const feature: any = items[0];
    return (
      <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
        <div className={`mx-auto max-w-5xl border p-7 text-center sm:p-12 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
          <Quote className="mx-auto h-7 w-7" style={{ color: p.accent }} />
          <p className="mx-auto mt-5 max-w-3xl text-xl font-semibold leading-9 sm:text-3xl" style={{ fontFamily: spec.tokens.typography.display }}>
            “{String(feature.text || '')}”
          </p>
          <div className="mt-5 text-sm font-black">{String(feature.author || 'Cliente')}</div>
          <div className="mt-2 flex justify-center gap-1" style={{ color: '#F59E0B' }}>
            {Array.from({ length: Math.max(1, Math.min(5, Number(feature.rating || 5))) }).map((_, idx) => <Star key={idx} className="h-3.5 w-3.5 fill-current" />)}
          </div>
          <div className="mt-2 text-[9px]" style={{ color: p.muted }}>{String(feature.source || '')}</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>{block.title || 'Avaliações'}</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any, index) => (
            <article key={index} className={`border p-5 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
              <div className="flex gap-1" style={{ color: '#F59E0B' }}>
                {Array.from({ length: Math.max(1, Math.min(5, Number(item.rating || 5))) }).map((_, idx) => <Star key={idx} className="h-3 w-3 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-6" style={{ color: p.muted }}>“{String(item.text || '')}”</p>
              <div className="mt-4 text-xs font-black">{String(item.author || 'Cliente')}</div>
              <div className="mt-1 text-[9px]" style={{ color: p.muted }}>{String(item.source || '')}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const items = block.items || [];
  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mx-auto grid max-w-7xl divide-y border-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4" style={{ borderColor: p.border }}>
        {items.map((item: any, index) => (
          <div key={index} className="p-5">
            <div className="font-mono text-2xl font-black">{String(item.value || '')}</div>
            <div className="mt-1 text-[10px] leading-4" style={{ color: p.muted }}>{String(item.label || '')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Projects({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const media = block.media || [];
  const items = block.items || [];
  const list = media.length
    ? media.map((asset, index) => ({ asset, title: String((items[index] as any)?.title || `Projeto ${index + 1}`) }))
    : items.map((item: any) => ({ asset: undefined, title: String(item.title || item.name || '') }));
  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black sm:text-4xl" style={{ fontFamily: spec.tokens.typography.display }}>{block.title || 'Projetos'}</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {list.slice(0, 8).map((item, index) => (
            <article key={index} className="group relative min-h-[300px] overflow-hidden" style={{ background: p.surface }}>
              {item.asset && <Picture asset={item.asset} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" treatment={spec.tokens.imageTreatment} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-lg font-black">{item.title}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const items = block.items || [];
  const radius = radiusClass(spec.tokens.radius);
  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>{block.title || 'Perguntas frequentes'}</h2>
        <div className="mt-6 space-y-2">
          {items.map((item: any, index) => (
            <details key={index} className={`border p-4 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
              <summary className="cursor-pointer text-sm font-bold">{String(item.question || item.title || '')}</summary>
              <p className="mt-3 text-sm leading-6" style={{ color: p.muted }}>{String(item.answer || item.description || '')}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({
  block,
  spec,
  onPage,
}: {
  block: SiteBlockV2;
  spec: SiteSpecV2;
  onPage: (id: string) => void;
}) {
  const p = spec.tokens.colors;
  const minimal = block.variant === 'minimal';
  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div
        className={`mx-auto max-w-7xl p-7 sm:p-11 ${radiusClass(spec.tokens.radius)} ${minimal ? 'border' : ''}`}
        style={
          minimal
            ? { background: p.surface, borderColor: p.border }
            : { background: p.primary, color: contrastText(p.primary) }
        }
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-3xl font-black sm:text-4xl" style={{ fontFamily: spec.tokens.typography.display }}>{block.title}</h2>
            {block.body && (
              <p
                className="mt-3 max-w-2xl text-sm leading-6"
                style={
                  minimal
                    ? { color: p.muted }
                    : {
                        color:
                          contrastText(p.primary) === '#FFFFFF'
                            ? 'rgba(255,255,255,.76)'
                            : 'rgba(17,19,21,.72)',
                      }
                }
              >
                {block.body}
              </p>
            )}
          </div>
          <Action action={block.primaryAction} spec={spec} onPage={onPage} secondary={minimal} invert={!minimal} />
        </div>
      </div>
    </section>
  );
}

function Contact({
  block,
  spec,
  onPage,
}: {
  block: SiteBlockV2;
  spec: SiteSpecV2;
  onPage: (id: string) => void;
}) {
  const p = spec.tokens.colors;
  const c = spec.contact;
  const radius = radiusClass(spec.tokens.radius);
  const cards = [
    c.phone && { icon: Phone, label: 'Telefone', text: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, '')}` },
    c.email && { icon: Mail, label: 'E-mail', text: c.email, href: `mailto:${c.email}` },
    c.instagram && { icon: Instagram, label: 'Instagram', text: c.instagram, href: c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram.replace('@', '')}` },
    c.address && { icon: MapPin, label: 'Localização', text: c.address, href: c.mapsUrl || undefined },
  ].filter(Boolean) as Array<{ icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; text: string; href?: string }>;

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <div className={`p-7 sm:p-10 ${radius}`} style={{ background: p.primary, color: contrastText(p.primary) }}>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-white/60">{block.eyebrow || 'Contato'}</div>
          <h2 className="mt-3 text-4xl font-black tracking-tight" style={{ fontFamily: spec.tokens.typography.display }}>{block.title || 'Fale com a equipe'}</h2>
          {block.body && (
            <p
              className="mt-3 text-sm leading-7"
              style={{
                color:
                  contrastText(p.primary) === '#FFFFFF'
                    ? 'rgba(255,255,255,.76)'
                    : 'rgba(17,19,21,.72)',
              }}
            >
              {block.body}
            </p>
          )}
          <div className="mt-6">
            <Action action={block.primaryAction} spec={spec} onPage={onPage} secondary />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((item) => {
            const Icon = item.icon;
            const element = (
              <>
                <Icon className="h-4 w-4" style={{ color: p.accent }} />
                <div className="mt-3 text-[9px] uppercase tracking-wider" style={{ color: p.muted }}>{item.label}</div>
                <div className="mt-1 break-words text-sm font-black">{item.text}</div>
              </>
            );
            return item.href ? (
              <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={`border p-4 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
                {element}
              </a>
            ) : (
              <div key={item.label} className={`border p-4 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
                {element}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LeadForm({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const radius = radiusClass(spec.tokens.radius);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const lines = [
      block.title || 'Solicitação pelo site',
      name ? `Nome: ${name}` : '',
      contact ? `Contato: ${contact}` : '',
      message ? `Mensagem: ${message}` : '',
    ].filter(Boolean);
    const body = lines.join('\n');

    if (spec.contact.whatsapp) {
      const digits = spec.contact.whatsapp.replace(/\D/g, '');
      const number = digits.startsWith('55') ? digits : `55${digits}`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (spec.contact.email) {
      window.location.href = `mailto:${spec.contact.email}?subject=${encodeURIComponent(
        block.title || 'Contato pelo site'
      )}&body=${encodeURIComponent(body)}`;
    }
  };

  if (!spec.contact.whatsapp && !spec.contact.email) return null;

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className={`mx-auto max-w-4xl border p-6 sm:p-8 ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
        <div className="max-w-2xl">
          <div className="text-[10px] font-black uppercase tracking-[.18em]" style={{ color: p.accent }}>
            {block.eyebrow || 'Contato rápido'}
          </div>
          <h2 className="mt-2 text-3xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>
            {block.title || 'Conte um pouco do que você precisa'}
          </h2>
          {block.body && <p className="mt-3 text-sm leading-6" style={{ color: p.muted }}>{block.body}</p>}
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-bold" style={{ color: p.muted }}>
            Nome
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className={`mt-1.5 h-11 w-full border bg-transparent px-3 text-sm outline-none ${radius}`}
              style={{ borderColor: p.border, color: p.text }}
            />
          </label>
          <label className="text-[10px] font-bold" style={{ color: p.muted }}>
            Telefone ou e-mail
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              required
              className={`mt-1.5 h-11 w-full border bg-transparent px-3 text-sm outline-none ${radius}`}
              style={{ borderColor: p.border, color: p.text }}
            />
          </label>
          <label className="text-[10px] font-bold sm:col-span-2" style={{ color: p.muted }}>
            Mensagem
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className={`mt-1.5 w-full resize-none border bg-transparent p-3 text-sm outline-none ${radius}`}
              style={{ borderColor: p.border, color: p.text }}
            />
          </label>
          <button
            type="submit"
            className={`inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-black sm:col-span-2 ${radius}`}
            style={{ background: p.primary, color: contrastText(p.primary) }}
          >
            <Send className="h-4 w-4" />
            {String(block.options?.submitLabel || 'Enviar solicitação')}
          </button>
        </form>
      </div>
    </section>
  );
}

function LocationBlock({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const radius = radiusClass(spec.tokens.radius);
  if (!spec.contact.address) return null;

  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className={`mx-auto grid max-w-7xl gap-5 border p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center ${radius}`} style={{ background: p.surface, borderColor: p.border }}>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em]" style={{ color: p.accent }}>
            <MapPin className="h-4 w-4" />
            Localização
          </div>
          <h2 className="mt-3 text-2xl font-black" style={{ fontFamily: spec.tokens.typography.display }}>
            {block.title || 'Onde estamos'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: p.muted }}>
            {spec.contact.address}
          </p>
        </div>
        {spec.contact.mapsUrl && (
          <a
            href={spec.contact.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex min-h-11 items-center justify-center gap-2 border px-5 text-sm font-bold ${radius}`}
            style={{ borderColor: p.border, color: p.text }}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir no mapa
          </a>
        )}
      </div>
    </section>
  );
}

function GenericTeam({ block, spec }: { block: SiteBlockV2; spec: SiteSpecV2 }) {
  const p = spec.tokens.colors;
  const items = block.items || [];
  if (!items.length) return null;
  return (
    <section className={`px-5 ${sectionSpacing(spec.tokens.density)} sm:px-8`}>
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black">{block.title || 'Equipe'}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item: any, index) => (
            <article key={index} className="border p-5" style={{ background: p.surface, borderColor: p.border }}>
              <div className="font-black">{String(item.name || item.title || '')}</div>
              <div className="mt-1 text-sm" style={{ color: p.muted }}>{String(item.role || item.description || '')}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const componentRegistry: Record<
  SiteBlockV2['type'],
  React.ComponentType<any>
> = {
  hero: Hero,
  intro: Intro,
  services: Services,
  gallery: Gallery,
  reviews: Reviews,
  stats: Stats,
  projects: Projects,
  team: GenericTeam,
  faq: FAQ,
  form: LeadForm,
  map: LocationBlock,
  cta: CTA,
  contact: Contact,
};

export function SiteRendererV2({
  spec,
  publicMode = false,
  initialPageId,
  forceAllPages = false,
}: RendererProps) {
  const reduceMotion = useReducedMotion();
  const [activePageId, setActivePageId] = useState(
    initialPageId && spec.pages.some((page) => page.id === initialPageId)
      ? initialPageId
      : spec.pages[0]?.id || 'home'
  );
  const p = spec.tokens.colors;
  const page = useMemo(
    () => spec.pages.find((item) => item.id === activePageId) || spec.pages[0],
    [spec.pages, activePageId]
  );

  useEffect(() => {
    if (!publicMode || !page) return;
    document.title = `${page.title || page.label} | ${spec.brand.name}`;

    let description = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = spec.seo.description;
  }, [publicMode, page, spec.brand.name, spec.seo.description]);

  useEffect(() => {
    if (!publicMode) return;
    const fromUrl = new URL(window.location.href).searchParams.get('page');
    if (fromUrl && spec.pages.some((item) => item.id === fromUrl)) setActivePageId(fromUrl);

    const onPop = () => {
      const next = new URL(window.location.href).searchParams.get('page');
      setActivePageId(next && spec.pages.some((item) => item.id === next) ? next : spec.pages[0]?.id || 'home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [publicMode, spec.pages]);

  const navigate = (pageId: string) => {
    if (!spec.pages.some((item) => item.id === pageId)) return;
    setActivePageId(pageId);
    if (publicMode) {
      const url = new URL(window.location.href);
      if (pageId === spec.pages[0]?.id) url.searchParams.delete('page');
      else url.searchParams.set('page', pageId);
      window.history.pushState({}, '', url);
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const renderBlock = (block: SiteBlockV2) => {
    const Component = componentRegistry[block.type];
    if (!Component) return null;
    return (
      <div
        key={block.id}
        data-site-block-type={block.type}
        data-site-block-variant={block.variant}
      >
        <Component block={block} spec={spec} onPage={navigate} />
      </div>
    );
  };

  const navStyle = String(
    spec.pages
      .flatMap((item) => item.blocks)
      .find((block) => block.type === 'hero')
      ?.options?.navStyle || 'minimal'
  );

  const headerStyle =
    navStyle === 'floating'
      ? {
          background: p.surface + 'E8',
          borderColor: p.border,
          margin: '10px auto 0',
          width: 'min(1180px, calc(100% - 20px))',
          borderRadius: '18px',
        }
      : {
          background: p.background + 'F4',
          borderColor: p.border,
        };

  if (forceAllPages) {
    return (
      <div style={{ background: p.background, color: p.text, fontFamily: spec.tokens.typography.body }}>
        {spec.pages.map((item, index) => (
          <section key={item.id} className="site-print-page min-h-screen" style={{ breakAfter: index < spec.pages.length - 1 ? 'page' : 'auto' }}>
            <div className="border-b px-6 py-4" style={{ borderColor: p.border }}>
              <div className="text-base font-black">{spec.brand.name}</div>
              <div className="mt-1 text-[10px]" style={{ color: p.muted }}>{item.label}</div>
            </div>
            {item.blocks.map(renderBlock)}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div
      className="min-h-full"
      style={{
        background: p.background,
        color: p.text,
        fontFamily: spec.tokens.typography.body,
      }}
    >
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur-xl ${navStyle === 'floating' ? 'border' : ''}`}
        style={headerStyle}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            {spec.brand.logo?.url ? (
              <img
                src={spec.brand.logo.url}
                alt={spec.brand.logo.alt || `Logo ${spec.brand.name}`}
                className="h-9 w-9 rounded-lg bg-white object-contain p-1"
              />
            ) : (
              <div
                className="grid h-9 w-9 place-items-center rounded-lg text-xs font-black text-white"
                style={{ background: p.primary }}
              >
                {spec.brand.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-black">{spec.brand.name}</div>
              <div className="truncate text-[9px]" style={{ color: p.muted }}>
                {spec.brand.tagline}
              </div>
            </div>
          </div>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {spec.navigation.map((item) => (
              <button
                key={item.pageId}
                type="button"
                onClick={() => navigate(item.pageId)}
                className="rounded-lg px-3 py-2 text-xs font-bold transition"
                style={{
                  background: activePageId === item.pageId ? p.primary + '18' : 'transparent',
                  color: activePageId === item.pageId ? p.accent : p.muted,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {spec.contact.whatsapp && (
            <a
              href={actionHref({
                label: 'WhatsApp',
                kind: 'whatsapp',
                value: spec.contact.whatsapp,
              })}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black md:ml-2"
              style={{ background: p.primary, color: contrastText(p.primary) }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          )}
        </div>

        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {spec.navigation.map((item) => (
            <button
              key={item.pageId}
              type="button"
              onClick={() => navigate(item.pageId)}
              className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold"
              style={{
                background: activePageId === item.pageId ? p.primary : p.surface,
                color: activePageId === item.pageId ? '#fff' : p.muted,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={page?.id}
          data-site-page={page?.id}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
          className="min-h-[520px]"
        >
          {page?.blocks.map(renderBlock)}
        </motion.main>
      </AnimatePresence>

      <footer className="border-t px-5 py-6 text-center text-[10px]" style={{ borderColor: p.border, color: p.muted }}>
        <div>{spec.brand.name}</div>
        <div className="mt-1 text-[8px]">{spec.disclosure}</div>
      </footer>
    </div>
  );
}
