const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");

let mongoServer;
let app;

const FaqSection = require("../../../services/admin-service/src/models/FaqSection");
const InstructionContent = require("../../../services/admin-service/src/models/InstructionContent");
const User = require("../../../services/admin-service/src/models/User");
const Role = require("../../../services/admin-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/admin-service/src/middleware/auth");

let adminToken;
let admin;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
  process.env.DISABLE_CSRF = "true";

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const adminMongoose =
    require("../../../services/admin-service/src/models/Role").base;
  await adminMongoose.connect(uri);

  try {
    const authMongoose =
      require("../../../services/auth-service/src/models/Role").base;
    if (authMongoose && authMongoose.connection.readyState === 0) {
      await authMongoose.connect(uri);
    }
  } catch (_) {
    // ignore if auth-service path isn't available
  }

  const adminService = require("../../../services/admin-service/src/index");
  app = adminService.app;

  const adminRole = await Role.findOneAndUpdate(
    { slug: "admin" },
    { name: "Admin", slug: "admin" },
    { upsert: true, new: true },
  );

  admin = await User.create({
    role: adminRole._id,
    firstName: "Admin",
    lastName: "User",
    email: `cms_test_${Date.now()}@test.com`,
    username: `cms_test_${Date.now()}`,
    phoneNumber: `+6390000000${Math.floor(Math.random() * 1000)}`,
    passwordHash: await bcrypt.hash("Admin123!", 10),
    termsAccepted: true,
    isActive: true,
  });

  adminToken = signAccessToken({ _id: admin._id, role: adminRole }).token;
});

afterAll(async () => {
  const adminMongoose =
    require("../../../services/admin-service/src/models/Role").base;
  await adminMongoose.disconnect();
  try {
    const authMongoose =
      require("../../../services/auth-service/src/models/Role").base;
    if (authMongoose && authMongoose.connection.readyState !== 0) {
      await authMongoose.disconnect();
    }
  } catch (_) {}
  await mongoServer.stop();
});

beforeEach(async () => {
  await FaqSection.deleteMany({ slotId: /^test-/ });
  await InstructionContent.deleteMany({ slotId: /^test-/ });
});

describe("CMS Routes", () => {
  describe("Public FAQ Routes", () => {
    test("GET /api/cms/faq/:slotId should return FAQ section", async () => {
      await FaqSection.create({
        slotId: "test-public-faq",
        title: "Test FAQ",
        subtitle: "Test subtitle",
        items: [
          { key: "1", question: "Test Q1", answer: "Test A1" },
          { key: "2", question: "Test Q2", answer: "Test A2" },
        ],
      });

      const res = await request(app).get("/api/cms/faq/test-public-faq");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("slotId", "test-public-faq");
      expect(res.body).toHaveProperty("items");
      expect(res.body.items).toHaveLength(2);
    });

    test("GET /api/cms/faq/:slotId should return 404 for non-existent slot", async () => {
      const res = await request(app).get("/api/cms/faq/non-existent");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("Public Instruction Routes", () => {
    test("GET /api/cms/instructions/:slotId should return instruction content", async () => {
      await InstructionContent.create({
        slotId: "test-public-instruction",
        title: "Test Instruction",
        description: "Test description",
        bulletPoints: [{ title: "BP1", content: "Content 1" }],
        faqItems: [{ key: "1", question: "Test Q", answer: "Test A" }],
      });

      const res = await request(app).get(
        "/api/cms/instructions/test-public-instruction",
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("slotId", "test-public-instruction");
      expect(res.body).toHaveProperty("description");
    });

    test("GET /api/cms/instructions/:slotId should return 404 for non-existent slot", async () => {
      const res = await request(app).get("/api/cms/instructions/non-existent");
      expect(res.status).toBe(404);
    });
  });

  describe("Admin FAQ Routes", () => {
    beforeEach(async () => {
      await FaqSection.create({
        slotId: "test-admin-faq",
        title: "Test Admin FAQ",
        items: [
          { key: "1", question: "Q1", answer: "A1" },
          { key: "2", question: "Q2", answer: "A2" },
        ],
      });
    });

    test("GET /api/admin/cms/faq should list all FAQ sections", async () => {
      const res = await request(app)
        .get("/api/admin/cms/faq")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("PUT /api/admin/cms/faq/:slotId should update FAQ items", async () => {
      const updatedItems = [
        { key: "1", question: "Updated Q1", answer: "Updated A1" },
        { key: "2", question: "Updated Q2", answer: "Updated A2" },
      ];
      const res = await request(app)
        .put("/api/admin/cms/faq/test-admin-faq?publish=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ items: updatedItems });
      expect(res.status).toBe(200);
      expect(res.body.items[0].question).toBe("Updated Q1");
    });

    test("PUT /api/admin/cms/faq/:slotId should save draft without publish", async () => {
      const draftItems = [
        { key: "1", question: "Draft Q1", answer: "Draft A1" },
        { key: "2", question: "Draft Q2", answer: "Draft A2" },
      ];
      const res = await request(app)
        .put("/api/admin/cms/faq/test-admin-faq")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ items: draftItems });
      expect(res.status).toBe(200);
      expect(res.body.draftData).toBeDefined();
      expect(res.body.draftData.items[0].question).toBe("Draft Q1");
    });
  });

  describe("Admin Instruction Routes", () => {
    beforeEach(async () => {
      await InstructionContent.create({
        slotId: "test-admin-instruction",
        title: "Test Admin Instruction",
        description: "Original description",
        bulletPoints: [],
        faqItems: [],
      });
    });

    test("GET /api/admin/cms/instructions should list all instructions", async () => {
      const res = await request(app)
        .get("/api/admin/cms/instructions")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("PUT /api/admin/cms/instructions/:slotId should update instruction content", async () => {
      const res = await request(app)
        .put("/api/admin/cms/instructions/test-admin-instruction?publish=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ description: "Updated description" });
      expect(res.status).toBe(200);
      expect(res.body.description).toBe("Updated description");
    });

    test("PUT /api/admin/cms/instructions/:slotId should update bullet points", async () => {
      const bulletPoints = [{ title: "New BP", content: "New content" }];
      const res = await request(app)
        .put("/api/admin/cms/instructions/test-admin-instruction?publish=true")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ bulletPoints });
      expect(res.status).toBe(200);
      expect(res.body.bulletPoints).toHaveLength(1);
    });

    test("PUT /api/admin/cms/instructions/:slotId should save draft without publish", async () => {
      const res = await request(app)
        .put("/api/admin/cms/instructions/test-admin-instruction")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ description: "Draft description" });
      expect(res.status).toBe(200);
      expect(res.body.draftData).toBeDefined();
      expect(res.body.draftData.description).toBe("Draft description");
    });

    test("PUT /api/admin/cms/instructions/:slotId should return 404 for non-existent slot", async () => {
      const res = await request(app)
        .put("/api/admin/cms/instructions/non-existent")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ description: "Test" });
      expect(res.status).toBe(404);
    });
  });
});
