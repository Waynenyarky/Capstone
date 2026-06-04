const express = require("express");
const path = require("path");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { requireJwt, requireRole } = require("../middleware/auth");
const { aiValidationRateLimit } = require("../middleware/rateLimit");
const { sanitizeString } = require("../lib/sanitizer");
const respond = require("../middleware/respond");
const logger = require("../lib/logger");
const {
  LINE_OF_BUSINESS,
} = require("../../../../shared/constants/lineOfBusiness");
const LobRecommendationFeedback = require("../models/LobRecommendationFeedback");

const MAX_DESCRIPTION_LENGTH = 1000;
const ALLOWED_ROLES = ["business_owner", "lgu_officer", "inspector", "admin"];

const router = express.Router();

const MODEL_SERVICE_URL = process.env.LOB_MODEL_SERVICE_URL;

/** Gemini model for LOB classification and help tips. 2.5-flash often has free-tier quota; 2.0-flash may show limit 0. */
const GEMINI_MODEL = process.env.GEMINI_LOB_MODEL || "gemini-2.5-flash";

let dataset = null;
function loadDataset() {
  if (dataset) return dataset;
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "ai",
    "datasets",
    "lob_recommendation_dataset.json",
  );
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    dataset = JSON.parse(raw);
    logger.info("LOB recommendation dataset loaded", {
      entries: dataset.length,
    });
  } catch (err) {
    logger.warn("Failed to load LOB recommendation dataset", {
      error: err.message,
      path: filePath,
    });
    dataset = [];
  }
  return dataset;
}

const VALID_TAX_CODES = new Set(LINE_OF_BUSINESS.map((l) => l.taxCode));
const VALID_DETAILED_LINES = new Map();
for (const lob of LINE_OF_BUSINESS) {
  for (const dl of lob.detailedLines) {
    VALID_DETAILED_LINES.set(`${lob.taxCode}:${dl.toLowerCase()}`, {
      taxCode: lob.taxCode,
      lineOfBusiness: lob.lineOfBusiness,
      detailedLine: dl,
    });
  }
}

function findClosestDetailedLine(taxCode, candidate) {
  if (!candidate) return null;
  const key = `${taxCode}:${candidate.toLowerCase()}`;
  if (VALID_DETAILED_LINES.has(key)) return VALID_DETAILED_LINES.get(key);
  const lob = LINE_OF_BUSINESS.find((l) => l.taxCode === taxCode);
  if (!lob) return null;
  const lower = candidate.toLowerCase();
  const match = lob.detailedLines.find(
    (dl) =>
      dl.toLowerCase().includes(lower) || lower.includes(dl.toLowerCase()),
  );
  if (match) {
    const idx = lob.detailedLines.indexOf(match);
    return {
      taxCode: lob.taxCode,
      lineOfBusiness: lob.lineOfBusiness,
      detailedLine: match,
      psicCode: lob.psicCodes[idx] || "",
    };
  }
  return null;
}

function validateRecommendation(rec) {
  if (!rec || !rec.taxCode) return null;
  const code = String(rec.taxCode).toUpperCase();
  if (!VALID_TAX_CODES.has(code)) return null;
  const lob = LINE_OF_BUSINESS.find((l) => l.taxCode === code);
  if (!lob) return null;

  const closest = findClosestDetailedLine(code, rec.detailedLine);
  if (closest) {
    const idx = lob.detailedLines.indexOf(closest.detailedLine);
    return {
      taxCode: code,
      lineOfBusiness: lob.lineOfBusiness,
      detailedLine: closest.detailedLine,
      psicCode: lob.psicCodes[idx] || rec.psicCode || "",
    };
  }

  return {
    taxCode: code,
    lineOfBusiness: lob.lineOfBusiness,
    detailedLine: rec.detailedLine || lob.detailedLines[0],
    psicCode: rec.psicCode || lob.psicCodes[0] || "",
  };
}

