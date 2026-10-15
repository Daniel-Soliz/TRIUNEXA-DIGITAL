import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { chooseDistinctDesign, fingerprintSiteDesign } from "./designDiversity.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STAGES = [
  ["identify", "Identificando a empresa", 6],
  ["sources", "Verificando fontes", 18],
  ["briefing", "Construindo briefing", 30],
  ["strategy", "Definindo estratégia", 42],
  ["art", "Criando direções artísticas", 54],
  ["architecture", "Planejando páginas", 66],
  ["build", "Construindo componentes", 78],
  ["quality", "Validando qualidade", 90],
  ["finalize", "Preparando demonstração", 98],
];

const FAMILIES = [
  "editorial-premium",
  "corporate-professional",
  "luxury-experience",
  "modern-minimal",
  "creative-studio",
  "technology-premium",
  "local-business-pro",
  "visual-showcase",
];

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function txt(value: unknown) {
  return String(value || "").trim();
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  let key = legacy || "";
  if (!key && raw) {
    try {
      const parsed = JSON.parse(raw);
      key = parsed.default || Object.values(parsed)[0] || "";
    } catch {}
  }
  if (!url || !key) throw new Error("Configuração administrativa do Supabase indisponível.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getCaller(req: Request, admin: any) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return null;
  const { data: profile } = await admin
    .from("truinexa_profiles")
    .select("id,name,role,status")
    .eq("id", data.user.id)
    .maybeSingle();
  return profile?.status === "active" ? profile : null;
}

function hash(input: string) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

function isPrivateHost(host: string) {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "::1" || h.endsWith(".local")) return true;
  if (/^(127|10|169\.254|192\.168)\./.test(h)) return true;
  const match = h.match(/^172\.(\d+)\./);
  return !!match && Number(match[1]) >= 16 && Number(match[1]) <= 31;
}

function safeUrl(value: unknown) {
  const raw = txt(value);
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw);
    if (!["http:", "https:"].includes(url.protocol) || isPrivateHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function absoluteUrl(value: string, base: URL) {
  try {
    const url = new URL(value, base);
    if (!["http:", "https:"].includes(url.protocol) || isPrivateHost(url.hostname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp(name + "\\s*=\\s*[\"']([^\"']+)[\"']", "i"))?.[1] || "";
}

function metaValue(html: string, key: string) {
  const patternA = new RegExp("<meta[^>]+(?:property|name)=[\"']" + key + "[\"'][^>]+content=[\"']([^\"']+)[\"']", "i");
  const patternB = new RegExp("<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+(?:property|name)=[\"']" + key + "[\"']", "i");
  return stripHtml(html.match(patternA)?.[1] || html.match(patternB)?.[1] || "");
}

async function researchWebsite(rawUrl: unknown) {
  const url = safeUrl(rawUrl);
  if (!url) return { reachable: false, images: [] };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TRUINEXA-DesignEngine/3.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return { url: url.toString(), reachable: false, images: [] };
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return { url: response.url || url.toString(), reachable: true, images: [] };
    }

    const html = (await response.text()).slice(0, 1500000);
    const base = new URL(response.url || url.toString());
    const title = metaValue(html, "og:title") || stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
    const description = metaValue(html, "og:description") || metaValue(html, "description");
    const themeColor = metaValue(html, "theme-color");
    const instagram = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?/i)?.[0] || "";
    const images: any[] = [];
    let logoUrl = "";

    const ogImage = metaValue(html, "og:image") || metaValue(html, "twitter:image");
    if (ogImage) {
      const resolved = absoluteUrl(ogImage, base);
      if (resolved) {
        images.push({
          url: resolved,
          alt: title || "Imagem principal",
          attribution: "Site oficial",
          source: "official-site",
          verified: true,
        });
      }
    }

    const tags = html.match(/<img\b[^>]*>/gi) || [];
    for (const tag of tags.slice(0, 120)) {
      const src = attr(tag, "src") || attr(tag, "data-src") || attr(tag, "data-lazy-src");
      if (!src || src.startsWith("data:")) continue;
      const resolved = absoluteUrl(src, base);
      if (!resolved) continue;
      const alt = stripHtml(attr(tag, "alt"));
      const label = (alt + " " + attr(tag, "class") + " " + attr(tag, "id")).toLowerCase();
      const logoLike = /logo|brand|marca/.test(label);
      const width = Number(attr(tag, "width")) || 0;
      const height = Number(attr(tag, "height")) || 0;
      if (width && height && width < 180 && height < 180 && !logoLike) continue;
      if (logoLike && !logoUrl) logoUrl = resolved;
      images.push({
        url: resolved,
        alt: alt || title || "Imagem da empresa",
        attribution: "Site oficial",
        source: "official-site",
        verified: true,
      });
    }

    if (!logoUrl) {
      const iconTag = html.match(/<link[^>]+rel=[\"'][^\"']*(?:icon|apple-touch-icon)[^\"']*[\"'][^>]*>/i)?.[0] || "";
      const icon = attr(iconTag, "href");
      if (icon) logoUrl = absoluteUrl(icon, base);
    }

    const unique = new Map<string, any>();
    for (const image of images) {
      if (image.url && !unique.has(image.url)) unique.set(image.url, image);
    }

    return {
      url: base.toString(),
      reachable: true,
      title,
      description,
      themeColor,
      instagram,
      logoUrl,
      images: [...unique.values()].slice(0, 12),
    };
  } catch {
    return { url: url.toString(), reachable: false, images: [] };
  } finally {
    clearTimeout(timer);
  }
}

async function researchPlaces(lead: any) {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return { connected: false, found: false, photos: [], reviews: [] };
  const query = [lead.company, lead.address, lead.neighborhood, lead.city, lead.state].filter(Boolean).join(", ");
  if (!query) return { connected: true, found: false, photos: [], reviews: [] };

  try {
    const search = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: 1,
      }),
    });
    if (!search.ok) return { connected: true, found: false, photos: [], reviews: [] };
    const searchData = await search.json();
    const place = searchData?.places?.[0];
    const placeId = place?.id;
    if (!placeId) return { connected: true, found: false, photos: [], reviews: [] };

    const companyToken = txt(lead.company).toLowerCase().replace(/[^a-z0-9áàãâéêíóôõúç ]/gi, "").split(/\s+/).filter((x:string)=>x.length > 3)[0] || "";
    const resultName = txt(place.displayName?.text).toLowerCase();
    const resultAddress = txt(place.formattedAddress).toLowerCase();
    const locality = txt(lead.city).toLowerCase();
    if (companyToken && !resultName.includes(companyToken) && locality && !resultAddress.includes(locality)) {
      return { connected: true, found: false, identityMismatch: true, photos: [], reviews: [] };
    }

    const details = await fetch("https://places.googleapis.com/v1/places/" + encodeURIComponent(placeId), {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount,websiteUri,photos,reviews,nationalPhoneNumber,googleMapsUri,regularOpeningHours",
      },
    });
    if (!details.ok) return { connected: true, found: false, photos: [], reviews: [] };
    const data = await details.json();

    const photos: any[] = [];
    for (const photo of (data.photos || []).slice(0, 8)) {
      try {
        const media = await fetch(
          "https://places.googleapis.com/v1/" +
            photo.name +
            "/media?maxWidthPx=1600&skipHttpRedirect=true&key=" +
            encodeURIComponent(apiKey)
        );
        if (!media.ok) continue;
        const mediaData = await media.json();
        if (mediaData?.photoUri) {
          photos.push({
            url: mediaData.photoUri,
            alt: (data.displayName?.text || lead.company) + " — foto",
            attribution: photo.authorAttributions?.[0]?.displayName || "Google Places",
            source: "google-places",
            verified: true,
          });
        }
      } catch {}
    }

    const reviews = (data.reviews || [])
      .slice(0, 5)
      .map((review: any) => ({
        author: review.authorAttribution?.displayName || "Cliente",
        rating: Number(review.rating || 0),
        text: txt(review.text?.text),
        source: "Google",
      }))
      .filter((review: any) => review.text);

    return {
      connected: true,
      found: true,
      placeId,
      name: data.displayName?.text || "",
      address: data.formattedAddress || "",
      rating: Number(data.rating || 0),
      reviewCount: Number(data.userRatingCount || 0),
      website: data.websiteUri || "",
      phone: data.nationalPhoneNumber || "",
      mapsUrl: data.googleMapsUri || "",
      openingHours: data.regularOpeningHours?.weekdayDescriptions || [],
      photos,
      reviews,
    };
  } catch {
    return { connected: true, found: false, photos: [], reviews: [] };
  }
}

function segmentProfile(segmentRaw: string) {
  const segment = segmentRaw.toLowerCase();
  if (/barbearia|sal[aã]o/.test(segment)) {
    return {
      audience: "Clientes locais que valorizam estilo, praticidade e confiança.",
      positioning: "Experiência visual forte, portfólio e agendamento rápido.",
      tone: "Confiante, contemporâneo e direto.",
      services: [
        ["Cortes e estilo", "Atendimento pensado para valorizar o estilo de cada cliente."],
        ["Barba e acabamento", "Cuidado completo e acabamento profissional."],
        ["Horário marcado", "Agendamento simples para reduzir espera."],
      ],
      preferred: ["visual-showcase", "creative-studio", "editorial-premium"],
      action: "Agendar horário",
    };
  }
  if (/odonto|dent|cl[ií]nica|dermato|est[eé]tica|sa[uú]de/.test(segment)) {
    return {
      audience: "Pessoas que procuram confiança, clareza e atendimento profissional.",
      positioning: "Autoridade, acolhimento e conversão para avaliação.",
      tone: "Elegante, claro e acolhedor.",
      services: [
        ["Avaliação personalizada", "Entendimento dos objetivos para orientar o melhor caminho."],
        ["Tratamentos selecionados", "Procedimentos apresentados com clareza e linguagem acessível."],
        ["Acompanhamento", "Contato facilitado para dúvidas, retorno e próximos passos."],
      ],
      preferred: ["modern-minimal", "luxury-experience", "editorial-premium"],
      action: "Agendar avaliação",
    };
  }
  if (/construtora|engenharia|arquitet|imobili/.test(segment)) {
    return {
      audience: "Clientes, investidores e parceiros que valorizam credibilidade e execução.",
      positioning: "Apresentação institucional forte, projetos e diferenciais verificáveis.",
      tone: "Corporativo, seguro e objetivo.",
      services: [
        ["Projetos e execução", "Apresentação clara das frentes de atuação e entregas."],
        ["Soluções técnicas", "Informações organizadas para transmitir segurança e capacidade."],
        ["Contato comercial", "Canal direto para propostas e novas oportunidades."],
      ],
      preferred: ["corporate-professional", "editorial-premium", "visual-showcase"],
      action: "Solicitar contato",
    };
  }
  if (/restaurante|gastronomia|caf[eé]|pizz|hamb/.test(segment)) {
    return {
      audience: "Pessoas que escolhem pela experiência, confiança e apelo visual.",
      positioning: "Fotografia, cardápio, localização e reserva em destaque.",
      tone: "Sensorial, convidativo e direto.",
      services: [
        ["Experiência gastronômica", "Destaque para especialidades e proposta da casa."],
        ["Cardápio e destaques", "Apresentação visual dos principais itens disponíveis."],
        ["Reserva e localização", "Caminho curto para decidir e entrar em contato."],
      ],
      preferred: ["visual-showcase", "editorial-premium", "local-business-pro"],
      action: "Reservar",
    };
  }
  if (/advoc|jur[ií]dic/.test(segment)) {
    return {
      audience: "Pessoas e empresas que procuram orientação jurídica com credibilidade.",
      positioning: "Sobriedade, clareza, áreas de atuação e contato responsável.",
      tone: "Sóbrio, institucional e informativo.",
      services: [
        ["Áreas de atuação", "Apresentação informativa e organizada das frentes profissionais."],
        ["Atendimento profissional", "Comunicação clara e respeitosa sobre os canais disponíveis."],
        ["Contato", "Canal institucional para solicitar informações."],
      ],
      preferred: ["corporate-professional", "modern-minimal", "editorial-premium"],
      action: "Entrar em contato",
    };
  }
  if (/tecnologia|software|saas|\bti\b/.test(segment)) {
    return {
      audience: "Empresas que buscam eficiência, inovação e soluções digitais.",
      positioning: "Produto, benefícios, processo e chamadas de conversão.",
      tone: "Contemporâneo, preciso e confiante.",
      services: [
        ["Soluções digitais", "Apresentação direta das capacidades e benefícios."],
        ["Processos inteligentes", "Explicação clara de como a solução entrega valor."],
        ["Demonstração", "Próximo passo objetivo para avaliar a solução."],
      ],
      preferred: ["technology-premium", "creative-studio", "modern-minimal"],
      action: "Solicitar demonstração",
    };
  }
  if (/pet/.test(segment)) {
    return {
      audience: "Tutores que valorizam cuidado, confiança e praticidade.",
      positioning: "Serviços pet, fotos reais, localização e agendamento rápido.",
      tone: "Próximo, acolhedor e confiável.",
      services: [
        ["Banho e cuidados", "Rotina de higiene e bem-estar com atendimento cuidadoso."],
        ["Tosa e acabamento", "Opções para diferentes perfis e necessidades."],
        ["Agendamento", "Contato rápido para escolher o melhor horário."],
      ],
      preferred: ["local-business-pro", "visual-showcase", "modern-minimal"],
      action: "Agendar serviço",
    };
  }
  if (/oficina|auto|mec[aâ]nica/.test(segment)) {
    return {
      audience: "Motoristas que procuram confiança, rapidez e transparência.",
      positioning: "Serviços, orçamento e localização em primeiro plano.",
      tone: "Objetivo, confiável e comercial.",
      services: [
        ["Diagnóstico e revisão", "Avaliação objetiva para entender a necessidade do veículo."],
        ["Manutenção e reparos", "Apresentação clara dos principais serviços."],
        ["Orçamento rápido", "Contato direto para agilizar a triagem."],
      ],
      preferred: ["local-business-pro", "corporate-professional", "modern-minimal"],
      action: "Pedir orçamento",
    };
  }
  return {
    audience: "Clientes que procuram um fornecedor confiável e fácil de contatar.",
    positioning: "Oferta clara, autoridade e caminho curto para contato.",
    tone: "Profissional, claro e próximo.",
    services: [
      ["Atendimento especializado", "Soluções organizadas para facilitar a decisão."],
      ["Experiência personalizada", "Atendimento alinhado à necessidade de cada cliente."],
      ["Contato direto", "Canal rápido para tirar dúvidas e solicitar atendimento."],
    ],
    preferred: ["local-business-pro", "modern-minimal", "corporate-professional"],
    action: "Falar com a equipe",
  };
}

