/**
 * Site Studio 4.0 — structural design diversity.
 * Pure module: no user data, external services, or executable model output.
 * Colors and copy intentionally do NOT contribute to similarity: re-skinning a
 * template must not count as a different composition.
 */
type Block = {
  type?: string;
  variant?: string;
  media?: Array<{ url?: string }>;
  options?: { navStyle?: string };
};
type Page = { id?: string; blocks?: Block[] };
export type DesignSpecInput = {
  pages?: Page[];
  tokens?: {
    typography?: { display?: string; scale?: string };
    radius?: string;
    density?: string;
    imageTreatment?: string;
    motion?: string;
  };
  navigation?: Array<{ pageId?: string }>;
};

export type DesignFingerprint = {
  pages: string[];
  homeTypes: string[];
  homeVariants: string[];
  allTypes: string[];
  allVariants: string[];
  hero: string;
  services: string;
  gallery: string;
  intro: string;
  navigation: string;
  typography: string;
  density: string;
  radius: string;
  imageTreatment: string;
  motion: string;
  photography: string;
};

function hash(input: string): number {
  let result = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    result ^= input.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function orderedSimilarity(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const previous = new Array<number>(b.length + 1).fill(0);
  for (const item of a) {
    let diagonal = 0;
    for (let j = 1; j <= b.length; j += 1) {
      const old = previous[j];
      previous[j] = item === b[j - 1]
        ? diagonal + 1
        : Math.max(previous[j], previous[j - 1]);
      diagonal = old;
    }
  }
  return previous[b.length] / Math.max(a.length, b.length);
}

function same(a: string, b: string): number {
  return a === b ? 1 : 0;
}

export function fingerprintSiteDesign(spec: DesignSpecInput): DesignFingerprint {
  const pages = Array.isArray(spec?.pages) ? spec.pages : [];
  const home = pages.find((page) => page.id === 'home') || pages[0];
  const homeBlocks = home?.blocks || [];
  const all = pages.flatMap((page) => (page.blocks || []).map((block) => ({
    ...block,
    pageId: page.id || '',
  })));
  const first = (type: string) => all.find((block) => block.type === type);
  const hero = first('hero');
  const images = all.reduce((count, block) => count + (block.media || []).filter((asset) => Boolean(asset.url)).length, 0);
  const blocksWithImages = all.filter((block) => (block.media || []).some((asset) => Boolean(asset.url))).length;
  return {
    pages: pages.map((page) => page.id || ''),
    homeTypes: homeBlocks.map((block) => block.type || ''),
    homeVariants: homeBlocks.map((block) => (block.type || '') + ':' + (block.variant || '')),
    allTypes: all.map((block) => block.pageId + ':' + (block.type || '')),
    allVariants: all.map((block) => block.pageId + ':' + (block.type || '') + ':' + (block.variant || '')),
    hero: hero?.variant || 'none',
    services: first('services')?.variant || 'none',
    gallery: first('gallery')?.variant || 'none',
    intro: first('intro')?.variant || 'none',
    navigation: hero?.options?.navStyle || 'default',
    typography: (spec.tokens?.typography?.display || 'default').toLowerCase().trim() +
      ':' + (spec.tokens?.typography?.scale || 'balanced'),
    density: spec.tokens?.density || 'balanced',
    radius: spec.tokens?.radius || 'soft',
    imageTreatment: spec.tokens?.imageTreatment || 'natural',
    motion: spec.tokens?.motion || 'subtle',
    photography: images === 0 ? 'none' : blocksWithImages > all.length / 2 ? 'dominant' : 'selective',
  };
}

/** 0 = different visual structure; 1 = effectively the same composition. */
export function designSimilarity(left: DesignSpecInput, right: DesignSpecInput): number {
  const a = fingerprintSiteDesign(left);
  const b = fingerprintSiteDesign(right);
  const metrics: Array<[number, number]> = [
    [16, orderedSimilarity(a.homeTypes, b.homeTypes)],
    [12, orderedSimilarity(a.allTypes, b.allTypes)],
    [20, orderedSimilarity(a.homeVariants, b.homeVariants)],
    [13, orderedSimilarity(a.allVariants, b.allVariants)],
    [11, same(a.hero, b.hero)],
    [6, same(a.services, b.services)],
    [4, same(a.gallery, b.gallery)],
    [3, same(a.intro, b.intro)],
    [4, orderedSimilarity(a.pages, b.pages)],
    [3, same(a.navigation, b.navigation)],
    [3, same(a.typography, b.typography)],
    [2, same(a.density, b.density)],
    [1, same(a.radius, b.radius)],
    [2, same(a.imageTreatment, b.imageTreatment)],
    [1, same(a.motion, b.motion)],
    [2, same(a.photography, b.photography)],
  ];
  const total = metrics.reduce((sum, pair) => sum + pair[0], 0);
  return Number((metrics.reduce((sum, pair) => sum + pair[0] * pair[1], 0) / total).toFixed(4));
}

function variantFor(current: string, choices: string[], attempt: number, seed: number): string {
  const alternatives = choices.filter((choice) => choice !== current);
  if (!alternatives.length) return current;
  return alternatives[(seed + attempt) % alternatives.length];
}

function generateCandidate<T extends DesignSpecInput>(original: T, attempt: number, seed: number): T {
  const next = structuredClone(original);
  const pages = next.pages || [];
  const blocks = pages.flatMap((page) => page.blocks || []);
  const hero = blocks.find((block) => block.type === 'hero');
  const hasHeroPhoto = Boolean(hero?.media?.some((asset) => asset.url));

  if (hero) {
    const choices = hasHeroPhoto
      ? ['cinematic', 'editorial', 'fullscreen', 'asymmetric', 'magazine', 'layered', 'minimal-type']
      : ['minimal-type', 'editorial', 'asymmetric'];
    hero.variant = variantFor(hero.variant || '', choices, attempt, seed);
    if (hero.options) {
      hero.options.navStyle = variantFor(hero.options.navStyle || '', ['minimal', 'floating', 'solid'], attempt, seed);
    }
  }

  for (const block of blocks) {
    if (block.type === 'services') {
      block.variant = variantFor(block.variant || '', ['editorial-list', 'grid', 'alternating', 'spotlight', 'bento', 'timeline'], attempt + 1, seed);
    } else if (block.type === 'intro') {
      block.variant = variantFor(block.variant || '', ['split', 'editorial', 'statement'], attempt + 2, seed);
    } else if (block.type === 'gallery') {
      block.variant = variantFor(block.variant || '', ['mosaic', 'carousel', 'filmstrip', 'editorial-grid'], attempt + 3, seed);
    } else if (block.type === 'cta') {
      block.variant = variantFor(block.variant || '', ['minimal', 'banner', 'split-cta'], attempt + 4, seed);
    }
  }

  // Respect the information architecture: keep hero first and final CTA last.
  // Reorder existing supporting sections only; never fabricate new content.
  const home = pages.find((page) => page.id === 'home');
  if (home && (home.blocks || []).length >= 4 && attempt % 2 === 0) {
    const existing = home.blocks || [];
    const first = existing[0];
    const last = existing[existing.length - 1];
    const middle = existing.slice(1, -1);
    home.blocks = [first, ...middle.slice(1), middle[0], last];
  }

  // Page order can vary without affecting stable page IDs/actions.
  if (attempt % 3 === 0 && pages.length >= 4) {
    const movable = pages.slice(1, -1);
    const rotated = [...movable.slice(1), movable[0]];
    next.pages = [pages[0], ...rotated, pages[pages.length - 1]];
    if (next.navigation) {
      next.navigation = (next.pages || []).map((page) => ({
        pageId: page.id,
        label: original.navigation?.find((item) => item.pageId === page.id)?.label,
      })) as typeof next.navigation;
    }
  }
  return next;
}

export type DiversityDecision<T> = {
  spec: T;
  originalSimilarity: number;
  finalSimilarity: number;
  changed: boolean;
  compared: number;
  threshold: number;
};

/** Find a lower-similarity safe composition; return honest scores if no variation succeeds. */
export function chooseDistinctDesign<T extends DesignSpecInput>(
  spec: T,
  recent: DesignSpecInput[],
  seedText: string,
  threshold = 0.82,
): DiversityDecision<T> {
  const references = recent.filter((item) => Boolean(item?.pages?.length));
  const closest = (candidate: T) =>
    references.reduce((max, item) => Math.max(max, designSimilarity(candidate, item)), 0);
  const originalSimilarity = closest(spec);
  let best = spec;
  let bestSimilarity = originalSimilarity;
  let changed = false;

  if (bestSimilarity >= threshold) {
    const seed = hash(seedText);
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = generateCandidate(spec, attempt, seed);
      const similarity = closest(candidate);
      if (similarity < bestSimilarity) {
        bestSimilarity = similarity;
        best = candidate;
        changed = true;
      }
      if (bestSimilarity < threshold) break;
    }
  }
  return {
    spec: best,
    originalSimilarity,
    finalSimilarity: bestSimilarity,
    changed,
    compared: references.length,
    threshold,
  };
}
