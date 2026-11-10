# RRV.digital — aplicação autônoma para VPS

Aplicação full-stack com a home aprovada, `/start`, `/privacidade`, painel administrativo, CMS, leads, autenticação local, PostgreSQL e auditoria. A versão VPS não depende de Sign in with ChatGPT, APIs privadas do Sites ou storage proprietário.

## Requisitos

- Node.js 22+
- PostgreSQL 14+
- Docker 24+ e Docker Compose
- NGINX apontando `rrv.digital` para `127.0.0.1:4321`

## Instalação em `/opt/rrv-digital`

```bash
cd /opt/rrv-digital
npm ci
cp .env.example .env
```

Preencha no `.env`, no mínimo:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://usuario:senha@host:5432/rrv_digital
DATABASE_SSL=false
SESSION_SECRET=gere-um-segredo-aleatorio-com-pelo-menos-32-caracteres
ALLOWED_ORIGIN=https://rrv.digital
```

Não versione o arquivo `.env`.

## Banco e primeiro administrador

```bash
npm run db:schema
npm run create-admin
```

`create-admin` solicita nome, e-mail e senha. O banco recebe somente o hash scrypt com salt individual, nunca a senha em texto puro.

## Executar com Docker

```bash
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:4321/api/health
```

O container `rrv-digital-web` ouve internamente na porta `3000` e publica somente em `127.0.0.1:4321`.

## NGINX

```nginx
location / {
    proxy_pass http://127.0.0.1:4321;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Valide e recarregue o NGINX conforme o procedimento operacional da VPS.

## Rotas

Públicas:

- `/`, `/start`, `/privacidade`
- `GET /api/health`
- `POST /api/leads`
- `GET /api/public/home|services|projects|team`

Administrativas:

- `/admin/login`, `/admin`, `/admin/home`, `/admin/services`, `/admin/projects`, `/admin/team`, `/admin/leads`, `/admin/settings`
- `POST /api/admin/auth/login|logout`
- `GET /api/admin/auth/me|dashboard|home|services|projects|team|leads|settings`
- CRUD de serviços, projetos, equipe e CTAs
- atualização de home/configurações, publicação e status de leads

## Segurança

- cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção;
- tokens de sessão aleatórios persistidos apenas como HMAC SHA-256;
- senhas scrypt com salt;
- roles `owner`, `admin`, `editor` e `viewer` verificadas no servidor;
- consultas parametrizadas, Helmet, restrição de origem e auditoria;
- nenhuma credencial real no código.

## Operação

O PostgreSQL é externo ao Compose. Reiniciar o container não apaga conteúdo, leads ou usuários. Faça backup periódico do banco e monitore `/api/health`.

```bash
docker compose build --pull
docker compose up -d
curl -fsS http://127.0.0.1:4321/api/health
```

## Desenvolvimento e validação

```bash
npm run dev
npm test
npm run lint
npm run build
```

O frontend existente continua compatível com a validação do Sites. A VPS usa `node server/app.js`: APIs Express/PostgreSQL primeiro e as demais rotas delegadas ao Next.js.
