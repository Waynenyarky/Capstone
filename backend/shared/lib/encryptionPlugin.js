/**
 * Mongoose Encryption Plugin
 * Automatically encrypts string fields before save and decrypts after find.
 *
 * Usage:
 *   const { encryptionPlugin } = require('../../../../shared/lib/encryptionPlugin')
 *   MySchema.plugin(encryptionPlugin, {
 *     fields: ['firstName', 'lastName', 'phoneNumber'],
 *     deterministicFields: ['email', 'username'],   // for exact-match lookups
 *     nestedPaths: ['address'],                      // encrypt all strings inside nested objects
 *     arrayPaths: [],                                // encrypt string fields in array subdocs
 *     mixedPaths: ['metadata', 'formData'],          // encrypt Mixed-type fields (JSON stringify → encrypt)
 *   })
 *
 * Fields that are null, undefined, or '' are left untouched.
 * Fields that are already encrypted (start with enc:v2: or det:v2:) are skipped.
 */
const {
  encrypt,
  encryptDeterministic,
  decrypt,
  isEncrypted,
} = require("./fieldCipher");

function encryptionPlugin(schema, options = {}) {
  const {
    fields = [],
    deterministicFields = [],
    nestedPaths = [],
    arrayPaths = [],
    arrayPathsExclude = {}, // { arrayFieldName: ['field1', 'field2'] } — skip these fields from encryption
    mixedPaths = [],
  } = options;

  // Skip if encryption key not set (e.g., early migration, tests without key)
  function keyAvailable() {
    return !!process.env.FIELD_ENCRYPTION_KEY;
  }

  // ──────────────────── ENCRYPT ON SAVE ────────────────────
  schema.pre("save", async function () {
    if (!keyAvailable()) return;
    encryptDoc(this);
  });

  // ──────────────────── STRIP ENUM VALIDATORS ────────────────────
  // When a document is loaded from the DB, string fields already contain ciphertext
  // (e.g. "enc:v2:…"). If we then modify an unrelated field and call .save(),
  // Mongoose re-validates ALL fields including those with ciphertext, which fails
  // enum validators like `applicationStatus: { enum: ['draft','submitted',…] }`.
  // The fix: remove enum validators from paths that will be encrypted at plugin
  // registration time.
  if (keyAvailable()) {
    // Remove enum/match validators from top-level encrypted fields
    const encryptedTopPaths = [...fields, ...deterministicFields];
    for (const p of encryptedTopPaths) {
      const schemaPath = schema.path(p);
      if (schemaPath && schemaPath.validators) {
        schemaPath.validators = schemaPath.validators.filter(
          (v) => v.type !== "enum" && v.type !== "regexp",
        );
      }
    }

    // Remove enum validators from array subdocument fields
    for (const arrPath of arrayPaths) {
      const schemaType = schema.path(arrPath);
      const subSchema =
        schemaType?.schema || schemaType?.$embeddedSchemaType?.schema;
      if (subSchema) {
        subSchema.eachPath((subPath, subSchemaType) => {
          if (subSchemaType.instance === "String" && subSchemaType.validators) {
            subSchemaType.validators = subSchemaType.validators.filter(
              (v) => v.type !== "enum" && v.type !== "regexp",
            );
          }
        });
      }
    }

    // Remove enum validators from nested path sub-fields
    for (const np of nestedPaths) {
      const schemaType = schema.path(np);
      const subSchema = schemaType?.schema;
      if (subSchema) {
        subSchema.eachPath((subPath, subSchemaType) => {
          if (subSchemaType.instance === "String" && subSchemaType.validators) {
            subSchemaType.validators = subSchemaType.validators.filter(
              (v) => v.type !== "enum" && v.type !== "regexp",
            );
          }
        });
      }
    }
  }

  // Handle insertMany
  schema.pre("insertMany", function (next, docs) {
    if (!keyAvailable()) return next();
    try {
      if (Array.isArray(docs)) {
        docs.forEach((doc) => encryptPlainObj(doc));
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // ──────────────────── ENCRYPT QUERY FILTERS ────────────────────
  // Deterministic fields in query filters must be encrypted so lookups match stored values
  function encryptFilter(filter) {
    if (!filter || typeof filter !== "object") return;
    for (const f of deterministicFields) {
      if (
        typeof filter[f] === "string" &&
        filter[f] !== "" &&
        !isEncrypted(filter[f])
      ) {
        filter[f] = encryptDeterministic(filter[f]);
      }
      // Handle $in operator: { email: { $in: ['a@b.com', 'c@d.com'] } }
      if (
        filter[f] &&
        typeof filter[f] === "object" &&
        Array.isArray(filter[f].$in)
      ) {
        filter[f].$in = filter[f].$in.map((v) =>
          typeof v === "string" && v !== "" && !isEncrypted(v)
            ? encryptDeterministic(v)
            : v,
        );
      }
    }
  }

  const preQueryHandler = async function () {
    if (!keyAvailable()) return;
    encryptFilter(this.getFilter());
  };
  schema.pre("find", preQueryHandler);
  schema.pre("findOne", preQueryHandler);
  schema.pre("countDocuments", preQueryHandler);
  schema.pre("deleteOne", preQueryHandler);
  schema.pre("deleteMany", preQueryHandler);

  // Handle findOneAndUpdate / updateOne / updateMany
  // Use individual hooks with async to avoid next() issues across Mongoose versions
  const preUpdateHandler = async function () {
    if (!keyAvailable()) return;
    encryptFilter(this.getFilter());
    const update = this.getUpdate();
    if (update) {
      encryptUpdate(update);
    }
  };
  schema.pre("findOneAndUpdate", preUpdateHandler);
  schema.pre("updateOne", preUpdateHandler);
  schema.pre("updateMany", preUpdateHandler);

  // ──────────────────── DECRYPT ON READ ────────────────────
  schema.post("find", function (docs) {
    if (!keyAvailable()) return;
    if (Array.isArray(docs)) docs.forEach((d) => decryptDoc(d));
  });

  schema.post("findOne", function (doc) {
    if (!keyAvailable() || !doc) return;
    decryptDoc(doc);
  });

  schema.post("findOneAndUpdate", function (doc) {
    if (!keyAvailable() || !doc) return;
    decryptDoc(doc);
  });

  // Also decrypt after save so the returned document is readable
  schema.post("save", function (doc) {
    if (!keyAvailable() || !doc) return;
    decryptDoc(doc);
  });

  // ──────────────────── ENCRYPT HELPERS ────────────────────

  function encryptField(obj, path, deterministic) {
    const val = obj[path];
    if (val == null || val === "" || typeof val !== "string") return;
    if (isEncrypted(val)) return;
    obj[path] = deterministic ? encryptDeterministic(val) : encrypt(val);
  }

  function encryptNested(obj, basePath) {
    const nested = obj[basePath];
    if (!nested || typeof nested !== "object") return;
    for (const key of Object.keys(nested)) {
      if (
        typeof nested[key] === "string" &&
        nested[key] !== "" &&
        !isEncrypted(nested[key])
      ) {
        nested[key] = encrypt(nested[key]);
      } else if (
        nested[key] &&
        typeof nested[key] === "object" &&
        !Array.isArray(nested[key])
      ) {
        // Recurse one more level for nested objects like address.street
        for (const subKey of Object.keys(nested[key])) {
          if (
            typeof nested[key][subKey] === "string" &&
            nested[key][subKey] !== "" &&
            !isEncrypted(nested[key][subKey])
          ) {
            nested[key][subKey] = encrypt(nested[key][subKey]);
          }
        }
      }
    }
  }

  function encryptArraySubdocs(obj, basePath) {
    const arr = obj[basePath];
    if (!Array.isArray(arr)) return;
    const excludeSet = new Set(arrayPathsExclude[basePath] || []);
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      for (const key of Object.keys(item)) {
        if (excludeSet.has(key)) continue; // Skip excluded fields
        const val = item[key];
        if (typeof val === "string" && val !== "" && !isEncrypted(val)) {
          item[key] = encrypt(val);
        } else if (val && typeof val === "object" && !Array.isArray(val)) {
          // One level of nested objects inside array items
          for (const subKey of Object.keys(val)) {
            if (
              typeof val[subKey] === "string" &&
              val[subKey] !== "" &&
              !isEncrypted(val[subKey])
            ) {
              val[subKey] = encrypt(val[subKey]);
            }
          }
        }
      }
    }
  }

  function encryptMixed(obj, path) {
    const val = obj[path];
    if (val == null) return;
    if (typeof val === "string") {
      if (val !== "" && !isEncrypted(val)) {
        obj[path] = encrypt(val);
      }
      return;
    }
    if (typeof val === "object") {
      encryptObjectDeep(val);
    }
  }

  function encryptObjectDeep(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (
          typeof obj[i] === "string" &&
          obj[i] !== "" &&
          !isEncrypted(obj[i])
        ) {
          obj[i] = encrypt(obj[i]);
        } else if (typeof obj[i] === "object") {
          encryptObjectDeep(obj[i]);
        }
      }
      return;
    }
    for (const key of Object.keys(obj)) {
      if (
        typeof obj[key] === "string" &&
        obj[key] !== "" &&
        !isEncrypted(obj[key])
      ) {
        obj[key] = encrypt(obj[key]);
      } else if (typeof obj[key] === "object") {
        encryptObjectDeep(obj[key]);
      }
    }
  }

  function encryptDoc(doc) {
    for (const f of fields) encryptField(doc, f, false);
    for (const f of deterministicFields) encryptField(doc, f, true);
    for (const p of nestedPaths) encryptNested(doc, p);
    for (const p of arrayPaths) encryptArraySubdocs(doc, p);
    for (const p of mixedPaths) encryptMixed(doc, p);
  }

  function encryptPlainObj(obj) {
    // Same as encryptDoc but for plain JS objects (insertMany)
    encryptDoc(obj);
  }

  function encryptUpdate(update) {
    // Encrypt fields in $set
    if (update.$set) {
      for (const f of fields) {
        if (update.$set[f] !== undefined) encryptField(update.$set, f, false);
      }
      for (const f of deterministicFields) {
        if (update.$set[f] !== undefined) encryptField(update.$set, f, true);
      }
      for (const p of nestedPaths) {
        // Handle dot-notation like 'address.street'
        for (const key of Object.keys(update.$set)) {
          if (
            key.startsWith(p + ".") &&
            typeof update.$set[key] === "string" &&
            update.$set[key] !== "" &&
            !isEncrypted(update.$set[key])
          ) {
            update.$set[key] = encrypt(update.$set[key]);
          }
        }
        if (update.$set[p]) encryptNested(update.$set, p);
      }
      for (const p of mixedPaths) {
        if (update.$set[p] !== undefined) encryptMixed(update.$set, p);
      }
    }
    // Also handle direct field assignments (no $set wrapper)
    for (const f of fields) {
      if (update[f] !== undefined && !f.startsWith("$"))
        encryptField(update, f, false);
    }
    for (const f of deterministicFields) {
      if (update[f] !== undefined && !f.startsWith("$"))
        encryptField(update, f, true);
    }
  }

  // ──────────────────── DECRYPT HELPERS ────────────────────

  function decryptField(obj, path) {
    const val = obj[path];
    if (typeof val !== "string" || !isEncrypted(val)) return;
    try {
      obj[path] = decrypt(val);
    } catch (_) {
      // Leave as-is if decryption fails (e.g., wrong key)
    }
  }

  function decryptNested(obj, basePath) {
    const nested = obj[basePath];
    if (!nested || typeof nested !== "object") return;
    for (const key of Object.keys(nested)) {
      if (typeof nested[key] === "string" && isEncrypted(nested[key])) {
        try {
          nested[key] = decrypt(nested[key]);
        } catch (_) {}
      } else if (
        nested[key] &&
        typeof nested[key] === "object" &&
        !Array.isArray(nested[key])
      ) {
        for (const subKey of Object.keys(nested[key])) {
          if (
            typeof nested[key][subKey] === "string" &&
            isEncrypted(nested[key][subKey])
          ) {
            try {
              nested[key][subKey] = decrypt(nested[key][subKey]);
            } catch (_) {}
          }
        }
      }
    }
  }

  function decryptArraySubdocs(obj, basePath) {
    const arr = obj[basePath];
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      for (const key of Object.keys(item)) {
        const val = item[key];
        if (typeof val === "string" && isEncrypted(val)) {
          try {
            item[key] = decrypt(val);
          } catch (_) {}
        } else if (val && typeof val === "object" && !Array.isArray(val)) {
          for (const subKey of Object.keys(val)) {
            if (typeof val[subKey] === "string" && isEncrypted(val[subKey])) {
              try {
                val[subKey] = decrypt(val[subKey]);
              } catch (_) {}
            }
          }
        }
      }
    }
  }

  function decryptMixed(obj, path) {
    const val = obj[path];
    if (val == null) return;
    if (typeof val === "string" && isEncrypted(val)) {
      try {
        obj[path] = decrypt(val);
      } catch (_) {}
      return;
    }
    if (typeof val === "object") {
      decryptObjectDeep(val);
    }
  }

  function decryptObjectDeep(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === "string" && isEncrypted(obj[i])) {
          try {
            obj[i] = decrypt(obj[i]);
          } catch (_) {}
        } else if (typeof obj[i] === "object") {
          decryptObjectDeep(obj[i]);
        }
      }
      return;
    }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string" && isEncrypted(obj[key])) {
        try {
          obj[key] = decrypt(obj[key]);
        } catch (_) {}
      } else if (typeof obj[key] === "object") {
        decryptObjectDeep(obj[key]);
      }
    }
  }

  function decryptDoc(doc) {
    // Support both Mongoose docs and plain objects
    const obj = doc._doc || doc;
    for (const f of fields) decryptField(obj, f);
    for (const f of deterministicFields) decryptField(obj, f);
    for (const p of nestedPaths) decryptNested(obj, p);
    for (const p of arrayPaths) decryptArraySubdocs(obj, p);
    for (const p of mixedPaths) decryptMixed(obj, p);
  }
}

module.exports = { encryptionPlugin };
