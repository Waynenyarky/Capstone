#!/bin/bash
# ==========================================
# Generate self-signed TLS certs for MongoDB (optional local demo, IAS-3.6)
# ==========================================
# Creates deploy/mongo-tls/ with:
#   ca.pem       - CA certificate
#   server.pem   - Server cert + key (for mongod --tlsCertificateKeyFile)
#   server-key.pem - Server private key (combined into server.pem for MongoDB)
#
# Use with: docker compose --profile tls up -d mongodb
# ==========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="${REPO_ROOT}/deploy/mongo-tls"
mkdir -p "$OUT_DIR"
cd "$OUT_DIR"

# Subject for CA and server (hostnames: mongodb for Docker, localhost for local)
SUBJECT_CA="/CN=CapstoneMongoCA"
SUBJECT_SERVER="/CN=mongodb"

echo "Generating CA..."
openssl genrsa -out ca-key.pem 4096
openssl req -new -x509 -days 3650 -key ca-key.pem -out ca.pem -subj "$SUBJECT_CA"

echo "Generating server cert (mongodb, localhost)..."
openssl genrsa -out server-key.pem 2048
openssl req -new -key server-key.pem -out server.csr -subj "$SUBJECT_SERVER"
# SAN for mongodb and localhost
echo "subjectAltName=DNS:mongodb,DNS:localhost,IP:127.0.0.1" > server-ext.cnf
openssl x509 -req -in server.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -days 3650 -extfile server-ext.cnf
# MongoDB expects cert and key in one file for --tlsCertificateKeyFile
cat server-cert.pem server-key.pem > server.pem
rm -f server.csr server-ext.cnf server-cert.pem

echo "Done. Certs in $OUT_DIR"
echo "  ca.pem         - CA (use for --tlsCAFile)"
echo "  server.pem     - Server cert+key (use for --tlsCertificateKeyFile)"
echo "Start MongoDB with TLS: docker compose --profile tls up -d mongodb"
