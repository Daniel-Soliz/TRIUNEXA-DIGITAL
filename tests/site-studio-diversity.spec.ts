import { expect, test } from '@playwright/test';
import {
  chooseDistinctDesign,
  designSimilarity,
  fingerprintSiteDesign,
  type DesignSpecInput,
} from '../supabase/functions/truinexa-site-studio/designDiversity';

function fixture(): DesignSpecInput {
  return {
    pages: [
      {
        id: 'home',
        blocks: [
          { type: 'hero', variant: 'editorial', media: [{ url: 'https://example.com/hero.jpg' }], options: { navStyle: 'minimal' } },
          { type: 'intro', variant: 'split' },
          { type: 'gallery', variant: 'mosaic', media: [{ url: 'https://example.com/gallery.jpg' }] },
          { type: 'cta', variant: 'banner' },
        ],
      },
      { id: 'services', blocks: [{ type: 'services', variant: 'grid' }] },
      { id: 'contact', blocks: [{ type: 'contact', variant: 'split' }] },
    ],
    navigation: [
      { pageId: 'home', label: 'Início' },
      { pageId: 'services', label: 'Serviços' },
      { pageId: 'contact', label: 'Contato' },
    ],
    tokens: {
      typography: { display: 'Georgia, serif', scale: 'expressive' },
      density: 'airy',
      radius: 'soft',
      imageTreatment: 'editorial',
      motion: 'subtle',
    },
  };
}

test('cores e copy não mascaram templates estruturais repetidos', () => {
  const first = fixture();
  const recolored = structuredClone(first);
  (recolored as any).brand = { name: 'Outra Empresa', tagline: 'Novo texto' };
  (recolored as any).tokens.colors = { primary: '#ff0000', background: '#ffffff' };

  expect(designSimilarity(first, recolored)).toBe(1);
  expect(fingerprintSiteDesign(first)).toEqual(fingerprintSiteDesign(recolored));
});

test('hero e arquitetura diferentes reduzem a similaridade estrutural', () => {
  const first = fixture();
  const alternative = structuredClone(first);
  alternative.pages![0].blocks![0].variant = 'magazine';
  alternative.pages![0].blocks![1].variant = 'statement';
  alternative.pages![0].blocks!.reverse();

  expect(designSimilarity(first, alternative)).toBeLessThan(0.83);
});

test('decisão antitemplate cria nova composição sem alterar dados originais', () => {
  const first = fixture();
  const untouched = structuredClone(first);
  const selected = chooseDistinctDesign(first, [structuredClone(first)], 'empresa:run-42');

  expect(selected.changed).toBe(true);
  expect(selected.compared).toBe(1);
  expect(selected.originalSimilarity).toBe(1);
  expect(selected.finalSimilarity).toBeLessThan(0.82);
  expect(selected.spec.pages![0].blocks![0].type).toBe('hero');
  expect(selected.spec.pages![0].blocks!.at(-1)?.type).toBe('cta');
  expect(first).toEqual(untouched);
});

test('sem mídia real não escolhe hero dependente de fotografia', () => {
  const first = fixture();
  first.pages![0].blocks![0].media = [];
  const selected = chooseDistinctDesign(first, [structuredClone(first)], 'empresa:sem-fotos');

  expect(['minimal-type', 'editorial', 'asymmetric'])
    .toContain(selected.spec.pages![0].blocks![0].variant);
});

test('sem colisão de portfólio preserva a composição da IA', () => {
  const first = fixture();
  const selected = chooseDistinctDesign(first, [], 'qualquer');

  expect(selected.changed).toBe(false);
  expect(selected.originalSimilarity).toBe(0);
  expect(selected.finalSimilarity).toBe(0);
  expect(selected.spec).toEqual(first);
});
