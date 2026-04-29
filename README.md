# GenovaAI Server

Next.js API/server untuk GenovaAI customer dashboard, browser extension gateway, knowledge upload, paid LLM, BYOK provider, payment, dan admin flows.

## Production baseline

- Public domain: `https://genova.genfity.com`
- Container: `genovaai-server`
- Host port: `127.0.0.1:8093`
- Database: `genovaai` via PgBouncer `host.docker.internal:6432`
- Docker network: `genfity-network`
- Upload volume: `/app/uploads`
- Knowledge upload directory: `/app/uploads/knowledge-files`

## Required production environment

Use `REFRESH_SECRET` as the canonical refresh-token secret name.

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://genfity:PASSWORD@host.docker.internal:6432/genovaai
JWT_SECRET=REPLACE_WITH_STRONG_SECRET
REFRESH_SECRET=REPLACE_WITH_STRONG_SECRET
CUSTOMER_CREDENTIAL_ENCRYPTION_KEY=REPLACE_WITH_32_BYTE_BASE64_SECRET
KNOWLEDGE_UPLOAD_DIR=/app/uploads/knowledge-files
APP_URL=https://genova.genfity.com
NEXT_PUBLIC_APP_URL=https://genova.genfity.com
NEXT_PUBLIC_API_URL=https://genova.genfity.com
PAID_LLM_BASE_URL=REPLACE_WITH_OPENAI_COMPATIBLE_BASE_URL
PAID_LLM_API_KEY=REPLACE_WITH_OPENAI_COMPATIBLE_API_KEY
```

Payment and email production envs are documented in `.env.production` and `vps-deployment/apps/genovaai-server/.env.production`.

## Extension ask flow

Browser extension calls `POST /api/gateway/ask` with Bearer access token.

Valid minimal body:

```json
{
  "question": "User question"
}
```

`sessionId` is optional. If omitted, the server uses the latest active extension session for the authenticated user. If provided, the server verifies the session is active and owned by the authenticated user.

## Knowledge uploads

Supported files:

- PDF
- DOCX
- TXT
- MD

Uploaded files are capped at 10 MB. Extracted text is stored for LLM context; list APIs return a bounded preview instead of the full extracted content.

## BYOK provider keys

Customer provider API keys are encrypted at rest with `CUSTOMER_CREDENTIAL_ENCRYPTION_KEY` using the `enc:v1:` format. Existing plaintext records remain readable during transition and are encrypted on later successful write/update.

## Local development

```bash
npm install
npx prisma generate
npm run dev
```

Default local knowledge uploads are stored under `uploads/knowledge-files` unless `KNOWLEDGE_UPLOAD_DIR` is set.

## Validation

```bash
npx prisma validate
npm run lint
npm run build
```

`npm run build` may run deployment-time Prisma steps depending on the package scripts, so verify the target database env before running it against production.
