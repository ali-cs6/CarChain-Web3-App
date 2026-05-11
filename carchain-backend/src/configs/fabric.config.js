"use strict";

const path = require("path"); // built-in module for handling file paths
const fs = require("fs"); // built-in module for file system operations (checking existence, reading files)
const dotenv = require("dotenv");
dotenv.config();

const networkRoot = path.resolve(
  process.cwd(), // ensures we start from the project root regardless of where this file is located
  process.env.FABRIC_NETWORK_PATH || "../carchain-network"
);

// Certificate paths inside the network directory
const CERT_PATHS = {
  adminCert: path.join(
    networkRoot,
    "organizations/usersorg/admin/msp/signcerts/cert.pem"
  ),
  adminKey: path.join(
    networkRoot,
    "organizations/usersorg/admin/msp/keystore/",
    process.env.FABRIC_ADMIN_KEY_FILENAME // set in .env — the hashed _sk filename
  ),
  tlsCACert: path.join(
    networkRoot,
    "peers/peer0/tls/tlscacerts/ca.crt"
  ),
};

// Validate all cert files exist at startup
function validateCertPaths() {
  for (const [name, filePath] of Object.entries(CERT_PATHS)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `[FabricConfig] Missing cert file "${name}" at: ${filePath}\n` +
        `Check FABRIC_NETWORK_PATH and FABRIC_ADMIN_KEY_FILENAME in your .env`
      );
    }
  }
}

// Load cert file contents as UTF-8 strings
function loadCerts() {
  validateCertPaths();
  return {
    adminCert: fs.readFileSync(CERT_PATHS.adminCert).toString(),
    adminKey:  fs.readFileSync(CERT_PATHS.adminKey).toString(),
    tlsCACert: fs.readFileSync(CERT_PATHS.tlsCACert),  // Buffer — needed by gRPC
  };
}

// Connection constants
const FABRIC_CONNECTION = Object.freeze({
  PEER_ENDPOINT:  process.env.FABRIC_PEER_ENDPOINT  || "localhost:7051",
  PEER_HOST_ALIAS: process.env.FABRIC_PEER_HOST_ALIAS || "peer0.usersorg",
  CHANNEL_NAME:   process.env.FABRIC_CHANNEL_NAME   || "carchain-channel",
  CHAINCODE_NAME: process.env.FABRIC_CHAINCODE_NAME || "carchain",
  MSP_ID:         process.env.FABRIC_MSP_ID         || "UsersOrgMSP",
});

module.exports = { loadCerts, FABRIC_CONNECTION };