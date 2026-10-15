import { expect, test } from '@playwright/test';
import type { Lead, SystemConfig } from '../crm';
import {
  buildWhatsAppUrl,
  generateProspectingMessage,
  sanitizeWhatsAppNumber,
} from '../prospecting';

const config = {
  senderName: 'Daniel Soliz',
  brandName: 'DS Digital',
  portfolioUrl: 'https://example.com/portfolio',
  presentationUrl: 'https://example.com/apresentacao',
} as SystemConfig;

function lead(segment: string, company = 'Studio Black 7'): Lead {
  return {
    id: 'lead-001',
    company,
    segment,
    city: 'São Paulo',
    neighborhood: 'Brasilândia',
    whatsapp: '(11) 99999-9999',
  } as Lead;
}

test('barbearia recebe apresentação breve de site, agenda, produtos e bio do Instagram', () => {
  const msg = generateProspectingMessage(lead('Barbearia'), config);

  expect(msg).toContain('Oi, tudo bem? Sou Daniel Soliz, da DS Digital!');
  expect(msg).toContain('Studio Black 7');
  expect(msg).toContain('site exclusivo');
  expect(msg).toContain('agendamentos online');
  expect(msg).toContain('loja para vender produtos');
  expect(msg).toContain('bio do Instagram');
  expect(msg).toContain('robôs no WhatsApp');
  expect(msg).toContain('Posso te mostrar um exemplo');
  expect(msg).not.toContain('paga bot');
  expect(msg).not.toContain('Portfólio:');
  expect(msg.length).toBeLessThan(650);
});

test('restaurante recebe cardápio e pedidos, não cortes ou salão', () => {
  const msg = generateProspectingMessage(lead('Restaurante', 'Bistrô Primavera'), config);
  expect(msg).toContain('cardápio digital');
  expect(msg).toContain('pedidos');
  expect(msg).toContain('reservas');
  expect(msg).not.toContain('fotos dos cortes');
});

test('loja recebe vitrine de produtos; clínica não recebe promessa de loja', () => {
  const retail = generateProspectingMessage(lead('Loja de roupas'), config);
  const clinic = generateProspectingMessage(lead('Clínica Odontológica'), config);
  expect(retail).toContain('loja online');
  expect(clinic).toContain('solicitação de agendamentos');
  expect(clinic).not.toContain('loja para vender produtos');
});

test('opções de personalização acrescentam apenas conteúdos solicitados', () => {
  const msg = generateProspectingMessage(lead('Barbearia'), config, {
    includePortfolio: true,
    mentionNeighborhood: true,
    includePresentation: true,
    includeRecommendedService: false,
  });
  expect(msg).toContain('em Brasilândia');
  expect(msg).toContain('https://example.com/portfolio');
  expect(msg).toContain('https://example.com/apresentacao');
});

test('link do WhatsApp abre número móvel e preserva acentos e parágrafos', () => {
  const msg = generateProspectingMessage(lead('Barbearia'), config);
  const url = buildWhatsAppUrl('+55 (11) 99999-9999', msg);
  const parsed = new URL(url);
  expect(parsed.hostname).toBe('wa.me');
  expect(parsed.pathname).toBe('/5511999999999');
  expect(parsed.searchParams.get('text')).toBe(msg);
  expect(url).toContain('text=');
});

test('não direciona telefones fixos, números inválidos ou textos vazios', () => {
  expect(sanitizeWhatsAppNumber('(11) 3456-7890')).toBe('');
  expect(buildWhatsAppUrl('(11) 3456-7890', 'Oi')).toBe('');
  expect(buildWhatsAppUrl('(11) 99999-9999', ' ')).toBe('');
  expect(sanitizeWhatsAppNumber('11999999999')).toBe('5511999999999');
  expect(sanitizeWhatsAppNumber('55999999999')).toBe('5555999999999');
});