function palette(family: string, seed: number, themeColor: string) {
  const validTheme = /^#[0-9a-f]{6}$/i.test(themeColor || "") ? themeColor : "";
  const maps: Record<string, any> = {
    "editorial-premium": {
      background: "#F3EFE8", surface: "#FCFAF6", surfaceAlt: "#E9E2D8", text: "#191816",
      muted: "#6F6A63", primary: validTheme || (seed % 2 ? "#2F403D" : "#6F3F2F"),
      accent: seed % 2 ? "#8BA39E" : "#C08B62", border: "rgba(25,24,22,.12)",
      display: "Georgia, Times New Roman, serif", body: "Inter, system-ui, sans-serif",
      scale: "expressive", radius: "soft", density: "airy", imageTreatment: "editorial", motion: "subtle",
    },
    "corporate-professional": {
      background: "#F5F7FA", surface: "#FFFFFF", surfaceAlt: "#E9EEF5", text: "#102033",
      muted: "#64748B", primary: validTheme || "#173B67", accent: "#2F6FB6",
      border: "rgba(15,23,42,.10)", display: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif", scale: "balanced", radius: "soft", density: "balanced",
      imageTreatment: "natural", motion: "subtle",
    },
    "luxury-experience": {
      background: "#0C0B0A", surface: "#17130F", surfaceAlt: "#211A14", text: "#F7F2E8",
      muted: "#A69D90", primary: validTheme || "#B5965E", accent: "#D9BC7A",
      border: "rgba(255,255,255,.10)", display: "Georgia, Times New Roman, serif",
      body: "Inter, system-ui, sans-serif", scale: "expressive", radius: "sharp", density: "airy",
      imageTreatment: "cinematic", motion: "subtle",
    },
    "modern-minimal": {
      background: "#FAFAFA", surface: "#FFFFFF", surfaceAlt: "#F1F3F5", text: "#111315",
      muted: "#71767C", primary: validTheme || "#111827", accent: "#4F46E5",
      border: "rgba(17,19,21,.10)", display: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif", scale: "balanced", radius: "soft", density: "airy",
      imageTreatment: "natural", motion: "subtle",
    },
    "creative-studio": {
      background: "#0E0E13", surface: "#181821", surfaceAlt: "#232331", text: "#F6F5FF",
      muted: "#9C9AAD", primary: validTheme || "#7C3AED", accent: "#22D3EE",
      border: "rgba(255,255,255,.11)", display: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif", scale: "expressive", radius: "rounded", density: "balanced",
      imageTreatment: "high-contrast", motion: "expressive",
    },
    "technology-premium": {
      background: "#070B12", surface: "#0F1623", surfaceAlt: "#151F30", text: "#F3F7FC",
      muted: "#8794A8", primary: validTheme || "#4F6EF7", accent: "#21C7A8",
      border: "rgba(148,163,184,.13)", display: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif", scale: "balanced", radius: "rounded", density: "balanced",
      imageTreatment: "high-contrast", motion: "expressive",
    },
    "local-business-pro": {
      background: "#FCFBF8", surface: "#FFFFFF", surfaceAlt: "#F3F0E9", text: "#25231F",
      muted: "#777169", primary: validTheme || (seed % 2 ? "#8B4E2F" : "#1F5D50"),
      accent: seed % 2 ? "#D38B5D" : "#3E9D83", border: "rgba(37,35,31,.11)",
      display: "Inter, system-ui, sans-serif", body: "Inter, system-ui, sans-serif",
      scale: "balanced", radius: "rounded", density: "balanced", imageTreatment: "natural", motion: "subtle",
    },
    "visual-showcase": {
      background: "#0C0C0D", surface: "#151516", surfaceAlt: "#202022", text: "#FAFAFA",
      muted: "#9A9A9D", primary: validTheme || "#F5F5F5", accent: "#C7A06A",
      border: "rgba(255,255,255,.10)", display: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif", scale: "expressive", radius: "soft", density: "airy",
      imageTreatment: "cinematic", motion: "subtle",
    },
  };
  const value = maps[family] || maps["local-business-pro"];
  return {
    colors: {
      background: value.background, surface: value.surface, surfaceAlt: value.surfaceAlt,
      text: value.text, muted: value.muted, primary: value.primary, accent: value.accent,
      border: value.border,
    },
    typography: { display: value.display, body: value.body, scale: value.scale },
    radius: value.radius,
    density: value.density,
    imageTreatment: value.imageTreatment,
    motion: value.motion,
  };
}

function createDirections(briefing: any, themeColor: string) {
  const preferred = briefing.preferred || ["local-business-pro", "modern-minimal", "corporate-professional"];
  const seed = hash(briefing.company + briefing.segment);
  const hero = ["cinematic", "editorial", "fullscreen", "asymmetric", "magazine", "layered", "minimal-type"];
  const services = ["editorial-list", "grid", "alternating", "spotlight", "bento", "timeline"];
  const gallery = ["mosaic", "carousel", "filmstrip", "editorial-grid"];
  const nav = ["minimal", "floating", "solid"];

  return preferred.slice(0, 3).map((family: string, index: number) => {
    const familySeed = hash(briefing.company + family + index);
    const verifiedAssets = briefing.assets.filter((asset: any) => asset.verified).length;
    const score = Math.min(99, 78 + Math.min(9, verifiedAssets * 2) - index * 2);
    return {
      id: "direction-" + (index + 1) + "-" + family,
      family,
      name: family.split("-").map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
      rationale: "Direção construída para o segmento, ativos verificados e objetivo comercial.",
      score,
      tokens: palette(family, seed, themeColor),
      heroVariant: hero[(familySeed + index) % hero.length],
      servicesVariant: services[(familySeed + index * 2) % services.length],
      galleryVariant: gallery[(familySeed + index) % gallery.length],
      navStyle: nav[(familySeed + index) % nav.length],
    };
  });
}

function makeBlock(id: string, type: string, variant: string, extra: any = {}) {
  return { id, type, variant, ...extra };
}

