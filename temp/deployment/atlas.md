# MongoDB Atlas Setup (Encryption at Rest + TLS)

This guide walks you through creating a MongoDB Atlas cluster and connecting the Capstone app to it. Atlas gives you **encryption at rest** (and TLS in transit) by default, so you can easily demonstrate IAS-3.3 and IAS-3.6.

---

## 1. Create an Atlas account and cluster

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up (free).
2. Create an **organization** and **project** (use defaults or name them e.g. "Capstone").
3. **Build a cluster:**
   - Choose **M0 FREE** (shared).
   - Pick a cloud provider and region (e.g. AWS, closest to you).
   - Cluster name: e.g. `CapstoneCluster` → **Create**.
4. Wait until the cluster is created (status becomes "Active").

---

## 2. Create a database user (for the app)

1. In the left sidebar: **Database Access** → **Add New Database User**.
2. **Authentication:** Password.
3. **Username:** e.g. `capstone_app` (or any name).
4. **Password:** Create a strong password and **save it** (you'll put it in `.env`).
5. **Database User Privileges:** **Read and write to any database** (or, for least privilege, **Add built-in role** → `readWrite` on a database named `capstone_project`; you may need to create the DB first or grant readWrite on `admin` and use the DB in the URI).
   - Easiest for a free tier: choose **Read and write to any database**.
6. Click **Add User**.

---

## 3. Allow network access (so the app can connect)

1. Left sidebar: **Network Access** → **Add IP Address**.
2. For **local/dev:** **Add Current IP Address**.
3. For **Codespaces / cloud dev:** either add your current IP again after reconnecting, or temporarily use **Allow Access from Anywhere** (`0.0.0.0/0`) for dev only (not recommended for production).
4. Confirm with **Add IP Address**.

---

## 4. Get the connection string

1. Go back to **Database** (left sidebar) and click **Connect** on your cluster.
2. Choose **Drivers** (or **Connect your application**).
3. **Driver:** Node.js. Copy the connection string. It looks like:
   ```text
   mongodb+srv://<username>:<password>@capstonecluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` with your DB user (e.g. `capstone_app`) and `<password>` with that user's password.  
   **Important:** If the password contains special characters, URL-encode them (e.g. `@` → `%40`, `#` → `%23`).
5. Add the database name. Before the `?` add `/capstone_project`:
   ```text
   mongodb+srv://capstone_app:YOUR_PASSWORD@capstonecluster.xxxxx.mongodb.net/capstone_project?retryWrites=true&w=majority
   ```
   The app uses the database name `capstone_project`.

---

## 5. Show encryption at rest (IAS-3.3)

Atlas encrypts data at rest by default. To show it:

1. In Atlas, go to **Database** → your cluster.
2. Click the **…** (ellipsis) next to the cluster name → **Edit Configuration**,  
   **or** open the cluster and look for **Security** / **Encryption** (wording can vary by Atlas version).
3. You should see that **encryption at rest** is enabled (often with no option to turn it off on M0).
4. **Screenshot** that screen (cluster configuration or encryption section) and keep it as evidence for the checklist.

You can also cite in your runbook: *"Production database uses MongoDB Atlas; encryption at rest is enabled by default (see Atlas cluster configuration)."*

---

## 6. TLS (IAS-3.6)

Atlas connection strings use the `mongodb+srv://` scheme, which uses **TLS by default**. No extra steps needed. Your runbook can state: *"Production MongoDB connection uses TLS via Atlas (mongodb+srv://)."*

---

## 7. Connect the Capstone app to Atlas

### Option A: Use Atlas with the start script (recommended)

1. Put the full connection string in your **`.env`** (project root):
   ```env
   MONGO_URI=mongodb+srv://capstone_app:YOUR_PASSWORD@capstonecluster.xxxxx.mongodb.net/capstone_project?retryWrites=true&w=majority
   ```
   Do **not** commit `.env` to git.

2. Start the app with the **`--atlas`** flag so the local MongoDB container is not started:
   ```bash
   ./start.sh --atlas
   ```
   You can combine flags: `./start.sh --atlas --dev`, `./start.sh --atlas --demo-ui`, `./start.sh --atlas --skip-ipfs`, etc.

### Option B: Use Docker Compose directly (no start script)

1. Set `MONGO_URI` in `.env` as above.

2. Run Compose with the Atlas override (no local `mongodb` service):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.atlas.yml up -d
   ```

3. If you use the web dev server, start it separately (e.g. `cd web && npm run dev`).

### Backend scripts and backup/restore

- Backend scripts (e.g. seed) that use MongoDB read `MONGO_URI` from `.env`; ensure the same Atlas URI is set when you run them.
- For backup/restore, you can use [deploy/backup.sh](../../deploy/backup.sh) / [deploy/restore.sh](../../deploy/restore.sh) with `MONGO_URI` pointing to Atlas, or use Atlas Backup from the Atlas UI.

---

## 8. Switch back to local MongoDB

- Remove or comment out the Atlas `MONGO_URI` in `.env` (or set it to the default local URI from .env.example).
- Start without the `--atlas` flag so the local MongoDB container runs:
  ```bash
  ./start.sh
  ```
  or `docker compose up -d`.

---

## 9. Verify the app is using Atlas

1. After starting with Atlas, open the app and log in or sign up.
2. In Atlas: **Database** → **Browse Collections** for your cluster.
3. Select the `capstone_project` database; you should see collections (e.g. `users`, `sessions`) and new data when you use the app.

---

## Quick checklist

- [ ] Atlas account and M0 cluster created  
- [ ] Database user created; password saved  
- [ ] Network access: your IP (or temporary 0.0.0.0/0 for dev) added  
- [ ] Connection string in `.env` as `MONGO_URI` with `/capstone_project` and password filled in  
- [ ] Screenshot of cluster configuration / encryption at rest for IAS-3.3  
- [ ] App started with `./start.sh --atlas` (or the equivalent compose command)  
- [ ] Data visible in Atlas **Browse Collections** when using the app  

See also: [../security/database.md](../security/database.md) (IAS-3.3, 3.4, 3.6, 3.7).
