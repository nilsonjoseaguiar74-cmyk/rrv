# RRV Verify — Checkpoint de pausa
Data: 10/11/2026

## 1. Identificacao

Projeto: RRV.digital
Modulo: RRV Verify Beta
Repositorio: nilsonjoseaguiar74-cmyk/rrv
Branch: recovery/rrv-integrated-beta

## 2. Commits consolidados

- eb78d14 — Recuperacao da aplicacao integrada.
- 0460a78 — Playwright, Lighthouse, axe-core,
  Ollama, persistencia e teste E2E.
- 9837a36 — Solicitacao de acesso Beta,
  convites, administracao e testes de autenticacao.

## 3. Funcionalidades comprovadas

- Cadastro e recuperacao de projetos.
- Execucao automatizada na fixture local.
- Playwright, Lighthouse e axe-core.
- Interpretacao local com Ollama/Qwen2.5 1.5B.
- Persistencia de resultados no PostgreSQL.
- Evidencias e recuperacao pela API.
- Visualizacao no dashboard.
- Exportacao JSON.
- Teste E2E integrado aprovado.
- Testes de acesso Beta: 23/23 aprovados.

## 4. Pendencias conhecidas

- Validar envio real de convites e OTP pelo Resend.
- Implementar saida de rede segura para URLs
  externas autorizadas, com protecao contra SSRF.
- Revisar configuracoes Docker do worker.
- Consolidar documentacao e scripts de deploy.
- Validar os fluxos completos de clientes reais.
- Revisar seguranca antes da publicacao.
- Considerar MiroFish-Offline posteriormente.

## 5. Arquivos locais ainda pendentes

- Dockerfile
- Dockerfile.verify-worker
- server/app.js
- app/globals.css
- next-env.d.ts
- deploy/
- docs/
- .vscode/

Esses arquivos nao devem ser descartados nem
misturados automaticamente com outros modulos.

## 6. Infraestrutura de producao

Servidor: Hostinger / srv993737
Aplicacao existente: rrv-digital-web
Compose: /opt/rrv-digital/docker-compose.yml
Nginx: 127.0.0.1:4321
Diretorio full-stack: /opt/rrv-digital/app-fullstack-new

A home institucional, RRV Start e administracao
devem permanecer preservados.

Nenhuma alteracao na VPS esta autorizada.

## 7. Roteiro de retomada

ETAPA 1 — Recuperar o checkpoint e o trabalho local.
ETAPA 2 — Revisar exclusivamente arquivos pendentes.
ETAPA 3 — Consolidar configuracoes de implantacao.
ETAPA 4 — Validar testes externos autorizados.
ETAPA 5 — Homologar o acesso Beta real.
ETAPA 6 — Comparar com a producao existente.
ETAPA 7 — Preparar backup e rollback.
ETAPA 8 — Solicitar autorizacao para deploy.

Avancar somente apos validar a etapa anterior.

## 8. Regras permanentes

- Nao reconstruir funcionalidades aprovadas.
- Nao alterar a home institucional.
- Nao misturar outros modulos com o Verify.
- Nao realizar merge automatico na main.
- Nao executar deploy sem autorizacao.
- Preservar commits e historico Git.
- Retomar pelo ultimo checkpoint validado.

STATUS: MODULO PAUSADO.