function buildSpec(briefing: any, direction: any) {
  const assets = briefing.assets || [];
  const creativeCopy = fallbackCreativeCopy(briefing);
  const heroMedia = assets.slice(0, direction.family === "visual-showcase" ? 3 : 1);
  const action = briefing.contact.whatsapp
    ? {
        label: briefing.action || "Falar pelo WhatsApp",
        kind: "whatsapp",
        value: briefing.contact.whatsapp,
        message: "Olá! Gostaria de mais informações sobre a " + briefing.company + ".",
      }
    : undefined;

  const pages: any[] = [];
  const homeBlocks: any[] = [
    makeBlock("home-hero", "hero", direction.heroVariant, {
      eyebrow: briefing.location || briefing.segment,
      title: creativeCopy.heroTitle,
      body: creativeCopy.heroBody,
      media: heroMedia,
      primaryAction: action,
      secondaryAction: { label: "Conhecer serviços", kind: "page", value: "services" },
      options: { navStyle: direction.navStyle },
    }),
  ];

  const introVariant =
    direction.family === "editorial-premium"
      ? "editorial"
      : ["modern-minimal", "creative-studio", "technology-premium"].includes(direction.family)
        ? "statement"
        : "split";

  if (!(direction.family === "visual-showcase" && assets.length >= 4)) {
    homeBlocks.push(
      makeBlock("home-intro", "intro", introVariant, {
        eyebrow: "Sobre",
        title: creativeCopy.introTitle,
        body: briefing.summary,
        items: briefing.differentiators.map((item: string) => ({ text: item })),
        media: assets.slice(1, 2),
      })
    );
  } else {
    homeBlocks.push(
      makeBlock("home-gallery-feature", "gallery", "editorial-grid", {
        title: creativeCopy.galleryTitle,
        media: assets.slice(0, 7),
      })
    );
  }

  if (direction.family === "corporate-professional" && briefing.verifiedFacts.length >= 2) {
    homeBlocks.push(makeBlock("home-stats", "stats", "inline", {
      items: briefing.verifiedFacts.slice(0, 4).map((fact: string, index: number) => ({
        value: String(index + 1).padStart(2, "0"),
        label: fact,
      })),
    }));
  }

  homeBlocks.push(makeBlock("home-cta", "cta", direction.family === "luxury-experience" ? "minimal" : "banner", {
    title: briefing.recommendedService || "Vamos conversar?",
    body: briefing.opportunity,
    primaryAction: action,
  }));

  pages.push({ id: "home", slug: "/", label: "Início", title: "Início", blocks: homeBlocks });

  const seed = hash(briefing.company + briefing.segment);
  const secondaryPages: any[] = [];
  const shouldAbout = Boolean(briefing.summary) && (seed % 3 === 0 || direction.family === "editorial-premium");

  if (shouldAbout) {
    secondaryPages.push({
      id: "about",
      slug: "/sobre",
      label: "Sobre",
      title: "Sobre",
      blocks: [
        makeBlock("about-story", "intro", direction.family === "corporate-professional" ? "split" : "statement", {
          eyebrow: briefing.segment,
          title: creativeCopy.introTitle,
          body: briefing.summary,
          items: briefing.differentiators.map((item: string) => ({ text: item })),
          media: assets.slice(0, 1),
        })
      ]
    });
  }

  const servicesBlocks = [
    makeBlock("services-main", "services", direction.servicesVariant, {
      eyebrow: "Serviços",
      title: creativeCopy.servicesTitle,
      body: briefing.recommendedService,
      items: briefing.services.map((service: any) => ({ title: service.name, description: service.description })),
      media: assets.slice(0, 4),
      primaryAction: action,
    }),
  ];
  secondaryPages.push({
    id: "services",
    slug: "/servicos",
    label: /cl[ií]nica|odonto|est[eé]tica/i.test(briefing.segment) ? "Tratamentos" : "Serviços",
    title: "Serviços",
    blocks: servicesBlocks,
  });

  if (assets.length >= 3) {
    secondaryPages.push({
      id: "gallery",
      slug: "/galeria",
      label: "Galeria",
      title: "Galeria",
      blocks: [makeBlock("gallery-main", "gallery", direction.galleryVariant, {
        title: creativeCopy.galleryTitle,
        media: assets.slice(0, 9),
      })],
    });
  }

  if (briefing.reviews.length) {
    secondaryPages.push({
      id: "reviews",
      slug: "/avaliacoes",
      label: "Avaliações",
      title: "Avaliações",
      blocks: [makeBlock("reviews-main", "reviews", briefing.reviews.length > 3 ? "grid" : "feature", {
        eyebrow: "Avaliações verificadas",
        title: "O que clientes dizem",
        items: briefing.reviews,
      })],
    });
  }

  if (/construtora|engenharia|arquitet|tecnologia/i.test(briefing.segment) && assets.length >= 2) {
    secondaryPages.push({
      id: "projects",
      slug: "/projetos",
      label: "Projetos",
      title: "Projetos",
      blocks: [makeBlock("projects-main", "projects", "showcase", {
        title: "Projetos em destaque",
        media: assets.slice(0, 8),
      })],
    });
  }

  const pagePriority =
    direction.family === "visual-showcase"
      ? ["gallery", "services", "about", "reviews", "projects"]
      : direction.family === "corporate-professional"
        ? ["about", "projects", "services", "reviews", "gallery"]
        : direction.family === "modern-minimal"
          ? ["services", "about", "gallery", "reviews", "projects"]
          : ["services", "gallery", "about", "reviews", "projects"];

  secondaryPages.sort((a: any, b: any) => {
    const ai = pagePriority.indexOf(a.id);
    const bi = pagePriority.indexOf(b.id);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  pages.push(...secondaryPages);

  const contactBlocks: any[] = [
    makeBlock("contact-main", "contact", direction.family === "local-business-pro" ? "map-split" : "split", {
      eyebrow: "Contato",
      title: briefing.action || "Fale com a equipe",
      body: briefing.location,
      primaryAction: action,
    }),
  ];

  const shouldUseForm =
    /construtora|engenharia|oficina|auto|mec[aâ]nica|consult|tecnologia|software|servi[cç]os/i.test(
      briefing.segment
    ) && Boolean(briefing.contact.whatsapp || briefing.contact.email);

  if (shouldUseForm) {
    contactBlocks.push(
      makeBlock("contact-form", "form", "compact", {
        eyebrow: "Solicitação",
        title: /oficina|auto|mec[aâ]nica/i.test(briefing.segment)
          ? "Conte o que seu veículo precisa"
          : "Conte um pouco sobre sua necessidade",
        body: "A mensagem é encaminhada pelo canal de contato configurado da empresa.",
        options: {
          submitLabel: /oficina|auto|mec[aâ]nica/i.test(briefing.segment)
            ? "Pedir orçamento"
            : "Enviar solicitação",
        },
      })
    );
  }

  if (briefing.contact.address) {
    contactBlocks.push(
      makeBlock("contact-location", "map", "location-card", {
        title: "Localização",
      })
    );
  }

  pages.push({
    id: "contact",
    slug: "/contato",
    label: "Contato",
    title: "Contato",
    blocks: contactBlocks,
  });

  return {
    version: 2,
    brand: {
      name: briefing.company,
      tagline: briefing.positioning,
      logo: briefing.logo || undefined,
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
    navigation: pages.map((page: any) => ({ pageId: page.id, label: page.label })),
    pages,
    seo: {
      title: briefing.company + " | " + briefing.segment,
      description: briefing.summary.slice(0, 155),
    },
    contact: briefing.contact,
    assets,
    disclosure: "Demonstração comercial criada pela TRUINEXA • informações públicas verificadas quando disponíveis.",
  };
}

function normalizeAIDirection(direction: any, briefing: any) {
  const fallback = palette(direction?.family || "modern-minimal", hash(briefing.company), "");
  const color = (value: any, fallbackValue: string) =>
    /^#[0-9a-f]{6}$/i.test(txt(value)) || /^rgba?\(/i.test(txt(value))
      ? txt(value)
      : fallbackValue;

  return {
    id: txt(direction?.id) || "ai-direction",
    family: FAMILIES.includes(direction?.family) ? direction.family : "modern-minimal",
    name: txt(direction?.name) || "Direção Autoral",
    rationale: txt(direction?.rationale) || "Direção criada pela IA a partir da marca e do objetivo comercial.",
    concept: txt(direction?.concept),
    score: Math.max(0, Math.min(100, Number(direction?.score || 80))),
    tokens: {
      colors: {
        background: color(direction?.colors?.background, fallback.colors.background),
        surface: color(direction?.colors?.surface, fallback.colors.surface),
        surfaceAlt: color(direction?.colors?.surfaceAlt, fallback.colors.surfaceAlt),
        text: color(direction?.colors?.text, fallback.colors.text),
        muted: color(direction?.colors?.muted, fallback.colors.muted),
        primary: color(direction?.colors?.primary, fallback.colors.primary),
        accent: color(direction?.colors?.accent, fallback.colors.accent),
        border: color(direction?.colors?.border, fallback.colors.border)
      },
      typography: {
        display: txt(direction?.typography?.display) || fallback.typography.display,
        body: txt(direction?.typography?.body) || fallback.typography.body,
        scale: ["compact","balanced","expressive"].includes(direction?.typography?.scale)
          ? direction.typography.scale
          : fallback.typography.scale
      },
      radius: ["sharp","soft","rounded"].includes(direction?.radius) ? direction.radius : fallback.radius,
      density: ["airy","balanced","compact"].includes(direction?.density) ? direction.density : fallback.density,
      imageTreatment: ["natural","cinematic","editorial","soft","high-contrast"].includes(direction?.imageTreatment)
        ? direction.imageTreatment
        : fallback.imageTreatment,
      motion: ["none","subtle","expressive"].includes(direction?.motion) ? direction.motion : fallback.motion
    },
    heroVariant: ["cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type"].includes(direction?.heroVariant)
      ? direction.heroVariant
      : "editorial",
    servicesVariant: ["editorial-list","grid","alternating","spotlight","bento","timeline"].includes(direction?.servicesVariant)
      ? direction.servicesVariant
      : "editorial-list",
    galleryVariant: ["mosaic","carousel","filmstrip","editorial-grid"].includes(direction?.galleryVariant)
      ? direction.galleryVariant
      : "mosaic",
    navStyle: ["minimal","floating","solid"].includes(direction?.navStyle) ? direction.navStyle : "minimal",
    compositionNotes: Array.isArray(direction?.compositionNotes) ? direction.compositionNotes.slice(0, 6) : []
  };
}

function fallbackCreativeCopy(briefing: any) {
  const segment = txt(briefing.segment).toLowerCase();
  if (/pet/.test(segment)) {
    return {
      heroTitle: "Cuidado que faz parte da rotina de quem ama pets.",
      heroBody: briefing.summary || "Uma apresentação leve, próxima e visual para facilitar o primeiro contato.",
      introTitle: "Um lugar pensado para quem trata o pet como família.",
      servicesTitle: "Cuidado em cada etapa",
      galleryTitle: "De perto, como deve ser"
    };
  }
  if (/pilates|fisioterapia|academia|fitness/.test(segment)) {
    return {
      heroTitle: "Movimento com atenção ao seu ritmo.",
      heroBody: briefing.summary || "Uma presença clara e acolhedora para transformar interesse em primeiro contato.",
      introTitle: "Confiança começa antes da primeira aula.",
      servicesTitle: "Experiências para colocar o corpo em movimento",
      galleryTitle: "Ambiente, movimento e cuidado"
    };
  }
  if (/barbearia|sal[aã]o|beleza/.test(segment)) {
    return {
      heroTitle: "Estilo se percebe nos detalhes.",
      heroBody: briefing.summary || "Uma experiência visual forte para valorizar trabalho, atmosfera e contato rápido.",
      introTitle: "Mais que serviço: presença, técnica e identidade.",
      servicesTitle: "Escolha sua experiência",
      galleryTitle: "Trabalho que fala por si"
    };
  }
  if (/odonto|dent|cl[ií]nica|sa[uú]de|est[eé]tica/.test(segment)) {
    return {
      heroTitle: "Cuidado que transmite confiança desde o primeiro contato.",
      heroBody: briefing.summary || "Informação clara, ambiente acolhedor e caminho simples para agendar.",
      introTitle: "Clareza também faz parte do cuidado.",
      servicesTitle: "Conheça os atendimentos",
      galleryTitle: "Estrutura e experiência"
    };
  }
  if (/construtora|engenharia|arquitet|imobili/.test(segment)) {
    return {
      heroTitle: "Projetos apresentados com a clareza que grandes decisões pedem.",
      heroBody: briefing.summary || "Uma presença institucional que valoriza capacidade, projetos e confiança.",
      introTitle: "Do planejamento à percepção de valor.",
      servicesTitle: "Capacidade em diferentes frentes",
      galleryTitle: "Projetos em perspectiva"
    };
  }
  if (/restaurante|gastronomia|caf[eé]|pizz|hamb/.test(segment)) {
    return {
      heroTitle: "A experiência começa antes do primeiro pedido.",
      heroBody: briefing.summary || "Fotografia, identidade e informação organizadas para despertar vontade e facilitar a visita.",
      introTitle: "Sabor também é atmosfera.",
      servicesTitle: "Destaques da casa",
      galleryTitle: "Uma mesa que começa pelos olhos"
    };
  }
  if (/tecnologia|software|saas|\bti\b/.test(segment)) {
    return {
      heroTitle: "Tecnologia explicada com clareza. Valor percebido rápido.",
      heroBody: briefing.summary || "Uma apresentação de produto contemporânea, objetiva e orientada à conversão.",
      introTitle: "Menos ruído. Mais entendimento.",
      servicesTitle: "O que a solução coloca em movimento",
      galleryTitle: "Produto em contexto"
    };
  }
  return {
    heroTitle: briefing.company + " com uma presença à altura do que entrega.",
    heroBody: briefing.summary || briefing.positioning,
    introTitle: "Uma apresentação que deixa o valor mais claro.",
    servicesTitle: "O que merece destaque",
    galleryTitle: "Conheça de perto"
  };
}

function aiAction(kind: string, briefing: any) {
  if (kind === "whatsapp" && briefing.contact.whatsapp) {
    return {
      label: briefing.action || "Falar pelo WhatsApp",
      kind: "whatsapp",
      value: briefing.contact.whatsapp,
      message: "Olá! Gostaria de mais informações sobre a " + briefing.company + "."
    };
  }
  if (kind === "phone" && briefing.contact.phone) {
    return { label: "Ligar", kind: "phone", value: briefing.contact.phone };
  }
  if (kind === "page-services") return { label: "Ver serviços", kind: "page", value: "services" };
  if (kind === "page-contact") return { label: "Entrar em contato", kind: "page", value: "contact" };
  if (kind === "page-gallery") return { label: "Ver galeria", kind: "page", value: "gallery" };
  if (kind === "page-projects") return { label: "Ver projetos", kind: "page", value: "projects" };
  return undefined;
}

function safeFaqItems(briefing: any) {
  const items: any[] = [];
  if (briefing.contact.whatsapp || briefing.contact.phone) {
    items.push({
      question: "Como entrar em contato?",
      answer: briefing.contact.whatsapp
        ? "Use o WhatsApp disponível nesta página para falar diretamente com a equipe."
        : "Use o telefone informado nesta página para falar com a equipe."
    });
  }
  if (briefing.location) {
    items.push({
      question: "Onde fica?",
      answer: "A empresa está localizada em " + briefing.location + ". Consulte os dados de contato para confirmar o endereço e a melhor forma de chegar."
    });
  }
  if (briefing.services?.length) {
    items.push({
      question: "Como saber qual serviço faz sentido?",
      answer: "Entre em contato e explique o que você procura. A equipe poderá orientar o atendimento disponível."
    });
  }
  return items;
}

function blockItems(mode: string, briefing: any) {
  if (mode === "services") return (briefing.services || []).map((service: any) => ({
    title: service.name,
    description: service.description
  }));
  if (mode === "differentiators") return (briefing.differentiators || []).map((text: string) => ({ text }));
  if (mode === "reviews") return briefing.reviews || [];
  if (mode === "verifiedFacts") return (briefing.verifiedFacts || []).map((fact: string, index: number) => ({
    value: String(index + 1).padStart(2, "0"),
    label: fact
  }));
  if (mode === "faq") return safeFaqItems(briefing);
  return [];
}

function blockMedia(mode: string, briefing: any) {
  const assets = briefing.assets || [];
  if (mode === "hero") return assets.slice(0, 3);
  if (mode === "feature") return assets.slice(0, 1);
  if (mode === "gallery") return assets.slice(0, 9);
  if (mode === "services") return assets.slice(0, 5);
  return [];
}

function safeVariant(type: string, requested: string, direction: any) {
  const variants: Record<string, string[]> = {
    hero: ["cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type"],
    intro: ["split","editorial","statement"],
    services: ["editorial-list","grid","alternating","spotlight","bento","timeline"],
    gallery: ["mosaic","carousel","filmstrip","editorial-grid"],
    reviews: ["grid","feature"],
    stats: ["inline"],
    projects: ["showcase"],
    faq: ["accordion"],
    form: ["compact"],
    map: ["location-card"],
    cta: ["minimal","banner","split-cta"],
    contact: ["split","map-split"]
  };
  const allowed = variants[type] || ["grid"];
  if (allowed.includes(requested)) return requested;
  if (type === "hero") return direction.heroVariant;
  if (type === "services") return direction.servicesVariant;
  if (type === "gallery") return direction.galleryVariant;
  return allowed[0];
}

function buildSpecFromAIPlan(briefing: any, aiPlan: any, requestedDirectionId: string | null) {
  const directions = (aiPlan?.directions || []).map((direction: any) =>
    normalizeAIDirection(direction, briefing)
  );
  let direction =
    directions.find((item: any) => item.id === requestedDirectionId) ||
    directions.find((item: any) => item.id === aiPlan?.selectedDirectionId) ||
    directions.slice().sort((a: any, b: any) => b.score - a.score)[0];

  if (!direction) {
    direction = createDirections(briefing, "")[0];
  }

  const pagePlans = Array.isArray(aiPlan?.pages) ? aiPlan.pages : [];
  const seen = new Set<string>();
  const pages: any[] = [];

  for (const rawPage of pagePlans) {
    const pageId = txt(rawPage.id);
    if (!pageId || seen.has(pageId)) continue;
    seen.add(pageId);

    const blocks: any[] = [];
    for (let index = 0; index < (rawPage.blocks || []).length; index++) {
      const raw = rawPage.blocks[index];
      const type = txt(raw.type);
      if (!["hero","intro","services","gallery","reviews","stats","projects","faq","form","map","cta","contact"].includes(type)) {
        continue;
      }
      if (type === "reviews" && !(briefing.reviews || []).length) continue;
      if (type === "stats" && (briefing.verifiedFacts || []).length < 2) continue;
      if (type === "projects" && (briefing.assets || []).length < 2) continue;
      if (type === "form" && !briefing.contact.whatsapp && !briefing.contact.email) continue;
      if (type === "map" && !briefing.contact.address) continue;

      const block: any = makeBlock(
        pageId + "-" + type + "-" + index,
        type,
        safeVariant(type, txt(raw.variant), direction),
        {
          eyebrow: txt(raw.eyebrow),
          title: txt(raw.title),
          body: txt(raw.body),
          items: blockItems(txt(raw.itemMode), briefing),
          media: blockMedia(txt(raw.mediaMode), briefing),
          primaryAction: aiAction(txt(raw.primaryAction), briefing),
          secondaryAction: aiAction(txt(raw.secondaryAction), briefing)
        }
      );

      if (type === "hero") {
        block.options = { navStyle: direction.navStyle };
        if (!block.media?.length) block.media = (briefing.assets || []).slice(0, 2);
      }
      if (type === "services" && !block.items?.length) {
        block.items = blockItems("services", briefing);
      }
      if (type === "gallery" && !block.media?.length) {
        block.media = blockMedia("gallery", briefing);
      }
      if (type === "reviews") block.items = briefing.reviews || [];
      if (type === "stats") block.items = blockItems("verifiedFacts", briefing);
      if (type === "faq") block.items = safeFaqItems(briefing);
      if (type === "projects") block.media = (briefing.assets || []).slice(0, 8);

      blocks.push(block);
    }

    if (!blocks.length) continue;
    pages.push({
      id: pageId,
      slug: pageId === "home" ? "/" : "/" + pageId,
      label: txt(rawPage.label) || pageId,
      title: txt(rawPage.label) || pageId,
      description: txt(rawPage.purpose),
      blocks
    });
  }

  if (!pages.some((page: any) => page.id === "home")) {
    const copy = fallbackCreativeCopy(briefing);
    pages.unshift({
      id: "home",
      slug: "/",
      label: "Início",
      title: "Início",
      blocks: [
        makeBlock("home-hero-safe", "hero", direction.heroVariant, {
          eyebrow: briefing.location || briefing.segment,
          title: copy.heroTitle,
          body: copy.heroBody,
          media: (briefing.assets || []).slice(0, 3),
          primaryAction: aiAction("whatsapp", briefing) || aiAction("page-contact", briefing),
          secondaryAction: aiAction("page-services", briefing),
          options: { navStyle: direction.navStyle }
        })
      ]
    });
  }

  if (!pages.some((page: any) => page.id === "contact")) {
    pages.push({
      id: "contact",
      slug: "/contact",
      label: "Contato",
      title: "Contato",
      blocks: [
        makeBlock("contact-safe", "contact", "split", {
          eyebrow: "Contato",
          title: briefing.action || "Fale com a equipe",
          body: briefing.location,
          primaryAction: aiAction("whatsapp", briefing)
        })
      ]
    });
  }

  return {
    directions,
    selected: direction,
    spec: {
      version: 2,
      brand: {
        name: briefing.company,
        tagline: aiPlan?.positioning || briefing.positioning,
        logo: briefing.logo || undefined,
        segment: briefing.segment,
        location: briefing.location
      },
      direction: {
        id: direction.id,
        family: direction.family,
        name: direction.name,
        rationale: direction.rationale,
        score: direction.score
      },
      tokens: direction.tokens,
      navigation: pages.map((page: any) => ({ pageId: page.id, label: page.label })),
      pages,
      seo: {
        title: txt(aiPlan?.seoTitle) || briefing.company + " | " + briefing.segment,
        description: (txt(aiPlan?.seoDescription) || briefing.summary).slice(0, 160)
      },
      contact: briefing.contact,
      assets: briefing.assets || [],
      disclosure: "Demonstração comercial criada pela TRUINEXA • informações públicas verificadas quando disponíveis."
    }
  };
}

function applyCriticPatch(spec: any, review: any) {
  if (!review?.patch) return spec;
  const next = structuredClone(spec);
  const patch = review.patch;

  if (patch.density && patch.density !== "keep") next.tokens.density = patch.density;
  if (patch.motion && patch.motion !== "keep") next.tokens.motion = patch.motion;

  const blocks = next.pages.flatMap((page: any) => page.blocks || []);
  const hero = blocks.find((block: any) => block.type === "hero");
  if (hero) {
    if (patch.heroVariant && patch.heroVariant !== "keep") hero.variant = patch.heroVariant;
    if (txt(patch.heroTitle)) hero.title = txt(patch.heroTitle);
    if (txt(patch.heroBody)) hero.body = txt(patch.heroBody);
    if (patch.emphasizePhotography && (next.assets || []).length) {
      hero.media = (next.assets || []).slice(0, 3);
      if (hero.variant === "editorial") hero.variant = "magazine";
    }
  }

  const services = blocks.find((block: any) => block.type === "services");
  if (services && patch.servicesVariant && patch.servicesVariant !== "keep") {
    services.variant = patch.servicesVariant;
  }

  const gallery = blocks.find((block: any) => block.type === "gallery");
  if (gallery && patch.galleryVariant && patch.galleryVariant !== "keep") {
    gallery.variant = patch.galleryVariant;
  }

  return next;
}

function compositionSignature(spec: any) {
  return (spec.pages || [])
    .map((page: any) =>
      page.id + ":" + (page.blocks || []).map((block: any) => block.type + "/" + block.variant).join(",")
    )
    .join("|");
}

function genericCopyScore(spec: any) {
  const text = JSON.stringify(spec.pages || []).toLowerCase();
  const generic = [
    "uma experiência digital feita para o seu negócio",
    "confiança, clareza e presença profissional",
    "como podemos ajudar",
    "conheça de perto",
    "soluções sob medida",
    "excelência e qualidade",
    "conheça a "
  ];
  return generic.filter((phrase) => text.includes(phrase)).length;
}

function hexRgb(value: string) {
  const match = String(value || "").match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  return {
    r: Number.parseInt(match[1].slice(0, 2), 16),
    g: Number.parseInt(match[1].slice(2, 4), 16),
    b: Number.parseInt(match[1].slice(4, 6), 16)
  };
}

function relativeLuminance(value: string) {
  const rgb = hexRgb(value);
  if (!rgb) return null;
  const channel = (n: number) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrastRatio(a: string, b: string) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 4.5;
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function quality(spec: any) {
  const blocks = spec.pages.flatMap((page: any) => page.blocks || []);
  const variants = new Set(blocks.map((block: any) => block.type + ":" + block.variant)).size;
  const genericCount = genericCopyScore(spec);
  const mainContrast = contrastRatio(spec.tokens?.colors?.text || "#111111", spec.tokens?.colors?.background || "#ffffff");
  const checks = [
    {
      id: "copy-specificity",
      label: "Especificidade da copy",
      score: genericCount === 0 ? 100 : genericCount === 1 ? 70 : 45,
      detail: genericCount === 0
        ? "Sem clichês genéricos conhecidos."
        : genericCount + " expressão(ões) genérica(s) detectada(s)."
    },
    {
      id: "contrast",
      label: "Contraste principal",
      score: mainContrast >= 4.5 ? 100 : mainContrast >= 3 ? 72 : 45,
      detail: "Contraste calculado: " + mainContrast.toFixed(2) + ":1."
    },
    {
      id: "navigation",
      label: "Navegação",
      score: spec.pages.length >= 2 && spec.navigation.length === spec.pages.length ? 100 : 55,
      detail: spec.pages.length + " páginas estruturadas.",
    },
    {
      id: "differentiation",
      label: "Diferenciação",
      score: variants >= 4 ? 94 : variants >= 3 ? 82 : 60,
      detail: variants + " combinações de componente/variante.",
    },
    {
      id: "contact",
      label: "Contato funcional",
      score: spec.contact.whatsapp || spec.contact.phone || spec.contact.email ? 100 : 45,
      detail: "Validação de canal real de contato.",
    },
    {
      id: "images",
      label: "Imagens",
      score: spec.assets.length === 0 ? 72 : spec.assets.every((asset: any) => asset.verified || asset.illustrative) ? 100 : 70,
      detail: spec.assets.length + " ativos visuais.",
    },
    {
      id: "accessibility",
      label: "Estrutura acessível",
      score: spec.pages.every((page: any) => page.label && page.blocks.every((block: any) => block.id && block.type)) ? 92 : 58,
      detail: "IDs, rótulos e estrutura semântica.",
    },
    {
      id: "content",
      label: "Conteúdo comercial",
      score: blocks.filter((block: any) => block.title || block.body).length >= 3 ? 92 : 65,
      detail: "Hierarquia e chamadas comerciais.",
    },
  ];
  const score = Math.round(checks.reduce((sum: number, check: any) => sum + check.score, 0) / checks.length);
  return {
    score,
    passed: score >= 78 && checks.every((check: any) => check.score >= 55),
    checks: checks.map((check: any) => ({ ...check, passed: check.score >= 70 })),
    fixes: checks.filter((check: any) => check.score < 70).map((check: any) => "Revisar " + check.label + ": " + check.detail),
  };
}

function repair(spec: any) {
  const next = structuredClone(spec);
  if (!next.navigation?.length) next.navigation = next.pages.map((page: any) => ({ pageId: page.id, label: page.label }));
  for (const asset of next.assets || []) {
    if (!asset.alt) asset.alt = "Imagem de " + next.brand.name;
  }
  if (!next.disclosure) next.disclosure = "Demonstração comercial criada pela TRUINEXA.";
  return next;
}

function licensedFallbackAssets(segmentRaw: string) {
  const segment = segmentRaw.toLowerCase();
  const image = (url: string, alt: string) => ({
    url,
    alt,
    source: "licensed",
    attribution: "Unsplash • imagem ilustrativa",
    verified: false,
    illustrative: true,
  });

  if (/barbearia|sal[aã]o/.test(segment)) {
    return [
      image("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=82", "Barbearia — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1600&q=82", "Profissional de barbearia — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1600&q=82", "Corte masculino — imagem ilustrativa"),
    ];
  }
  if (/odonto|dent|cl[ií]nica|dermato|est[eé]tica|sa[uú]de/.test(segment)) {
    return [
      image("https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1600&q=82", "Atendimento clínico — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=82", "Profissional de saúde — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1600&q=82", "Ambiente de saúde — imagem ilustrativa"),
    ];
  }
  if (/construtora|engenharia|arquitet|imobili/.test(segment)) {
    return [
      image("https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=82", "Arquitetura — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=82", "Projeto corporativo — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=82", "Construção — imagem ilustrativa"),
    ];
  }
  if (/restaurante|gastronomia|caf[eé]|pizz|hamb/.test(segment)) {
    return [
      image("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=82", "Restaurante — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=82", "Gastronomia — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=82", "Prato — imagem ilustrativa"),
    ];
  }
  if (/pet/.test(segment)) {
    return [
      image("https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1600&q=82", "Pet — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1600&q=82", "Cães — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1600&q=82", "Cuidado pet — imagem ilustrativa"),
    ];
  }
  if (/oficina|auto|mec[aâ]nica/.test(segment)) {
    return [
      image("https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1600&q=82", "Oficina — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1600&q=82", "Mecânica — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=82", "Serviço automotivo — imagem ilustrativa"),
    ];
  }
  if (/tecnologia|software|saas|\\bti\\b/.test(segment)) {
    return [
      image("https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=82", "Equipe de tecnologia — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=82", "Ambiente de trabalho — imagem ilustrativa"),
      image("https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=82", "Colaboração — imagem ilustrativa"),
    ];
  }
  return [
    image("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=82", "Empresa — imagem ilustrativa"),
    image("https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=82", "Equipe — imagem ilustrativa"),
  ];
}

function buildBriefing(lead: any, website: any, places: any, aiPlan: any) {
  const segment = txt(lead.segment) || "Serviços";
  const profile = segmentProfile(segment);
  const assetsMap = new Map<string, any>();

  for (const asset of [...(places.photos || []), ...(website.images || [])]) {
    if (asset?.url && !assetsMap.has(asset.url)) assetsMap.set(asset.url, asset);
  }

  if (assetsMap.size < 3) {
    for (const asset of licensedFallbackAssets(segment)) {
      if (assetsMap.size >= 5) break;
      if (asset?.url && !assetsMap.has(asset.url)) assetsMap.set(asset.url, asset);
    }
  }

  const location = [lead.neighborhood, lead.city, lead.state].filter(Boolean).join(", ");
  const verifiedFacts = [
    location ? "Atendimento em " + location : "",
    places.rating ? "Nota pública " + Number(places.rating).toFixed(1) + " no Google" : "",
    places.reviewCount ? String(places.reviewCount) + " avaliações públicas" : "",
    website.reachable ? "Site oficial localizado" : "",
  ].filter(Boolean);

  const services = profile.services.map((item: any, index: number) => ({
    name: index === 0 && (lead.recommended_service || lead.service_interest)
      ? txt(lead.recommended_service || lead.service_interest)
      : item[0],
    description: item[1],
  }));

  const briefing = {
    company: txt(lead.company),
    segment,
    location,
    summary: txt(website.description || lead.company_summary) ||
      txt(lead.company) + " atua em " + segment.toLowerCase() + " e possui oportunidade de organizar melhor sua presença digital.",
    audience: aiPlan?.audience || profile.audience,
    positioning: aiPlan?.positioning || profile.positioning,
    tone: aiPlan?.tone || profile.tone,
    opportunity: txt(lead.opportunity_reason || lead.opportunity_summary) || profile.positioning,
    recommendedService: txt(lead.recommended_service || lead.service_interest) || services[0]?.name || "",
    differentiators: Array.isArray(aiPlan?.differentiators) && aiPlan.differentiators.length
      ? aiPlan.differentiators.slice(0, 5)
      : [
          website.reachable ? "Presença digital existente que pode ser refinada" : "Oportunidade de criar presença digital própria",
          lead.whatsapp ? "Contato direto por WhatsApp" : "Canal comercial direto",
          places.rating ? "Reputação pública verificável" : "Comunicação focada em confiança",
        ],
    services,
    verifiedFacts,
    reviews: places.reviews || [],
    assets: [...assetsMap.values()].slice(0, 12),
    logo: website.logoUrl
      ? {
          url: website.logoUrl,
          alt: "Logo " + txt(lead.company),
          attribution: "Site oficial",
          source: "official-site",
          verified: true,
        }
      : undefined,
    contact: {
      whatsapp: txt(lead.whatsapp || lead.phone),
      phone: txt(places.phone || lead.phone),
      email: txt(lead.email),
      instagram: txt(lead.instagram_url || lead.instagram || website.instagram),
      website: txt(places.website || website.url || lead.website),
      address: txt(places.address || lead.address),
      mapsUrl: txt(places.mapsUrl),
      openingHours: Array.isArray(places.openingHours) ? places.openingHours : [],
    },
    sourceCoverage: {
      crm: true,
      officialSite: Boolean(website.reachable),
      instagram: Boolean(lead.instagram_url || lead.instagram || website.instagram),
      googlePlaces: Boolean(places.found),
    },
    preferred: profile.preferred,
    action: profile.action,
  };

  return briefing;
}

function studioAISchema() {
  const blockVariants = [
    "cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type",
    "split","statement",
    "editorial-list","grid","alternating","spotlight","bento","timeline",
    "mosaic","carousel","filmstrip","editorial-grid",
    "feature","inline","showcase","accordion","compact","location-card","map-split",
    "minimal","banner","split-cta"
  ];

  const directionSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      family: { type: "string", enum: FAMILIES },
      name: { type: "string" },
      rationale: { type: "string" },
      concept: { type: "string" },
      score: { type: "integer", minimum: 0, maximum: 100 },
      colors: {
        type: "object",
        additionalProperties: false,
        properties: {
          background: { type: "string" },
          surface: { type: "string" },
          surfaceAlt: { type: "string" },
          text: { type: "string" },
          muted: { type: "string" },
          primary: { type: "string" },
          accent: { type: "string" },
          border: { type: "string" }
        },
        required: ["background","surface","surfaceAlt","text","muted","primary","accent","border"]
      },
      typography: {
        type: "object",
        additionalProperties: false,
        properties: {
          display: { type: "string" },
          body: { type: "string" },
          scale: { type: "string", enum: ["compact","balanced","expressive"] }
        },
        required: ["display","body","scale"]
      },
      radius: { type: "string", enum: ["sharp","soft","rounded"] },
      density: { type: "string", enum: ["airy","balanced","compact"] },
      imageTreatment: { type: "string", enum: ["natural","cinematic","editorial","soft","high-contrast"] },
      motion: { type: "string", enum: ["none","subtle","expressive"] },
      heroVariant: { type: "string", enum: ["cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type"] },
      servicesVariant: { type: "string", enum: ["editorial-list","grid","alternating","spotlight","bento","timeline"] },
      galleryVariant: { type: "string", enum: ["mosaic","carousel","filmstrip","editorial-grid"] },
      navStyle: { type: "string", enum: ["minimal","floating","solid"] },
      compositionNotes: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 }
    },
    required: [
      "id","family","name","rationale","concept","score","colors","typography","radius","density",
      "imageTreatment","motion","heroVariant","servicesVariant","galleryVariant","navStyle","compositionNotes"
    ]
  };

  const blockSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      type: {
        type: "string",
        enum: ["hero","intro","services","gallery","reviews","stats","projects","faq","form","map","cta","contact"]
      },
      variant: { type: "string", enum: blockVariants },
      eyebrow: { type: "string" },
      title: { type: "string" },
      body: { type: "string" },
      itemMode: {
        type: "string",
        enum: ["none","services","differentiators","reviews","verifiedFacts","faq","assets"]
      },
      mediaMode: {
        type: "string",
        enum: ["none","hero","feature","gallery","services"]
      },
      primaryAction: {
        type: "string",
        enum: ["none","whatsapp","phone","page-services","page-contact","page-gallery","page-projects"]
      },
      secondaryAction: {
        type: "string",
        enum: ["none","whatsapp","phone","page-services","page-contact","page-gallery","page-projects"]
      }
    },
    required: [
      "type","variant","eyebrow","title","body","itemMode","mediaMode","primaryAction","secondaryAction"
    ]
  };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      audience: { type: "string" },
      positioning: { type: "string" },
      tone: { type: "string" },
      brandIdea: { type: "string" },
      commercialAngle: { type: "string" },
      differentiators: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
      doNotUse: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 },
      directions: {
        type: "array",
        items: directionSchema,
        minItems: 3,
        maxItems: 3
      },
      selectedDirectionId: { type: "string" },
      pages: {
        type: "array",
        minItems: 3,
        maxItems: 7,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", enum: ["home","about","services","gallery","reviews","projects","faq","contact"] },
            label: { type: "string" },
            purpose: { type: "string" },
            blocks: { type: "array", items: blockSchema, minItems: 1, maxItems: 5 }
          },
          required: ["id","label","purpose","blocks"]
        }
      },
      seoTitle: { type: "string" },
      seoDescription: { type: "string" },
      reviewChecklist: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 10 }
    },
    required: [
      "audience","positioning","tone","brandIdea","commercialAngle","differentiators","doNotUse",
      "directions","selectedDirectionId","pages","seoTitle","seoDescription","reviewChecklist"
    ]
  };
}

