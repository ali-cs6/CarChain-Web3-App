# CarChain Backend

A production-ready Express.js API backend for the CarChain marketplace. Integrates Hyperledger Fabric for immutable vehicle record management, MongoDB for user and listing data, Cloudinary for image storage, and JWT-based authentication.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Prerequisites](#4-prerequisites)
5. [Setup & Installation](#5-setup--installation)
6. [Environment Variables](#6-environment-variables)
7. [Database Schema](#7-database-schema)
8. [Blockchain Integration](#8-blockchain-integration)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Image Upload & Media Management](#10-image-upload--media-management)
11. [Audit Logging System](#11-audit-logging-system)
12. [Error Handling](#12-error-handling)
13. [Project Structure](#13-project-structure)
14. [API Reference](#14-api-reference)
15. [Response Format](#15-response-format)
16. [HTTP Status Codes](#16-http-status-codes)
17. [Middleware Pipeline](#17-middleware-pipeline)
18. [Service Layer](#18-service-layer)
19. [Development Guidelines](#19-development-guidelines)
20. [Security Considerations](#20-security-considerations)

---

## 1. Overview

CarChain Backend is a RESTful API that bridges the gap between a React frontend and a Hyperledger Fabric blockchain. It provides:

- **User Management** — Registration, login, JWT tokens, password management
- **Vehicle Registry** — Immutable records on Fabric, queryable via REST
- **Marketplace** — MongoDB-backed listings with photo uploads to Cloudinary
- **Ownership Transfer** — Atomic transaction linking blockchain + platform state
- **Audit Trail** — Complete action history with timestamps, IPs, and outcomes

The API enforces role-based access control (user vs. admin), maintains referential integrity between the blockchain and MongoDB, and provides rich filtering and pagination for marketplace queries.

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | >=18 |
| **Framework** | Express.js | ^5.2.1 |
| **Blockchain Gateway** | @hyperledger/fabric-gateway | ^1.11.0 |
| **RPC Transport** | @grpc/grpc-js | ^1.14.3 |
| **Database** | MongoDB | (via Atlas or local) |
| **ODM** | Mongoose | ^9.6.1 |
| **Authentication** | JWT (jsonwebtoken) | ^9.0.3 |
| **Password Hashing** | bcryptjs | ^3.0.3 |
| **File Upload** | multer | ^2.1.1 |
| **Cloud Storage** | Cloudinary SDK | ^2.10.0 |
| **CORS** | cors | ^2.8.6 |
| **Environment** | dotenv | ^17.4.2 |
| **Input Validation** | express-validator | ^7.3.2 |
| **Cookie Parsing** | cookie-parser | ^1.4.7 |
| **Dev Tool** | nodemon | ^3.1.14 (dev) |

---

## 3. Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
│                     (port 5173)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/REST
                         │
         ┌───────────────▼──────────────────┐
         │   Express.js API Server          │
         │        (port 9000)               │
         │                                  │
         ├──────────────┬──────────────────┤
         │              │                  │
    ┌────▼──┐      ┌────▼──┐       ┌──────▼──────┐
    │MongoDB│      │Fabric │       │ Cloudinary  │
    │(Users,│      │Gateway│       │   (Images)  │
    │Listings,     │(gRPC) │       └─────────────┘
    │Sales, Logs)  │       │
    │              └───┬───┘
    └──────────────────┤
                       │
                 gRPC/TLS
                       │
       ┌───────────────▼──────────────┐
       │  Hyperledger Fabric Peer     │
       │  Chaincode Execution         │
       │  (carchain:1.0.0)            │
       └──────────────────────────────┘
```

### Request Lifecycle

```
Request
   │
   ▼
Express Middleware Stack
   ├─► CORS + JSON Parser
   ├─► Cookie Parser
   ├─► Authentication (if required)
   ├─► Authorization (if admin-only)
   └─► Audit Logger (fire-and-forget)
   │
   ▼
Route Handler
   │
   ├─► Input Validation
   ├─► DB/Fabric Query
   └─► Response Construction
   │
   ▼
Response Interceptor (audit capture)
   │
   ▼
Error Handler (global)
   │
   ▼
Client
```

---

## 4. Prerequisites

- **Node.js** >=18 (LTS recommended)
- **MongoDB** Atlas account (or local MongoDB 5.0+)
- **Cloudinary** account (free tier sufficient)
- **Hyperledger Fabric network** running with `carchain` chaincode deployed
  - See `../carchain-network/README.md` for network setup
- **Private Key File** of the Fabric admin identity (`.../admin/msp/keystore/*_sk`)

---

## 5. Setup & Installation

### Step 1 — Clone and Install

```bash
cd carchain-backend
npm install
```

### Step 2 — Configure Environment

```bash
cp .env.example .env
# Edit .env — fill all required values
```

### Step 3 — Verify Fabric Connection

Ensure the Fabric network is running and accessible:

```bash
# From carchain-network directory
docker-compose -f docker/docker-compose-ca.yaml up -d
docker-compose -f docker/docker-compose-network.yaml up -d

# Verify orderer is reachable
nc -zv localhost 7050    # Should output "succeeded"
nc -zv localhost 7051    # Should output "succeeded"
```

### Step 4 — Start Development Server

```bash
npm run dev      # With nodemon auto-reload
npm start        # Production (no auto-reload)
```

Expected startup output:
```
Server running on port 9000
[DB] Connected to MongoDB
[FabricUtils] Gateway connected → localhost:7051 | channel: carchain-channel | chaincode: carchain
```

---

## 6. Environment Variables

All variables are required unless noted as optional.

### Server Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Server listen port | `9000` | Optional (default 9000) |
| `CORS_ORIGIN` | Frontend origin for CORS | `http://localhost:5173` | Yes |
| `NODE_ENV` | Environment mode | `development` \| `production` | Optional (default development) |

> **CORS Note**: `credentials: true` is enabled, so you cannot use `*` as origin. Always specify exact frontend URL. Browsers reject `*` when credentials are needed.

### Database

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/carchain?appName=Cluster0` | Yes |

> **Security**: Never commit the actual MongoDB credentials to git. Use environment variables or `.env` (which is `.gitignore`d).

### JWT & Authentication

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ACCESS_TOKEN_SECRET` | Secret key for signing access tokens | 64-char hex: `a1b2c3d4...` | Yes |
| `ACCESS_TOKEN_EXPIRY` | Access token TTL | `1d` \| `7d` \| `24h` | Yes (default `1d`) |
| `REFRESH_TOKEN_SECRET` | Secret key for signing refresh tokens | 64-char hex: `x1y2z3w4...` | Yes |
| `REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `10d` \| `30d` | Yes (default `10d`) |

> **Token Strategy**: Access tokens are short-lived (1d). Refresh tokens are stored in the database and live longer (10d). Clients get both on login and use refresh tokens to issue new access tokens without re-entering credentials.

### Cloudinary Image Uploads

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | `dxxxxxx` | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcXYZ_1a2b3c...` | Yes |

> **Note**: API credentials should be restricted at Cloudinary dashboard to allow only upload operations. Never use overly permissive permissions.

### Fabric Blockchain Connection

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `FABRIC_NETWORK_PATH` | Relative path to `carchain-network` | `../carchain-network` | Yes |
| `FABRIC_ADMIN_KEY_FILENAME` | Admin private key filename (the `_sk` file in keystore) | `abc123def456_sk` | Yes |
| `FABRIC_PEER_ENDPOINT` | gRPC endpoint of the peer (host:port) | `localhost:7051` | Yes |
| `FABRIC_PEER_HOST_ALIAS` | TLS hostname override for peer certificate validation | `peer0.usersorg` | Yes |
| `FABRIC_CHANNEL_NAME` | Fabric channel name | `carchain-channel` | Yes |
| `FABRIC_CHAINCODE_NAME` | Deployed chaincode name | `carchain` | Yes |
| `FABRIC_MSP_ID` | Organization MSP ID | `UsersOrgMSP` | Yes |

> **Fabric Discovery**: The backend reads certificates and keys directly from the filesystem at startup (validated in `fabric.config.js`). If any file is missing, startup fails with a clear error.

---

## 7. Database Schema

All MongoDB collections are managed by Mongoose models in `src/models/`.

### User Collection

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `_id` | ObjectId | (auto) | Unique document ID |
| `username` | String | unique, lowercase, trim | Login identifier |
| `email` | String | unique, lowercase, trim | Contact & password reset |
| `fullname` | String | required, trim | Display name (used on blockchain) |
| `password` | String | required, hashed (bcrypt) | Login credential |
| `role` | String | enum: `user` \| `admin` | Permission level (default: `user`) |
| `governmentId` | String | unique, required | KYC identifier |
| `licenseNumber` | String | optional | Driver license (planned feature) |
| `refreshToken` | String | optional | Long-lived JWT (stored for logout) |
| `verificationStatus` | String | enum: `pending` \| `verified` \| `rejected` | KYC approval status (default: `pending`) |
| `createdAt` | Date | (auto) | Account creation timestamp |
| `updatedAt` | Date | (auto) | Last modification timestamp |

**Hooks**:
- `pre('save')` — Auto-hashes password if modified (using bcrypt, 10 rounds)

**Methods**:
- `isPasswordCorrect(password)` — Async bcrypt compare
- `generateAccessToken()` — Returns signed JWT with `_id`, `email`, `governmentId`
- `generateRefreshToken()` — Returns signed JWT with only `_id`

---

### Listing Collection

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `_id` | ObjectId | (auto) | Unique listing ID |
| `vehicleId` | String | unique, required | Reference to blockchain vehicle |
| `sellerId` | ObjectId | ref: User, required | Owner of listing (links to User) |
| `price` | Number | required, >=0 | Asking price in PKR |
| `location` | String | required, trim | City/address |
| `mileage` | Number | required, >=0 | Odometer reading in km |
| `description` | String | trim, default: "" | Seller's notes |
| `photos` | [String] | default: [] | Array of Cloudinary URLs |
| `isForSale` | Boolean | default: true | Soft delete (listing still exists if false, but hidden) |
| `views` | Number | default: 0 | Auto-incremented on GET |
| `contactNumber` | String | trim, default: "" | Seller's phone |
| `make` | String | trim, optional | Denormalized from blockchain (e.g., "Toyota") |
| `model` | String | trim, optional | Denormalized from blockchain (e.g., "Corolla") |
| `year` | String | trim, optional | Denormalized from blockchain (e.g., "2022") |
| `color` | String | trim, optional | Denormalized from blockchain (e.g., "Blue") |
| `createdAt` | Date | (auto) | Listing creation time |
| `updatedAt` | Date | (auto) | Last edit time |

**Indexes**:
- `{ isForSale: 1, createdAt: -1 }` — Active listings by newest first
- `{ sellerId: 1 }` — User's listings
- `{ price: 1 }` — Price filtering
- `{ make: 1, model: 1, year: 1 }` — Vehicle details search
- `{ location: 1 }` — Location filtering

**Denormalization Strategy**: `make`, `model`, `year`, `color` are copied from the blockchain record at listing creation time. This avoids hitting Fabric for every marketplace filter query. If the blockchain record changes, the listing is not auto-updated (by design — ownership transfer changes owner, not make/model).

---

### Sale Collection

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `_id` | ObjectId | (auto) | Unique sale ID |
| `vehicleId` | String | required | Which vehicle was sold |
| `sellerId` | ObjectId | ref: User, required | Original seller |
| `buyerId` | ObjectId | ref: User, required | New owner |
| `buyerName` | String | required, trim | Buyer's full name (sent to blockchain) |
| `salePrice` | Number | required, >=0 | Agreed price |
| `fabricTxId` | String | optional | Transaction ID from blockchain transfer |
| `make` | String | trim, optional | Denormalized from listing |
| `model` | String | trim, optional | Denormalized from listing |
| `year` | String | trim, optional | Denormalized from listing |
| `color` | String | trim, optional | Denormalized from listing |
| `createdAt` | Date | (auto) | Sale completion timestamp |
| `updatedAt` | Date | (auto) | Last modification |

**Indexes**:
- `{ sellerId: 1, createdAt: -1 }` — Seller's sales history
- `{ buyerId: 1, createdAt: -1 }` — Buyer's acquisitions
- `{ vehicleId: 1 }` — Look up sale by vehicle

**Sale Workflow**:
1. Seller calls `POST /api/v1/sales/:vehicleId/complete` with buyer's username/email
2. Backend resolves buyer from User collection
3. Backend transfers ownership on blockchain (`transferOwnership` → buyer's fullname)
4. Backend closes the listing (`isForSale = false`) and reassigns it to the buyer
5. Backend creates a Sale record with all denormalized vehicle data + `fabricTxId`

---

### Audit Log Collection

| Field | Type | Constraints | Purpose |
|-------|------|-------------|---------|
| `_id` | ObjectId | (auto) | Unique log entry ID |
| `userId` | ObjectId | ref: User, optional | Authenticated user (null for public queries) |
| `action` | String | enum: see list | What was done |
| `vehicleId` | String | optional | Which vehicle (if applicable) |
| `fabricTxId` | String | optional | Blockchain transaction ID (only for submits) |
| `payload` | Mixed | default: {} | Request body/params/query that arrived |
| `response` | Mixed | optional | Data sent back to client (on success) |
| `error` | String | optional | Error message (on failure) |
| `status` | String | enum: `success` \| `failure` | Outcome |
| `ipAddress` | String | optional | Client IP (respects `X-Forwarded-For`) |
| `createdAt` | Date | (auto) | Timestamp |

**Valid Actions**:
```
"getAllVehicles", "getVehicleById", "getVehiclesByOwner", "getVehicleHistory", 
"verifyVehicle", "registerVehicle", "transferOwnership", "updateVehicleStatus", 
"initLedger", "completeSale"
```

**Indexes**:
- `{ userId: 1, createdAt: -1 }` — User's activity
- `{ vehicleId: 1, createdAt: -1 }` — Vehicle's history
- `{ action: 1 }` — Action filtering
- `{ status: 1 }` — Success/failure split

**Logging Strategy**: Non-blocking, fire-and-forget. The audit middleware wraps `res.json()` to capture the outgoing response and persists to MongoDB asynchronously. If logging fails, it warns to console but never blocks or crashes the response.

---

## 8. Blockchain Integration

### Connection Pattern — Singleton Gateway

The backend maintains a single `fabric-gateway` connection (reused across all requests) for efficiency. This is initialized lazily on first use and kept alive.

**Key File**: `src/utils/fabricUtils.js`

```javascript
// Singleton initialization
async function getGateway()
  ↓ checks if _gateway exists
  ↓ if yes, return cached instance
  ↓ if no:
    - load certs from filesystem
    - create gRPC client with TLS
    - build Identity + Signer
    - connect gateway
    - cache in _gateway
    ↓ return gateway

// Get the contract (derived from gateway)
async function getContract()
  ↓ get gateway (above)
  ↓ getNetwork(FABRIC_CHANNEL_NAME)
  ↓ getContract(FABRIC_CHAINCODE_NAME)
  ↓ return contract
```

### Certificate & Key Loading

**File**: `src/configs/fabric.config.js`

Certificates are loaded from the Fabric network directory at startup:

```
Network Root: ../carchain-network (or FABRIC_NETWORK_PATH)
  │
  ├── Admin Identity:
  │   ├── cert: organizations/usersorg/admin/msp/signcerts/cert.pem
  │   └── key:  organizations/usersorg/admin/msp/keystore/{FABRIC_ADMIN_KEY_FILENAME}
  │
  └── Peer TLS CA:
      └── peers/peer0/tls/tlscacerts/ca.crt
```

If any file is missing at startup, `fabric.config.js` throws an error with the expected path, preventing silent failures.

### Service Layer — Chaincode Bindings

**File**: `src/services/fabric.services.js`

Exports 8 functions that map directly to chaincode functions:

#### Query Functions (Read-Only)

```javascript
getAllVehicles()                    → evaluateTransaction("getAllVehicles")
queryVehicle(vehicleId)             → evaluateTransaction("queryVehicle", vehicleId)
getVehiclesByOwner(owner)           → evaluateTransaction("getVehiclesByOwner", owner)
getVehicleHistory(vehicleId)        → evaluateTransaction("getVehicleHistory", vehicleId)
verifyVehicle(vehicleId)            → evaluateTransaction("verifyVehicle", vehicleId)
```

#### Submit Functions (Write Transactions)

```javascript
registerVehicle(vehicleId, make, model, year, color, owner)
  → submitTransaction("registerVehicle", vehicleId, make, model, year, color, owner)

transferOwnership(vehicleId, newOwner)
  → submitTransaction("transferOwnership", vehicleId, newOwner)

updateVehicleStatus(vehicleId, newStatus)
  → submitTransaction("updateVehicleStatus", vehicleId, newStatus)

initLedger()
  → submitTransaction("initLedger")
```

### Error Mapping

Chaincode errors are caught and remapped to HTTP status codes:

| Chaincode Error | HTTP Code | Example |
|-----------------|-----------|---------|
| "already exists" (regex) | 409 Conflict | Vehicle ID already on ledger |
| "does not exist" (regex) | 404 Not Found | Query nonexistent vehicle |
| "not active" (regex) | 422 Unprocessable Entity | Cannot transfer inactive vehicle |
| "invalid status" (regex) | 400 Bad Request | Invalid status value |
| Other | 500 Internal Server Error | Unexpected chaincode failure |

Errors are cleaned of gRPC status prefixes (e.g., "2 UNKNOWN: ...") before returning to client.

### Graceful Shutdown

On `SIGTERM` or `SIGINT`, the backend closes both the Gateway and gRPC client:

```javascript
// index.js
process.on("SIGTERM", () => { closeGateway(); process.exit(0); });
process.on("SIGINT",  () => { closeGateway(); process.exit(0); });
```

This ensures the Fabric connection is cleanly torn down before the process exits, avoiding orphaned connections.

---

## 9. Authentication & Authorization

### JWT Strategy

**Dual-Token Approach**:

- **Access Token** — Short-lived (1 day), stored in memory or httpOnly cookie, used for every authenticated request
- **Refresh Token** — Long-lived (10 days), stored in database, used to issue a new access token without re-login

### Token Generation

Both tokens are JWT signed with respective secrets:

```javascript
// Access Token (short-lived)
jwt.sign(
  { _id, email, governmentId },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
)

// Refresh Token (long-lived)
jwt.sign(
  { _id },
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
)
```

### Token Verification Middleware

**File**: `src/middlewares/auth.middleware.js`

```javascript
verifyJWT
  ├─ Extract token from:
  │  ├─ req.cookies.accessToken (httpOnly cookie), OR
  │  └─ Authorization: Bearer <token> header
  │
  ├─ Verify signature against ACCESS_TOKEN_SECRET
  ├─ Decode to get _id
  ├─ Fetch user from MongoDB
  ├─ Attach user to req.user
  └─ Call next()
```

If verification fails at any step, throws `401 Unauthorized`.

### Admin Authorization

**File**: `src/middlewares/auth.middleware.js`

```javascript
requireAdmin
  ├─ Check req.user.role === "admin"
  ├─ If not, throw 403 Forbidden
  └─ If yes, call next()
```

**Usage**: Applied to admin-only routes:

```javascript
router.post("/init-ledger", verifyJWT, requireAdmin, initLedger);
```

### Login & Token Exchange Flow

1. **POST `/api/v1/users/login`** — Credentials valid, generate tokens
   - Set `accessToken` in httpOnly cookie (`Path=/`, `HttpOnly`, `Secure` in prod)
   - Return both tokens in response body (for SPA to store refresh token)

2. **POST `/api/v1/users/refresh-token`** — Access token expired
   - Send refresh token
   - Verify against REFRESH_TOKEN_SECRET
   - Issue new access token
   - Update cookie

3. **POST `/api/v1/users/logout`** — Clear stored tokens
   - Clear `accessToken` cookie
   - Clear `refreshToken` from database (invalidates future refresh attempts)

---

## 10. Image Upload & Media Management

### Multer Configuration

**File**: `src/middlewares/upload.middleware.js`

- **Storage**: In-memory (Buffer) — not disk
- **File Size Limit**: 5 MB per file
- **Accepted Types**: `image/jpeg`, `image/png`, `image/webp`
- **Max Files Per Request**: 5 files

Validation occurs before Cloudinary upload. Invalid files are rejected early.

### Cloudinary Upload

**File**: `src/configs/cloudinary.config.js`

```javascript
uploadToCloudinary(buffer, folder = "carchain/listings")
  ├─ Create stream from buffer
  ├─ Call cloudinary.uploader.upload_stream()
  ├─ Store in folder "carchain/listings"
  ├─ Return secure_url on success
  └─ Throw error on failure
```

URLs returned are HTTPS and suitable for direct display in the frontend.

### Photo Deletion

When a listing is deleted, its photos are removed from Cloudinary:

```javascript
deleteFromCloudinary(publicId)
  ├─ Extract public_id from URL (if needed)
  └─ Call cloudinary.uploader.destroy(publicId)
```

Photos stored in `listing.photos` array are URLs; the public_id is extracted from the URL path as needed.

---

## 11. Audit Logging System

### Design: Fire-and-Forget, Non-Blocking

The audit logger is inserted into the middleware stack but never blocks responses. It intercepts `res.json()` to capture the outgoing response, logs to MongoDB asynchronously, and immediately calls the original `res.json()` to send the response.

**File**: `src/middlewares/audit.middleware.js`

### Usage in Routes

```javascript
router.get("/", auditLog("getAllVehicles"), getAllVehicles);
router.post("/", verifyJWT, auditLog("registerVehicle"), registerVehicle);
```

### Captured Information

| Field | Source | Purpose |
|-------|--------|---------|
| `userId` | `req.user._id` | Who made the request |
| `action` | String literal in route | What they tried to do |
| `vehicleId` | `req.params.vehicleId` or `req.body.vehicleId` | Which vehicle (if applicable) |
| `fabricTxId` | Parsed from response for submits | Blockchain transaction ID |
| `payload` | `req.params`, `req.body`, `req.query` | What was sent |
| `response` | `res.body.data` | What was returned (on success) |
| `error` | `res.body.message` | Error message (on failure) |
| `status` | `res.statusCode < 400` ? "success" : "failure" | Outcome |
| `ipAddress` | `X-Forwarded-For` header or socket | Client IP |
| `createdAt` | Auto timestamp | When it happened |

### Admin Query

**GET `/api/v1/admin/audit-logs`**

Parameters:
- `page` — Page number (default 1)
- `limit` — Per page (default 20, max 50)
- `userId` — Filter by user
- `vehicleId` — Filter by vehicle
- `action` — Filter by action
- `status` — Filter by "success" or "failure"

Example:
```
GET /api/v1/admin/audit-logs?action=transferOwnership&status=failure&limit=10
```

---

## 12. Error Handling

### Custom ApiError Class

**File**: `src/utils/ApiErrors.js`

```javascript
new ApiError(statusCode, message, errors = [], stack = "")
  ├─ Extends built-in Error
  ├─ Stores statusCode for response
  ├─ Stores array of validation errors
  └─ Captures stack trace automatically
```

### Async Error Wrapping

**File**: `src/utils/asyncHandler.js`

Every async controller is wrapped to catch errors and forward to the global error handler:

```javascript
asyncHandler(asyncFn)
  ├─ Wraps async controller function
  ├─ Catches any thrown error (ApiError or other)
  └─ Calls next(error) to pass to global error handler
```

Usage:
```javascript
const getAllVehicles = asyncHandler(async (req, res) => {
  // Any error thrown here is caught
  const vehicles = await fabricService.getAllVehicles();
  return res.status(200).json(...);
});
```

### Global Error Handler

**File**: `src/middlewares/error.middleware.js`

Registered last in middleware stack. Catches all errors:

```javascript
errorHandler(err, req, res, next)
  ├─ Determine statusCode:
  │  ├─ If ApiError: use err.statusCode
  │  └─ Else: use 500
  │
  ├─ Build response:
  │  ├─ success: false
  │  ├─ statusCode
  │  ├─ message
  │  ├─ errors: [] (from ApiError)
  │  └─ stack: (only in development)
  │
  └─ Send JSON response
```

### Common Error Scenarios

| Scenario | Type | Code | Message |
|----------|------|------|---------|
| Invalid JWT | ApiError | 401 | "Invalid access token" |
| Missing auth | ApiError | 401 | "Authentication token missing" |
| Not admin | ApiError | 403 | "Forbidden: admin access required" |
| Vehicle not found on blockchain | ApiError | 404 | "Vehicle {id} does not exist" |
| Vehicle already exists | ApiError | 409 | "Vehicle {id} already exists on the ledger" |
| Validation failed | ApiError | 400 | Specific field error |
| Unexpected chaincode error | ApiError | 500 | Error message from chaincode |
| Database connection error | Error | 500 | "Failed to connect to MongoDB" |

---

## 13. Project Structure

```
carchain-backend/
│
├── src/
│   ├── index.js                      # Entry point — loads .env, connects DB, starts server
│   ├── app.js                        # Express app definition — middleware + routes
│   ├── constants.js                  # Exported constants (if any)
│   │
│   ├── configs/
│   │   ├── fabric.config.js          # Loads Fabric certs, validates paths, exports FABRIC_CONNECTION
│   │   └── cloudinary.config.js      # Initializes Cloudinary SDK, export upload/delete helpers
│   │
│   ├── controllers/
│   │   ├── user.controller.js        # register, login, logout, refresh, profile, change-password
│   │   ├── vehicle.controller.js     # All vehicle queries + registers/transfers/status updates
│   │   ├── listing.controller.js     # Browse, create, update, delete, upload photos
│   │   ├── sale.controller.js        # Complete sale, fetch sales history
│   │   └── admin.controller.js       # init-ledger, audit-logs, get users
│   │
│   ├── db/
│   │   └── index.js                  # Mongoose.connect() — handles connection + error events
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js        # verifyJWT, requireAdmin
│   │   ├── audit.middleware.js       # auditLog(action) — wraps res.json, logs to MongoDB
│   │   ├── error.middleware.js       # Global error handler (registered last)
│   │   └── upload.middleware.js      # Multer configuration for file uploads
│   │
│   ├── models/
│   │   ├── user.model.js             # User schema + bcrypt hooks + JWT methods
│   │   ├── listing.model.js          # Listing schema + indexes
│   │   ├── sale.model.js             # Sale schema + indexes
│   │   └── auditlog.model.js         # AuditLog schema + indexes
│   │
│   ├── routes/
│   │   ├── user.routes.js            # /api/v1/users
│   │   ├── vehicle.routes.js         # /api/v1/vehicles
│   │   ├── listing.routes.js         # /api/v1/listings
│   │   ├── sale.routes.js            # /api/v1/sales
│   │   └── admin.routes.js           # /api/v1/admin
│   │
│   ├── services/
│   │   └── fabric.services.js        # 8 functions: evaluateTransaction + submitTransaction wrappers
│   │
│   └── utils/
│       ├── ApiErrors.js              # Custom ApiError class extending Error
│       ├── ApiResponse.js            # Standardized response wrapper
│       ├── asyncHandler.js           # Wraps async route handlers for error catching
│       ├── fabricUtils.js            # Singleton gateway + contract getter, graceful shutdown
│       └── fabricUtils.js            # (above)
│
├── package.json                      # Dependencies + scripts (start, dev)
├── package-lock.json                 # Locked dependency versions
├── .env.example                      # Template for environment variables
├── .env                              # Actual env vars (git-ignored)
├── .gitignore                        # Excludes node_modules, .env
└── README.md                         # This file
```

---

## 14. API Reference

Base URL: `http://localhost:9000/api/v1`

All endpoints return JSON responses following the standardized format (see Response Format section).

### Users Routes

#### POST `/users/register`

Create a new user account.

**Auth**: None  
**Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "fullname": "John Doe",
  "password": "SecurePass@123",
  "governmentId": "GOV-12345",
  "licenseNumber": "LIC-001"
}
```

**Response** (201):
```json
{
  "statusCode": 201,
  "data": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "fullname": "John Doe",
    "role": "user",
    "verificationStatus": "pending"
  },
  "message": "User registered successfully",
  "success": true
}
```

---

#### POST `/users/login`

Authenticate and get tokens.

**Auth**: None  
**Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": { "_id", "username", "email", "fullname", "role" }
  },
  "message": "Login successful",
  "success": true
}
```

**Cookies Set**:
- `accessToken` — httpOnly, Secure (prod), 1 day TTL

---

#### POST `/users/refresh-token`

Exchange refresh token for new access token.

**Auth**: None  
**Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Access token refreshed",
  "success": true
}
```

---

#### POST `/users/logout`

Invalidate tokens.

**Auth**: Yes (JWT required)  
**Body**: None  
**Response** (200):
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Logged out successfully",
  "success": true
}
```

---

#### GET `/users/me`

Get authenticated user's profile.

**Auth**: Yes  
**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "fullname": "John Doe",
    "role": "user",
    "governmentId": "GOV-12345",
    "verificationStatus": "pending",
    "createdAt": "2026-05-10T...",
    "updatedAt": "2026-05-10T..."
  },
  "message": "User profile fetched",
  "success": true
}
```

---

#### POST `/users/change-password`

Change password (requires current password).

**Auth**: Yes  
**Body**:
```json
{
  "oldPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```

**Response** (200):
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Password changed successfully",
  "success": true
}
```

---

### Vehicles Routes

#### GET `/vehicles`

Get all vehicles on the blockchain.

**Auth**: No  
**Query**: None  
**Response** (200):
```json
{
  "statusCode": 200,
  "data": [
    {
      "vehicleId": "VH001",
      "make": "Toyota",
      "model": "Corolla",
      "year": "2022",
      "color": "White",
      "owner": "Ali Hassan",
      "registeredBy": "UsersOrgMSP",
      "status": "active",
      "timestamp": "2026-05-12T..."
    }
  ],
  "message": "Vehicles fetched successfully",
  "success": true
}
```

---

#### GET `/vehicles/:vehicleId`

Get a single vehicle by ID.

**Auth**: No  
**Response** (200): Single vehicle object (same schema as above)

---

#### GET `/vehicles/:vehicleId/history`

Get full transaction history of a vehicle.

**Auth**: No  
**Response** (200):
```json
{
  "statusCode": 200,
  "data": [
    {
      "txId": "...",
      "timestamp": "...",
      "isDelete": false,
      "data": "{...vehicle JSON...}"
    }
  ],
  "message": "Vehicle history fetched successfully",
  "success": true
}
```

---

#### GET `/vehicles/owner/:owner`

Get all vehicles owned by a specific person.

**Auth**: No  
**Response** (200): Array of vehicle objects

---

#### GET `/vehicles/:vehicleId/verify`

Quick existence + status check.

**Auth**: No  
**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "exists": true,
    "status": "active",
    "owner": "Ali Hassan"
  },
  "message": "Vehicle verified successfully",
  "success": true
}
```

---

#### POST `/vehicles`

Register a new vehicle on the blockchain.

**Auth**: Yes  
**Body**:
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

**Response** (201): Newly registered vehicle object

---

#### PUT `/vehicles/:vehicleId/transfer`

Transfer ownership to a new owner.

**Auth**: Yes  
**Body**:
```json
{
  "newOwner": "Jane Smith"
}
```

**Response** (200): Updated vehicle object with new owner + timestamp

---

#### PUT `/vehicles/:vehicleId/status`

Update vehicle status.

**Auth**: Yes  
**Body**:
```json
{
  "status": "stolen"
}
```

**Valid Statuses**: `active` | `stolen` | `scrapped` | `removed`

**Response** (200): Updated vehicle object

---

### Listings Routes

#### GET `/listings`

Browse marketplace listings with advanced filtering.

**Auth**: No  
**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `make` | string | Case-insensitive regex match |
| `model` | string | Case-insensitive regex match |
| `year` | string | Exact year |
| `minYear` / `maxYear` | string | Year range |
| `minPrice` / `maxPrice` | number | Price range |
| `location` | string | Case-insensitive regex |
| `sortBy` | string | Field (default `createdAt`) |
| `order` | string | `asc` or `desc` (default `desc`) |
| `page` | number | Page number (default 1) |
| `limit` | number | Per page (max 50, default 20) |

**Example**:
```
GET /listings?make=Toyota&minPrice=1000000&maxPrice=3000000&page=1&limit=10
```

**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "listings": [...],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  },
  "message": "Listings fetched successfully",
  "success": true
}
```

---

#### GET `/listings/:vehicleId`

Get a single listing (increments view count).

**Auth**: No  
**Response** (200): Single listing object

---

#### POST `/listings`

Create a new listing for a vehicle.

**Auth**: Yes  
**Body**:
```json
{
  "vehicleId": "VH-2024-001",
  "price": 2500000,
  "location": "Islamabad, Pakistan",
  "mileage": 12000,
  "description": "Well maintained, single owner."
}
```

Backend verifies the vehicle exists on blockchain before creating listing.

**Response** (201): New listing object

---

#### PATCH `/listings/:vehicleId`

Update listing details (seller only).

**Auth**: Yes  
**Body**: Any subset of:
```json
{
  "price": 2300000,
  "location": "Lahore",
  "mileage": 13500,
  "description": "Updated description",
  "isForSale": false,
  "contactNumber": "+923001234567"
}
```

**Authorization**: Only the seller (listing owner) can edit

**Response** (200): Updated listing

---

#### DELETE `/listings/:vehicleId`

Delete a listing (seller only).

**Auth**: Yes  
**Authorization**: Seller only  
**Response** (200): Success message

---

#### POST `/listings/:vehicleId/photos`

Upload car photos (seller only).

**Auth**: Yes  
**Content-Type**: `multipart/form-data`  
**Field Name**: `photos` (up to 5 files)  
**File Constraints**:
- Max 5 MB per file
- Accepted types: JPEG, PNG, WebP
- Max 5 files per request

**Example cURL**:
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "photos=@car1.jpg" \
  -F "photos=@car2.jpg" \
  http://localhost:9000/api/v1/listings/VH-2024-001/photos
```

**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "vehicleId": "VH-2024-001",
    "photos": [
      "https://res.cloudinary.com/...",
      "https://res.cloudinary.com/..."
    ]
  },
  "message": "Photos uploaded successfully",
  "success": true
}
```

---

### Sales Routes

#### POST `/sales/:vehicleId/complete`

Complete a sale and transfer ownership on blockchain.

**Auth**: Yes (seller)  
**Body**:
```json
{
  "buyerIdentifier": "jane_smith_username",
  "salePrice": 2500000
}
```

`buyerIdentifier` can be username or email.

**Workflow**:
1. Resolve buyer from User collection
2. Verify listing exists and caller is seller
3. Transfer ownership on blockchain to buyer's fullname
4. Close listing (`isForSale = false`) and reassign to buyer
5. Create Sale record with fabric transaction ID

**Response** (201):
```json
{
  "statusCode": 201,
  "data": {
    "sale": {
      "_id": "...",
      "vehicleId": "VH-2024-001",
      "sellerId": "...",
      "buyerId": "...",
      "buyerName": "Jane Smith",
      "salePrice": 2500000,
      "fabricTxId": "...",
      "createdAt": "..."
    }
  },
  "message": "Sale completed — ownership transferred on blockchain",
  "success": true
}
```

---

#### GET `/sales/my-sales`

Fetch authenticated seller's completed sales history.

**Auth**: Yes  
**Query**:
- `page` — Default 1
- `limit` — Default 10, max 50

**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "sales": [...],
    "pagination": { "total": 5, "page": 1, "limit": 10, "totalPages": 1 }
  },
  "message": "Sales fetched successfully",
  "success": true
}
```

---

### Admin Routes

#### POST `/admin/init-ledger`

Bootstrap the blockchain with sample vehicles.

**Auth**: Yes (admin only)  
**Body**: None  
**Response** (200):
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Ledger initialized with seed vehicles",
  "success": true
}
```

---

#### GET `/admin/audit-logs`

Fetch paginated audit logs with optional filters.

**Auth**: Yes (admin)  
**Query**:
- `page` — Default 1
- `limit` — Default 20, max 50
- `userId` — Filter by user ID
- `vehicleId` — Filter by vehicle ID
- `action` — Filter by action name
- `status` — Filter by "success" or "failure"

**Example**:
```
GET /admin/audit-logs?action=transferOwnership&status=failure&limit=10
```

**Response** (200):
```json
{
  "statusCode": 200,
  "data": {
    "auditLogs": [...],
    "pagination": { "total": 47, "page": 1, "limit": 20, "totalPages": 3 }
  },
  "message": "Audit logs fetched",
  "success": true
}
```

---

#### GET `/admin/users`

Fetch all registered users (admin only).

**Auth**: Yes (admin)  
**Response** (200):
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "role": "user",
      "verificationStatus": "pending",
      "createdAt": "..."
    }
  ],
  "message": "Users fetched",
  "success": true
}
```

---

## 15. Response Format

All endpoints return JSON in this standardized format:

### Success Response (status < 400)

```json
{
  "statusCode": 200,
  "data": { /* actual response payload */ },
  "message": "Human-readable success message",
  "success": true
}
```

### Error Response (status >= 400)

```json
{
  "statusCode": 404,
  "message": "Vehicle not found",
  "errors": [],
  "success": false
}
```

Development mode includes stack trace:

```json
{
  "statusCode": 500,
  "message": "Database connection failed",
  "errors": [],
  "stack": "Error: connect ECONNREFUSED...\n    at ...",
  "success": false
}
```

---

## 16. HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Successful GET/PUT/POST (read or safe write) |
| 201 | Successful POST (resource created) |
| 400 | Bad request — validation error, missing field, invalid format |
| 401 | Unauthorized — no token, invalid token, expired token |
| 403 | Forbidden — authenticated but insufficient permissions (not admin) |
| 404 | Not found — vehicle/listing/user doesn't exist |
| 409 | Conflict — vehicle ID already exists on blockchain, listing already exists |
| 422 | Unprocessable entity — vehicle not active for ownership transfer |
| 500 | Internal server error — unexpected failure in chaincode or database |

---

## 17. Middleware Pipeline

Requests flow through this middleware stack in order:

```
1. JSON Parser           (parse JSON body)
2. Cookie Parser        (parse httpOnly cookies)
3. CORS                 (check origin, allow credentials)
4. Routes               (matched routes use specific middlewares)
   ├─ Public routes (GET vehicles, listings) → no auth
   ├─ Protected routes (POST vehicle, listing) → verifyJWT
   ├─ Admin routes (init-ledger) → verifyJWT + requireAdmin
   └─ Audit logging → auditLog(action) (all routes)
5. Global Error Handler (catches all errors, last)
```

Example middleware chain for a protected, audited endpoint:

```javascript
router.post(
  "/",
  verifyJWT,                           // Step 1: Auth
  auditLog("registerVehicle"),         // Step 2: Audit wrap
  registerVehicle                      // Step 3: Controller
);
```

---

## 18. Service Layer

All blockchain calls are abstracted in `fabric.services.js`. Controllers never call `getContract()` directly; they use these service functions:

**Query Functions** (return data):
```javascript
getAllVehicles()                    // No params, returns []
queryVehicle(vehicleId)             // Returns single object or throws 404
getVehiclesByOwner(owner)           // Returns [] (may be empty)
getVehicleHistory(vehicleId)        // Returns [] of history records
verifyVehicle(vehicleId)            // Returns { exists, status, owner }
```

**Submit Functions** (return data + write to ledger):
```javascript
registerVehicle(...args)            // Returns created vehicle
transferOwnership(vehicleId, newOwner)   // Returns updated vehicle
updateVehicleStatus(vehicleId, newStatus)  // Returns updated vehicle
initLedger()                        // Returns { message: "..." }
```

**Error Handling**: All functions catch errors, map to HTTP codes, and throw `ApiError`. Controllers don't need to handle Fabric-specific errors.

---

## 19. Development Guidelines

### Adding a New Endpoint

1. Create route in `src/routes/` (or existing route file)
2. Create controller in `src/controllers/`
3. Use `asyncHandler` to wrap controller
4. Use `auditLog(action)` if it's a state-changing action
5. Return `ApiResponse` for success
6. Throw `ApiError` for errors

**Example**:

```javascript
// routes/vehicle.routes.js
router.post(
  "/",
  verifyJWT,
  auditLog("registerVehicle"),
  registerVehicle
);

// controllers/vehicle.controller.js
const registerVehicle = asyncHandler(async (req, res) => {
  const { vehicleId, make, model, year, color, owner } = req.body;

  // Validation
  if ([vehicleId, make, model, year, color, owner].some(f => !f?.trim())) {
    throw new ApiError(400, "All fields required");
  }

  // Call service
  const vehicle = await fabricService.registerVehicle(
    vehicleId.trim(),
    make.trim(),
    model.trim(),
    year.trim(),
    color.trim(),
    owner.trim()
  );

  // Respond
  return res.status(201).json(
    new ApiResponse(201, vehicle, "Vehicle registered successfully")
  );
});
```

### Adding a New MongoDB Model

1. Create model in `src/models/`
2. Define schema with types, validation, default values
3. Add indexes for common queries
4. Export Mongoose model
5. Use in controllers

```javascript
// models/example.model.js
const exampleSchema = new Schema({
  field1: { type: String, required: true },
  field2: { type: Number, min: 0 },
  createdAt: { type: Date, default: Date.now }
});

exampleSchema.index({ field1: 1, createdAt: -1 });

const Example = mongoose.model("Example", exampleSchema);
module.exports = Example;
```

### Testing Endpoints Locally

Use cURL or Postman:

```bash
# Register user
curl -X POST http://localhost:9000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "fullname": "Test User",
    "password": "TestPass@123",
    "governmentId": "GOV-001",
    "licenseNumber": "LIC-001"
  }'

# Login
curl -X POST http://localhost:9000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass@123"}' \
  -c cookies.txt

# Query vehicles (public)
curl http://localhost:9000/api/v1/vehicles

# Register vehicle (protected)
curl -X POST http://localhost:9000/api/v1/vehicles \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VH-TEST-001",
    "make": "Toyota",
    "model": "Corolla",
    "year": "2024",
    "color": "Blue",
    "owner": "Test Owner"
  }'
```

---

## 20. Security Considerations

### Password Security

- Passwords are hashed using **bcryptjs** (10 rounds) before storage
- Never stored in plaintext
- `isPasswordCorrect()` method uses timing-safe comparison

### JWT Security

- Secrets should be at least 64 characters (hex)
- Tokens stored in **httpOnly** cookies (inaccessible to JavaScript)
- **Secure** flag set in production (HTTPS only)
- Refresh tokens also validated against the database (can be revoked on logout)

### Fabric Identity Security

- Admin private key (`_sk` file) is never committed to git (`.gitignore`)
- Loaded from the Fabric network directory at startup
- Certificate paths are validated on startup — missing files cause immediate failure
- Gateway connection is reused (no new credentials loaded per request)

### Blockchain Access Control

- All Fabric transactions are signed by the admin identity
- The backend acts as a trusted intermediary — only authenticated users can modify on-chain state
- Audit logs track which user triggered which blockchain transaction

### Input Validation

- **express-validator** for field validation
- **Multer** enforces file size (5 MB) and type (JPEG/PNG/WebP) limits
- **Cloudinary** validates images server-side

### SQL/NoSQL Injection Prevention

- Mongoose with schema validation prevents injection
- No raw queries used
- User input is never interpolated into queries

### CORS

- CORS is configured to **specific origin** (not `*`)
- Credentials are allowed only with specific origin
- Browsers enforce same-site cookie policy

### Rate Limiting

Not implemented in current version. For production, add:
- `express-rate-limit` to limit login attempts (e.g., 5 attempts / 15 min)
- General API rate limiting (e.g., 100 req/min per IP)

### Monitoring & Logging

- Audit logs capture all state-changing actions
- Admin can query audit logs by user, vehicle, action, status
- Stack traces only shown in development mode
- Production errors logged but not exposed to clients

### Secrets Management

- **Never commit .env file**
- Use environment variables from CI/CD pipeline in production
- Rotate secrets regularly
- Restrict Cloudinary API key permissions at dashboard level
- Use separate DB user with minimal permissions in production

---

## Appendix: Quick Reference

### Key File Locations

| Purpose | File |
|---------|------|
| Server entry | `src/index.js` |
| Express app config | `src/app.js` |
| User registration/login logic | `src/controllers/user.controller.js` |
| Vehicle blockchain calls | `src/controllers/vehicle.controller.js` |
| Listing marketplace logic | `src/controllers/listing.controller.js` |
| Sale completion flow | `src/controllers/sale.controller.js` |
| All Fabric interactions | `src/services/fabric.services.js` |
| Blockchain cert loading | `src/configs/fabric.config.js` |
| Auth & token verification | `src/middlewares/auth.middleware.js` |
| Audit logging logic | `src/middlewares/audit.middleware.js` |
| Error handling | `src/middlewares/error.middleware.js` |
| User schema & methods | `src/models/user.model.js` |
| Listing schema | `src/models/listing.model.js` |
| Sale schema | `src/models/sale.model.js` |
| Audit log schema | `src/models/auditlog.model.js` |

### Environment Variable Checklists

**Minimal working setup**:
```
PORT=9000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=a1b2c3d4...
REFRESH_TOKEN_SECRET=x1y2z3w4...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FABRIC_NETWORK_PATH=../carchain-network
FABRIC_ADMIN_KEY_FILENAME=abc123_sk
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_HOST_ALIAS=peer0.usersorg
FABRIC_CHANNEL_NAME=carchain-channel
FABRIC_CHAINCODE_NAME=carchain
FABRIC_MSP_ID=UsersOrgMSP
```

### Common Commands

```bash
# Install deps
npm install

# Start dev server
npm run dev

# Production start
npm start

# Check endpoints
curl http://localhost:9000/api/v1/vehicles

# Tail logs
tail -f server.log
```