function buildPrompt(userDescription) {
  const data = loadDataset();

  const fewShot = (Array.isArray(data) ? data.slice(0, 20) : [])
    .map((entry) => {
      const recs = (entry.recommendations || [])
        .map(
          (r) =>
            `{ "taxCode": "${r.taxCode}", "lineOfBusiness": "${r.lineOfBusiness}", "detailedLine": "${r.detailedLine}", "psicCode": "${r.psicCode}" }`,
        )
        .join(", ");
      return `Input: "${entry.businessDescription || ""}"\nOutput: [${recs}]`;
    })
    .join("\n\n");

  const taxonomyList = LINE_OF_BUSINESS.map(
    (lob) =>
      `${lob.taxCode} (${lob.lineOfBusiness}): ${lob.detailedLines.join(", ")}`,
  ).join("\n");

  return `You are a Philippine BPLO (Business Permit and Licensing Office) assistant that classifies business descriptions into lines of business.

Given a free-text description of what a business sells or does (which may be in English, Filipino, or mixed), determine the appropriate line(s) of business from the taxonomy below.

TAXONOMY OF VALID TAX CODES AND LINES OF BUSINESS:
${taxonomyList}

RULES:
- Return ONLY a JSON array of objects with keys: taxCode, lineOfBusiness, detailedLine, psicCode
- Each object must use EXACT values from the taxonomy above
- A business may map to multiple lines if it has multiple activities
- If the description clearly matches one or more lines in the taxonomy, return those. If the description does NOT clearly match any line of business in the taxonomy above, return an empty array [] — do not guess or force a match.
- Do NOT add explanation text — return only the JSON array

EXAMPLES:
${fewShot}

Now classify the following:
Input: "${userDescription}"
Output:`;
}

async function tryTrainedModel(description) {
  if (!MODEL_SERVICE_URL) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${MODEL_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessDescription: description,
        minConfidence: 0.18,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      logger.warn("Trained model service returned error", {
        status: res.status,
      });
      return null;
    }
    const data = await res.json();
    if (!data.recommendations || !Array.isArray(data.recommendations)) {
      return null;
    }
    if (data.recommendations.length > 0) {
      return { recommendations: data.recommendations };
    }
    if (data.noConfidentMatch) {
      return {
        recommendations: [],
        message:
          data.message ||
          "Your description doesn't clearly match any of our current lines of business. Please add your line(s) manually below.",
        noConfidentMatch: true,
      };
    }
    return null;
  } catch (err) {
    logger.warn("Trained model service call failed, falling back to Gemini", {
      error: err.message,
    });
    return null;
  }
}