function extractOutputText(data: any) {
  if (typeof data?.output_text === "string") return data.output_text;
  const parts: string[] = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item.content || []) {
      if (content?.type === "output_text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n");
}

async function optionalAIStudioPlan(lead: any, research: any, briefing: any, recentDesignFingerprints: any[] = []) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;

  const model = Deno.env.get("OPENAI_SITE_MODEL") || "gpt-6.1-sol";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 85000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: "high" },
        tools: [{ type: "web_search" }],
        instructions: [
          "Você é a equipe criativa sênior do TRIUNEXA DIGITAL, responsável por um site comercial que precisa parecer feito sob medida por uma agência de alto nível.",
          "Trabalhe internamente em sete papéis reais: pesquisador, estrategista, diretor de arte, arquiteto de informação, copywriter, designer de conversão e crítico.",
          "A prioridade é DIFERENCIAÇÃO. Não use fórmulas genéricas de IA e não monte sempre hero + 3 cards + CTA.",
          "A composição precisa nascer da empresa, do segmento, dos ativos visuais reais e do objetivo comercial.",
          "Crie exatamente três direções artísticas que sejam estruturalmente diferentes, não somente paletas diferentes.",
          "Considere o campo recentDesignFingerprints: são estruturas de projetos anteriores sem dados de clientes. Evite repetir hero, composição, sequência de seções e ritmo desses trabalhos.",
          "Trocar cores, fotografias, títulos ou fontes sem mudar a arquitetura visual NÃO conta como direção artística original.",
          "Prefira um ritmo editorial coerente com cada marca. Não adicione seções para preencher espaço nem afirme que uma integração está funcionando se não houver dados.",
          "Evite clichês como 'uma experiência digital feita para o seu negócio', 'como podemos ajudar', 'soluções sob medida', 'excelência e qualidade' e títulos vazios.",
          "Escreva títulos comerciais específicos e naturais em português do Brasil.",
          "Nunca invente equipe, anos de mercado, números, endereço, avaliações, serviços específicos ou diferenciais factuais que não estejam confirmados.",
          "Avaliações só podem ser usadas quando vierem em verifiedResearch/briefing.",
          "Se uma informação não existir, crie composição e linguagem, não fatos.",
          "Use fotografia real da empresa quando disponível; material licenciado é apenas ilustrativo.",
          "Pense em ritmo visual: contraste entre seções, espaço negativo, imagem, tipografia, blocos amplos, assimetria e momentos de pausa.",
          "Escolha somente páginas e blocos que agreguem valor. Um site menor e memorável é melhor que um site cheio de seções genéricas.",
          "Não gere HTML, CSS ou JavaScript. Entregue somente o plano estruturado solicitado."
        ].join("\n"),
        input: [{
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              company: {
                name: lead.company,
                segment: lead.segment,
                city: lead.city,
                neighborhood: lead.neighborhood,
                address: lead.address,
                officialWebsite: lead.website,
                instagram: lead.instagram_url || lead.instagram
              },
              verifiedBriefing: briefing,
              verifiedResearch: research,
              recentDesignFingerprints,
              componentRegistry: {
                hero: ["cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type"],
                intro: ["split","editorial","statement"],
                services: ["editorial-list","grid","alternating","spotlight","bento","timeline"],
                gallery: ["mosaic","carousel","filmstrip","editorial-grid"],
                reviews: ["grid","feature"],
                stats: ["inline"],
                projects: ["showcase"],
                faq: ["accordion"],
                form: ["compact"],
                map: ["location-card"],
                cta: ["minimal","banner","split-cta"],
                contact: ["split","map-split"]
              }
            })
          }]
        }],
        text: {
          format: {
            type: "json_schema",
            name: "truinexa_site_studio_plan_v3",
            strict: true,
            schema: studioAISchema()
          }
        },
        max_output_tokens: 12000
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error("OpenAI " + response.status + (detail ? ": " + detail.slice(0, 300) : ""));
    }

    const data = await response.json();
    const raw = extractOutputText(data);
    if (!raw) throw new Error("Resposta vazia do diretor criativo.");
    return { plan: JSON.parse(raw), model };
  } finally {
    clearTimeout(timer);
  }
}

function criticSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "integer", minimum: 0, maximum: 100 },
      verdict: { type: "string" },
      issues: {
        type: "array",
        minItems: 0,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            severity: { type: "string", enum: ["low","medium","high"] },
            category: { type: "string" },
            problem: { type: "string" },
            fix: { type: "string" }
          },
          required: ["severity","category","problem","fix"]
        }
      },
      patch: {
        type: "object",
        additionalProperties: false,
        properties: {
          heroVariant: { type: "string", enum: ["keep","cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type"] },
          servicesVariant: { type: "string", enum: ["keep","editorial-list","grid","alternating","spotlight","bento","timeline"] },
          galleryVariant: { type: "string", enum: ["keep","mosaic","carousel","filmstrip","editorial-grid"] },
          heroTitle: { type: "string" },
          heroBody: { type: "string" },
          removeGenericCopy: { type: "boolean" },
          emphasizePhotography: { type: "boolean" },
          density: { type: "string", enum: ["keep","airy","balanced","compact"] },
          motion: { type: "string", enum: ["keep","none","subtle","expressive"] }
        },
        required: [
          "heroVariant","servicesVariant","galleryVariant","heroTitle","heroBody",
          "removeGenericCopy","emphasizePhotography","density","motion"
        ]
      }
    },
    required: ["score","verdict","issues","patch"]
  };
}

async function optionalAICritic(briefing: any, spec: any, plan: any) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;
  const model = Deno.env.get("OPENAI_SITE_REVIEW_MODEL") || Deno.env.get("OPENAI_SITE_MODEL") || "gpt-6.1-sol";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: "high" },
        instructions: [
          "Você é o crítico de direção de arte da TRIUNEXA. Seja rigoroso.",
          "Analise a especificação como se fosse uma apresentação que será mostrada a um cliente pagante.",
          "Procure repetição de fórmulas, linguagem genérica, hierarquia fraca, excesso de cards, fotografia mal aproveitada, ritmo monótono, páginas desnecessárias e falta de identidade.",
          "Não aprove um site apenas porque ele é tecnicamente válido.",
          "A meta é parecer trabalho de agência premium, específico para esta empresa.",
          "Não invente fatos. O patch só pode alterar apresentação e copy não factual."
        ].join("\n"),
        input: [{
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              briefing,
              creativePlan: {
                brandIdea: plan?.brandIdea,
                commercialAngle: plan?.commercialAngle,
                doNotUse: plan?.doNotUse,
                reviewChecklist: plan?.reviewChecklist
              },
              siteSpec: spec
            })
          }]
        }],
        text: {
          format: {
            type: "json_schema",
            name: "truinexa_site_critic",
            strict: true,
            schema: criticSchema()
          }
        },
        max_output_tokens: 3500
      })
    });

    if (!response.ok) throw new Error("OpenAI critic " + response.status);
    const data = await response.json();
    const raw = extractOutputText(data);
    if (!raw) throw new Error("Crítica vazia.");
    return { review: JSON.parse(raw), model };
  } finally {
    clearTimeout(timer);
  }
}

