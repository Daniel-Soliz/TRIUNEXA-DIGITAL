# TRUINEXA DIGITAL — CRM Comercial

CRM interno da TRUINEXA DIGITAL para prospecção, captura de oportunidades, carteira individual, funil Kanban, atendimento, agenda, serviços, projetos e relatórios.

## Arquitetura oficial

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Banco/Auth/Realtime: Supabase
- Hospedagem: GitHub Pages via GitHub Actions
- Distribuição de leads: modo **capture** — oportunidades entram sem responsável e precisam ser assumidas antes do contato
- Prospecção: somente dados comerciais públicos validados; a plataforma aceita apenas celular brasileiro com WhatsApp confirmado

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
- celular/WhatsApp de lead automático precisa ter fonte pública e validação registrada
- números normalizados duplicados são bloqueados no próprio banco
- o claim de lead é atômico no banco: só o primeiro usuário consegue assumir
- o fluxo de prospecção usa mensagem personalizada editável antes de abrir o WhatsApp
- portfólio e apresentação comercial são configuráveis no Supabase, sem alteração de código

O projeto `studioblack7` não faz parte deste CRM e não deve ser alterado por integrações da TRUINEXA.
