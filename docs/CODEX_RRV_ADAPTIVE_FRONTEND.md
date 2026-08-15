Leia integralmente:
- AGENTS.md
- docs/ARCHITECTURE.md

Você atua como Senior Frontend / Full Stack Engineer da RRV.digital sob direção do Head de Development.

Sua missão agora é PROJETAR E IMPLEMENTAR o frontend visual da RRV.digital.

Não faça commit.
Não faça push.
Não faça merge.
Não acesse VPS.
Não altere main.

==================================================
OBJETIVO DO PRODUTO
==================================================

RRV.digital é um hub e portfólio digital avançado para múltiplos profissionais.

As três modalidades iniciais são:

GROWTH
ADS, marketing, paid media, performance, acquisition, analytics e áreas correlatas.

EXPERIENCE
Frontend, UX/UI, product design, interaction, design systems e áreas correlatas.

ENGINEERING
Fullstack, AI, Web3, Smart Contracts, architecture, solutions, integrations e DevOps.

Três profissionais é conteúdo inicial, NÃO limitação estrutural.

==================================================
CONCEITO CENTRAL
RRV ADAPTIVE CONTEXT SYSTEM
==================================================

O website deve reagir automaticamente ao contexto de interesse do visitante.

O usuário NÃO deve precisar clicar em um seletor de Growth, Experience ou Engineering para mudar a experiência.

Conforme a pessoa navega por serviços, projetos e conhecimentos relacionados a uma disciplina, o frontend deve inferir o contexto dominante e adaptar progressivamente:

- accent color
- background treatment
- typography auxiliar
- grid/composição
- ícones
- microinterações
- ordem/relevância de projetos
- serviços destacados
- CTA contextual

O sistema deve possuir estados conceituais:

neutral
growth
experience
engineering
convergence

Convergence deve representar interesse híbrido entre duas ou mais disciplinas.

Não criar três websites diferentes.

A identidade RRV deve permanecer constante.

O que muda é a gramática visual contextual.

==================================================
CONTEXT ENGINE
==================================================

Implemente uma primeira versão client-side previsível e leve.

Não usar IA.

Cada bloco contextual pode possuir metadata como:

data-context="growth"
data-context="experience"
data-context="engineering"

O mecanismo pode considerar:

- IntersectionObserver
- percentual visível
- permanência breve na região
- foco
- direção de navegação quando útil

Evite mudanças bruscas.

Implemente:
- threshold
- dwell time
- hysteresis/debounce

para impedir que o tema fique alternando rapidamente durante scroll.

Exponha o contexto através de uma solução central como:

ContextProvider
useAdaptiveContext()

ou arquitetura equivalente bem justificada.

Persistir opcionalmente o contexto da sessão via sessionStorage, sem identificação pessoal.

==================================================
LINGUAGEM VISUAL
==================================================

Inspirações conceituais previamente analisadas:

HALO LAB
- profundidade de cases
- forte categorização de projetos/serviços
- trabalho como evidência
- navegação estruturada por capacidades

VIVID MOTION
- forte impacto visual
- movimento como linguagem
- poucos elementos competindo com os projetos
- portfolio conduzindo a narrativa

SHAKURO
- equilíbrio entre design e engenharia
- especialidades técnicas explicadas de forma comercial
- processo, serviço, expertise e CTA conectados

Também absorver princípios de apresentação encontrados em:
- Dribbble
- Behance
- Figma

Mas NÃO copiar layouts.

Interpretação desejada:

Dribbble:
impacto visual imediato.

Behance:
storytelling e profundidade dos projetos.

Figma:
consistência sistêmica, tokens, componentes e variações controladas.

==================================================
ESTÉTICA
==================================================

A estética deve ser:

- avançada
- editorial
- tecnológica
- limpa
- sofisticada
- adaptativa
- confortável para leitura
- visualmente memorável
- premium

Evitar completamente:

- template SaaS
- estética genérica de agência
- bento grid arbitrário
- glassmorphism excessivo
- gradiente genérico roxo/azul de IA
- partículas aleatórias
- excesso de cards arredondados
- excesso de decoração
- emojis
- ícones inconsistentes
- animações sem significado

Não usar emoji em nenhuma parte da interface.

==================================================
ÍCONES
==================================================

Usar um sistema consistente de ícones outline / continuous-line.

Características:

- SVG
- fill none
- stroke consistente
- linecap round
- linejoin round
- aparência técnica e refinada

Pode usar uma biblioteca de ícones outline de boa qualidade se ela for tecnicamente adequada, mas não misturar múltiplos estilos.

Categorias conceituais:

Growth:
- trend
- target
- signal
- campaign
- conversion
- funnel
- analytics

Experience:
- frame
- cursor
- layers
- grid
- interaction
- prototype
- components

Engineering:
- nodes
- terminal
- database
- network
- contract
- architecture
- branch

==================================================
SERVICES
==================================================

Criar entidade TypeScript:

Service

Campos mínimos:

- id
- slug
- name
- shortDescription
- description
- disciplineId
- expertIds[]
- knowledgeIds[]
- relatedProjectIds[]
- icon
- visualVariant
- ctaLabel
- ctaUrl
- ctaTarget
- featured
- active
- displayOrder

Criar estrutura preparada para 36 serviços iniciais.

Não é necessário inventar textos completos para todos se isso reduzir qualidade.

Mas a arquitetura e o mock devem comprovar que:

services[]

é totalmente dinâmico.

Cada serviço deve possuir CTA próprio.

Exemplo conceitual:

ctaLabel
ctaUrl
ctaTarget

O CTA NÃO pode ser globalmente hardcoded.

Futuramente esses campos serão editáveis em /admin.

