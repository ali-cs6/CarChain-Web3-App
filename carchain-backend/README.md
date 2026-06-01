# CarChain Backend

REST API for CarChain — a blockchain-integrated vehicle marketplace built on Hyperledger Fabric. Handles user authentication, marketplace listings, vehicle ownership records, image uploads, and audit logging.

## Architecture

```
React Frontend (port 5173)
        │
        │ HTTP / REST
        ▼
Express API (port 9000)
        │
        ├──► MongoDB Atlas      — users, listings, audit logs
        │
        └──► Fabric Gateway     — vehicle records on blockchain
                  │ gRPC / TLS
                  ▼
         Hyperledger Fabric Peer
         (carchain chaincode)
```

## Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier is enough)
- `carchain-network` running with the `carchain` chaincode deployed

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**
```bash
cp .env.example .env
```
Fill in all values — see [Environment Variables](#environment-variables) below.

**3. Start the server**
```bash
npm run dev     # development (nodemon auto-reload)
npm start       # production
```

Server starts on `PORT` (default `9000`). The frontend must be on `CORS_ORIGIN` (default `http://localhost:5173`).

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `9000` |
| `CORS_ORIGIN` | Frontend origin — must be exact, not `*` | `http://localhost:5173` |
| `NODE_ENV` | Environment | `development` / `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `ACCESS_TOKEN_SECRET` | JWT signing secret (access tokens) | 64-char hex string |
| `ACCESS_TOKEN_EXPIRY` | Access token TTL | `1d` |
| `REFRESH_TOKEN_SECRET` | JWT signing secret (refresh tokens) | 64-char hex string |
| `REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `10d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (from dashboard) | `dxxxxxx` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc-xyz` |
| `FABRIC_NETWORK_PATH` | Path to `carchain-network` relative to this folder | `../carchain-network` |
| `FABRIC_ADMIN_KEY_FILENAME` | Admin private key filename (`_sk` file) | `abc123_sk` |
| `FABRIC_PEER_ENDPOINT` | gRPC peer address | `localhost:7051` |
| `FABRIC_PEER_HOST_ALIAS` | TLS hostname override for peer | `peer0.usersorg` |
| `FABRIC_CHANNEL_NAME` | Fabric channel name | `carchain-channel` |
| `FABRIC_CHAINCODE_NAME` | Deployed chaincode name | `carchain` |
| `FABRIC_MSP_ID` | MSP ID of the organization | `UsersOrgMSP` |

> **Note on CORS:** `credentials: true` is required for cookie-based auth. Browsers reject `*` as origin when credentials are used — always set `CORS_ORIGIN` to the exact frontend URL.

---

## API Reference

Base URL: `http://localhost:9000/api/v1`

Auth is via JWT — accepted as an `httpOnly` cookie (`accessToken`) **or** as an `Authorization: Bearer <token>` header.

---

### Users `/api/v1/users`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Create a new account |
| POST | `/login` | No | Authenticate — returns tokens in body and cookies |
| POST | `/refresh-token` | No | Exchange refresh token for new access token |
| POST | `/logout` | Yes | Clear tokens and invalidate refresh token in DB |
| GET | `/me` | Yes | Get the current authenticated user's profile |
| POST | `/change-password` | Yes | Change password (requires current password) |

**Register**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "fullname": "John Doe",
  "password": "Secret@123",
  "governmentId": "GOV-12345",
  "licenseNumber": "LIC-001"
}
```

**Login** — accepts `email` or `username`
```json
{ "email": "john@example.com", "password": "Secret@123" }
```

---

### Vehicles `/api/v1/vehicles`

GET routes are **public** — anyone can browse and verify vehicles without an account. Write routes require auth.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | No | All vehicles on the ledger |
| GET | `/:vehicleId` | No | Single vehicle by ID |
| GET | `/owner/:owner` | No | All vehicles owned by a given name |
| GET | `/:vehicleId/history` | No | Full blockchain transaction history |
| GET | `/:vehicleId/verify` | No | Verify vehicle existence and active status |
| POST | `/` | Yes | Register a new vehicle on the blockchain |
| PUT | `/:vehicleId/transfer` | Yes | Transfer ownership to a new owner |
| PUT | `/:vehicleId/status` | Yes | Update vehicle status |

**Register vehicle**
```json
{
  "vehicleId": "VH-2024-001",
  "make": "Toyota",
  "model": "Camry",
  "year": "2024",
  "color": "Blue",
  "owner": "John Doe"
}
```

**Transfer ownership**
```json
{ "newOwner": "Jane Smith" }
```

**Update status**
```json
{ "status": "stolen" }
```
Valid statuses: `active` · `stolen` · `scrapped` · `removed`

**Vehicle object (from blockchain)**
```json
{
  "vehicleId": "VH-2024-001",
  "make": "Toyota",
  "model": "Camry",
  "year": "2024",
  "color": "Blue",
  "owner": "John Doe",
  "registeredBy": "UsersOrgMSP",
  "status": "active",
  "timestamp": "2026-05-12T22:11:42.000Z"
}
```

---

### Listings `/api/v1/listings`

Marketplace layer — MongoDB-backed, linked to blockchain records via `vehicleId`.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Browse all active listings with filters |
| GET | `/:vehicleId` | No | Single listing (auto-increments views) |
| POST | `/` | Yes | Create a listing (verifies vehicle on Fabric first) |
| PATCH | `/:vehicleId` | Yes | Update listing details (seller only) |
| DELETE | `/:vehicleId` | Yes | Delete listing (seller only) |
| POST | `/:vehicleId/photos` | Yes | Upload car photos — `multipart/form-data`, field `photos` |

**Create listing**
```json
{
  "vehicleId": "VH-2024-001",
  "price": 2500000,
  "location": "Islamabad, Pakistan",
  "mileage": 12000,
  "description": "Well maintained, single owner."
}
```

**Update listing** — any subset of these fields
```json
{
  "price": 2300000,
  "location": "Lahore, Pakistan",
  "mileage": 13500,
  "description": "Price reduced.",
  "isForSale": false
}
```

**Photo upload** — `multipart/form-data`
```
POST /api/v1/listings/:vehicleId/photos
Content-Type: multipart/form-data
field: photos (up to 5 files, max 5 MB each, JPEG/PNG/WebP)
```

**Browse filters** (`GET /listings`)

| Param | Type | Description |
|---|---|---|
| `make` | string | Case-insensitive regex |
| `model` | string | Case-insensitive regex |
| `year` | string | Exact match |
| `minYear` / `maxYear` | string | Year range |
| `minPrice` / `maxPrice` | number | Price range |
| `location` | string | Case-insensitive regex |
| `sortBy` | string | Field to sort by (default: `createdAt`) |
| `order` | string | `asc` or `desc` (default: `desc`) |
| `page` | number | Page number (default: `1`) |
| `limit` | number | Results per page (max `50`, default `20`) |

---

### Admin `/api/v1/admin`

Requires both a valid JWT and `role: "admin"`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/init-ledger` | Admin | Bootstrap ledger with seed data |
| GET | `/audit-logs` | Admin | Paginated audit logs |
| GET | `/users` | Admin | All registered users |

