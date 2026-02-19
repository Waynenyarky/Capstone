# Database Security (IAS-3.3, 3.4, 3.6, 3.7)

This document describes database-related security requirements that are **infrastructure or operations responsibilities**, not implemented in application code. Below: what each term means and **how to check** each one.

---

## Quick reference: what each requirement means

| ID   | Term                     | In plain English |
|------|--------------------------|------------------|
| 3.3  | **Encryption at rest**   | Data on disk (the actual database files) is stored in encrypted form so someone with physical or server access can't read it without the key. |
| 3.4  | **Encrypted backups**   | Any copy of the database (backups, snapshots) is also encrypted so a stolen backup file is unreadable. |
| 3.6  | **TLS database connections** | All traffic between your app and the database is encrypted in transit (like HTTPS for the web), so it can't be read or altered on the network. |
| 3.7  | **Database hardening**   | The database is locked down: limited user permissions, restricted network access, strong passwords, and kept up to date. |

---

## IAS-3.3: Database encryption at rest

**What it means:** When the database is stored on disk, the files are encrypted. If someone gets a copy of the disk or the database files, they still can't read the data without the encryption key.

**Who does it:** The database host or cloud provider (e.g. MongoDB Atlas, or the server/VM that runs MongoDB). It is **not** something your application code does.

**Why you can't "see" it like password hashes:** With password hashing, the app writes the hash into the database, so you can open MongoDB, look at a user document, and see `passwordHash: "$2a$10$..."` — the proof is in the **data format**. With encryption at rest, the **disk** (or volume) is encrypted; MongoDB reads and writes normal data and the storage layer encrypts/decrypts transparently. So from inside the DB or the app, data looks normal — there is no field that "looks encrypted." Proof has to come from the **storage layer** (disk, volume, or cloud provider), not from inspecting documents.

**Ways you can prove it (without Atlas):**

| Where you run MongoDB | How to prove encryption at rest |
|-----------------------|----------------------------------|
| **GitHub Codespaces / Azure** | The VM disk is encrypted at rest by the provider. Document: *"Development runs on [Codespaces/Azure]; VM storage is encrypted at rest per [Azure docs](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption)."* Optional: link to provider’s encryption documentation. |
| **Your laptop (Mac/Windows)** | If full-disk encryption is on (FileVault, BitLocker), the Docker volume lives on an encrypted disk. Document that and optionally run: Mac `fdesetup status`, Windows `manage-bde status`. |
| **Linux server with LUKS** | Run `lsblk -f` or `cryptsetup status` and show the volume used by Docker/MongoDB is on a LUKS-encrypted device. |
| **Any cloud VM** | Check the cloud console: disk/volume often has an "Encrypted" flag or "Encryption at rest" in the disk’s properties. Screenshot or one-line doc. |

So you *can* prove it: by showing that the **disk or volume** where the DB lives is encrypted (provider docs, host FDE, or a quick command/screenshot), not by looking inside MongoDB.

**How to check:**