async function optionalAIRefinementPlan(spec: any, instruction: string) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;
  const model = Deno.env.get("OPENAI_SITE_MODEL") || "gpt-6.1-sol";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      family: {
        type: "string",
        enum: [
          "keep",
          "editorial-premium",
          "corporate-professional",
          "luxury-experience",
          "modern-minimal",
          "creative-studio",
          "technology-premium",
          "local-business-pro",
          "visual-showcase"
        ]
      },
      heroVariant: {
        type: "string",
        enum: ["keep", "cinematic", "editorial", "fullscreen", "asymmetric"]
      },
      servicesVariant: {
        type: "string",
        enum: ["keep", "editorial-list", "grid", "alternating", "spotlight"]
      },
      galleryVariant: {
        type: "string",
        enum: ["keep", "mosaic", "carousel", "filmstrip"]
      },
      density: {
        type: "string",
        enum: ["keep", "airy", "balanced", "compact"]
      },
      motion: {
        type: "string",
        enum: ["keep", "none", "subtle", "expressive"]
      },
      largerPhotography: { type: "boolean" },
      addGallery: { type: "boolean" },
      addProjects: { type: "boolean" },
      summary: { type: "string" }
    },
    required: [
      "family",
      "heroVariant",
      "servicesVariant",
      "galleryVariant",
      "density",
      "motion",
      "largerPhotography",
      "addGallery",
      "addProjects",
      "summary"
    ]
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: "high" },
        instructions:
          "Você é o refinador do TRIUNEXA Design Engine. Interprete a instrução do usuário e retorne somente operações estruturadas permitidas. Preserve conteúdo factual, contatos, avaliações e ativos verificados. Não gere HTML, CSS ou JavaScript. Não invente fatos. Uma alteração pequena deve modificar somente o necessário.",
        input: [{
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              instruction,
              currentDirection: spec.direction,
              currentTokens: spec.tokens,
              currentPages: (spec.pages || []).map((page: any) => ({
                id: page.id,
                label: page.label,
                blocks: (page.blocks || []).map((block: any) => ({
                  type: block.type,
                  variant: block.variant
                }))
              }))
            })
          }]
        }],
        text: {
          format: {
            type: "json_schema",
            name: "truinexa_refinement_plan",
            strict: true,
            schema
          }
        },
        max_output_tokens: 1200
      })
    });

    if (!response.ok) throw new Error("OpenAI refinement " + response.status);
    const data = await response.json();
    const raw = extractOutputText(data);
    if (!raw) throw new Error("Plano de refinamento vazio.");
    return { plan: JSON.parse(raw), model };
  } finally {
    clearTimeout(timer);
  }
}

function applyRefinementPlan(spec: any, plan: any) {
  const next = structuredClone(spec);

  if (plan.family && plan.family !== "keep") {
    next.direction.family = plan.family;
    next.direction.name = plan.family
      .split("-")
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    next.tokens = palette(plan.family, hash(next.brand.name), "");
  }

  if (plan.density && plan.density !== "keep") next.tokens.density = plan.density;
  if (plan.motion && plan.motion !== "keep") next.tokens.motion = plan.motion;

  for (const page of next.pages || []) {
    for (const block of page.blocks || []) {
      if (block.type === "hero" && plan.heroVariant !== "keep") {
        block.variant = plan.heroVariant;
      }
      if (block.type === "services" && plan.servicesVariant !== "keep") {
        block.variant = plan.servicesVariant;
      }
      if (block.type === "gallery" && plan.galleryVariant !== "keep") {
        block.variant = plan.galleryVariant;
      }
      if (plan.largerPhotography && block.type === "hero") {
        block.variant = "cinematic";
      }
    }
  }

  if (plan.addGallery && !next.pages.some((page: any) => page.id === "gallery") && next.assets?.length) {
    next.pages.splice(Math.max(1, next.pages.length - 1), 0, {
      id: "gallery",
      slug: "/galeria",
      label: "Galeria",
      title: "Galeria",
      blocks: [
        makeBlock("gallery-ai-refine", "gallery", plan.galleryVariant === "keep" ? "mosaic" : plan.galleryVariant, {
          title: "Galeria",
          media: next.assets.slice(0, 9)
        })
      ]
    });
  }

  if (plan.addProjects && !next.pages.some((page: any) => page.id === "projects")) {
    next.pages.splice(Math.max(1, next.pages.length - 1), 0, {
      id: "projects",
      slug: "/projetos",
      label: "Projetos",
      title: "Projetos",
      blocks: [
        makeBlock("projects-ai-refine", "projects", "showcase", {
          title: "Projetos em destaque",
          media: (next.assets || []).slice(0, 8)
        })
      ]
    });
  }

  next.navigation = (next.pages || []).map((page: any) => ({
    pageId: page.id,
    label: page.label
  }));

  return next;
}

function refineRuleBased(spec: any, instructionRaw: string) {
  const instruction = instructionRaw.toLowerCase();
  const next = structuredClone(spec);
  if (/minimalista|minimal|mais limpo/.test(instruction)) {
    next.direction.family = "modern-minimal";
    next.direction.name = "Modern Minimal";
    next.tokens = palette("modern-minimal", hash(next.brand.name), "");
  }
  if (/sofistic|luxo|luxury|premium/.test(instruction)) {
    next.direction.family = "luxury-experience";
    next.direction.name = "Luxury Experience";
    next.tokens = palette("luxury-experience", hash(next.brand.name), "");
  }
  if (/empresarial|corporativ/.test(instruction)) {
    next.direction.family = "corporate-professional";
    next.direction.name = "Corporate Professional";
    next.tokens = palette("corporate-professional", hash(next.brand.name), "");
  }
  if (/foto|fotografia|imagem/.test(instruction) && /maior|grande|destaque/.test(instruction)) {
    for (const page of next.pages) {
      for (const block of page.blocks) {
        if (block.type === "hero") block.variant = "cinematic";
        if (block.type === "gallery") block.variant = "mosaic";
      }
    }
  }
  if (/hero/.test(instruction) && /mude|troque|altere/.test(instruction)) {
    const variants = ["cinematic", "editorial", "fullscreen", "asymmetric"];
    const heroBlock = next.pages.flatMap((page: any) => page.blocks).find((block: any) => block.type === "hero");
    if (heroBlock) {
      const current = variants.indexOf(heroBlock.variant);
      heroBlock.variant = variants[(current + 1 + variants.length) % variants.length];
    }
  }
  if (/galeria/.test(instruction) && /adic|crie|coloque/.test(instruction) && !next.pages.some((page: any) => page.id === "gallery")) {
    next.pages.splice(Math.max(1, next.pages.length - 1), 0, {
      id: "gallery",
      slug: "/galeria",
      label: "Galeria",
      title: "Galeria",
      blocks: [makeBlock("gallery-refine", "gallery", "mosaic", { title: "Galeria", media: next.assets.slice(0, 9) })],
    });
  }
  if (/projeto/.test(instruction) && /p[aá]gina|adic|crie/.test(instruction) && !next.pages.some((page: any) => page.id === "projects")) {
    next.pages.splice(Math.max(1, next.pages.length - 1), 0, {
      id: "projects",
      slug: "/projetos",
      label: "Projetos",
      title: "Projetos",
      blocks: [makeBlock("projects-refine", "projects", "showcase", { title: "Projetos em destaque", media: next.assets.slice(0, 8) })],
    });
  }
  next.navigation = next.pages.map((page: any) => ({ pageId: page.id, label: page.label }));
  return next;
}

async function markStage(admin: any, runId: string, stageId: string, status: string, message = "", metadata: any = {}) {
  const { data: run } = await admin
    .from("truinexa_site_generation_runs")
    .select("stages,started_at")
    .eq("id", runId)
    .maybeSingle();
  const stages = Array.isArray(run?.stages) ? run.stages : [];
  const nextStages = stages.map((stage: any) =>
    stage.id === stageId
      ? {
          ...stage,
          status,
          message,
          metadata,
          startedAt: status === "running" ? stage.startedAt || new Date().toISOString() : stage.startedAt,
          finishedAt: status === "completed" || status === "failed" ? new Date().toISOString() : stage.finishedAt,
        }
      : stage
  );
  const stageTuple = STAGES.find((item) => item[0] === stageId);
  await admin
    .from("truinexa_site_generation_runs")
    .update({
      status: status === "failed" ? "failed" : "running",
      current_stage: stageId,
      progress: Number(stageTuple?.[2] || 0),
      stages: nextStages,
      started_at: run?.started_at || new Date().toISOString(),
    })
    .eq("id", runId);
}

