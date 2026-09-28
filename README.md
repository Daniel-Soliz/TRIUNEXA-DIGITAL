# TRUINEXA DIGITAL — CRM Comercial

CRM interno da TRUINEXA DIGITAL para prospecção, captura de oportunidades, carteira individual, funil Kanban, atendimento, agenda, serviços, projetos e relatórios.

## Arquitetura oficial

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Banco/Auth/Realtime: Supabase
- Hospedagem: GitHub Pages via GitHub Actions
- Distribuição de leads: modo **capture** — oportunidades entram sem responsável e precisam ser assumidas antes do contato
- Prospecção: somente dados comerciais públicos validados; telefone fixo ou celular é obrigatório, WhatsApp é opcional quando confirmado

## Rodar localmente

Pré-requisito: Node.js 22+

```bash
npm install
npm run dev
```

O projeto usa o Supabase da TRUINEXA. As variáveis públicas de frontend podem ser configuradas com base no arquivo `env.example`.

## Validação antes do deploy

```bash
npm run build
npm run lint
```

O GitHub Actions executa essas verificações automaticamente no branch `main`.

## Segurança e dados

- RLS habilitado nas tabelas do CRM
- usuários não autenticados não possuem acesso às tabelas
- membros comerciais veem oportunidades disponíveis e a própria carteira
- administrador possui visão gerencial
- telefone de lead automático precisa ter fonte pública e validação registrada
- números normalizados duplicados são bloqueados no próprio banco
- WhatsApp só é preenchido quando houver confirmação pública específica

O projeto `studioblack7` não faz parte deste CRM e não deve ser alterado por integrações da TRUINEXA.
