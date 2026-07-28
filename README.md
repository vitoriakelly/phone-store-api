# 📱 Phone Store API

API REST para gerenciamento de dispositivos, estoque e vendas de uma loja de aparelhos móveis.

A aplicação fornece endpoints para cadastro, consulta, edição e exclusão de dispositivos, além do registro e acompanhamento de vendas.

## 🚀 Funcionalidades

### Dispositivos

- Cadastro de dispositivos
- Listagem com pesquisa e filtro por status
- Consulta por ID
- Atualização parcial
- Alteração de status
- Exclusão de dispositivos
- Validação de IMEI
- Bloqueio de IMEI duplicado
- Bloqueio de exclusão para aparelhos com venda registrada

### Vendas

- Registro de vendas
- Consulta das vendas
- Consulta de venda por ID
- Cálculo de faturamento
- Cálculo de lucro
- Atualização automática do aparelho para `VENDIDO`
- Proteção contra venda duplicada do mesmo aparelho

### Documentação

- Swagger UI
- Documento OpenAPI em JSON
- Exemplos de requests e responses

## 🛠️ Tecnologias

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Zod
- Swagger UI
- Docker
- Docker Compose
- TSX
- CORS
- dotenv

## 🧱 Arquitetura

```text
Request
  ↓
Routes
  ↓
Controllers
  ↓
DTOs e validações
  ↓
Services
  ↓
Prisma
  ↓
PostgreSQL
```

## 📁 Estrutura principal

```text
src/
├── config/
│   ├── prisma.ts
│   └── swagger.ts
├── controllers/
├── docs/
├── dtos/
├── errors/
├── generated/
├── middlewares/
├── modules/
├── routes/
├── services/
├── app.ts
└── server.ts

prisma/
├── migrations/
└── schema.prisma
```

## ⚙️ Pré-requisitos

Antes de iniciar, tenha instalado:

- Node.js
- npm
- Docker
- Docker Compose

## 🔧 Configuração

Clone o projeto:

```bash
git clone https://github.com/vitoriakelly/phone-store-api.git
cd phone-store-api
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env`:

```env
PORT=3333
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://phone_store:phone_store_password@localhost:5433/phone_store?schema=public"
```

## 🐳 Banco de dados com Docker

Inicie o PostgreSQL:

```bash
docker compose up -d
```

Confira os containers:

```bash
docker compose ps
```

Para encerrar:

```bash
docker compose down
```

Para remover também os dados armazenados:

```bash
docker compose down -v
```

## 🗄️ Prisma

Gere o Prisma Client:

```bash
npx prisma generate
```

Execute as migrations:

```bash
npx prisma migrate dev
```

Abra o Prisma Studio:

```bash
npx prisma studio
```

## ▶️ Executando a API

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3333
```

## 📚 Swagger

A documentação interativa está disponível em:

```text
http://localhost:3333/api-docs
```

O documento OpenAPI em JSON está disponível em:

```text
http://localhost:3333/api-docs.json
```

## ❤️ Verificação de saúde

Verificar a API:

```text
GET /health
```

Verificar a conexão com o PostgreSQL:

```text
GET /health/database
```

Exemplo:

```json
{
  "status": "ok",
  "message": "Conexão com o PostgreSQL realizada com sucesso.",
  "database": {
    "devices": 1,
    "sales": 1
  }
}
```

## 🔗 Endpoints

### Dispositivos

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/devices` | Cadastrar dispositivo |
| `GET` | `/devices` | Listar dispositivos |
| `GET` | `/devices/:id` | Buscar dispositivo |
| `PATCH` | `/devices/:id` | Atualizar dispositivo |
| `DELETE` | `/devices/:id` | Excluir dispositivo |

Filtros disponíveis:

```text
GET /devices?search=iphone
GET /devices?status=DISPONIVEL
```

### Vendas

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/sales` | Registrar venda |
| `GET` | `/sales` | Listar vendas |
| `GET` | `/sales/:id` | Buscar venda |

Filtros disponíveis:

```text
GET /sales?search=vitoria
GET /sales?paymentMethod=PIX
```

## 📱 Exemplo de cadastro de dispositivo

```json
{
  "brand": "Apple",
  "model": "iPhone 14",
  "storage": "128 GB",
  "color": "Azul",
  "imei": "147852963147852",
  "batteryHealth": 88,
  "condition": "SEMINOVO",
  "purchasePrice": 2600,
  "salePrice": 3900,
  "supplier": "Fornecedor",
  "entryDate": "2026-07-28",
  "status": "DISPONIVEL",
  "notes": null
}
```

## 💰 Exemplo de registro de venda

```json
{
  "deviceId": "d083a894-cf7c-4b2e-936b-142377f68087",
  "customerName": "Vitória",
  "customerPhone": "21995974765",
  "salePrice": 3900,
  "paymentMethod": "CARTAO_CREDITO",
  "soldAt": "2026-07-28",
  "notes": null
}
```

Ao registrar a venda, a API altera automaticamente o status do dispositivo:

```json
{
  "status": "VENDIDO"
}
```

## 📜 Scripts

```bash
npm run dev
```

Inicia a API em modo de desenvolvimento.

```bash
npm run typecheck
```

Valida os tipos TypeScript.

```bash
npm run build
```

Gera os arquivos de produção.

```bash
npm start
```

Executa a versão compilada.

## ✅ Validação

Execute:

```bash
npm run typecheck
npm run build
```

Os dois comandos devem finalizar sem erros.

## 👩‍💻 Autora

Desenvolvido por **Vitória Kelly**.

GitHub: `https://github.com/vitoriakelly`

LinkedIn: `https://linkedin.com/in/vitoria-leopoldo`