==================================================
36 MODOS / SERVIÇOS
==================================================

A interface precisa suportar pelo menos 36 serviços sem quebrar layout.

Evitar exibir 36 cards idênticos em uma parede visual.

Criar uma experiência de descoberta adequada, por exemplo:

- adaptive index
- editorial service field
- contextual grid
- progressive disclosure
- filtros automáticos por contexto
- navegação horizontal/vertical bem controlada

Escolha a solução visual mais sofisticada e funcional.

Todos os serviços precisam ter CTA acessível.

==================================================
PROFESSIONALS
==================================================

Criar a UI baseada em:

professionals[]

Nunca assumir exatamente 3.

O layout deve funcionar com:

1
3
4
6
8+

profissionais.

Cada profissional pode possuir:

- disciplines
- knowledge
- services
- projects

Quando determinado contexto dominar, profissionais mais relacionados podem ganhar relevância visual sem ocultar permanentemente os demais.

==================================================
PROJECTS
==================================================

Projetos devem ser alimentados por:

projects[]

Cada projeto deve suportar:

- cover
- title
- subtitle
- shortDescription
- professionalIds
- disciplineIds
- knowledgeIds
- year
- status
- featured
- published

Selected Work deve poder alterar PRIORIDADE visual conforme o contexto.

Exemplo:

Growth ativo:
projetos de Growth sobem em relevância.

Engineering ativo:
projetos de Engineering sobem.

Não apagar ou esconder arbitrariamente os demais.

==================================================
KNOWLEDGE / CAPABILITY MAP
==================================================

Knowledge NÃO deve ser apenas uma coleção de badges.

Prepare a interface para representar:

Professional
↔
Knowledge
↔
Project
↔
Service

Crie uma primeira visualização refinada e simples dessa relação.

Não implementar visualização excessivamente pesada.

==================================================
HOME
==================================================

Construir:

1. Header
2. Adaptive Hero
3. Selected Work
4. Adaptive Services Field
5. Disciplines
6. Professionals
7. Capability / Knowledge Map
8. Case preview
9. Contextual CTA
10. Footer

==================================================
HERO
==================================================

Tese:

Growth.
Experience.
Engineering.

One digital system.

RRV é a marca.

A assinatura visual pode usar RRV e as três disciplinas, mas não pode associar permanentemente:

R = pessoa 1
R = pessoa 2
V = pessoa 3

A marca deve sobreviver à entrada de novos profissionais.

==================================================
DESIGN TOKENS
==================================================

Criar um sistema centralizado para:

- neutral palette
- context palettes
- typography
- spacing
- containers
- stroke widths
- radii
- motion duration
- easing
- z-index
- contextual transitions

As mudanças de contexto devem usar tokens/CSS variables, não estilos duplicados espalhados.

Exemplo conceitual:

--context-accent
--context-surface
--context-ink
--context-muted

==================================================
RESPONSIVIDADE
==================================================

Obrigatório:

- desktop
- laptop
- tablet
- mobile

No mobile, o contexto deve reagir principalmente a viewport/scroll, sem depender de cursor ou hover.

==================================================
ACESSIBILIDADE
==================================================

Obrigatório:

- semantic HTML
- keyboard focus
- prefers-reduced-motion
- contraste adequado
- conteúdo essencial independente de hover
- alt text
- CTAs acessíveis
- navegação por teclado funcional

==================================================
PERFORMANCE
==================================================

Evitar:

- animações JS pesadas
- rerenders globais a cada pixel de scroll
- listeners desnecessários
- dependências enormes
- canvas/WebGL sem justificativa

Preferir:

- CSS
- IntersectionObserver
- transforms
- opacity
- variables
- requestAnimationFrame somente quando realmente necessário

==================================================
ADMIN FUTURO
==================================================

Não construir /admin agora.

Mas o modelo precisa prever que futuramente o administrador poderá editar:

Professionals
Projects
Knowledge
Disciplines
Services
Media

Para Service, será obrigatório editar:

- CTA label
- CTA URL
- CTA target
- status
- order
- expert
- discipline
- related projects

==================================================
ARQUITETURA
==================================================

Manter separação clara entre:

src/domain
src/data
src/components
src/components/sections
src/components/context
src/lib
src/styles

ou estrutura equivalente superior.

Não misturar conteúdo mockado dentro da UI.

==================================================
STACK
==================================================

Usar:

- Next.js
- App Router
- TypeScript
- React
- Tailwind quando útil
- CSS variables para temas

Não instalar bibliotecas visuais grandes sem justificativa.

Não usar:
- Material UI
- Bootstrap
- Chakra
- Ant Design

==================================================
EXECUÇÃO
==================================================

Antes de modificar:
1. leia AGENTS.md
2. leia docs/ARCHITECTURE.md
3. inspecione o estado existente
4. preserve trabalho já criado
5. apresente plano resumido

Depois implemente a solução.

Execute ao final:

npm run lint

e, se disponível:
npm run typecheck

senão:
npx tsc --noEmit

Depois:
npm run build

Corrija erros.

==================================================
PROIBIÇÕES
==================================================

Não:
- fazer commit
- fazer push
- fazer merge
- tocar em main
- acessar VPS
- configurar banco real
- configurar Nginx
- criar secrets
- inventar credenciais
- modificar projetos externos

==================================================
RELATÓRIO FINAL
==================================================

Mostre:

1. arquitetura criada
2. Adaptive Context System
3. design system
4. services[]
5. projects[]
6. professionals[]
7. knowledge[]
8. responsividade
9. acessibilidade
10. lint
11. typecheck
12. build
13. git status --short --branch
14. git diff --stat

Não faça commit.

Pare após implementação e validação.
