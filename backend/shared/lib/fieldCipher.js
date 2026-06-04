/**
 * Field-Level Encryption Utility
 * Provides AES-256-GCM encryption for database fields.
 * Two modes:
 *   - Randomized (default): Different ciphertext each time (more secure)
 *   - Deterministic: Same plaintext → same ciphertext (allows exact-match queries)
 */
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const ENC_PREFIX = "enc:v2:";
const DET_PREFIX = "det:v2:";
const IV_LENGTH = 12;

/**
 * Derive a 256-bit key from the FIELD_ENCRYPTION_KEY env var.
 * Throws if the key is not set.
 */
function getKey() {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("FIELD_ENCRYPTION_KEY environment variable is not set");
  }
  return crypto.createHash("sha256").update(String(raw)).digest();
}

/**
 * Encrypt a string value using AES-256-GCM (randomized).
 * Returns prefixed ciphertext string.
 */
function encrypt(plaintext) {
  if (plaintext == null || plaintext === "") return plaintext;
  const str = String(plaintext);
  if (str.startsWith(ENC_PREFIX) || str.startsWith(DET_PREFIX)) return str; // already encrypted
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(str, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

/**
 * Encrypt a string value using AES-256-GCM (deterministic).
 * The IV is derived from the plaintext, so the same input always produces the same output.
 * This allows exact-match queries on encrypted fields (e.g., email lookups).
 */
function encryptDeterministic(plaintext) {
  if (plaintext == null || plaintext === "") return plaintext;
  const str = String(plaintext);
  if (str.startsWith(ENC_PREFIX) || str.startsWith(DET_PREFIX)) return str; // already encrypted
  const key = getKey();
  // Derive IV from HMAC of the plaintext — deterministic but unpredictable without the key
  const iv = crypto
    .createHmac("sha256", key)
    .update(str)
    .digest()
    .subarray(0, IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(str, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${DET_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

/**
 * Decrypt an encrypted string value.
 * Works for both randomized and deterministic ciphertexts.
 */
function decrypt(value) {
  if (value == null || value === "") return value;
  const str = String(value);
  let prefix;
  if (str.startsWith(ENC_PREFIX)) prefix = ENC_PREFIX;
  else if (str.startsWith(DET_PREFIX)) prefix = DET_PREFIX;
  else return str; // not encrypted
  const payload = str.slice(prefix.length);
  const parts = payload.split(":");
  if (parts.length < 3) return str; // malformed, return as-is
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const ct = Buffer.from(parts[2], "hex");
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(ct), decipher.final()]);
  return out.toString("utf8");
}

/**
 * Check if a value is already encrypted.
 */
function isEncrypted(value) {
  if (typeof value !== "string") return false;
  return value.startsWith(ENC_PREFIX) || value.startsWith(DET_PREFIX);
}

module.exports = { encrypt, encryptDeterministic, decrypt, isEncrypted };