1. **If you use MongoDB Atlas (cloud):**
   - Log into [Atlas](https://cloud.mongodb.com) → your project → your cluster.
   - Atlas encrypts data at rest by default. You can confirm in **Cluster** → **…** → **Edit Configuration** or in the cluster's **Security** / **Encryption** section (wording may vary by Atlas version).
   - In the Atlas docs, search for "encryption at rest" to see the current UI.

2. **If you run MongoDB yourself (e.g. on a server or VM):**
   - Check whether the **disk or volume** where MongoDB stores data is encrypted (e.g. LUKS on Linux, BitLocker on Windows, or your cloud's "encrypted volume" option).
   - Or check if MongoDB is configured with encryption (e.g. WiredTiger encryption) in the MongoDB docs for your version.

3. **Document it:** In your deployment or runbook doc, write one line such as: "Production database uses encryption at rest (Atlas default / encrypted volume / WiredTiger encryption)."

**Implementation in this repo:**

- MongoDB Community Edition in Docker does not support WiredTiger encryption at rest (that is Atlas or Enterprise). For this project, encryption at rest is achieved by **infrastructure**: use **MongoDB Atlas** (encryption at rest by default), or run the Docker `mongodb_data` volume on an **encrypted host disk or volume** (e.g. LUKS on Linux, BitLocker on Windows, or your cloud provider's encrypted volume option). No change to [docker-compose.yml](../docker-compose.yml) is required if the host disk is already encrypted.
- **Runbook sentence:** "Production database uses encryption at rest (Atlas default / encrypted volume / host encrypted disk)."

---

## IAS-3.4: Encrypted backups

**What it means:** Any backup or snapshot of the database is stored in encrypted form (or in an encrypted storage location). If a backup is stolen or leaked, it can't be restored and read without the key.

**Who does it:** Your backup process or tool (e.g. Atlas Backup, `mongodump` to an encrypted destination, or cloud snapshot on an encrypted volume).

**How to check:**

1. **If you use MongoDB Atlas:**
   - Atlas Backup (for backed-up clusters) stores backups in Atlas's infrastructure; check Atlas docs for "backup" and "encryption" to confirm backups are encrypted.
   - In Atlas: **Project** → **Backup** (or cluster **Backup** tab) and review how backups are stored.

2. **If you run your own backups (e.g. `mongodump`, scripts, or cloud snapshots):**
   - Check where backups are written: are they on an encrypted disk, or in a storage service that encrypts (e.g. S3 with SSE)?
   - If you use a backup tool, check its docs for "encryption" or "encrypted storage."

3. **Document it:** In your runbook or deployment doc, add a short "Backup" section: how often you back up, where backups are stored, and that backups are encrypted (or stored in encrypted storage).

**Implementation in this repo:**

- [deploy/backup.sh](../deploy/backup.sh) creates a gzipped archive; when **BACKUP_ENCRYPTION_PASSWORD** is set, the archive is encrypted with **AES-256-CBC** (OpenSSL) and saved as `.archive.enc`. Production should set `BACKUP_ENCRYPTION_PASSWORD` in `.env`.
- [deploy/restore.sh](../deploy/restore.sh) restores from a backup file (plain `.archive` or encrypted `.archive.enc`). For `.enc` files, set `BACKUP_ENCRYPTION_PASSWORD` to decrypt.
- **Runbook sentence:** "Backups are encrypted with AES-256 when BACKUP_ENCRYPTION_PASSWORD is set; restore uses the same password."

---

## IAS-3.6: TLS database connections

**What it means:** Every connection between your application and the database uses **TLS** (the same kind of encryption used for HTTPS). So data in transit is encrypted and can't be read or modified over the network.

**Who does it:** You enable it by using a connection string that uses TLS. Your app already uses `mongoose.connect(uri)`; the "how" is in the **MONGO_URI** you use in production.

**How to check:**

1. **Look at your production connection string** (in `.env` or your deployment config—never commit the real URI to git):
   - **MongoDB Atlas:** Connection strings usually look like `mongodb+srv://username:password@cluster....mongodb.net/...`. The **`mongodb+srv://`** scheme uses TLS by default. So if production uses an Atlas URI that starts with `mongodb+srv://`, you're good.
   - **Self-hosted or other cloud:** The URI should use TLS, for example:
     - `mongodb://host:27017/dbname?tls=true`
     - or a similar option for your driver/host (see MongoDB docs for "TLS/SSL").

2. **Quick test (optional):** From a machine that can reach the DB, try connecting with a URI that has `tls=true`. If it connects, TLS is in use. If you remove TLS and connection fails (or your policy forbids non-TLS), that also indicates TLS is required.

3. **Document it:** In your deployment/runbook doc, write: "Production MongoDB connection uses TLS (Atlas `mongodb+srv://` URI / connection string with `tls=true`)."

**Production:** Use a TLS-enabled URI: **MongoDB Atlas** (`mongodb+srv://...`, TLS by default) or self-hosted with `?tls=true` (and proper CA; do not use `tlsAllowInvalidCertificates` in production).

**Optional — TLS in Docker (for local demonstration):** To run MongoDB with TLS locally:

1. Generate self-signed certs: `./scripts/mongo-tls-certs.sh` (creates `deploy/mongo-tls/`; this path is gitignored).
2. Start with TLS: `docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d` (the override enables TLS and sets MONGO_URI with `tls=true` and `tlsAllowInvalidCertificates=true` for app services).
3. Omit the second file for normal (non-TLS) operation.

Production must use a proper CA and must not use `tlsAllowInvalidCertificates`. See [docker-compose.tls.yml](../docker-compose.tls.yml) and [scripts/mongo-tls-certs.sh](../scripts/mongo-tls-certs.sh).

---

## IAS-3.7: Database hardening

**What it means:** The database server and access to it are locked down: limited permissions, restricted network access, strong passwords, and up-to-date software. So even if someone gets into your network, they can't easily abuse the database.

**Who does it:** Whoever sets up and operates the database (you or your ops team), via configuration and procedures.

**How to check (use this as a checklist):**

1. **Least-privilege user**
   - The app uses a dedicated MongoDB user (not the superuser) that has only the permissions it needs (read/write only on the databases/collections it uses).
   - **Check:** In Atlas: **Database Access** → select the app's user → see assigned roles. For self-hosted MongoDB, run `db.getUser("yourappuser")` and review roles. Document: "App uses dedicated DB user with least privilege (only required DBs/collections)."

2. **Network restriction**
   - The database is not open to the whole internet. Only your app servers (or VPC) can reach it.
   - **Check:** In Atlas: **Network Access** → only your app's IP(s) or VPC are allowed. For self-hosted: firewall or security group allows only the app host(s). Document: "DB reachable only from app servers / VPC."

3. **Strong password and rotation**
   - The DB user has a strong password and it is rotated periodically (e.g. every 90 days).
   - **Check:** Password is long and random; rotation is in your runbook or calendar. Document: "DB user password is strong and rotated every X days."

4. **Patches and updates**
   - MongoDB (and the OS if you manage it) are kept up to date with security patches.
   - **Check:** Atlas handles this. For self-hosted: you have a process to apply MongoDB and OS updates. Document: "MongoDB and host OS are patched per our update policy."

5. **Document it:** Add a short "Database hardening" section to your deployment or runbook that states: least-privilege user, network restriction, strong/rotated password, and patching. That is your "check" for 3.7.

**Implementation in this repo:**

- **MongoDB in Docker** uses authentication: root user (admin only) and an **application user** with least privilege (`readWrite` on `capstone_project` only). See [docker-compose.yml](../docker-compose.yml) (environment `MONGO_INITDB_*`, `MONGO_APP_USER`, `MONGO_APP_PASSWORD`) and [deploy/mongo-init/01-create-app-user.js](../deploy/mongo-init/01-create-app-user.js). All services and [deploy/backup.sh](../deploy/backup.sh) connect with the app user via `MONGO_URI` (see [.env.example](../.env.example)).
- **Existing volume:** If you already had MongoDB running without auth, the init script runs only on first database creation. Either remove the volume and start fresh (`docker compose down -v`, then `docker compose up -d`; this deletes DB data) or create the app user manually in `mongosh` and then restart services.
- **Runbook sentence (paste into your runbook):** "Database hardening: app uses dedicated DB user with least privilege (readWrite on capstone_project only). In production, DB is not exposed publicly (restrict to app servers/VPC). DB user password is strong and rotated every 90 days. MongoDB and host OS are patched per our update policy."

---

## Summary

| IAS ID | Topic                     | Where it lives / how to check |
|--------|---------------------------|-------------------------------|
| 3.3    | Encryption at rest       | Atlas or host/volume encryption; confirm in provider UI or runbook. |
| 3.4    | Encrypted backups        | Backup tool or storage encryption; document in runbook. |
| 3.6    | TLS database connections | Production `MONGO_URI` uses `mongodb+srv://` or `tls=true`; document in runbook. |
| 3.7    | Database hardening       | Least privilege, network restriction, strong/rotated password, patches; document in runbook. |

**Code reference:** The app only connects via [backend/services/auth-service/src/config/db.js](../backend/services/auth-service/src/config/db.js); production must use a TLS-enabled URI (see comment there). Everything else (3.3, 3.4, 3.7) is configuration and operations, not application code.