async function finishRun(admin: any, runId: string, versionId: string, qualityReport: any) {
  const { data: run } = await admin
    .from("truinexa_site_generation_runs")
    .select("stages")
    .eq("id", runId)
    .maybeSingle();
  const stages = Array.isArray(run?.stages) ? run.stages : [];
  await admin
    .from("truinexa_site_generation_runs")
    .update({
      status: "succeeded",
      current_stage: "completed",
      progress: 100,
      stages,
      quality_report: qualityReport,
      result_version_id: versionId,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

async function failRun(admin: any, runId: string, projectId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Falha na geração.";
  const { data: run } = await admin
    .from("truinexa_site_generation_runs")
    .select("stages,current_stage")
    .eq("id", runId)
    .maybeSingle();
  const stages = (run?.stages || []).map((stage: any) =>
    stage.id === run?.current_stage
      ? { ...stage, status: "failed", message, finishedAt: new Date().toISOString() }
      : stage
  );
  await admin
    .from("truinexa_site_generation_runs")
    .update({
      status: "failed",
      stages,
      error_message: message,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);
  await admin
    .from("truinexa_site_projects")
    .update({ status: "error", error_message: message })
    .eq("id", projectId);
}

async function nextVersionNumber(admin: any, projectId: string) {
  const { data } = await admin
    .from("truinexa_site_versions")
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(data?.version_number || 0) + 1;
}

async function saveVersion(
  admin: any,
  project: any,
  userId: string,
  spec: any,
  briefing: any,
  direction: any,
  qualityReport: any,
  instruction: string,
  generationMode: string,
  modelName: string | null
) {
  const versionNumber = await nextVersionNumber(admin, project.id);
  const { data: version, error } = await admin
    .from("truinexa_site_versions")
    .insert({
      project_id: project.id,
      version_number: versionNumber,
      spec_version: 2,
      site_spec: spec,
      briefing,
      design_direction: direction,
      quality_report: qualityReport,
      change_instruction: instruction || "",
      generation_mode: generationMode,
      model_name: modelName,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;

  const { error: projectError } = await admin
    .from("truinexa_site_projects")
    .update({
      status: project.published ? "published" : "ready",
      spec_version: 2,
      site_spec: spec,
      briefing,
      design_direction: direction,
      quality_report: qualityReport,
      active_version_id: version.id,
      generation_mode: generationMode === "openai" ? "openai" : "smart_template",
      model_name: modelName,
      error_message: null,
    })
    .eq("id", project.id);
  if (projectError) throw projectError;
  return version;
}

function diversifySpec(spec: any, seedText: string) {
  const next = structuredClone(spec);
  const seed = hash(seedText);
  const heroVariants = ["cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type"];
  const serviceVariants = ["editorial-list","grid","alternating","spotlight","bento","timeline"];
  const galleryVariants = ["mosaic","carousel","filmstrip","editorial-grid"];

  const blocks = (next.pages || []).flatMap((page: any) => page.blocks || []);
  const hero = blocks.find((block: any) => block.type === "hero");
  const services = blocks.find((block: any) => block.type === "services");
  const gallery = blocks.find((block: any) => block.type === "gallery");

  if (hero) {
    const current = Math.max(0, heroVariants.indexOf(hero.variant));
    hero.variant = heroVariants[(current + 1 + (seed % 3)) % heroVariants.length];
  }
  if (services) {
    const current = Math.max(0, serviceVariants.indexOf(services.variant));
    services.variant = serviceVariants[(current + 1 + (seed % 2)) % serviceVariants.length];
  }
  if (gallery) {
    const current = Math.max(0, galleryVariants.indexOf(gallery.variant));
    gallery.variant = galleryVariants[(current + 1) % galleryVariants.length];
  }

  return next;
}

async function processGeneration(admin: any, run: any, project: any, lead: any, directionId: string | null) {
  try {
    await markStage(admin, run.id, "identify", "running", "Carregando identidade, contexto e histórico do cliente.");
    if (!lead?.company) throw new Error("Lead sem nome de empresa.");
    await markStage(admin, run.id, "identify", "completed", "Empresa identificada.");

    await markStage(admin, run.id, "sources", "running", "Validando fontes e ativos visuais.");

    const cachedResearch = project.source_snapshot || {};
    const cachedAt = Date.parse(txt(cachedResearch.capturedAt));
    const cacheFresh =
      Number.isFinite(cachedAt) &&
      Date.now() - cachedAt < 24 * 60 * 60 * 1000 &&
      cachedResearch.website &&
      cachedResearch.googlePlaces;

    let website: any;
    let places: any;
    let research: any;

    if (cacheFresh) {
      website = cachedResearch.website;
      places = cachedResearch.googlePlaces;
      research = {
        ...cachedResearch,
        cacheHit: true,
        reusedAt: new Date().toISOString()
      };
    } else {
      [website, places] = await Promise.all([
        researchWebsite(lead.website),
        researchPlaces(lead)
      ]);
      research = {
        website,
        googlePlaces: places,
        instagram: txt(lead.instagram_url || lead.instagram || website.instagram),
        sourceUrl: lead.source_url || "",
        validationSources: lead.validation_sources || [],
        capturedAt: new Date().toISOString(),
        cacheHit: false
      };
    }

    await admin.from("truinexa_site_generation_runs").update({ research }).eq("id", run.id);
    await markStage(
      admin,
      run.id,
      "sources",
      "completed",
      research.cacheHit ? "Fontes reutilizadas do cache validado." : "Fontes verificadas.",
      {
        cacheHit: Boolean(research.cacheHit),
        officialSite: Boolean(website.reachable),
        googlePlaces: Boolean(places.found),
        instagram: Boolean(research.instagram),
        images: Number((website.images || []).length + (places.photos || []).length)
      }
    );

    await markStage(admin, run.id, "briefing", "running", "Construindo briefing factual antes da criação.");
    const baselineBriefing = buildBriefing(lead, website, places, null);
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    // Consult design history BEFORE planning. Only structural fingerprints
    // (never other customers' names, contacts or content) reach the model.
    const { data: recentProjects, error: historyError } = await admin
      .from("truinexa_site_projects")
      .select("id,site_spec")
      .neq("id", project.id)
      .eq("spec_version", 2)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (historyError) console.warn("Design history unavailable:", historyError.message);
    const designReferences = (recentProjects || [])
      .map((item: any) => item.site_spec)
      .filter((item: any) => item?.version === 2 && Array.isArray(item.pages));
    const recentDesignFingerprints = designReferences.slice(0, 12).map(fingerprintSiteDesign);

    let aiStudio: any = null;
    if (openAIKey) {
      await markStage(admin, run.id, "briefing", "running", "GPT-6.1 Sol está pesquisando, pensando e definindo a estratégia criativa.");
      try {
        aiStudio = await optionalAIStudioPlan(lead, research, baselineBriefing, recentDesignFingerprints);
      } catch (error) {
        console.error("Advanced AI fallback:", error);
      }
    }

    const aiPlan = aiStudio?.plan || null;
    const briefing = buildBriefing(lead, website, places, aiPlan);
    if (aiPlan?.directions?.length) {
      briefing.preferred = aiPlan.directions.map((direction: any) => direction.family).filter(Boolean).slice(0, 3);
    }

    await admin.from("truinexa_site_generation_runs").update({ briefing }).eq("id", run.id);
    await markStage(
      admin,
      run.id,
      "briefing",
      "completed",
      aiPlan
        ? "Briefing e conceito criativo construídos com raciocínio avançado."
        : "Briefing concluído em modo estruturado; IA avançada não está configurada."
    );

    await markStage(admin, run.id, "strategy", "running", "Definindo posicionamento, narrativa e conversão.");
    const strategy = {
      mode: aiPlan ? "advanced-ai" : "structured-fallback",
      model: aiStudio?.model || null,
      audience: briefing.audience,
      positioning: briefing.positioning,
      tone: briefing.tone,
      conversionGoal: briefing.action,
      opportunity: briefing.opportunity,
      brandIdea: aiPlan?.brandIdea || "",
      commercialAngle: aiPlan?.commercialAngle || "",
      doNotUse: aiPlan?.doNotUse || []
    };
    await admin.from("truinexa_site_generation_runs").update({ strategy }).eq("id", run.id);
    await markStage(
      admin,
      run.id,
      "strategy",
      "completed",
      aiPlan ? "Estratégia autoral definida pela IA." : "Estratégia estruturada definida."
    );

    await markStage(admin, run.id, "art", "running", "Criando três direções com composições realmente diferentes.");

    let directions: any[];
    let selected: any;
    let spec: any;

    if (aiPlan) {
      const built = buildSpecFromAIPlan(briefing, aiPlan, directionId);
      directions = built.directions;
      selected = built.selected;
      spec = built.spec;
    } else {
      directions = createDirections(briefing, txt(website.themeColor));
      selected =
        directions.find((direction: any) => direction.id === directionId) ||
        directions.slice().sort((a: any, b: any) => b.score - a.score)[0];
      spec = buildSpec(briefing, selected);
    }

    await admin
      .from("truinexa_site_generation_runs")
      .update({ directions, selected_direction: selected })
      .eq("id", run.id);

    await markStage(
      admin,
      run.id,
      "art",
      "completed",
      aiPlan
        ? "Três conceitos artísticos autorais foram comparados."
        : "Três direções estruturadas foram comparadas.",
      { selected: selected?.id, score: selected?.score, mode: strategy.mode }
    );

    await markStage(admin, run.id, "architecture", "running", "Planejando páginas, ritmo e hierarquia visual.");
    if (!spec?.pages?.length) throw new Error("A arquitetura do site ficou vazia.");
    await markStage(
      admin,
      run.id,
      "architecture",
      "completed",
      String(spec.pages.length) + " páginas planejadas com " +
        String(spec.pages.flatMap((page: any) => page.blocks || []).length) + " blocos."
    );

    await markStage(admin, run.id, "build", "running", "Montando o SiteSpec sem executar código arbitrário.");
    if (spec.version !== 2 || !Array.isArray(spec.pages)) throw new Error("SiteSpec V2 inválido.");

    const diversityAudit = chooseDistinctDesign(
      spec, designReferences, briefing.company + ":" + run.id, 0.82
    );
    const duplicateComposition = diversityAudit.originalSimilarity >= diversityAudit.threshold;
    spec = diversityAudit.spec;

    await markStage(
      admin,
      run.id,
      "build",
      "completed",
      diversityAudit.changed
        ? "Similaridade elevada detectada: alternativa estrutural selecionada."
        : duplicateComposition
          ? "Composição muito semelhante; revisão de originalidade necessária."
          : "Composição comparada com os projetos recentes."
    );

    await markStage(admin, run.id, "quality", "running", "Executando crítica de agência e validação técnica.");

    let critic: any = null;
    if (aiPlan) {
      try {
        critic = await optionalAICritic(briefing, spec, aiPlan);
        if (critic?.review) {
          spec = applyCriticPatch(spec, critic.review);
        }
      } catch (error) {
        console.error("AI critic fallback:", error);
      }
    }

    let repaired = repair(spec);
    let qualityReport = quality(repaired);

    if (critic?.review) {
      qualityReport.aiCritic = {
        score: critic.review.score,
        verdict: critic.review.verdict,
        issues: critic.review.issues,
        model: critic.model
      };
      if (Number(critic.review.score || 0) < 72) {
        qualityReport.passed = false;
        qualityReport.fixes = [
          ...(qualityReport.fixes || []),
          "A crítica de direção de arte ficou abaixo do mínimo: " + critic.review.score
        ];
      }
    }

    qualityReport.designDiversity = {
      compared: diversityAudit.compared,
      initialSimilarity: diversityAudit.originalSimilarity,
      finalSimilarity: diversityAudit.finalSimilarity,
      threshold: diversityAudit.threshold,
      structurallyChanged: diversityAudit.changed
    };
    qualityReport.visualReviewStatus = "pending_real_screenshots";
    if (diversityAudit.compared > 0) {
      const stillSimilar = diversityAudit.finalSimilarity >= diversityAudit.threshold;
      qualityReport.checks = [
        ...(qualityReport.checks || []),
        {
          id: "portfolio-distinctiveness",
          label: "Diferenciação contra sites recentes",
          score: stillSimilar ? 55 : 94,
          passed: !stillSimilar,
          detail: "Similaridade estrutural máxima: " +
            Math.round(diversityAudit.finalSimilarity * 100) + "% entre " +
            diversityAudit.compared + " projetos (limite: " +
            Math.round(diversityAudit.threshold * 100) + "%)."
        }
      ];
      if (stillSimilar) {
        qualityReport.passed = false;
        qualityReport.fixes = [
          ...(qualityReport.fixes || []),
          "Site muito parecido com projetos recentes: refazer a arquitetura e a direção de arte."
        ];
      }
    }

    await admin
      .from("truinexa_site_generation_runs")
      .update({ quality_report: qualityReport })
      .eq("id", run.id);

    if (!qualityReport.passed) {
      throw new Error(
        "A revisão não aprovou o site. Pontuação estrutural: " + qualityReport.score +
        (critic?.review?.score ? " • crítica de arte: " + critic.review.score : "")
      );
    }

    await markStage(
      admin,
      run.id,
      "quality",
      "completed",
      critic?.review
        ? "Crítica da especificação e validação estrutural concluídas; revisão por screenshots pendente."
        : "Validação estrutural concluída; revisão visual por screenshots pendente.",
      {
        structuralScore: qualityReport.score,
        criticScore: critic?.review?.score || null,
        genericCopyCount: genericCopyScore(repaired)
      }
    );

    await markStage(admin, run.id, "finalize", "running", "Versionando e preparando o preview.");

    const mode = aiPlan ? "openai" : "design_engine";
    const modelName = aiStudio?.model || null;
    const version = await saveVersion(
      admin,
      project,
      run.requested_by,
      repaired,
      briefing,
      selected,
      qualityReport,
      "",
      mode,
      modelName
    );

    await admin
      .from("truinexa_site_projects")
      .update({
        analysis: {
          company: briefing.company,
          segment: briefing.segment,
          location: briefing.location,
          summary: briefing.summary,
          opportunity: briefing.opportunity,
          recommendedService: briefing.recommendedService,
          sourceCoverage: briefing.sourceCoverage,
          integrations: {
            googlePlacesConfigured: Boolean(places.connected),
            instagramOfficialApiConfigured: false,
            openaiConfigured: Boolean(openAIKey)
          },
          creativeMode: aiPlan ? "advanced-ai" : "structured-fallback",
          model: modelName,
          designEngine: "TRIUNEXA Design Engine V3 AI-First",
          specVersion: 2
        },
        source_snapshot: research,
        generation_run_id: run.id
      })
      .eq("id", project.id);

    await markStage(
      admin,
      run.id,
      "finalize",
      "completed",
      aiPlan
        ? "Demonstração criada com IA avançada e crítica de arte."
        : "Demonstração criada em modo estruturado."
    );
    await finishRun(admin, run.id, version.id, qualityReport);
  } catch (error) {
    await failRun(admin, run.id, project.id, error);
  }
}

function visualReviewSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "integer", minimum: 0, maximum: 100 },
      verdict: { type: "string" },
      desktopObservation: { type: "string" },
      mobileObservation: { type: "string" },
      missingElements: { type: "array", items: { type: "string" }, minItems: 0, maxItems: 8 },
      issues: {
        type: "array",
        minItems: 0,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            severity: { type: "string", enum: ["low","medium","high"] },
            category: { type: "string" },
            problem: { type: "string" },
            fix: { type: "string" }
          },
          required: ["severity","category","problem","fix"]
        }
      },
      patch: {
        type: "object",
        additionalProperties: false,
        properties: {
          heroVariant: { type: "string", enum: ["keep","cinematic","editorial","fullscreen","asymmetric","magazine","layered","minimal-type"] },
          servicesVariant: { type: "string", enum: ["keep","editorial-list","grid","alternating","spotlight","bento","timeline"] },
          galleryVariant: { type: "string", enum: ["keep","mosaic","carousel","filmstrip","editorial-grid"] },
          heroTitle: { type: "string" },
          heroBody: { type: "string" },
          removeGenericCopy: { type: "boolean" },
          emphasizePhotography: { type: "boolean" },
          density: { type: "string", enum: ["keep","airy","balanced","compact"] },
          motion: { type: "string", enum: ["keep","none","subtle","expressive"] }
        },
        required: [
          "heroVariant","servicesVariant","galleryVariant","heroTitle","heroBody",
          "removeGenericCopy","emphasizePhotography","density","motion"
        ]
      }
    },
    required: [
      "score","verdict","desktopObservation","mobileObservation","missingElements","issues","patch"
    ]
  };
}

async function optionalAIVisualReview(spec: any, briefing: any, screenshots: any[], metrics: any) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;

  const model = Deno.env.get("OPENAI_SITE_REVIEW_MODEL") || Deno.env.get("OPENAI_SITE_MODEL") || "gpt-6.1-sol";
  const content: any[] = [{
    type: "input_text",
    text: JSON.stringify({
      task: "Revisão visual real de um site já renderizado.",
      company: briefing?.company || spec?.brand?.name,
      segment: briefing?.segment || spec?.brand?.segment,
      verifiedBriefing: briefing,
      siteSpec: spec,
      layoutMetrics: metrics
    })
  }];

  for (const shot of (screenshots || []).slice(0, 2)) {
    const imageUrl = txt(shot?.dataUrl);
    if (!imageUrl.startsWith("data:image/") || imageUrl.length > 4_500_000) continue;
    content.push({
      type: "input_text",
      text: "Captura " + txt(shot?.viewport || "preview") + ":"
    });
    content.push({
      type: "input_image",
      detail: "high",
      image_url: imageUrl
    });
  }

  if (content.filter((item) => item.type === "input_image").length === 0) {
    throw new Error("Nenhuma captura visual válida foi recebida.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: "high" },
        instructions: [
          "Você é um diretor de arte digital extremamente exigente revisando screenshots reais do site.",
          "Olhe de fato as imagens. Não se limite ao JSON.",
          "Compare desktop e mobile quando ambos existirem.",
          "Procure: hero fraco, excesso de caixas, falta de contraste de escala, espaço morto, tipografia sem personalidade, fotos pequenas, enquadramento ruim, CTA sem destaque, ritmo repetitivo, aparência de template, desalinhamentos e excesso de texto.",
          "Avalie se o resultado parece um site de agência premium específico para esta empresa.",
          "Aponte o que visualmente está faltando e proponha correções estruturadas.",
          "Não invente fatos sobre a empresa. O patch altera somente apresentação e copy não factual."
        ].join("\n"),
        input: [{ role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "truinexa_visual_review",
            strict: true,
            schema: visualReviewSchema()
          }
        },
        max_output_tokens: 4000
      })
    });

    if (!response.ok) throw new Error("OpenAI visual review " + response.status);
    const data = await response.json();
    const raw = extractOutputText(data);
    if (!raw) throw new Error("Revisão visual vazia.");
    return { review: JSON.parse(raw), model };
  } finally {
    clearTimeout(timer);
  }
}

