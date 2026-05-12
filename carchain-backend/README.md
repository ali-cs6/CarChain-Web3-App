# CarChain Backend

REST API for CarChain — a decentralized vehicle ownership and history tracking system built on Hyperledger Fabric.

## Overview

The backend sits between the frontend and the Fabric network. It handles user authentication (JWT), forwards chaincode calls to the Fabric peer via gRPC, and logs every on-chain transaction to MongoDB for auditing.

```
Client → Express API → Fabric Gateway → Hyperledger Fabric (chaincode)
                     ↓
                  MongoDB (users, audit logs)
```

## Prerequisites

- Node.js v18+
- A running MongoDB instance (local or Atlas)
- The `carchain-network` Fabric network running with the `carchain` chaincode deployed

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**
```bash
cp .env.example .env
```
Edit `.env` with your values — see [Environment Variables](#environment-variables) below.

**3. Start the server**
```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

The server starts on `PORT` (default `9000`).

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `9000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `ACCESS_TOKEN_SECRET` | JWT secret for access tokens | 64-char hex string |
| `ACCESS_TOKEN_EXPIRY` | Access token TTL | `1d` |
| `REFRESH_TOKEN_SECRET` | JWT secret for refresh tokens | 64-char hex string |
| `REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `10d` |
| `FABRIC_NETWORK_PATH` | Path to `carchain-network` relative to this folder | `../carchain-network` |
| `FABRIC_ADMIN_KEY_FILENAME` | Filename of the admin private key (`_sk` file) | `abc123_sk` |
| `FABRIC_PEER_ENDPOINT` | gRPC peer address | `localhost:7051` |
| `FABRIC_PEER_HOST_ALIAS` | TLS hostname of the peer | `peer0.usersorg` |
| `FABRIC_CHANNEL_NAME` | Fabric channel name | `carchain-channel` |
| `FABRIC_CHAINCODE_NAME` | Deployed chaincode name | `carchain` |
| `FABRIC_MSP_ID` | MSP ID of the organization | `UsersOrgMSP` |

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require a JWT either as a cookie (`accessToken`) or in the `Authorization: Bearer <token>` header.

---

### Users `/api/v1/users`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login and receive tokens |
| POST | `/refresh-token` | No | Refresh the access token |
| POST | `/logout` | Yes | Logout and clear tokens |
| GET | `/me` | Yes | Get the current user's profile |
| POST | `/change-password` | Yes | Change password |

**Register body**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "fullname": "John Doe",
  "password": "Secret@123",
  "governmentId": "GOV-12345"
}
```

**Login body**
```json
{
  "email": "john@example.com",
  "password": "Secret@123"
}
```

---

### Vehicles `/api/v1/vehicles`

All vehicle routes require authentication.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get all vehicles on the ledger |
| GET | `/:vehicleId` | Yes | Get a vehicle by ID |
| GET | `/owner/:owner` | Yes | Get all vehicles by owner name |
| GET | `/:vehicleId/history` | Yes | Get full transaction history of a vehicle |
| GET | `/:vehicleId/verify` | Yes | Verify a vehicle exists and get its status |
| POST | `/` | Yes | Register a new vehicle on the ledger |
| PUT | `/:vehicleId/transfer` | Yes | Transfer ownership to a new owner |
| PUT | `/:vehicleId/status` | Yes | Update vehicle status |

**Register vehicle body**
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

**Transfer ownership body**
```json
{
  "newOwner": "Jane Smith"
}
```

**Update status body**
```json
{
  "newStatus": "stolen"
}
```
Valid statuses: `active`, `stolen`, `scrapped`, `removed`

---

### Admin `/api/v1/admin`

All admin routes require authentication and `role: "admin"`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/init-ledger` | Admin | Seed the ledger with initial data |
| GET | `/audit-logs` | Admin | Get paginated audit logs |
| GET | `/users` | Admin | Get all registered users |

**Audit logs query params**
```
?page=1&limit=20&userId=...&vehicleId=...&action=...&status=success|failure
```

---

## Response Format

All responses follow this structure:

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

## Project Structure

```
src/
├── app.js                  # Express app setup, routes, error handler
├── index.js                # Entry point — DB connect, server start, graceful shutdown
├── constants.js
├── configs/
│   └── fabric.config.js    # Cert paths and Fabric connection constants
├── controllers/
│   ├── admin.controller.js
│   ├── user.controller.js
│   └── vehicle.controller.js
├── db/
│   └── index.js            # MongoDB connection
├── middlewares/
│   ├── auth.middleware.js  # verifyJWT, requireAdmin
│   ├── audit.middleware.js # Logs every on-chain tx to MongoDB
│   └── error.middleware.js # Global error handler
├── models/
│   ├── auditlog.model.js
│   └── user.model.js
├── routes/
│   ├── admin.routes.js
│   ├── user.routes.js
│   └── vehicle.routes.js
├── services/
│   └── fabric.services.js  # All chaincode calls (evaluate + submit)
└── utils/
    ├── ApiErrors.js
    ├── ApiResponse.js
    ├── asyncHandler.js
    └── fabricUtils.js      # gRPC client + Fabric Gateway singleton
```
