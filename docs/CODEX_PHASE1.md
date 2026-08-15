Leia integralmente AGENTS.md e docs/ARCHITECTURE.md antes de modificar qualquer arquivo.

Você atua como Senior Full Stack Engineer da RRV.digital sob direção do Head de Development.

BRANCH ATUAL:
feat/rrv-foundation

MISSÃO:
Executar a Fase 1 da fundação frontend da RRV.digital.

OBJETIVO DO PRODUTO:
RRV.digital será um hub e portfólio digital premium e escalável.

As três disciplinas iniciais são:

- Growth — ADS, marketing, performance, acquisition e analytics.
- Experience — Frontend, UX/UI, product design e interaction.
- Engineering — Fullstack, AI, Web3, Smart Contracts, architecture, solutions e DevOps.

IMPORTANTE:
Três profissionais é apenas o conteúdo inicial.
A arquitetura NÃO pode depender permanentemente de exatamente três pessoas.

STACK:
- Next.js estável
- App Router
- React
- TypeScript
- ESLint
- Tailwind CSS
- src/
- alias @/*

Não utilizar versões canary, beta ou release candidate.

ARQUITETURA DE DADOS:

Criar tipos TypeScript para:

Professional
- id
- slug
- name
- title
- shortBio
- fullBio
- portrait
- disciplineIds[]
- knowledgeIds[]
- socialLinks[]
- featured
- active
- displayOrder

Project
- id
- slug
- title
- subtitle
- shortDescription
- description
- challenge
- solution
- results
- cover
- media[]
- professionalIds[]
- knowledgeIds[]
- disciplineIds[]
- year
- status
- featured
- published
- displayOrder

Knowledge
- id
- slug
- name
- category
- description
- icon
- featured
- active
- displayOrder

Discipline
- id
- slug
- name
- shortName
- description
- accent
- displayOrder

Media
- id
- type
- src
- alt
- width
- height
- poster
- caption

Evitar any.

Usar unions/enums quando houver benefício real de tipagem.

RELACIONAMENTOS:

A arquitetura deve suportar:

- um profissional em vários projetos;
- um projeto com vários profissionais;
- um profissional com vários conhecimentos;
- um conhecimento associado a vários profissionais;
- um projeto associado a vários conhecimentos;
- novas disciplinas futuramente.

PROIBIDO criar estruturas como:

professional1
professional2
professional3
project1
project2
project3

Todo conteúdo de negócio deve ser tratado como collection.

MOCK DATA:

Criar dados tipados separados dos componentes para:

- professionals[]
- projects[]
- knowledge[]
- disciplines[]

Utilizar IDs normalizados.

A arquitetura deve permitir posteriormente substituir:

mock data
-> API
-> PostgreSQL

sem reconstruir os componentes visuais.

ESTRUTURA:

Organizar o projeto de forma clara, preferencialmente próxima de:

src/
  app/
  components/
  components/layout/
  components/sections/
  data/
  domain/
  lib/
  styles/

Pode melhorar essa organização se houver justificativa técnica.

Separar claramente:

- domínio
- dados
- apresentação
- utilitários

DESIGN:

A identidade RRV deve ser:

- editorial;
- tecnológica;
- precisa;
- sofisticada;
- experimental com disciplina.

Tese visual:

Growth.
Experience.
Engineering.

One digital system.

Evitar:

- template SaaS;
- aparência genérica de agência;
- glassmorphism excessivo;
- gradiente AI roxo/azul genérico;
- partículas decorativas;
- bento grids arbitrários;
- excesso de cards;
- excesso de border-radius;
- motion sem função.

Não instalar:

- shadcn/ui
- Material UI
- Bootstrap
- Chakra
- Ant Design

nesta fase.

DESIGN TOKENS:

Criar fundação centralizada para:

- cores
- tipografia
- spacing
- containers
- radii
- motion
- easing
- z-index

HOME FASE 1:

Criar:

1. Header
2. Hero
3. Selected Work
4. Disciplines
5. Professionals
6. Capability / Knowledge Preview
7. Contact
8. Footer

Todas as seções que representam dados devem consumir as collections.

HERO:

Deve comunicar:

Growth.
Experience.
Engineering.

One digital system.

RRV é a marca.

Não associar rigidamente cada letra R/R/V a uma pessoa específica.

As disciplinas poderão possuir múltiplos profissionais futuramente.

PROJECTS:

Selected Work deve vir de projects[].

Preparar o modelo para:

- cover
- título
- descrição
- disciplinas
- conhecimentos
- profissionais
- ano
- status

Não criar case studies completos nesta fase.

PROFESSIONALS:

Renderizar exclusivamente a partir de professionals[].

O layout deve funcionar com:

- 1 profissional
- 3 profissionais
- 4 profissionais
- 8 profissionais

Não utilizar três colunas rígidas como premissa arquitetônica.

KNOWLEDGE:

Não tratar conhecimentos apenas como badges decorativos.

Preparar conceitualmente a estrutura para um futuro Capability Map:

Professional
<-> Knowledge
<-> Project

Nesta fase a representação pode ser simplificada.

RESPONSIVIDADE:

Obrigatório:

- desktop
- tablet
- mobile
- HTML semântico
- foco de teclado visível
- prefers-reduced-motion
- conteúdo essencial independente de hover
- alt text
- contraste adequado

MOTION:

Motion deve ter função.

Preferir CSS nesta fase.

Não instalar biblioteca de animação sem necessidade concreta.

NÃO IMPLEMENTAR AINDA:

- /admin
- autenticação
- API
- PostgreSQL
- Supabase
- upload real
- Docker de produção
- Nginx
- VPS

SEGURANÇA:

Não criar nem armazenar:

- passwords
- tokens
- API keys
- private keys
- URLs reais de banco

Não criar .env com secrets.

Criar .env.example somente se houver necessidade real.

GIT:

Você pode modificar arquivos da branch atual.

NÃO:

- fazer commit
- fazer push
- fazer merge
- modificar main
- criar outra branch

PROCESSO:

1. Leia AGENTS.md.
2. Leia docs/ARCHITECTURE.md.
3. Inspecione todo o repositório.
4. Confirme a branch.
5. Defina brevemente o plano.
6. Implemente a Fase 1.
7. Rode lint.
8. Rode typecheck.
9. Rode build.
10. Corrija erros encontrados.

Se não existir script typecheck, utilize tsc --noEmit ou crie script equivalente.

Não esconda erros importantes para obter build verde.

README:

Criar ou atualizar documentação contendo:

- instalação
- desenvolvimento
- build
- scripts
- arquitetura das pastas
- princípio de dados dinâmicos

RELATÓRIO FINAL:

Ao terminar, apresente:

1. Implementado
2. Arquitetura criada
3. Modelagem dos dados
4. UI criada
5. Resultado de lint
6. Resultado de typecheck
7. Resultado de build
8. Dependências adicionadas
9. git status --short --branch
10. git diff --stat
11. Pontos preparados para a Fase 2

Não faça commit.
Não faça push.
Não faça merge.
Não acesse a VPS.

Execute a missão até concluir ou até encontrar um bloqueio técnico real.