**Audit log filters**
```
?page=1&limit=20&userId=...&vehicleId=...&action=...&status=success|failure
```

---

## Response Format

All responses follow this shape:

```json
{
  "statusCode": 200,
  "data": { },
  "message": "Human readable message",
  "success": true
}
```

Errors:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Vehicle does not exist",
  "errors": []
}
```

Stack trace is included in `error.stack` only when `NODE_ENV=development`.

---

## Project Structure

```
src/
├── index.js                      # Entry point — dotenv first, then DB + server start
├── app.js                        # Express app: middleware stack, routes, error handler
├── constants.js
│
├── configs/
│   ├── fabric.config.js          # Cert file paths + Fabric connection constants
│   └── cloudinary.config.js      # Cloudinary SDK init + upload/delete helpers
│
├── controllers/
│   ├── user.controller.js        # Register, login, logout, refresh, profile, password
│   ├── vehicle.controller.js     # All chaincode interactions
│   ├── listing.controller.js     # Marketplace CRUD + photo upload
│   └── admin.controller.js       # Ledger init, audit logs, user management
│
├── db/
│   └── index.js                  # Mongoose connection
│
├── middlewares/
│   ├── auth.middleware.js        # verifyJWT, requireAdmin
│   ├── audit.middleware.js       # Fire-and-forget on-chain action logger
│   ├── error.middleware.js       # Global Express error handler (registered last)
│   └── upload.middleware.js      # Multer: memory storage, type/size validation
│
├── models/
│   ├── user.model.js             # User schema, bcrypt hooks, JWT methods
│   ├── auditlog.model.js         # On-chain action audit trail
│   └── listing.model.js          # Marketplace listing with denormalized vehicle fields
│
├── routes/
│   ├── user.routes.js            # /api/v1/users
│   ├── vehicle.routes.js         # /api/v1/vehicles (GET public, writes auth)
│   ├── listing.routes.js         # /api/v1/listings (GET public, writes auth)
│   └── admin.routes.js           # /api/v1/admin
│
├── services/
│   └── fabric.services.js        # Evaluate + submit chaincode calls, error mapping
│
└── utils/
    ├── ApiErrors.js              # Custom ApiError class
    ├── ApiResponse.js            # Standardized response wrapper
    ├── asyncHandler.js           # Wraps async controllers for Express error forwarding
    └── fabricUtils.js            # gRPC client + Gateway singleton, graceful shutdown
```
