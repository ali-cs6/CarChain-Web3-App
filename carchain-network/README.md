# CarChain Network

A permissioned blockchain network built on Hyperledger Fabric for tamper-proof vehicle registration and ownership management.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Network Architecture](#3-network-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Certificate Authorities](#5-certificate-authorities)
6. [Membership Service Provider (MSP)](#6-membership-service-provider-msp)
7. [Ordering Service](#7-ordering-service)
8. [Peers](#8-peers)
9. [Channel Configuration](#9-channel-configuration)
10. [Smart Contract (Chaincode)](#10-smart-contract-chaincode)
11. [Vehicle Data Model](#11-vehicle-data-model)
12. [Chaincode Functions Reference](#12-chaincode-functions-reference)
13. [Blockchain Events](#13-blockchain-events)
14. [Cryptographic Security](#14-cryptographic-security)
15. [Network Ports Reference](#15-network-ports-reference)
16. [Chaincode Lifecycle & Deployment History](#16-chaincode-lifecycle--deployment-history)
17. [Environment Configuration](#17-environment-configuration)
18. [State Database and History](#18-state-database-and-history)
19. [Docker Deployment](#19-docker-deployment)
20. [Design Decisions & Rationale](#20-design-decisions--rationale)

---

## 1. Overview

CarChain is a blockchain-based vehicle registry and ownership transfer system. The network records each vehicle's full lifecycle — from initial registration through every ownership transfer and status change — on an immutable, distributed ledger. Because each transaction is cryptographically signed, timestamped, and replicated across multiple peers, no single party can silently alter historical records.

The system solves the core problem of vehicle fraud: in traditional registries, records can be tampered with or forged. On CarChain, every state change is a blockchain transaction with a permanent, auditable history. This is directly applicable to anti-fraud use cases such as detecting odometer rollbacks, exposing stolen vehicles listed for sale, and verifying ownership chains before purchase.

The network is implemented as a single-organization permissioned blockchain. In a permissioned network, every participant must hold a valid cryptographic identity issued by a recognized Certificate Authority before they can submit or endorse transactions. This is the fundamental distinction from public blockchains such as Ethereum, where anyone can participate anonymously.

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Blockchain Platform | Hyperledger Fabric | 2.5.15 |
| Certificate Authority | Hyperledger Fabric CA | 1.5.12 |
| Smart Contract Language | JavaScript (Node.js) | Node >= 18 |
| Chaincode API | fabric-contract-api | 2.5.8 |
| Chaincode Shim | fabric-shim | 2.5.8 |
| Consensus Algorithm | etcd Raft | (embedded in Fabric 2.x) |
| State Database | LevelDB (goleveldb) | (embedded in Fabric peer) |
| Container Runtime | Docker / Docker Compose | — |
| Cryptography | ECDSA P-256, SHA2-256 | — |

---

## 3. Network Architecture

### High-Level Topology

```
                         ┌────────────────────────────────┐
                         │        CarChain Network         │
                         │   Docker Bridge Network         │
                         └────────────────────────────────┘
                                        │
          ┌─────────────┬───────────────┼───────────────┬─────────────┐
          │             │               │               │             │
   ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐ ┌─────▼──────┐ ┌───▼────────┐
   │ ca.usersorg │ │ca.order │  │orderer.users│ │peer0.users │ │peer1.users │
   │  port 7054  │ │ port    │  │  org        │ │  org       │ │  org       │
   │  Fabric CA  │ │  8054   │  │  port 7050  │ │ port 7051  │ │ port 8051  │
   └─────────────┘ └─────────┘  └─────────────┘ └────────────┘ └────────────┘
```

### Organization Structure

The network has a single organization named **UsersOrg** with the MSP identifier `UsersOrgMSP`. All network participants — the orderer, both peers, and application clients — are members of this organization. This is a deliberate single-org design suitable for an MVP or a system where one organization operates the full infrastructure (e.g., a government vehicle authority or a private marketplace operator).

### Consensus Model

The orderer uses **etcd Raft**, which is the production-grade consensus algorithm introduced in Hyperledger Fabric 2.x. Raft is a crash fault-tolerant (CFT) consensus protocol. In this deployment there is one Raft consenter (single orderer node), meaning the network tolerates no orderer failures in its current configuration. The design allows adding more Raft nodes later to achieve fault tolerance without changing the application layer.

---

## 4. Directory Structure

```
carchain-network/
│
├── bin/                          # Hyperledger Fabric CLI binaries
│   ├── configtxgen               # Generates genesis blocks and channel transactions
│   ├── configtxlator             # Translates config between protobuf and JSON
│   ├── cryptogen                 # Generates crypto material (dev/test use)
│   ├── discover                  # Service discovery tool
│   ├── fabric-ca-client          # CA client CLI
│   ├── fabric-ca-server          # CA server binary
│   ├── ledgerutil                # Ledger diagnostic utility
│   ├── orderer                   # Orderer node binary
│   ├── osnadmin                  # Orderer channel participation admin tool
│   └── peer                      # Peer node binary
│
├── ca/
│   ├── orderer/                  # Orderer CA server home directory
│   │   ├── fabric-ca-server-config.yaml   # Orderer CA configuration
│   │   ├── ca-cert.pem           # Orderer CA root certificate
│   │   └── tls-cert.pem          # Orderer CA TLS certificate
│   └── usersorg/                 # UsersOrg CA server home directory
│       ├── fabric-ca-server-config.yaml   # UsersOrg CA configuration
│       ├── ca-cert.pem           # UsersOrg CA root certificate
│       └── tls-cert.pem          # UsersOrg CA TLS certificate
│
├── chaincode/
│   └── carChain/                 # Smart contract source code
│       ├── index.js              # Chaincode entry point — exports contract class
│       ├── package.json          # Node.js package manifest
│       ├── carchain.tar.gz       # Packaged chaincode ready for peer install
│       └── lib/
│           └── CarchainChaincode.js   # All smart contract logic
│
├── channel-artifacts/            # Outputs from configtxgen
│   ├── channel.tx                # Channel creation transaction
│   └── carchain.block            # Application channel genesis block
│
├── config/                       # Fabric node configuration files
│   ├── configtx.yaml             # Channel and org policy definitions
│   ├── core.yaml                 # Peer node configuration
│   └── orderer.yaml              # Template orderer configuration
│
├── docker/
│   ├── docker-compose-ca.yaml    # Starts the two CA containers
│   └── docker-compose-network.yaml   # Starts orderer + peer0 + peer1
│
├── orderer/                      # Orderer node runtime material
│   ├── orderer.yaml              # Active orderer configuration
│   ├── genesis/
│   │   └── genesis.block         # Orderer system channel genesis block
│   ├── msp/                      # Orderer identity (MSP)
│   │   ├── admincerts/
│   │   ├── cacerts/
│   │   ├── signcerts/
│   │   └── config.yaml
│   └── tls/                      # Orderer TLS certificates and key
│
├── organizations/
│   └── usersorg/                 # Organization-level MSP material
│       ├── msp/                  # Org-wide MSP (used by configtx)
│       │   ├── admincerts/
│       │   ├── cacerts/
│       │   ├── tlscacerts/
│       │   └── config.yaml
│       └── admin/                # Admin user identity
│           └── msp/
│
├── peers/
│   ├── peer0/                    # peer0.usersorg runtime material
│   │   ├── msp/                  # Peer0 identity
│   │   └── tls/                  # Peer0 TLS certificates
│   └── peer1/                    # peer1.usersorg runtime material
│       ├── msp/                  # Peer1 identity
│       └── tls/                  # Peer1 TLS certificates
│
├── .env.chaincode                # Shell environment for chaincode lifecycle CLI commands
└── .gitignore                    # Excludes private keys, ledger data, and binaries
```

---

## 5. Certificate Authorities

The network runs two dedicated Fabric CA servers, one per domain. Each CA is an X.509 certificate authority that issues digital identities to all network participants.

### ca.usersorg (Port 7054)

This CA serves the `UsersOrg` organization. It issues certificates to peers, admin users, and any application clients that need to interact with the network.

| Property | Value |
|----------|-------|
| CA Name | ca-usersorg |
| Listen Port | 7054 |
| TLS | Enabled |
| Key Algorithm | ECDSA P-256 |
| Hash | SHA2-256 |
| Default Cert Expiry | 8760h (1 year) |
| CA Cert Expiry | 43800h (5 years) |
| Admin Identity | admin-usersorg / adminpw |
| Database | SQLite3 (fabric-ca-server.db) |
| Geographic Identity | Abbottabad, KPK, PK |
| Max Enrollments | Unlimited (-1) |

### ca.orderer (Port 8054)

This CA serves the orderer organization. Its primary job is to issue the TLS certificate and MSP identity for the orderer node.

| Property | Value |
|----------|-------|
| CA Name | ca-orderer |
| Listen Port | 8054 |
| TLS | Enabled |
| Key Algorithm | ECDSA P-256 |
| Hash | SHA2-256 |
| Default Cert Expiry | 8760h (1 year) |
| CA Cert Expiry | 43800h (5 years) |
| Admin Identity | admin-orderer / adminpw |
| Database | SQLite3 (fabric-ca-server.db) |
| Geographic Identity | Abbottabad, KPK, PK |

### Why Two Separate CAs?

Separating the orderer CA from the organization CA follows the Hyperledger Fabric security model. The orderer's role is to sequence transactions, not endorse them. Keeping its PKI separate means that compromising the application organization's CA does not automatically compromise the ordering service, and vice versa.

---

## 6. Membership Service Provider (MSP)

The MSP is the component that maps cryptographic identities (X.509 certificates) to organizational roles. CarChain uses **NodeOUs** (Node Organizational Units), which means a certificate's OU field determines what role the identity has within the network.

### NodeOU Role Mapping

All MSPs in this network (org-level, peer0, peer1, and orderer) have NodeOUs enabled with the following OU-to-role mappings:

| OU Value | Granted Role |
|----------|-------------|
| `client` | Application client — can submit transactions |
| `peer` | Peer node — can endorse transactions |
| `admin` | Administrator — can manage the network |
| `orderer` | Orderer node — can sequence transactions |

The CA certificate used as the trust anchor for these OU definitions is the root certificate from `ca.usersorg` (for the org and peers) and `ca.orderer` (for the orderer identity).

### MSP ID

The single MSP identifier used across the entire network is `UsersOrgMSP`. This MSP ID appears in:
- Channel configuration policies
- All peer environment variables (`CORE_PEER_LOCALMSPID`)
- Orderer configuration (`ORDERER_GENERAL_LOCALMSPID`)
- Chaincode identity queries (`ctx.clientIdentity.getMSPID()`)

---

## 7. Ordering Service

The ordering service is responsible for collecting transaction proposals from peers, ordering them into a deterministic sequence, and cutting them into blocks for distribution back to peers.

### Configuration

| Property | Value |
|----------|-------|
| Container | orderer.usersorg |
| Image | hyperledger/fabric-orderer:2.5.15 |
| Consensus Type | etcd Raft |
| Listen Address | 0.0.0.0:7050 |
| Admin API Address | 0.0.0.0:7053 |
| Operations Address | 0.0.0.0:9443 |
| MSP ID | UsersOrgMSP |
| Bootstrap Method | none (Channel Participation API) |
| TLS | Enabled |
| Admin TLS | Mutual TLS required |
| Ledger Storage | /var/hyperledger/production/orderer |

### Batch Parameters

These parameters control how the orderer groups transactions into blocks:

| Parameter | Value | Meaning |
|-----------|-------|---------|
| BatchTimeout | 2 seconds | Maximum wait before cutting a block even if not full |
| MaxMessageCount | 10 | Maximum transactions per block |
| AbsoluteMaxBytes | 99 MB | Hard limit on block size |
| PreferredMaxBytes | 512 KB | Soft target for block size |

### Channel Participation API

The orderer uses `ORDERER_CHANNELPARTICIPATION_ENABLED=true` and `ORDERER_GENERAL_BOOTSTRAPMETHOD=none`. This is the modern Fabric 2.3+ approach: instead of a system channel genesis block driving channel creation, channels are joined via the `osnadmin` tool directly through the orderer admin API (port 7053). This eliminates the legacy system channel entirely.

### Raft Consenter

The single Raft consenter is the orderer itself:

```
Host: orderer.usersorg
Port: 7050
ClientTLSCert: orderer/tls/signcerts/cert.pem
ServerTLSCert: orderer/tls/signcerts/cert.pem
```

---

## 8. Peers

Peers are the nodes that host the ledger and execute chaincode. The CarChain network has two peers, both belonging to `UsersOrg`.

### peer0.usersorg

| Property | Value |
|----------|-------|
| Container | peer0.usersorg |
| Image | hyperledger/fabric-peer:2.5.15 |
| Peer Port | 7051 (mapped to host 7051) |
| Chaincode Port | 7052 |
| Operations Port | 9444 |
| MSP ID | UsersOrgMSP |
| TLS | Enabled |
| Gossip Bootstrap | peer1.usersorg:7051 |

### peer1.usersorg

| Property | Value |
|----------|-------|
| Container | peer1.usersorg |
| Image | hyperledger/fabric-peer:2.5.15 |
| Peer Port | 7051 (mapped to host 8051) |
| Chaincode Port | 7052 |
| Operations Port | 9445 |
| MSP ID | UsersOrgMSP |
| TLS | Enabled |
| Gossip Bootstrap | peer0.usersorg:7051 |

### Gossip Protocol

Both peers are configured with **mutual gossip bootstrapping**: peer0 bootstraps from peer1, and peer1 bootstraps from peer0. The gossip protocol is used for:
- Block dissemination within the organization
- Peer discovery and liveness tracking
- Private data dissemination (if used in future)

`orgLeader: true` is set in `core.yaml`, meaning both peers statically act as organization leaders and maintain direct connections to the ordering service. `useLeaderElection: false` disables dynamic leader election since both peers are always available in this topology.

### Chaincode Execution

Chaincode runs in Docker containers managed by the peer. The peer mounts the host Docker socket (`/var/run/docker.sock`) giving it the ability to launch chaincode containers on demand. The chaincode container network is set to the same `carchain` Docker bridge network.

---

## 9. Channel Configuration

### Channel Name

`carchain-channel`

### Channel Genesis

The application channel genesis block is stored at `channel-artifacts/carchain.block`. This block was created using `configtxgen` with the `CarChainChannel` profile defined in `config/configtx.yaml`.

### configtx.yaml Profiles

Two profiles are defined:

**CarChainOrdererGenesis** — Used to bootstrap the orderer system domain. Includes `UsersOrg` as the single member of `CarChainConsortium`.

**CarChainChannel** — The application channel profile. Used to generate `channel.tx` and subsequently `carchain.block`. Includes `UsersOrg` as the sole application participant.

### Channel Policies

All policies use the `ImplicitMeta` type which aggregates sub-policies from member organizations:

| Policy | Rule | Applies To |
|--------|------|------------|
| Readers | ANY Readers | Read access to channel |
| Writers | ANY Writers | Write (submit transactions) |
| Admins | MAJORITY Admins | Administrative operations |
| LifecycleEndorsement | MAJORITY Endorsement | Chaincode lifecycle |
| Endorsement | MAJORITY Endorsement | Transaction endorsement |
| BlockValidation | ANY Writers | Block signature validation |

### Capabilities

All capabilities are set to `V2_0`, enabling Fabric 2.x features including the new lifecycle chaincode management system and the gateway service.

---

## 10. Smart Contract (Chaincode)

### Overview

The CarChain smart contract is written in JavaScript using the `fabric-contract-api` library. It extends the Fabric `Contract` base class and exposes nine functions that form the complete business logic of the vehicle registry.

**File**: `chaincode/carChain/lib/CarchainChaincode.js`  
**Entry Point**: `chaincode/carChain/index.js`  
**Name on channel**: `carchain`  
**Version**: `1.0.0`  
**Sequence**: `4`  
**Current Package ID**: `carchain_4:188b53ce1a67a6674d7568e74b2d8bcb0009e92a148a69f39d19a65fb557e8cc`

### Chaincode Package

The packaged chaincode tarball (`carchain.tar.gz`) is installed on the peers using:

```bash
peer lifecycle chaincode install chaincode/carChain/carchain.tar.gz
```

After installation, the chaincode must be approved by the organization and committed to the channel before it can be invoked.

---

## 11. Vehicle Data Model

Every vehicle is stored as a JSON-serialized object on the ledger, keyed by `vehicleId`. The complete schema is:

```json
{
  "vehicleId":    "string  — unique identifier (e.g. VH001)",
  "make":         "string  — manufacturer (e.g. Toyota)",
  "model":        "string  — model name (e.g. Corolla)",
  "year":         "string  — manufacture year (e.g. 2022)",
  "color":        "string  — vehicle color",
  "owner":        "string  — full name of current owner",
  "registeredBy": "string  — MSP ID of the org that registered the vehicle",
  "status":       "string  — one of: active | stolen | scrapped | removed",
  "timestamp":    "string  — ISO 8601 datetime of last state change"
}
```

### Status Lifecycle

```
           ┌─────────┐
           │  active │◄─────────────────────┐
           └────┬────┘                      │
                │                           │
     ┌──────────┼──────────┐                │
     ▼          ▼          ▼                │
 ┌────────┐ ┌──────────┐ ┌─────────┐       │
 │ stolen │ │ scrapped │ │ removed │       │
 └────────┘ └──────────┘ └─────────┘       │
     │                                     │
     └─────────────────────────────────────┘
           (status can be restored to active)
```

The `updateVehicleStatus` function enforces that only the four defined statuses are valid. The `transferOwnership` function enforces that a vehicle must be in `active` status before ownership can be changed.

### Seed Data

On first-time network initialization, `initLedger` populates the ledger with two sample vehicles:

| vehicleId | Make | Model | Year | Color | Owner |
|-----------|------|-------|------|-------|-------|
| VH001 | Toyota | Corolla | 2022 | White | Ali Hassan |
| VH002 | Honda | Civic | 2021 | Black | Sara Khan |

Both are registered with `status: active` and `registeredBy` set to the calling MSP ID.

---

## 12. Chaincode Functions Reference

### `initLedger(ctx)`

Seeds the ledger with predefined sample vehicles. Should be called once after the channel is created and the chaincode is committed. Idempotency note: if called again, it will overwrite VH001 and VH002.

**Access**: Invoke (write transaction)

---

### `registerVehicle(ctx, vehicleId, make, model, year, color, owner)`

Creates a new vehicle record on the ledger.

**Precondition**: `vehicleId` must not already exist on the ledger.  
**Effect**: Writes the vehicle JSON to world state. Captures `registeredBy` from the caller's MSP ID automatically via `ctx.clientIdentity.getMSPID()`.  
**Event emitted**: `VehicleRegistered`  
**Returns**: JSON string of the newly created vehicle object.

**Error**: Throws if the `vehicleId` already exists.

---

### `queryVehicle(ctx, vehicleId)`

Reads the current state of a single vehicle from the ledger.

**Access**: Query (read-only, no transaction written)  
**Returns**: JSON string of the vehicle object.  
**Error**: Throws if `vehicleId` does not exist.

---

### `transferOwnership(ctx, vehicleId, newOwner)`

Changes the `owner` field of a vehicle and updates the `timestamp` to the current transaction time.

**Precondition**: Vehicle must exist and have `status: active`.  
**Effect**: Overwrites the vehicle's world state entry with the new owner.  
**Event emitted**: `OwnershipTransferred` (includes `vehicleId`, `previousOwner`, `newOwner`, `timestamp`)  
**Returns**: JSON string of the updated vehicle.  
**Error**: Throws if vehicle does not exist or is not active.

---

### `getAllVehicles(ctx)`

Returns every vehicle currently stored on the ledger using a full-range state query.

**Access**: Query (read-only)  
**Implementation**: Uses `ctx.stub.getStateByRange("", "")` which iterates all keys in alphabetical order.  
**Returns**: JSON array of all vehicle objects.

---

### `getVehiclesByOwner(ctx, owner)`

Returns all vehicles whose `owner` field matches the given string. This is a client-side filter on top of a full ledger scan.

**Access**: Query (read-only)  
**Implementation**: Full range scan with JavaScript-level filtering by `vehicle.owner === owner`.  
**Returns**: JSON array of matching vehicle objects (empty array if none match).

---

### `getVehicleHistory(ctx, vehicleId)`

Returns the complete transaction history for a vehicle — every state change ever committed, in chronological order.

**Access**: Query (read-only)  
**Implementation**: Uses `ctx.stub.getHistoryForKey(vehicleId)`, which reads from Fabric's history database.  
**Returns**: JSON array of history records, each containing:

```json
{
  "txId":      "transaction ID",
  "timestamp": "block timestamp",
  "isDelete":  "boolean — true if this was a delete operation",
  "data":      "JSON string of vehicle state at this transaction"
}
```

This function is the cornerstone of the anti-fraud use case: it makes the complete change history of any vehicle verifiable and tamper-evident.

---

### `updateVehicleStatus(ctx, vehicleId, newStatus)`

Changes the `status` field of a vehicle.

**Valid values for newStatus**: `active`, `stolen`, `scrapped`, `removed`  
**Effect**: Updates world state and records timestamp.  
**Event emitted**: `VehicleStatusUpdated` (includes `vehicleId`, `previousStatus`, `newStatus`, `timestamp`)  
**Returns**: JSON string of the updated vehicle.  
**Error**: Throws if `newStatus` is not in the valid list, or if vehicle does not exist.

---

### `verifyVehicle(ctx, vehicleId)`

Lightweight existence and status check. Returns a summary object without exposing full vehicle details.

**Access**: Query (read-only)  
**Returns**:

```json
{ "exists": true,  "status": "active", "owner": "Owner Name" }
{ "exists": false, "status": null,     "owner": null          }
```

This function is designed for integration with external systems that need to confirm a vehicle's validity before proceeding (e.g., a sales platform checking if a vehicle is active before accepting a listing).

---

## 13. Blockchain Events

The chaincode emits three types of events. Application backends can register event listeners on the peer's deliver service to receive real-time notifications of state changes.

| Event Name | Triggered By | Payload Fields |
|------------|-------------|----------------|
| `VehicleRegistered` | `registerVehicle` | vehicleId, owner, mspId |
| `OwnershipTransferred` | `transferOwnership` | vehicleId, previousOwner, newOwner, timestamp |
| `VehicleStatusUpdated` | `updateVehicleStatus` | vehicleId, previousStatus, newStatus, timestamp |

Events are committed to the block along with the transaction. A client receives an event only after the block containing that transaction has been committed and confirmed by the peer.

---

## 14. Cryptographic Security

### Key Algorithm

All cryptographic keys in CarChain use **ECDSA with the P-256 curve** (256-bit). The BCCSP (Blockchain Crypto Service Provider) is configured in software mode (`SW`) using SHA2-256 for hashing.

This choice provides approximately 128 bits of security strength, consistent with NIST recommendations for symmetric encryption equivalence.

### TLS

All inter-node communication is encrypted with TLS:
- Peer-to-peer gRPC (port 7051): TLS enabled
- Peer-to-orderer gRPC (port 7050): TLS enabled
- Orderer admin API (port 7053): Mutual TLS required — both client and server must present valid certificates

### Identity Flow

```
CA issues cert → MSP validates cert → NodeOU identifies role → Policy evaluates role
```

1. A user or node presents a certificate signed by a trusted CA.
2. The MSP validates the certificate chain up to the CA root.
3. The NodeOU configuration maps the OU field in the certificate to a role (client/peer/admin/orderer).
4. Channel policies are evaluated against that role to allow or deny the operation.

### Certificate Storage

Private keys are stored in the `msp/keystore/` directories of each component. These directories are explicitly excluded from the git repository via `.gitignore` to prevent accidental exposure of private key material.

---

## 15. Network Ports Reference

| Port | Host Mapping | Component | Protocol | Purpose |
|------|-------------|-----------|----------|---------|
| 7050 | 7050 | orderer.usersorg | gRPC/TLS | Transaction ordering |
| 7053 | 7053 | orderer.usersorg | gRPC/mTLS | Orderer admin (osnadmin) |
| 9443 | 9443 | orderer.usersorg | HTTP | Operations/health |
| 7051 | 7051 | peer0.usersorg | gRPC/TLS | Client + peer comms |
| 7052 | — | peer0.usersorg | gRPC | Chaincode container comms |
| 9444 | 9444 | peer0.usersorg | HTTP | Operations/health |
| 7051 | 8051 | peer1.usersorg | gRPC/TLS | Client + peer comms |
| 7052 | — | peer1.usersorg | gRPC | Chaincode container comms |
| 9445 | 9445 | peer1.usersorg | HTTP | Operations/health |
| 7054 | 7054 | ca.usersorg | HTTPS | Identity enrollment |
| 8054 | 8054 | ca.orderer | HTTPS | Identity enrollment |

---

## 16. Chaincode Lifecycle & Deployment History

Hyperledger Fabric 2.x uses a decentralized chaincode lifecycle. The steps to deploy a new chaincode version are:

1. **Package** — `peer lifecycle chaincode package`
2. **Install** — `peer lifecycle chaincode install` on each peer
3. **Approve** — `peer lifecycle chaincode approveformyorg` by the organization
4. **Commit** — `peer lifecycle chaincode commit` to the channel

The sequence number must be incremented on each new commit. The `.env.chaincode` file records the history of all four deployment iterations:

| Sequence | Label | Package ID (truncated) |
|----------|-------|------------------------|
| 1 | carchain_1 | 32a1401ae29d... |
| 2 | carchain_2 | eaed57cbf0e0... |
| 3 | carchain_3 | 82cad53ccaa3... |
| 4 | carchain_4 | 188b53ce1a67... (current) |

The current active deployment is sequence `4` with package ID `carchain_4:188b53ce1a67a6674d7568e74b2d8bcb0009e92a148a69f39d19a65fb557e8cc`.

---

## 17. Environment Configuration

The `.env.chaincode` file provides all environment variables needed to run chaincode lifecycle CLI commands. It is sourced into the shell before running `peer` CLI commands:

```bash
source .env.chaincode
```

### Key Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `FABRIC_BIN_PATH` | `.../carchain-network/bin` | Path to Fabric binaries |
| `FABRIC_CFG_PATH` | `.../carchain-network/config` | Path to core.yaml and configtx.yaml |
| `CHANNEL_NAME` | carchain-channel | Target channel name |
| `CHAINCODE_NAME` | carchain | Chaincode name on channel |
| `CHAINCODE_VERSION` | 1.0.0 | Chaincode version string |
| `CHAINCODE_SEQUENCE` | 4 | Current lifecycle sequence number |
| `CORE_PEER_LOCALMSPID` | UsersOrgMSP | Org MSP ID for peer CLI |
| `CORE_PEER_ADDRESS` | localhost:7051 | Target peer address |
| `CORE_PEER_TLS_ENABLED` | true | Enable TLS for peer CLI |
| `CORE_PEER_MSPCONFIGPATH` | `.../admin/msp` | Admin identity for peer CLI |
| `ORDERER_CA` | `.../orderer/tls/tlscacerts/ca.crt` | Orderer TLS CA cert |
| `ORDERER_ADDRESS` | localhost:7050 | Orderer address for CLI |
| `FABRIC_LOGGING_SPEC` | INFO | Log verbosity |

---

## 18. State Database and History

### World State

The current state of every vehicle (keyed by `vehicleId`) is stored in **LevelDB** (goleveldb), the default embedded state database in Hyperledger Fabric peers. LevelDB is an ordered key-value store, which makes range queries (like `getStateByRange("", "")` used by `getAllVehicles`) efficient.

### History Database

`enableHistoryDatabase: true` is set in `core.yaml`. This causes the peer to maintain a secondary index that maps each key to its complete transaction history. The `getVehicleHistory` chaincode function uses `ctx.stub.getHistoryForKey()` to query this database.

The history database is stored alongside the world state in the peer's data directory (`/var/hyperledger/production`), also in LevelDB format. It records the transaction ID, timestamp, and state value for every write to a key, enabling full audit trail queries.

### Ledger Data Persistence

Each node's ledger data is mounted from the host filesystem into its Docker container:

| Component | Host Path | Container Path |
|-----------|-----------|----------------|
| peer0 ledger | `peers/peer0/data/` | `/var/hyperledger/production` |
| peer1 ledger | `peers/peer1/data/` | `/var/hyperledger/production` |
| orderer ledger | `orderer/data/` | `/var/hyperledger/production/orderer` |

This means ledger data survives container restarts as long as the host directories exist.

---

## 19. Docker Deployment

The network is split across two Docker Compose files for operational separation:

### Step 1 — Start Certificate Authorities

```bash
docker-compose -f docker/docker-compose-ca.yaml up -d
```

This starts `ca.usersorg` (port 7054) and `ca.orderer` (port 8054). The CA servers read their configuration from the `ca/` directory and serve identity enrollment requests over HTTPS.

### Step 2 — Start the Network

```bash
docker-compose -f docker/docker-compose-network.yaml up -d
```

This starts the orderer and both peers on the `carchain` Docker bridge network. All three containers communicate using their service names as hostnames (e.g., `orderer.usersorg`, `peer0.usersorg`).

### Docker Network

All containers share a single Docker bridge network named `carchain`. The network is defined identically in both compose files, so containers from both files can reach each other by hostname.

### Chaincode Environment Variable

`CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=carchain` is set on both peer containers. This ensures that when a peer launches a chaincode container, that container is also placed on the `carchain` network, allowing it to communicate back to its peer.

---

## 20. Design Decisions & Rationale

### Single Organization

The network is designed as a single-organization system (`UsersOrg`). This simplifies the identity model and is appropriate for an MVP where one entity (e.g., a vehicle authority or marketplace operator) controls the full infrastructure. The architecture can be extended to multiple organizations by adding additional MSPs to `configtx.yaml` and enrolling new peers.

### Single Orderer (No Fault Tolerance)

The current deployment has one Raft consenter. Raft requires a majority of consenters to be live, so a single-consenter deployment has zero crash fault tolerance. For production, this should be expanded to at least three Raft consenters. The code supports this expansion without changes to the chaincode or channel policies.

### History Database Enabled

Enabling the history database is a deliberate choice aligned with the anti-fraud purpose of CarChain. Every ownership transfer, status change, and registration is permanently recorded and queryable via `getVehicleHistory`. This is what makes CarChain credible as a vehicle fraud prevention tool.

### JavaScript Chaincode

Node.js was chosen for chaincode because it uses the same language ecosystem as the backend application. This allows sharing data model knowledge and reduces the skill gap when onboarding developers. The `fabric-contract-api` high-level API abstracts away the low-level gRPC shim, making the business logic in `CarchainChaincode.js` straightforward to read and modify.

### LevelDB over CouchDB

LevelDB (goleveldb) is used as the state database rather than CouchDB. Since the vehicle data model has a simple, predictable key structure (`vehicleId`), the range query capabilities of LevelDB are sufficient. CouchDB would add operational complexity (a separate container) in exchange for JSON indexing features that are not needed in this design.

### Channel Participation API (No System Channel)

Using `ORDERER_GENERAL_BOOTSTRAPMETHOD=none` with `ORDERER_CHANNELPARTICIPATION_ENABLED=true` adopts the Fabric 2.3+ channel management model. This eliminates the legacy system channel, simplifies orderer operation, and aligns with the current Hyperledger Fabric best practices for new deployments.

### Sequence Number Iteration

The chaincode has been deployed four times (sequence 1 through 4), visible from the `.env.chaincode` history. This reflects the iterative development process: each time the chaincode logic was modified, a new package was installed and the sequence incremented to commit the update to the channel.

---

## Appendix: Key File Locations

| Purpose | File |
|---------|------|
| All smart contract logic | `chaincode/carChain/lib/CarchainChaincode.js` |
| Channel and org policies | `config/configtx.yaml` |
| Orderer runtime config | `orderer/orderer.yaml` |
| Peer runtime config | `config/core.yaml` |
| CA config for UsersOrg | `ca/usersorg/fabric-ca-server-config.yaml` |
| CA config for Orderer | `ca/orderer/fabric-ca-server-config.yaml` |
| Network Docker services | `docker/docker-compose-network.yaml` |
| CA Docker services | `docker/docker-compose-ca.yaml` |
| CLI environment variables | `.env.chaincode` |
| Org MSP config (NodeOUs) | `organizations/usersorg/msp/config.yaml` |
| Peer0 MSP config | `peers/peer0/msp/config.yaml` |
| Peer1 MSP config | `peers/peer1/msp/config.yaml` |
