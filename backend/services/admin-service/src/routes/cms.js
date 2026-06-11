const express = require("express");
const FaqSection = require("../models/FaqSection");
const InstructionContent = require("../models/InstructionContent");
const PageContent = require("../models/PageContent");
const PageChapter = require("../models/PageChapter");
const AuditLog = require("../models/AuditLog");
const { requireJwt } = require("../middleware/auth");
const logger = require("../lib/logger");
const { createAuditLog } = require("../lib/auditLogger");

const VALID_PAGE_SLOT_IDS = ["privacy-policy", "terms-of-service", "bizclear-manual"];

// ─── Public router (mounted at /api/cms) ────────────────────────────────────────
const publicRouter = express.Router();

// GET /api/cms/faq/:slotId — public fetch of FAQ section
publicRouter.get("/faq/:slotId", async (req, res) => {
  try {
    const doc = await FaqSection.findOne({ slotId: req.params.slotId }).lean();
    if (!doc) return res.status(404).json({ error: "FAQ section not found" });
    // Return published data if available and has content, otherwise fallback to main fields
    const hasPublishedData =
      doc.isPublished &&
      doc.publishedData &&
      (doc.publishedData.subtitle ||
        (doc.publishedData.items && doc.publishedData.items.length > 0));
    const responseData = hasPublishedData
      ? {
          ...doc,
          subtitle: doc.publishedData.subtitle,
          items: doc.publishedData.items,
        }
      : { ...doc, subtitle: doc.subtitle, items: doc.items };
    return res.json(responseData);
  } catch (err) {
    logger.error("GET /api/cms/faq/:slotId failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cms/instructions/:slotId — public fetch of instruction content
publicRouter.get("/instructions/:slotId", async (req, res) => {
  try {
    const doc = await InstructionContent.findOne({
      slotId: req.params.slotId,
    }).lean();
    if (!doc)
      return res.status(404).json({ error: "Instruction content not found" });
    // Return published data if available and has content, otherwise fallback to main fields
    const hasPublishedData =
      doc.isPublished &&
      doc.publishedData &&
      (doc.publishedData.description ||
        (doc.publishedData.bulletPoints &&
          doc.publishedData.bulletPoints.length > 0) ||
        (doc.publishedData.faqItems && doc.publishedData.faqItems.length > 0));
    const responseData = hasPublishedData
      ? {
          ...doc,
          description: doc.publishedData.description,
          bulletPoints: doc.publishedData.bulletPoints,
          faqItems: doc.publishedData.faqItems,
        }
      : {
          ...doc,
          description: doc.description,
          bulletPoints: doc.bulletPoints,
          faqItems: doc.faqItems,
        };
    return res.json(responseData);
  } catch (err) {
    logger.error("GET /api/cms/instructions/:slotId failed", {
      error: err.message,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cms/pages/:slotId — public fetch of page content (chapter-based)
publicRouter.get("/pages/:slotId", async (req, res) => {
  try {
    const { slotId } = req.params;

    // Try chapter-based content first
    const chapters = await PageChapter.find({ pageSlotId: slotId })
      .sort({ order: 1 })
      .lean();

    if (chapters.length > 0) {
      // Return published chapter data
      const publishedChapters = chapters
        .filter((ch) => ch.isPublished)
        .map((ch) => {
          const data = ch.publishedData || {};
          return {
            _id: ch._id,
            order: ch.order,
            title: data.title || ch.title,
            description: data.description || ch.description,
            introText: data.introText || ch.introText,
            sections: data.sections || ch.sections,
          };
        });
      return res.json({ slotId, chapters: publishedChapters });
    }

    // Fallback to legacy single-document PageContent
    const doc = await PageContent.findOne({ slotId }).lean();
    if (!doc) return res.status(404).json({ error: "Page content not found" });
    const hasPublishedData =
      doc.isPublished &&
      doc.publishedData &&
      (doc.publishedData.introText ||
        (doc.publishedData.sections && doc.publishedData.sections.length > 0));
    const responseData = hasPublishedData
      ? {
          ...doc,
          introText: doc.publishedData.introText,
          sections: doc.publishedData.sections,
        }
      : { ...doc, introText: doc.introText, sections: doc.sections };
    return res.json(responseData);
  } catch (err) {
    logger.error("GET /api/cms/pages/:slotId failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin router (mounted at /api/admin/cms) ──────────────────────────────────
const adminRouter = express.Router();

// GET /api/admin/cms/faq — list all FAQ sections
adminRouter.get("/faq", requireJwt, async (req, res) => {
  try {
    const docs = await FaqSection.find().sort({ slotId: 1 }).lean();
    // Return draft data for editing, fallback to main fields if draftData is empty
    const responseData = docs.map((doc) => {
      const hasDraftData =
        doc.draftData &&
        (doc.draftData.subtitle ||
          (doc.draftData.items && doc.draftData.items.length > 0));
      return {
        ...doc,
        subtitle: hasDraftData ? doc.draftData.subtitle : doc.subtitle,
        items: hasDraftData ? doc.draftData.items : doc.items,
      };
    });
    return res.json(responseData);
  } catch (err) {
    logger.error("GET /api/admin/cms/faq failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/cms/faq/:slotId — update FAQ section items (edit only, no create/delete slots)
adminRouter.put("/faq/:slotId", requireJwt, async (req, res) => {
  try {
    const { items, subtitle } = req.body;
    const { publish = false } = req.query;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }

    const doc = await FaqSection.findOne({ slotId: req.params.slotId });
    if (!doc) return res.status(404).json({ error: "FAQ section not found" });

    // Validate each item has question and answer
    for (const item of items) {
      if (!item.question || !item.answer) {
        return res
          .status(400)
          .json({ error: "Each item must have a question and answer" });
      }
    }

    if (publish) {
      // Publish: save to publishedData and set isPublished=true
      const previousState = { ...doc.toObject() };
      doc.publishedData = { subtitle, items };
      doc.isPublished = true;
      doc.subtitle = subtitle;
      doc.items = items;
      doc.updatedBy = req._userId;
      await doc.save();

      // Create audit log for publish
      const newState = doc.toObject();
      const changedFields = [];
      if (
        JSON.stringify(previousState.items) !== JSON.stringify(newState.items)
      )
        changedFields.push("items");
      if (previousState.subtitle !== newState.subtitle)
        changedFields.push("subtitle");

      createAuditLog(
        req._userId,
        "faq_updated",
        null,
        JSON.stringify(previousState),
        JSON.stringify(newState),
        "admin",
        {
          slotId: doc.slotId,
          contentType: "faq",
          changedFields,
        },
        doc.slotId,
      ).catch((err) =>
        logger.warn("Failed to create audit log for FAQ update", {
          error: err.message,
        }),
      );
    } else {
      // Draft: save to draftData only
      doc.draftData = { subtitle, items };
      doc.updatedBy = req._userId;
      await doc.save();
    }

    return res.json(doc.toObject());
  } catch (err) {
    logger.error("PUT /api/admin/cms/faq/:slotId failed", {
      error: err.message,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/cms/instructions — list all instruction slots
adminRouter.get("/instructions", requireJwt, async (req, res) => {
  try {
    const docs = await InstructionContent.find().sort({ slotId: 1 }).lean();
    // Return draft data for editing, fallback to main fields if draftData is empty
    const responseData = docs.map((doc) => {
      const hasDraftData =
        doc.draftData &&
        (doc.draftData.description ||
          (doc.draftData.bulletPoints &&
            doc.draftData.bulletPoints.length > 0) ||
          (doc.draftData.faqItems && doc.draftData.faqItems.length > 0));
      return {
        ...doc,
        description: hasDraftData ? doc.draftData.description : doc.description,
        bulletPoints: hasDraftData
          ? doc.draftData.bulletPoints
          : doc.bulletPoints,
        faqItems: hasDraftData ? doc.draftData.faqItems : doc.faqItems,
      };
    });
    return res.json(responseData);
  } catch (err) {
    logger.error("GET /api/admin/cms/instructions failed", {
      error: err.message,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/cms/instructions/:slotId — fetch single instruction by slotId
adminRouter.get("/instructions/:slotId", requireJwt, async (req, res) => {
  try {
    const doc = await InstructionContent.findOne({
      slotId: req.params.slotId,
    }).lean();
    if (!doc)
      return res.status(404).json({ error: "Instruction content not found" });
    // Return draft data for editing, fallback to main fields if draftData is empty
    const hasDraftData =
      doc.draftData &&
      (doc.draftData.description ||
        (doc.draftData.bulletPoints && doc.draftData.bulletPoints.length > 0) ||
        (doc.draftData.faqItems && doc.draftData.faqItems.length > 0));
    const responseData = {
      ...doc,
      description: hasDraftData ? doc.draftData.description : doc.description,
      bulletPoints: hasDraftData
        ? doc.draftData.bulletPoints
        : doc.bulletPoints,
      faqItems: hasDraftData ? doc.draftData.faqItems : doc.faqItems,
    };
    return res.json(responseData);
  } catch (err) {
    logger.error("GET /api/admin/cms/instructions/:slotId failed", {
      error: err.message,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/cms/instructions/:slotId — update instruction content (edit only)
adminRouter.put("/instructions/:slotId", requireJwt, async (req, res) => {
  try {
    logger.info("PUT /api/admin/cms/instructions/:slotId called", {
      slotId: req.params.slotId,
      userId: req._userId,
    });

    const { description, bulletPoints, faqItems } = req.body;
    const { publish = false } = req.query;

    const doc = await InstructionContent.findOne({ slotId: req.params.slotId });
    if (!doc)
      return res.status(404).json({ error: "Instruction content not found" });

    if (bulletPoints !== undefined && !Array.isArray(bulletPoints)) {
      return res.status(400).json({ error: "bulletPoints must be an array" });
    }
    if (faqItems !== undefined && !Array.isArray(faqItems)) {
      return res.status(400).json({ error: "faqItems must be an array" });
    }

    if (publish) {
      // Publish: save to publishedData and set isPublished=true
      const previousState = { ...doc.toObject() };
      doc.publishedData = { description, bulletPoints, faqItems };
      doc.isPublished = true;
      doc.description = description;
      doc.bulletPoints = bulletPoints;
      doc.faqItems = faqItems;
      doc.updatedBy = req._userId;
      await doc.save();

      logger.info("Instruction published successfully", { slotId: doc.slotId });

      // Create audit log for publish
      const newState = doc.toObject();
      const changedFields = [];
      if (previousState.description !== newState.description)
        changedFields.push("description");
      if (
        JSON.stringify(previousState.bulletPoints) !==
        JSON.stringify(newState.bulletPoints)
      )
        changedFields.push("bulletPoints");
      if (
        JSON.stringify(previousState.faqItems) !==
        JSON.stringify(newState.faqItems)
      )
        changedFields.push("faqItems");

      logger.info("Creating audit log for instruction update", {
        slotId: doc.slotId,
        userId: req._userId,
        changedFields,
      });

      const auditResult = await createAuditLog(
        req._userId,
        "instruction_updated",
        null,
        JSON.stringify(previousState),
        JSON.stringify(newState),
        "admin",
        {
          slotId: doc.slotId,
          contentType: "instruction",
          changedFields,
        },
        doc.slotId,
      );

      if (auditResult) {
        logger.info("Audit log created successfully", {
          auditId: auditResult._id,
        });
      } else {
        logger.warn("Audit log creation returned null");
      }
    } else {
      // Draft: save to draftData only
      doc.draftData = { description, bulletPoints, faqItems };
      doc.updatedBy = req._userId;
      await doc.save();
      logger.info("Instruction draft saved successfully", {
        slotId: doc.slotId,
      });
    }

    return res.json(doc.toObject());
  } catch (err) {
    logger.error("PUT /api/admin/cms/instructions/:slotId failed", {
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/cms/pages — list chapters (query: ?pageSlotId=privacy-policy)
adminRouter.get("/pages", requireJwt, async (req, res) => {
  try {
    const { pageSlotId } = req.query;

    // If pageSlotId specified, return chapters for that page
    if (pageSlotId && VALID_PAGE_SLOT_IDS.includes(pageSlotId)) {
      const chapters = await PageChapter.find({ pageSlotId })
        .sort({ order: 1 })
        .lean();
      // Return draft data for editing
      const responseData = chapters.map((ch) => {
        const draft = ch.draftData;
        return {
          ...ch,
          title: draft?.title || ch.title,
          description: draft?.description || ch.description,
          introText: draft?.introText || ch.introText,
          sections: draft?.sections || ch.sections,
        };
      });
      return res.json(responseData);
    }

    // Legacy: return all PageContent docs (for backwards compat)
    const docs = await PageContent.find().sort({ slotId: 1 }).lean();
    const responseData = docs.map((doc) => {
      const hasDraftData =
        doc.draftData &&
        (doc.draftData.introText ||
          (doc.draftData.sections && doc.draftData.sections.length > 0));
      return {
        ...doc,
        introText: hasDraftData ? doc.draftData.introText : doc.introText,
        sections: hasDraftData ? doc.draftData.sections : doc.sections,
      };
    });
    return res.json(responseData);
  } catch (err) {
    logger.error("GET /api/admin/cms/pages failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/cms/pages — create a new chapter
adminRouter.post("/pages", requireJwt, async (req, res) => {
  try {
    const { pageSlotId, title, description } = req.body;
    if (!pageSlotId || !VALID_PAGE_SLOT_IDS.includes(pageSlotId)) {
      return res.status(400).json({ error: "Invalid pageSlotId" });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Determine next order value
    const maxOrder = await PageChapter.findOne({ pageSlotId })
      .sort({ order: -1 })
      .select("order")
      .lean();
    const nextOrder = (maxOrder?.order ?? -1) + 1;

    const chapter = await PageChapter.create({
      pageSlotId,
      order: nextOrder,
      title: title.trim(),
      description: description?.trim() || "",
      introText: "",
      sections: [],
      isPublished: false,
      updatedBy: req._userId,
    });

    return res.status(201).json(chapter.toObject());
  } catch (err) {
    logger.error("POST /api/admin/cms/pages failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/cms/pages/:id — update a chapter
adminRouter.put("/pages/:id", requireJwt, async (req, res) => {
  try {
    const { title, description, introText, sections } = req.body;
    const { publish } = req.query;
    const isPublish = publish === "true";

    const doc = await PageChapter.findById(req.params.id);
    if (!doc) {
      // Fallback: try legacy PageContent by slotId
      const legacyDoc = await PageContent.findOne({ slotId: req.params.id });
      if (!legacyDoc)
        return res.status(404).json({ error: "Chapter not found" });

      // Handle legacy update
      if (sections !== undefined && !Array.isArray(sections)) {
        return res.status(400).json({ error: "sections must be an array" });
      }
      if (isPublish) {
        const previousState = { ...legacyDoc.toObject() };
        legacyDoc.publishedData = { introText, sections };
        legacyDoc.isPublished = true;
        legacyDoc.introText = introText;
        legacyDoc.sections = sections;
        legacyDoc.updatedBy = req._userId;
        await legacyDoc.save();
        const newState = legacyDoc.toObject();
        createAuditLog(
          req._userId,
          "page_updated",
          null,
          JSON.stringify(previousState),
          JSON.stringify(newState),
          "admin",
          { slotId: legacyDoc.slotId, contentType: "page", changedFields: ["sections"] },
          legacyDoc.slotId,
        ).catch(() => {});
      } else {
        legacyDoc.draftData = { introText, sections };
        legacyDoc.updatedBy = req._userId;
        await legacyDoc.save();
      }
      return res.json(legacyDoc.toObject());
    }

    if (sections !== undefined && !Array.isArray(sections)) {
      return res.status(400).json({ error: "sections must be an array" });
    }

    const updatedData = {
      title: title !== undefined ? title.trim() : doc.title,
      description: description !== undefined ? description.trim() : doc.description,
      introText: introText !== undefined ? introText : doc.introText,
      sections: sections !== undefined ? sections : doc.sections,
    };

    if (isPublish) {
      const previousState = { ...doc.toObject() };
      doc.title = updatedData.title;
      doc.description = updatedData.description;
      doc.introText = updatedData.introText;
      doc.sections = updatedData.sections;
      doc.publishedData = { ...updatedData };
      doc.isPublished = true;
      doc.updatedBy = req._userId;
      await doc.save();

      const newState = doc.toObject();
      const changedFields = [];
      if (previousState.title !== newState.title) changedFields.push("title");
      if (previousState.description !== newState.description) changedFields.push("description");
      if (previousState.introText !== newState.introText) changedFields.push("introText");
      if (JSON.stringify(previousState.sections) !== JSON.stringify(newState.sections))
        changedFields.push("sections");

      createAuditLog(
        req._userId,
        "page_updated",
        null,
        JSON.stringify(previousState),
        JSON.stringify(newState),
        "admin",
        {
          slotId: `${doc.pageSlotId}:${doc._id}`,
          contentType: "page_chapter",
          changedFields,
        },
        `${doc.pageSlotId}:${doc._id}`,
      ).catch((err) =>
        logger.warn("Failed to create audit log for chapter update", {
          error: err.message,
        }),
      );
    } else {
      doc.draftData = { ...updatedData };
      doc.updatedBy = req._userId;
      await doc.save();
    }

    return res.json(doc.toObject());
  } catch (err) {
    logger.error("PUT /api/admin/cms/pages/:id failed", {
      error: err.message,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/cms/pages/:id — delete a chapter
adminRouter.delete("/pages/:id", requireJwt, async (req, res) => {
  try {
    const doc = await PageChapter.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Chapter not found" });

    // Re-order remaining chapters
    const remaining = await PageChapter.find({ pageSlotId: doc.pageSlotId }).sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i) {
        remaining[i].order = i;
        await remaining[i].save();
      }
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/admin/cms/pages/:id failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/cms/pages/reorder — reorder chapters
adminRouter.patch("/pages/reorder", requireJwt, async (req, res) => {
  try {
    const { pageSlotId, orderedIds } = req.body;
    if (!pageSlotId || !VALID_PAGE_SLOT_IDS.includes(pageSlotId)) {
      return res.status(400).json({ error: "Invalid pageSlotId" });
    }
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: "orderedIds must be an array" });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, pageSlotId },
        update: { $set: { order: index } },
      },
    }));
    await PageChapter.bulkWrite(bulkOps);

    const updated = await PageChapter.find({ pageSlotId }).sort({ order: 1 }).lean();
    return res.json(updated);
  } catch (err) {
    logger.error("PATCH /api/admin/cms/pages/reorder failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Legacy: PUT /api/admin/cms/pages/legacy/:slotId — update old PageContent (kept for migration)
adminRouter.put("/pages/legacy/:slotId", requireJwt, async (req, res) => {
  try {
    const { introText, sections } = req.body;
    const { publish = false } = req.query;

    const doc = await PageContent.findOne({ slotId: req.params.slotId });
    if (!doc) return res.status(404).json({ error: "Page content not found" });

    if (sections !== undefined && !Array.isArray(sections)) {
      return res.status(400).json({ error: "sections must be an array" });
    }

    if (publish) {
      doc.publishedData = { introText, sections };
      doc.isPublished = true;
      doc.introText = introText;
      doc.sections = sections;
      doc.updatedBy = req._userId;
      await doc.save();
    } else {
      doc.draftData = { introText, sections };
      doc.updatedBy = req._userId;
      await doc.save();
    }

    return res.json(doc.toObject());
  } catch (err) {
    logger.error("PUT /api/admin/cms/pages/legacy/:slotId failed", { error: err.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/cms/audit/:slotId — fetch audit logs for a specific CMS slot
adminRouter.get("/audit/:slotId", requireJwt, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    logger.info("GET /api/admin/cms/audit/:slotId called", {
      slotId,
      page,
      limit,
    });

    const skip = (page - 1) * limit;

    const filter = {
      slotId,
      eventType: {
        $in: ["faq_updated", "instruction_updated", "page_updated"],
      },
    };
    logger.info("Query filter before find", { filter });

    const logs = await AuditLog.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    logger.info("Query result", { count: logs.length });

    const total = await AuditLog.countDocuments(filter);

    logger.info("Total count", { total });

    return res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("GET /api/admin/cms/audit/:slotId failed", {
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = { publicRouter, adminRouter };