function deduplicateAndValidate(recs) {
  const validated = recs.map(validateRecommendation).filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const rec of validated) {
    const key = `${rec.taxCode}:${rec.detailedLine}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rec);
    }
  }
  return unique;
}

const BUSINESS_KEYWORDS = [
  // Core business verbs (English)
  "sell",
  "selling",
  "operate",
  "operating",
  "run",
  "running",
  "own",
  "owning",
  "provide",
  "providing",
  "offer",
  "offering",
  "supply",
  "supplying",
  "distribute",
  "distributing",
  "manufacture",
  "manufacturing",
  "produce",
  "producing",
  "make",
  "making",
  "process",
  "processing",
  "fabricate",
  "fabricating",
  "assemble",
  "assembling",
  "build",
  "building",
  "construct",
  "constructing",
  "repair",
  "repairing",
  "fix",
  "fixing",
  "install",
  "installing",
  "deliver",
  "delivering",
  "haul",
  "hauling",
  "transport",
  "transporting",
  "rent",
  "renting",
  "lease",
  "leasing",
  "manage",
  "managing",
  "serve",
  "serving",
  "cater",
  "catering",
  "cook",
  "cooking",
  "grow",
  "growing",
  "raise",
  "raising",
  "farm",
  "farming",
  "quarry",
  "quarrying",
  "mine",
  "mining",
  "extract",
  "extracting",
  "deploy",
  "deploying",
  "help",
  "helping",
  "assist",
  "assisting",
  "develop",
  "developing",
  "design",
  "designing",
  "handle",
  "handling",

  // Core business verbs (Filipino)
  "nagbebenta",
  "nagtitinda",
  "nag-aalok",
  "nag-ooperate",
  "nag-susuply",
  "nagluluto",
  "nag-cacater",
  "nag-lalaba",
  "nag-paplantsa",
  "nagkukumpuni",
  "nag-aayos",
  "nag-iinstall",
  "nag-piprint",
  "nag-poproseso",
  "gumagawa",
  "gumugupit",
  "nag-aalaga",
  "nagpapagamot",
  "nagtatanim",
  "nag-aalaga",
  "naghahatid",
  "nagpapaupa",
  "tumutulong",
  "kumukuha",
  "nangongolekta",
  "ginagawang",
  "nagpapatayo",

  // Ownership & possession (English & Filipino)
  "i have",
  "we have",
  "i am",
  "we are",
  "i do",
  "we do",
  "may",
  "kami",
  "ako",
  "mayroon",

  // Business types & establishments (English)
  "store",
  "shop",
  "business",
  "company",
  "firm",
  "agency",
  "center",
  "restaurant",
  "eatery",
  "cafe",
  "bar",
  "bakery",
  "canteen",
  "salon",
  "barbershop",
  "parlor",
  "clinic",
  "hospital",
  "pharmacy",
  "drugstore",
  "hardware",
  "market",
  "mall",
  "factory",
  "plant",
  "mill",
  "workshop",
  "warehouse",
  "office",
  "station",
  "terminal",
  "depot",
  "garage",
  "farm",
  "ranch",
  "fishpond",
  "nursery",
  "plantation",
  "hotel",
  "inn",
  "motel",
  "resort",
  "lodge",
  "pension",
  "school",
  "academy",
  "institute",
  "training",
  "tutorial",
  "bank",
  "lending",
  "pawnshop",
  "remittance",
  "insurance",
  "contractor",
  "builder",
  "developer",
  "broker",
  "dealer",

  // Business types & establishments (Filipino)
  "tindahan",
  "negosyo",
  "kumpanya",
  "ahensya",
  "sentro",
  "karinderia",
  "panaderia",
  "botika",
  "sanglaan",
  "gilingan",
  "pabrika",
  "bodega",
  "garahe",
  "bukid",
  "sakahan",
  "taniman",
  "palayan",
  "paaralan",
  "eskwelahan",
  "ospital",
  "klinika",

  // Business activities & outputs (English)
  "retail",
  "wholesale",
  "service",
  "services",
  "sales",
  "food",
  "goods",
  "products",
  "items",
  "merchandise",
  "wares",
  "materials",
  "supplies",
  "equipment",
  "machinery",
  "tools",
  "construction",
  "building",
  "installation",
  "maintenance",
  "delivery",
  "shipping",
  "logistics",
  "freight",
  "cargo",
  "rental",
  "leasing",
  "property",
  "real estate",
  "advertising",
  "marketing",
  "media",
  "printing",
  "publishing",
  "consulting",
  "consultancy",
  "advisory",
  "accounting",
  "bookkeeping",
  "legal",
  "law",
  "attorney",
  "lawyer",
  "notary",
  "medical",
  "dental",
  "health",
  "veterinary",
  "clinic",
  "security",
  "manpower",
  "recruitment",
  "employment",
  "laundry",
  "cleaning",
  "washing",
  "pressing",
  "transportation",
  "trucking",
  "courier",
  "express",

  // Business activities & outputs (Filipino)
  "serbisyo",
  "pagkain",
  "produkto",
  "gamit",
  "materyales",
  "kagamitan",
  "kasangkapan",
  "paninda",
  "tinda",
  "benta",
  "karne",
  "gulay",
  "isda",
  "manok",
  "baboy",
  "baka",
  "damit",
  "sapatos",
  "cellphone",
  "laptop",
  "gadget",
  "semento",
  "buhangin",
  "gravel",
  "hollow blocks",
  "gamot",
  "vitamins",
  "alahas",
  "prenda",
  "bigas",
  "palay",
  "mais",
  "pataba",
  "binhi",
  "ulam",
  "kanin",
  "tinapay",
  "pandesal",
  "cake",
  "groceries",
  "vegetables",
  "fruits",
  "rice",

  // Professional roles (English)
  "contractor",
  "supplier",
  "distributor",
  "manufacturer",
  "producer",
  "retailer",
  "wholesaler",
  "vendor",
  "merchant",
  "trader",
  "agent",
  "broker",
  "dealer",
  "consultant",
  "specialist",
  "technician",
  "mechanic",
  "electrician",
  "plumber",
  "carpenter",
  "farmer",
  "grower",
  "breeder",
  "fisher",
  "rancher",
  "driver",
  "operator",
  "manager",
  "owner",
  "proprietor",
  "developer",
  "builder",
  "designer",
  "engineer",
  "architect",

  // Professional roles (Filipino)
  "magsasaka",
  "mangingisda",
  "karpintero",
  "mekaniko",
  "drayber",
  "kontraktor",
  "tsuper",
  "barbero",

  // Common business contexts
  "customers",
  "clients",
  "buyers",
  "market",
  "wholesale",
  "bulk",
  "online",
  "delivery",
  "pickup",
  "order",
  "orders",
  "licensed",
  "registered",
  "certified",
  "accredited",
];

/** Vague phrases that don't describe what the business sells or does — reject even if they contain keywords. */
const VAGUE_PHRASE_BLACKLIST = new Set([
  "my business",
  "our business",
  "a business",
  "the business",
  "my company",
  "our company",
  "a company",
  "the company",
  "my store",
  "our store",
  "a store",
  "the store",
  "my shop",
  "our shop",
  "a shop",
  "the shop",
  "my negosyo",
  "our negosyo",
  "negosyo",
  "my tindahan",
  "our tindahan",
  "tindahan",
  "i have a business",
  "we have a business",
  "we run a business",
  "i run a business",
  "i have a company",
  "we have a company",
  "i have a store",
  "we have a store",
  "i have a shop",
  "we have a shop",
  // Generic-only: no specifics about what is sold or done
  "my business sells products",
  "my business sells goods",
  "our business sells products",
  "we sell products",
  "we sell goods",
  "we offer services",
  "i sell products",
  "i sell goods",
  "we have a business that sells products",
  "i have a store that sells things",
  "we offer services to customers",
  "we provide services",
  "we sell things",
  "my business offers services",
  "our company sells products",
  // Filipino equivalents
  "negosyo ko nagbebenta ng produkto",
  "nagtitinda kami ng produkto",
  "nagbebenta kami ng paninda",
  "nag-aalok kami ng serbisyo",
  "negosyo namin nagbebenta ng gamit",
  "tindahan namin nagbebenta ng produkto",
]);

function isLikelyBusinessDescription(description) {
  const lower = description.toLowerCase().trim();
  if (VAGUE_PHRASE_BLACKLIST.has(lower)) {
    return false;
  }

  const multiWordKeywords = BUSINESS_KEYWORDS.filter((k) => k.includes(" "));
  const singleWordKeywords = BUSINESS_KEYWORDS.filter((k) => !k.includes(" "));
  const words = lower.match(/\b[\w-]+\b/g) || [];

  let matchCount = 0;
  if (multiWordKeywords.some((keyword) => lower.includes(keyword))) {
    matchCount++;
  }
  const matchedWords = singleWordKeywords.filter((keyword) =>
    words.includes(keyword),
  );
  matchCount += matchedWords.length;

  return matchCount >= 2;
}

async function askGeminiIsBusinessDescription(description, genAI) {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are checking whether a text is a valid description of what a business sells or does (e.g. products, services, or type of establishment).

Reply YES only if the text clearly describes what the business sells or does. Reply NO for:
- Gibberish, random words, or nonsensical text
- Generic phrases without specifics (e.g. "my business", "our company", "a store", "we have a business", "we run a business")
- Generic phrases that do not specify what is sold or done (e.g. "my business sells products", "we offer services", "we sell goods")
- Code, instructions, or unrelated content
- Jokes, poetry, or clearly off-topic input

Reply with ONLY one word: YES or NO.

Text: "${description}"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim().toUpperCase();

    if (text.includes("NO")) {
      return false;
    }
    return true;
  } catch (err) {
    logger.warn("Gemini gate check failed, assuming valid description", {
      error: err.message,
    });
    return true;
  }
}

/** Returns 1–2 sentence review of the business description, or null on failure. */
async function getGeminiReviewText(description, genAI) {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are a Philippine BPLO assistant. The user submitted a description of their business.

In 1–2 sentences only, either:
- Summarize what the business appears to do (products, services, or type of establishment), or
- Say that the text does not clearly describe a business and they should describe what they sell or do.

Write in a helpful, neutral tone. No lists, no JSON, no bullet points. Plain text only.

Description: "${description}"

Your response:`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    if (text && typeof text === "string") {
      return text.trim().slice(0, 500);
    }
    return null;
  } catch (err) {
    logger.warn("Gemini review failed", { error: err.message });
    return null;
  }
}

