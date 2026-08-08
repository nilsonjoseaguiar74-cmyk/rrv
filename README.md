# RRV.digital

Fundação frontend do hub digital RRV: Growth, Experience e Engineering operando como um único sistema.

## Requisitos

- Node.js 20.9 ou superior
- npm 10 ou superior

## Instalação e desenvolvimento

```bash
npm install
npm run dev
```

A aplicação estará disponível no endereço informado pelo Next.js no terminal.

## Scripts

```bash
npm run dev        # ambiente local
npm run lint       # análise estática
npm run typecheck  # validação TypeScript sem emissão
npm run build      # build otimizado de produção
npm run start      # executa o build de produção
```

## Arquitetura de pastas

```text
src/
├── app/                 # App Router, metadata e composição de páginas
├── components/
│   ├── layout/          # header e footer
│   ├── sections/        # seções editoriais da home
│   └── ui/              # primitivas reutilizáveis
├── data/                # collections tipadas de mock data
├── domain/              # tipos e contratos do negócio
├── lib/                 # seletores e resolução de relacionamentos
└── styles/              # tokens e estilos globais responsivos
```

Assets locais ficam em `public/images`. A direção de arquitetura está documentada em `docs/ARCHITECTURE.md`.

## Princípio de dados dinâmicos

Profissionais, projetos, conhecimentos e disciplinas são collections independentes, conectadas por IDs normalizados. Componentes não importam registros individuais nem pressupõem quantidades fixas. A camada `lib/content.ts` expõe consultas para a apresentação, delimitando o ponto que poderá trocar mock data por API e PostgreSQL sem reconstruir a UI.

Nesta fase não existem API, banco, autenticação, admin ou configuração de produção.
