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

test('barbearia recebe abordagem natural, sem emojis ou propaganda agressiva', () => {
  const msg = generateProspectingMessage(lead('Barbearia'), config);

  expect(msg).toContain('Oi, tudo bem? Aqui é o Daniel, da DS Digital.');
  expect(msg).toContain('Studio Black 7');
  expect(msg).toContain('site próprio');
  expect(msg).toContain('agendamento online');
  expect(msg).toContain('vender produtos');
  expect(msg).toContain('bio do Instagram');
  expect(msg).toContain('Já fiz algo parecido para uma barbearia.');
  expect(msg).toContain('Posso te mandar o exemplo');
  expect(msg).not.toMatch(/robôs|paga bot|vitalício|!|👋/);
  expect(msg).not.toContain('Meu portfólio:');
  expect(msg.length).toBeLessThan(570);
});

test('salão usa nome curto, texto sobre horários e demonstração real de barbearia', () => {
  const msg = generateProspectingMessage(lead('Salão de Beleza', 'DUO+ Salão de Beleza Pinheiros'), config);

  expect(msg).toContain('Vi a DUO+ e pensei numa ideia');
  expect(msg).toContain('fotos dos trabalhos');
  expect(msg).toContain('escolhe um horário para agendar');
  expect(msg).toContain('link pode ficar direto na bio do Instagram');
  expect(msg).toContain('Já fiz algo parecido para uma barbearia');
  expect(msg).not.toContain('Salão de Beleza Pinheiros');
  expect(msg).not.toContain('loja para vender produtos');
  expect(msg.length).toBeLessThan(490);
});

test('restaurante recebe cardápio e pedidos, não cortes ou salão', () => {
  const msg = generateProspectingMessage(lead('Restaurante', 'Bistrô Primavera'), config);
  expect(msg).toContain('cardápio e pedidos');
  expect(msg).toContain('link na bio do Instagram');
  expect(msg).not.toContain('Já fiz algo parecido para uma barbearia');
  expect(msg).not.toContain('fotos dos cortes');
});

test('loja recebe vitrine de produtos; clínica não recebe promessa de loja', () => {
  const retail = generateProspectingMessage(lead('Loja de roupas'), config);
  const clinic = generateProspectingMessage(lead('Clínica Odontológica'), config);
  expect(retail).toContain('loja online própria');
  expect(clinic).toContain('solicitar horários');
  expect(clinic).not.toContain('loja para vender produtos');
  expect(clinic).not.toContain('barbearia');
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
  expect(msg).toContain('Posso te mandar o exemplo');
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