/** When Gemini help tip fails (quota, 404, etc.), show this static tip so the user always gets guidance. Use "we" (the system), not "I". */
const FALLBACK_HELP_TIP =
  'We need a bit more detail to suggest the right line of business. Try adding what you sell or do — for example: "sari-sari store selling snacks and drinks" or "restaurant serving Filipino food".';

/** Max wait for Gemini help tip; long enough for very slow connections (e.g. during capstone defense). */
const HELP_TIP_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/** Returns a short, friendly tip on how to improve a vague or unclear description, or null on failure or timeout. Response must use "we" (the system), not "I" or third person. */
async function getGeminiHelpTip(description, genAI) {
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { temperature: 0.7 },
    });
    const prompt = `You are part of a Philippine business permit (BPLO) system. A business owner just entered a description that was too vague to classify.

Your reply MUST do all of the following in 1–2 short sentences:
1. Say that WE (the system) need a bit more detail. Use "we" only (e.g. "We need a bit more detail..." or "Kailangan namin ng mas maraming detalye...").
2. Ask them to add what they sell or do, and give at least ONE concrete example in quotation marks (e.g. "sari-sari store selling snacks and drinks" or "restaurant serving Filipino food").

Do NOT reply with only a thank-you or acknowledgment (e.g. "Salamat sa paglalahad!" or "Thanks for sharing!"). You must give the guidance above. Plain text only, no bullet points or JSON. You may write in English or Tagalog.

User's description: "${description}"

Your reply:`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Help tip timeout")),
        HELP_TIP_TIMEOUT_MS,
      ),
    );
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);
    const response = result.response;
    const text = response.text();
    if (text && typeof text === "string") {
      const trimmed = text.trim();
      // Trust Gemini: use its reply unless it's empty, too short, or a known useless phrase. Prevents fallback overuse.
      const tooShort = trimmed.length < 15;
      const exactThankOnly = [
        "salamat sa paglalahad!",
        "thanks for sharing!",
        "thank you!",
      ].includes(trimmed.toLowerCase());
      if (!tooShort && !exactThankOnly) {
        return trimmed;
      }
      logger.warn(
        "Gemini help tip reply rejected (too short or thank-only), using fallback",
        {
          replyLength: trimmed.length,
          replySnippet: trimmed.slice(0, 120),
        },
      );
      return null;
    }
    return null;
  } catch (err) {
    if (err.message === "Help tip timeout") {
      logger.warn("Gemini help tip timed out, using fallback");
    } else {
      logger.warn("Gemini help tip failed", { error: err.message });
    }
    return null;
  }
}