async function processVisualReview(
  admin: any,
  run: any,
  project: any,
  screenshots: any[],
  metrics: any
) {
  try {
    await markStage(admin, run.id, "identify", "running", "Carregando a versão renderizada.");
    if (!project?.site_spec || project.site_spec.version !== 2) {
      throw new Error("A revisão visual requer um projeto V2.");
    }
    if (!Deno.env.get("OPENAI_API_KEY")) {
      throw new Error("A revisão visual requer a IA avançada configurada.");
    }
    await markStage(admin, run.id, "identify", "completed", "Versão carregada.");

    await markStage(admin, run.id, "briefing", "running", "O diretor de arte está olhando as capturas desktop e mobile.");
    const visual = await optionalAIVisualReview(
      project.site_spec,
      project.briefing || {},
      screenshots,
      metrics
    );
    if (!visual?.review) throw new Error("A revisão visual não retornou um parecer.");

    await markStage(
      admin,
      run.id,
      "briefing",
      "completed",
      "Capturas analisadas visualmente.",
      {
        score: visual.review.score,
        issues: visual.review.issues?.length || 0
      }
    );

    await markStage(admin, run.id, "quality", "running", "Aplicando correções de direção de arte.");
    const refined = repair(applyCriticPatch(project.site_spec, visual.review));
    const qualityReport: any = quality(refined);
    qualityReport.visualReview = {
      score: visual.review.score,
      verdict: visual.review.verdict,
      desktopObservation: visual.review.desktopObservation,
      mobileObservation: visual.review.mobileObservation,
      missingElements: visual.review.missingElements,
      issues: visual.review.issues,
      model: visual.model,
      reviewedAt: new Date().toISOString(),
      autoRefined: true
    };

    if (!qualityReport.passed) {
      throw new Error("A correção visual não passou na validação estrutural.");
    }

    await admin
      .from("truinexa_site_generation_runs")
      .update({
        strategy: {
          refinementMode: "visual-ai-review",
          review: visual.review
        },
        quality_report: qualityReport
      })
      .eq("id", run.id);

    await markStage(
      admin,
      run.id,
      "quality",
      "completed",
      "Correções aplicadas após inspeção visual real.",
      { originalVisualScore: visual.review.score }
    );

    await markStage(admin, run.id, "finalize", "running", "Salvando a versão revisada visualmente.");
    const version = await saveVersion(
      admin,
      project,
      run.requested_by,
      refined,
      project.briefing || {},
      refined.direction || project.design_direction || {},
      qualityReport,
      "Revisão visual automática por IA",
      "openai",
      visual.model
    );

    await markStage(admin, run.id, "finalize", "completed", "Versão revisada visualmente salva.");
    await finishRun(admin, run.id, version.id, qualityReport);
  } catch (error) {
    await failRun(admin, run.id, project.id, error);
  }
}

async function processRefinement(admin: any, run: any, project: any, instruction: string) {
  try {
    await markStage(admin, run.id, "identify", "running", "Carregando versão ativa.");
    let baseSpec = project.site_spec;
    if (!baseSpec || baseSpec.version !== 2) throw new Error("O refinamento por comando requer um projeto V2.");
    await markStage(admin, run.id, "identify", "completed", "Versão ativa carregada.");

    await markStage(admin, run.id, "briefing", "running", "Interpretando a instrução sem alterar dados verificados.");

    let refined: any;
    let refinementPlan: any = null;
    let refinementModel: string | null = null;
    let refinementMode = "design_engine";

    if (Deno.env.get("OPENAI_API_KEY")) {
      try {
        const ai = await optionalAIRefinementPlan(baseSpec, instruction);
        if (ai?.plan) {
          refinementPlan = ai.plan;
          refinementModel = ai.model;
          refinementMode = "openai";
          refined = applyRefinementPlan(baseSpec, ai.plan);
        }
      } catch (error) {
        console.error("AI refinement fallback:", error);
      }
    }

    if (!refined) refined = refineRuleBased(baseSpec, instruction);

    await admin
      .from("truinexa_site_generation_runs")
      .update({
        strategy: {
          refinementMode,
          instruction,
          plan: refinementPlan || { fallback: "deterministic-rule-engine" }
        }
      })
      .eq("id", run.id);

    await markStage(
      admin,
      run.id,
      "briefing",
      "completed",
      refinementMode === "openai"
        ? "Instrução interpretada pelo modelo em operações estruturadas."
        : "Instrução interpretada pelo motor determinístico."
    );

    await markStage(admin, run.id, "quality", "running", "Validando a nova composição.");
    const repaired = repair(refined);
    const qualityReport = quality(repaired);
    if (!qualityReport.passed) throw new Error("O refinamento reduziu a qualidade abaixo do mínimo.");
    await markStage(admin, run.id, "quality", "completed", "Refinamento aprovado.", { score: qualityReport.score });

    await markStage(admin, run.id, "finalize", "running", "Criando nova versão sem destruir a anterior.");
    const version = await saveVersion(
      admin,
      project,
      run.requested_by,
      repaired,
      project.briefing || {},
      repaired.direction || project.design_direction || {},
      qualityReport,
      instruction,
      refinementMode,
      refinementModel
    );
    await markStage(admin, run.id, "finalize", "completed", "Nova versão criada.");
    await finishRun(admin, run.id, version.id, qualityReport);
  } catch (error) {
    await failRun(admin, run.id, project.id, error);
  }
}

async function createRun(admin: any, projectId: string, userId: string, action: string, input: any) {
  const allowedStageIds =
    action === "refine"
      ? new Set(["identify", "briefing", "quality", "finalize"])
      : new Set(STAGES.map(([id]) => id));
  const visualLabels: Record<string, string> = {
    identify: "Carregando versão",
    briefing: "Analisando screenshots",
    quality: "Refinando direção de arte",
    finalize: "Salvando revisão visual"
  };
  const stages = STAGES
    .filter(([id]) => allowedStageIds.has(id))
    .map(([id, label]) => ({
      id,
      label: input?.visualReview ? visualLabels[String(id)] || label : label,
      status: "pending"
    }));
  const { data, error } = await admin
    .from("truinexa_site_generation_runs")
    .insert({
      project_id: projectId,
      requested_by: userId,
      action,
      status: "queued",
      current_stage: "queued",
      progress: 0,
      stages,
      input,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respond({ error: "method_not_allowed" }, 405);

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return respond({ error: "auth_required", message: "Entre na TRUINEXA para usar o Site Studio." }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const action = txt(body.action);

    if (action === "configuration") {
      return respond({
        ok: true,
        integrations: {
          openai: Boolean(Deno.env.get("OPENAI_API_KEY")),
          googlePlaces: Boolean(Deno.env.get("GOOGLE_MAPS_API_KEY")),
          instagramOfficialApi: false,
        },
        model: Deno.env.get("OPENAI_API_KEY")
          ? Deno.env.get("OPENAI_SITE_MODEL") || "gpt-6.1-sol"
          : null,
        engine: "TRUINEXA Design Engine V2",
      });
    }

    if (action === "publish" || action === "unpublish") {
      const projectId = txt(body.projectId);
      const { data: project } = await admin
        .from("truinexa_site_projects")
        .select("id,created_by")
        .eq("id", projectId)
        .maybeSingle();
      if (!project) return respond({ error: "not_found", message: "Projeto não encontrado." }, 404);
      if (project.created_by !== caller.id && caller.role !== "admin") {
        return respond({ error: "forbidden", message: "Você não pode publicar este projeto." }, 403);
      }
      const published = action === "publish";
      const { data, error } = await admin
        .from("truinexa_site_projects")
        .update({
          published,
          status: published ? "published" : "ready",
          published_at: published ? new Date().toISOString() : null,
        })
        .eq("id", projectId)
        .select("*")
        .single();
      if (error) throw error;
      return respond({ ok: true, project: data });
    }

    if (action === "restore") {
      const projectId = txt(body.projectId);
      const versionId = txt(body.versionId);
      const { data: project } = await admin
        .from("truinexa_site_projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      if (!project) return respond({ error: "not_found", message: "Projeto não encontrado." }, 404);
      if (project.created_by !== caller.id && caller.role !== "admin") {
        return respond({ error: "forbidden" }, 403);
      }
      const { data: version } = await admin
        .from("truinexa_site_versions")
        .select("*")
        .eq("id", versionId)
        .eq("project_id", projectId)
        .maybeSingle();
      if (!version) return respond({ error: "version_not_found" }, 404);

      const qualityReport = version.quality_report || quality(version.site_spec);
      const copied = await saveVersion(
        admin,
        project,
        caller.id,
        version.site_spec,
        version.briefing,
        version.design_direction,
        qualityReport,
        "Restaurada da versão " + version.version_number,
        "design_engine",
        null
      );
      return respond({ ok: true, version: copied });
    }

    if (!["start_generate", "start_refine", "start_visual_review"].includes(action)) {
      return respond({ error: "invalid_action" }, 400);
    }

    let project: any = null;
    const projectId = txt(body.projectId);
    if (projectId) {
      const { data } = await admin
        .from("truinexa_site_projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      if (data && (data.created_by === caller.id || caller.role === "admin")) project = data;
    }

    if (project?.generation_run_id) {
      const { data: existingRun } = await admin
        .from("truinexa_site_generation_runs")
        .select("id,status")
        .eq("id", project.generation_run_id)
        .maybeSingle();
      if (existingRun && ["queued", "running"].includes(existingRun.status)) {
        return respond(
          {
            error: "generation_in_progress",
            message: "Já existe uma geração em andamento para este projeto.",
            runId: existingRun.id,
          },
          409
        );
      }
    }

    if (action === "start_generate") {
      const leadId = txt(body.leadId);
      const { data: lead } = await admin
        .from("truinexa_leads")
        .select("*")
        .eq("id", leadId)
        .maybeSingle();
      if (!lead) return respond({ error: "lead_not_found", message: "Cliente não encontrado." }, 404);
      const allowed = caller.role === "admin" || !lead.responsible_id || lead.responsible_id === caller.id;
      if (!allowed) return respond({ error: "forbidden", message: "Este cliente pertence a outra carteira." }, 403);

      if (!project) {
        const { data, error } = await admin
          .from("truinexa_site_projects")
          .insert({
            lead_id: leadId,
            created_by: caller.id,
            template_key: "premium",
            status: "generating",
            title: "Demo — " + lead.company,
            spec_version: 2,
          })
          .select("*")
          .single();
        if (error) throw error;
        project = data;
      }

      const run = await createRun(admin, project.id, caller.id, project.site_spec?.version === 2 ? "regenerate" : "generate", {
        leadId,
        directionId: body.directionId || null,
      });
      await admin
        .from("truinexa_site_projects")
        .update({ status: "generating", generation_run_id: run.id, error_message: null })
        .eq("id", project.id);

      const task = processGeneration(admin, run, project, lead, txt(body.directionId) || null);
      (globalThis as any).EdgeRuntime.waitUntil(task);
      return respond({ ok: true, projectId: project.id, runId: run.id, status: "queued" }, 202);
    }

    if (action === "start_visual_review") {
      if (!project) return respond({ error: "project_not_found" }, 404);
      if (!Deno.env.get("OPENAI_API_KEY")) {
        return respond({
          error: "advanced_ai_not_configured",
          message: "A revisão visual exige uma chave OpenAI configurada no backend."
        }, 412);
      }

      const screenshots = Array.isArray(body.screenshots) ? body.screenshots.slice(0, 2) : [];
      const validShots = screenshots.filter((shot: any) => {
        const dataUrl = txt(shot?.dataUrl);
        return dataUrl.startsWith("data:image/") && dataUrl.length <= 4_500_000;
      });
      if (!validShots.length) {
        return respond({
          error: "visual_capture_required",
          message: "Não foi possível obter uma captura visual válida do preview."
        }, 400);
      }

      const run = await createRun(admin, project.id, caller.id, "refine", {
        visualReview: true,
        versionId: body.versionId || project.active_version_id || null,
        viewports: validShots.map((shot: any) => shot.viewport)
      });

      await admin
        .from("truinexa_site_projects")
        .update({ status: "generating", generation_run_id: run.id, error_message: null })
        .eq("id", project.id);

      const task = processVisualReview(
        admin,
        run,
        project,
        validShots,
        body.metrics || {}
      );
      (globalThis as any).EdgeRuntime.waitUntil(task);
      return respond({ ok: true, projectId: project.id, runId: run.id, status: "queued" }, 202);
    }

    if (action === "start_refine") {
      if (!project) return respond({ error: "project_not_found" }, 404);
      const instruction = txt(body.instruction);
      if (instruction.length < 3 || instruction.length > 1000) {
        return respond({ error: "invalid_instruction", message: "Digite uma instrução entre 3 e 1.000 caracteres." }, 400);
      }
      const run = await createRun(admin, project.id, caller.id, "refine", { instruction });
      await admin
        .from("truinexa_site_projects")
        .update({ status: "generating", generation_run_id: run.id, error_message: null })
        .eq("id", project.id);
      const task = processRefinement(admin, run, project, instruction);
      (globalThis as any).EdgeRuntime.waitUntil(task);
      return respond({ ok: true, projectId: project.id, runId: run.id, status: "queued" }, 202);
    }

    return respond({ error: "unreachable" }, 500);
  } catch (error) {
    return respond({
      error: "site_studio_failed",
      message: error instanceof Error ? error.message : "Não foi possível executar o Site Studio.",
    }, 500);
  }
});