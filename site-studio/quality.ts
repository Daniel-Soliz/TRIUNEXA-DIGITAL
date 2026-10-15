import { QualityReport, SiteSpecV2 } from './types';

function contrastScore(spec: SiteSpecV2) {
  const text = spec.tokens.colors.text.toLowerCase();
  const background = spec.tokens.colors.background.toLowerCase();
  if (text === background) return 0;
  const lightText = /#f|#e|white/.test(text);
  const darkBackground = /#0|#1|#2/.test(background);
  const darkText = /#0|#1|#2/.test(text);
  const lightBackground = /#f|#e|white/.test(background);
  return lightText === darkBackground || darkText === lightBackground ? 100 : 78;
}

export function evaluateSiteSpec(spec: SiteSpecV2): QualityReport {
  const checks: QualityReport['checks'] = [];
  const pages = spec.pages || [];
  const blocks = pages.flatMap((page) => page.blocks);
  const imageAssets = spec.assets.filter((asset) => asset.url);
  const verifiedImages = imageAssets.filter((asset) => asset.verified);
  const labels = new Set(spec.navigation.map((item) => item.pageId));

  const push = (id: string, label: string, score: number, detail: string) => {
    checks.push({ id, label, score, passed: score >= 70, detail });
  };

  push(
    'navigation',
    'Navegação',
    pages.length >= 2 && pages.every((page) => labels.has(page.id)) ? 100 : 55,
    `${pages.length} páginas e ${spec.navigation.length} itens de navegação.`
  );
  push(
    'differentiation',
    'Diferenciação de composição',
    new Set(blocks.map((block) => `${block.type}:${block.variant}`)).size >= 4 ? 94 : 62,
    `${new Set(blocks.map((block) => block.variant)).size} variações de composição utilizadas.`
  );
  push(
    'content',
    'Conteúdo comercial',
    blocks.filter((block) => block.title || block.body).length >= 3 ? 90 : 65,
    'Avalia presença de títulos, corpo e chamadas comerciais.'
  );
  push(
    'contact',
    'Conversão e contato',
    spec.contact.whatsapp || spec.contact.phone || spec.contact.email ? 100 : 40,
    'Verifica se existe um canal real de contato.'
  );
  push(
    'images',
    'Qualidade e origem das imagens',
    imageAssets.length === 0 ? 70 : verifiedImages.length === imageAssets.length ? 100 : 75,
    `${verifiedImages.length}/${imageAssets.length} imagens marcadas como verificadas.`
  );
  push(
    'accessibility',
    'Legibilidade e contraste',
    contrastScore(spec),
    'Validação estrutural de contraste entre tokens principais.'
  );
  push(
    'responsive',
    'Responsividade estrutural',
    blocks.every((block) => block.id && block.type && block.variant) ? 92 : 60,
    'Componentes V2 são responsivos por contrato do renderer.'
  );
  push(
    'integrity',
    'Integridade dos dados',
    blocks.some((block) => block.type === 'reviews') && !spec.pages.find((page) => page.id === 'reviews')
      ? 55
      : 100,
    'Evita exibir blocos sem página correspondente ou conteúdo não estruturado.'
  );

  const score = Math.round(checks.reduce((sum, check) => sum + check.score, 0) / checks.length);
  const fixes = checks
    .filter((check) => !check.passed)
    .map((check) => `Revisar: ${check.label} — ${check.detail}`);

  return {
    score,
    passed: score >= 78 && checks.every((check) => check.score >= 55),
    checks,
    fixes,
  };
}

export function autoRepairSiteSpec(spec: SiteSpecV2) {
  const next = structuredClone(spec);

  if (!next.navigation.length) {
    next.navigation = next.pages.map((page) => ({ pageId: page.id, label: page.label }));
  }

  const pageIds = new Set(next.pages.map((page) => page.id));
  next.navigation = next.navigation.filter((item) => pageIds.has(item.pageId));

  for (const asset of next.assets) {
    asset.alt = asset.alt?.trim() || `Imagem de ${next.brand.name}`;
  }

  if (!next.disclosure) {
    next.disclosure =
      'Demonstração comercial criada pela TRUINEXA • informações públicas verificadas quando disponíveis.';
  }

  return next;
}