router.post(
  "/recommend-line-of-business",
  requireJwt,
  requireRole(ALLOWED_ROLES),
  aiValidationRateLimit(),
  async (req, res) => {
    try {
      const { businessDescription } = req.body;

      if (!businessDescription || typeof businessDescription !== "string") {
        return respond.error(
          res,
          400,
          "invalid_input",
          "businessDescription is required and must be a string",
        );
      }

      const sanitized = sanitizeString(businessDescription);
      if (sanitized.length < 10) {
        return respond.error(
          res,
          400,
          "input_too_short",
          "Please provide a more detailed description (at least 10 characters)",
        );
      }
      if (sanitized.length > MAX_DESCRIPTION_LENGTH) {
        return respond.error(
          res,
          400,
          "input_too_long",
          `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
        );
      }

      const apiKeyForGate = process.env.GEMINI_API_KEY;

      /** Message when we return a single conservative suggestion for vague retail-like input. */
      const genericRetailMessage =
        "Your description is general. We've suggested 'General merchandise' — please confirm or add more specific lines below.";

      /** Single conservative recommendation for vague retail-like descriptions (noConfidentMatch but text mentions selling products/goods). */
      const CONSERVATIVE_RETAIL_REC = {
        taxCode: "RET",
        lineOfBusiness: "retail",
        detailedLine: "General merchandise",
        psicCode: "4721",
      };

      /** True if description suggests retail (sell/products/goods) without specifying WHAT is sold — used to offer one conservative rec.
       *  Returns false if the description contains specific product/service/industry words
       *  (e.g. "food", "pagkain", "lutong-bahay", "electronics", "hardware") because those are NOT vague. */
      function isVagueRetailLike(desc) {
        const lower = desc.toLowerCase();
        const hasGenericRetail =
          /\b(sell|selling|products|goods|nagbebenta|nagtitinda|produkto|paninda)\b/.test(
            lower,
          );
        if (!hasGenericRetail) return false;

        // If the description mentions specific products, services, or industries, it is NOT vague
        const specificitySignals =
          /\b(food|pagkain|lutong|luto|ulam|kanin|kain|kainan|karinderya|karinderia|eatery|restaurant|carinderia|snack|merienda|tinapay|pandesal|cake|pastry|bakery|panaderia|coffee|kape|milk tea|drinks|inumin|rice|bigas|gulay|vegetables|fruits|prutas|isda|fish|seafood|karne|meat|manok|chicken|baboy|pork|baka|beef|barbecue|ihaw|grilled|fried|prito|siomai|lumpia|kwek|tusok|fishball|kakanin|halo-halo|lugaw|goto|bulalo|adobo|sinigang|electronics|gadget|cellphone|laptop|hardware|construction|cement|semento|buhangin|gravel|hollow|clothes|damit|shoes|sapatos|pharmacy|gamot|botika|medicine|salon|gupit|haircut|barber|laundry|laba|repair|kumpuni|ayos|farm|bukid|tanim|livestock|manukan|babuyan|plant|nursery|gasoline|fuel|gas|auto|car|vehicle|motor|truck|hauling|delivery|hatid|courier|lending|pautang|pawn|sanglaan|remittance|padala|insurance|real estate|lupa|apartment|boarding|hotel|resort|inn|school|tutorial|training|security|guard|agency|warehouse|bodega|storage|printing|advertising|accounting|legal|medical|dental|veterinary|clinic|hospital)\b/.test(
            lower,
          );
        return !specificitySignals;
      }

      // Phase 1: Heuristic first — reject obvious non–business descriptions (e.g. gibberish) even without API key.
      if (!isLikelyBusinessDescription(sanitized)) {
        logger.info(
          "Input rejected by heuristic (not likely a business description)",
        );
        let message = FALLBACK_HELP_TIP;
        if (apiKeyForGate) {
          const genAI = new GoogleGenerativeAI(apiKeyForGate);
          const customTip = await getGeminiHelpTip(sanitized, genAI);
          if (customTip) message = customTip;
        }
        return respond.ok(res, 200, {
          recommendations: [],
          message,
          geminiReview: null,
        });
      }

      // When GEMINI_API_KEY is set, also run Gemini gate for edge cases the heuristic might miss.
      if (apiKeyForGate) {
        const genAI = new GoogleGenerativeAI(apiKeyForGate);
        const isBusinessDesc = await askGeminiIsBusinessDescription(
          sanitized,
          genAI,
        );
        if (!isBusinessDesc) {
          logger.info(
            "Input rejected by Gemini gate (not a business description)",
          );
          const customTip = await getGeminiHelpTip(sanitized, genAI);
          return respond.ok(res, 200, {
            recommendations: [],
            message: customTip || FALLBACK_HELP_TIP,
            geminiReview: null,
          });
        }
      }

      // Optional: get a short Gemini review to show the user before recommendations (only when key is set).
      let geminiReview = null;
      if (apiKeyForGate) {
        const genAI = new GoogleGenerativeAI(apiKeyForGate);
        geminiReview = await getGeminiReviewText(sanitized, genAI);
      }

      const modelResult = await tryTrainedModel(sanitized);
      if (modelResult) {
        if (modelResult.recommendations.length > 0) {
          const unique = deduplicateAndValidate(modelResult.recommendations);
          if (unique.length > 0) {
            logger.info("LOB recommendation served by trained model", {
              count: unique.length,
            });
            return respond.ok(res, 200, {
              recommendations: unique,
              source: "trained_model",
              geminiReview,
            });
          }
        }
        if (modelResult.noConfidentMatch) {
          // Only suggest "General merchandise" for genuinely vague descriptions
          // (e.g. "nagtitinda kami" with NO product/service specifics).
          // If the description mentions specific products/services, fall through to Gemini instead.
          if (isVagueRetailLike(sanitized)) {
            logger.info(
              "Vague retail-like description: returning single conservative recommendation",
            );
            return respond.ok(res, 200, {
              recommendations: [CONSERVATIVE_RETAIL_REC],
              message: genericRetailMessage,
              geminiReview,
            });
          }
          // Description is specific but model wasn't confident — fall through to Gemini for a better answer
          logger.info(
            "Model not confident on specific description, falling through to Gemini",
          );
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error("GEMINI_API_KEY is not configured");
        return respond.error(
          res,
          503,
          "ai_unavailable",
          "AI service is not configured. Please add your line of business manually.",
        );
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const prompt = buildPrompt(sanitized);

      const result = await model.generateContent(prompt);
      const response = result.response;
      let text;
      try {
        text = response.text();
      } catch (textErr) {
        logger.warn("Gemini response.text() failed (blocked or empty)", {
          error: textErr.message,
        });
        return respond.error(
          res,
          502,
          "ai_parse_error",
          "AI returned an unexpected response. Please try again or add your line of business manually.",
        );
      }
      if (!text || typeof text !== "string") {
        return respond.error(
          res,
          502,
          "ai_parse_error",
          "AI returned an unexpected response. Please try again or add your line of business manually.",
        );
      }

      let parsed;
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found in response");
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        logger.warn("Failed to parse Gemini response", {
          responseLength: text.length,
          error: parseErr.message,
        });
        return respond.error(
          res,
          502,
          "ai_parse_error",
          "AI returned an unexpected response. Please try again or add your line of business manually.",
        );
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        let helpTip = null;
        try {
          helpTip = await getGeminiHelpTip(sanitized, genAI);
        } catch (_) {
          /* ignore */
        }
        return respond.ok(res, 200, {
          recommendations: [],
          message: helpTip || FALLBACK_HELP_TIP,
          geminiReview,
        });
      }

      const unique = deduplicateAndValidate(parsed);
      return respond.ok(res, 200, {
        recommendations: unique,
        source: "gemini",
        geminiReview,
      });
    } catch (err) {
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        logger.warn("Gemini rate limit hit", { error: err.message });
        return respond.error(
          res,
          429,
          "ai_rate_limit",
          "AI service is busy. Please wait a moment and try again, or add your line of business manually.",
        );
      }
      logger.error("AI recommendation failed", {
        error: err.message,
        stack: err.stack,
        name: err.name,
      });
      return respond.error(
        res,
        500,
        "ai_error",
        "Failed to get AI recommendations. Please try again or add your line of business manually.",
      );
    }
  },
);

function validateFeedbackRecommendation(rec) {
  if (!rec || typeof rec.accepted !== "boolean") return null;
  const validated = validateRecommendation(rec);
  if (!validated) return null;
  return {
    taxCode: validated.taxCode,
    lineOfBusiness: validated.lineOfBusiness,
    detailedLine: validated.detailedLine,
    accepted: rec.accepted,
    acceptedWithEdits: rec.acceptedWithEdits === true,
  };
}

router.post(
  "/lob-feedback",
  requireJwt,
  requireRole(ALLOWED_ROLES),
  aiValidationRateLimit(),
  async (req, res) => {
    try {
      const { businessDescription, recommendations } = req.body;

      if (
        !recommendations ||
        !Array.isArray(recommendations) ||
        recommendations.length === 0
      ) {
        return respond.error(
          res,
          400,
          "invalid_input",
          "recommendations is required and must be a non-empty array",
        );
      }

      const items = recommendations
        .map(validateFeedbackRecommendation)
        .filter(Boolean);
      if (items.length === 0) {
        return respond.error(
          res,
          400,
          "invalid_input",
          "Each recommendation must have taxCode, lineOfBusiness, detailedLine, and accepted",
        );
      }

      const description =
        businessDescription && typeof businessDescription === "string"
          ? sanitizeString(businessDescription).slice(0, 500)
          : "";

      const doc = await LobRecommendationFeedback.create({
        businessDescription: description,
        recommendations: items,
        userId: req.user?.id || null,
      });

      logger.info("LOB recommendation feedback recorded", {
        id: doc._id,
        count: items.length,
      });
      return respond.ok(res, 201, { feedbackId: doc._id });
    } catch (err) {
      logger.error("Failed to save LOB feedback", { error: err.message });
      return respond.error(res, 500, "server_error", "Failed to save feedback");
    }
  },
);

module.exports = router;
