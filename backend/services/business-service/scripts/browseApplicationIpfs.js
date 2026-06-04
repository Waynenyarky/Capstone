#!/usr/bin/env node
/**
 * Browse IPFS files from business application submissions
 *
 * Lists all document CIDs stored when users submit new/renewal applications
 * (prefill test data, LGU docs, BIR docs, etc.) and prints gateway URLs so you
 * can open them in a browser.
 *
 * Usage (from project root or backend/services/business-service):
 *   node scripts/browseApplicationIpfs.js
 *   node scripts/browseApplicationIpfs.js --application WI-xxx   # filter by application ref
 *   node scripts/browseApplicationIpfs.js --pins                  # list all pinned CIDs from IPFS node
 *
 * Requires: MONGO_URI (or MONGO_URI_LOCAL when using Docker locally with Atlas in .env)
 *           IPFS_GATEWAY_URL (optional, default http://localhost:8080/ipfs/)
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../../.env"),
});
const mongoose = require("mongoose");

// When .env has Atlas (mongodb+srv), use local Docker MongoDB so the script finds local submissions.
// Set MONGO_URI_LOCAL to override, or set USE_ATLAS=1 to force Atlas.
const envUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/capstone_project";
const isAtlas = envUri.includes("mongodb+srv");
const localUri =
  process.env.MONGO_URI_LOCAL ||
  `mongodb://${process.env.MONGO_APP_USER || "capstone_app"}:${process.env.MONGO_APP_PASSWORD || "devapppass"}@localhost:27017/capstone_project?authSource=admin`;
const MONGO_URI =
  process.env.MONGO_URI_LOCAL ||
  (isAtlas && process.env.USE_ATLAS !== "1" ? localUri : envUri);
const IPFS_GATEWAY = (
  process.env.IPFS_GATEWAY_URL || "http://localhost:8080/ipfs/"
).replace(/\/?$/, "/");

const BusinessProfile = require("../src/models/BusinessProfile");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};
function log(msg, c) {
  console.log(`${colors[c] || colors.reset}${msg}${colors.reset}`);
}

async function listApplicationFiles(filterAppRef = null) {
  log("\n📁 IPFS files from application submissions", "bright");
  log("═".repeat(80), "cyan");

  const query = {};
  if (filterAppRef) {
    query["businesses.applicationReferenceNumber"] = new RegExp(
      filterAppRef,
      "i",
    );
  }

  const profiles = await BusinessProfile.find(query)
    .select("userId ownerIdentity businesses")
    .lean();

  let total = 0;
  for (const profile of profiles) {
    const userLabel = profile.userId ? profile.userId.toString() : "—";
    for (const biz of profile.businesses || []) {
      const appRef = biz.applicationReferenceNumber || biz.businessId || "—";
      const entries = [];

      // Owner identity (profile-level id file)
      if (profile.ownerIdentity?.idFileIpfsCid) {
        entries.push({
          label: "Owner ID file",
          cid: profile.ownerIdentity.idFileIpfsCid,
        });
      }

      // LGU documents (Mixed: idPictureIpfsCid, ctcIpfsCid, or form-def keys)
      const lgu = biz.lguDocuments || {};
      for (const [k, v] of Object.entries(lgu)) {
        if (
          typeof v === "string" &&
          v.trim() &&
          (k === "ipfsCid" || k.endsWith("IpfsCid"))
        ) {
          entries.push({ label: k, cid: v.trim() });
        }
      }

      // BIR registration
      const bir = biz.birRegistration || {};
      [
        "certificateIpfsCid",
        "booksOfAccountsIpfsCid",
        "authorityToPrintIpfsCid",
        "paymentReceiptIpfsCid",
      ].forEach((f) => {
        if (bir[f]) entries.push({ label: f, cid: bir[f].trim() });
      });

      // Other agencies
      const oa = biz.otherAgencyRegistrations || {};
      if (oa.sss?.proofIpfsCid)
        entries.push({ label: "SSS proof", cid: oa.sss.proofIpfsCid.trim() });
      if (oa.philhealth?.proofIpfsCid)
        entries.push({
          label: "PhilHealth proof",
          cid: oa.philhealth.proofIpfsCid.trim(),
        });
      if (oa.pagibig?.proofIpfsCid)
        entries.push({
          label: "Pag-IBIG proof",
          cid: oa.pagibig.proofIpfsCid.trim(),
        });

      // Renewal documents
      for (const r of biz.renewals || []) {
        const rd = r.renewalDocuments || {};
        for (const [k, v] of Object.entries(rd)) {
          if (typeof v === "string" && v.trim() && k.endsWith("IpfsCid")) {
            entries.push({
              label: `Renewal ${r.renewalYear}: ${k}`,
              cid: v.trim(),
            });
          }
        }
      }

      if (entries.length === 0) continue;

      log(`\n👤 User ${userLabel}  |  Application: ${appRef}`, "yellow");
      entries.forEach(({ label, cid }) => {
        total++;
        log(`   ${total}. ${label}`, "cyan");
        log(`      CID:  ${cid}`, "green");
        log(`      URL:  ${IPFS_GATEWAY}${cid}`, "blue");
      });
    }
  }

  if (total === 0) {
    log("\n   No IPFS documents found for application submissions.", "yellow");
    log(
      "   Submit a new application with file uploads (or use prefill test data) to see CIDs here.",
      "yellow",
    );
  } else {
    log(
      `\n✅ Total: ${total} document(s). Open URLs in your browser to view files.`,
      "green",
    );
  }
}

async function listPinned() {
  log("\n📌 Pinned CIDs on IPFS node", "bright");
  log("─".repeat(50), "cyan");
  try {
    const ipfsClient = require("ipfs-http-client").create({
      url: process.env.IPFS_API_URL || "http://127.0.0.1:5001",
    });
    const pins = [];
    for await (const pin of ipfsClient.pin.ls()) {
      pins.push(pin);
    }
    if (pins.length === 0) {
      log("   No pinned files.", "yellow");
      return;
    }
    pins.forEach((pin, i) => {
      const cid = pin.cid?.toString?.() || pin.path || pin;
      log(`   ${i + 1}. ${cid}`, "cyan");
      log(`      ${IPFS_GATEWAY}${cid}`, "blue");
    });
    log(`\n✅ ${pins.length} pinned object(s)`, "green");
  } catch (e) {
    log(`❌ IPFS not available: ${e.message}`, "red");
    log(
      "   Start IPFS (e.g. docker-compose up -d ipfs) or use list from DB only.",
      "yellow",
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filterApp =
    args.find((a) => a.startsWith("--application="))?.split("=")[1] || null;
  const showPins = args.includes("--pins");

  log("\n🌐 Application IPFS Browser", "bright");
  log("═".repeat(80), "cyan");
  log(`   Gateway: ${IPFS_GATEWAY}`, "cyan");

  try {
    await mongoose.connect(MONGO_URI);
    log("✅ Connected to MongoDB", "green");
  } catch (e) {
    log(`❌ MongoDB failed: ${e.message}`, "red");
    process.exit(1);
  }

  try {
    await listApplicationFiles(filterApp);
    if (showPins) await listPinned();
  } catch (e) {
    log(`\n❌ ${e.message}`, "red");
    console.error(e);
  } finally {
    await mongoose.disconnect();
    log("\n✅ Done", "green");
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { listApplicationFiles, listPinned };
