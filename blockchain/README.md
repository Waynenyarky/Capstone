# Blockchain (audit logging)

Contracts for on-chain audit logging. Uses Ganache (Docker or GUI).

## After you restart Ganache

1. **Set `DEPLOYER_PRIVATE_KEY` in the project root `.env`**  
   In Ganache GUI: click the key icon next to Account 0 → copy the private key → paste into `.env` as `DEPLOYER_PRIVATE_KEY=0x...`.

2. **Run one command** (from project root or from this folder):
   - **From project root:** `./start.sh --ganache-gui`  
     (starts the app and sets up the chain automatically)
   - **Or only blockchain:** `cd blockchain && npm run setup`  
     (deploys contracts, updates `.env` with new addresses, grants roles)

You don’t need to edit contract addresses or run migrate/write-env/GRANT_ROLES separately. `npm run setup` does a fresh deploy and updates everything.

## Scripts

- `npm run setup` — Deploy to current chain, update `.env`, grant AUDITOR_ROLE (use after restarting Ganache).
- `npm run migrate:development` — Migrate (no reset) and update `.env` (for an already-deployed chain).
- `npm run grant-roles` — Grant roles only (if contracts and `.env` are already correct).
