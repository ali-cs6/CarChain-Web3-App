"use strict";

const grpc = require("@grpc/grpc-js");
const { connect, hash, signers } = require("@hyperledger/fabric-gateway"); //connect: main entry point, hash: for signing, signers: to create a Signer from private key
const crypto = require("crypto"); // Node's built-in crypto module to handle private key loading
const { loadCerts, FABRIC_CONNECTION } = require("../configs/fabric.config");

// Singleton state
let _grpcClient = null;
let _gateway = null;

// Create gRPC client with TLS
function createGrpcClient(tlsCACert) {
  const tlsCredentials = grpc.credentials.createSsl(tlsCACert);

  return new grpc.Client(FABRIC_CONNECTION.PEER_ENDPOINT, tlsCredentials, {
    "grpc.ssl_target_name_override": FABRIC_CONNECTION.PEER_HOST_ALIAS,
  });
}

// Build the Identity object
function loadIdentity(adminCert) {
  return {
    mspId: FABRIC_CONNECTION.MSP_ID,
    credentials: Buffer.from(adminCert),
  };
}

// Build the Signer from the private key
function createSigner(adminKey) {
  const privateKey = crypto.createPrivateKey(adminKey);
  return signers.newPrivateKeySigner(privateKey);
}

// Return a connected Gateway (singleton - reused across requests)
async function getGateway() {
  if (_gateway) return _gateway;

  const { adminCert, adminKey, tlsCACert } = loadCerts();

  _grpcClient = createGrpcClient(tlsCACert);

  _gateway = connect({ // 
    client: _grpcClient,
    identity: loadIdentity(adminCert),
    signer: createSigner(adminKey),
    hash: hash.sha256,
  });

  console.log(
    `[FabricUtils] Gateway connected → ${FABRIC_CONNECTION.PEER_ENDPOINT} ` +
      `| channel: ${FABRIC_CONNECTION.CHANNEL_NAME} ` +
      `| chaincode: ${FABRIC_CONNECTION.CHAINCODE_NAME}`,
  );

  return _gateway;
}

// Return the Contract - entry point for all chaincode calls
async function getContract() {
  const gateway = await getGateway();
  const network = gateway.getNetwork(FABRIC_CONNECTION.CHANNEL_NAME);
  return network.getContract(FABRIC_CONNECTION.CHAINCODE_NAME);
}

//  Graceful shutdown - call on SIGTERM/SIGINT in index.js
function closeGateway() {
  if (_gateway) {
    _gateway.close();
    _gateway = null;
    console.log("[FabricUtils] Gateway closed");
  }
  if (_grpcClient) {
    _grpcClient.close();
    _grpcClient = null;
    console.log("[FabricUtils] gRPC client closed");
  }
}

module.exports = { getContract, closeGateway };
