/**
 * Payments visibility regression tests
 */

const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;

const Payment = require("../../../services/business-service/src/models/Payment");
const BusinessProfile = require("../../../services/business-service/src/models/BusinessProfile");
const User = require("../../../services/business-service/src/models/User");
const Role = require("../../../services/business-service/src/models/Role");
const {
  signAccessToken,
} = require("../../../services/business-service/src/middleware/auth");

let ownerToken;
let ownerId;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const bsMongoose =
    require("../../../services/business-service/src/models/Role").base;
  await bsMongoose.connect(uri);

  const businessService = require("../../../services/business-service/src/index");
  app = businessService.app;

  const ownerRole = await Role.findOneAndUpdate(
    { slug: "business_owner" },
    { name: "Business Owner", slug: "business_owner" },
    { upsert: true, new: true },
  );

  const bcrypt = require("bcryptjs");
  const owner = await User.create({
    role: ownerRole._id,
    firstName: "Owner",
    lastName: "Payments",
    email: `owner_payments_${Date.now()}@test.com`,
    phoneNumber: `__unset__payments_${Date.now()}`,
    passwordHash: await bcrypt.hash("Test123!@#", 10),
    termsAccepted: true,
    tokenVersion: 0,
  });

  ownerId = String(owner._id);
  ownerToken = signAccessToken({ ...owner.toObject(), role: ownerRole }).token;
});

afterAll(async () => {
  const bsMongoose =
    require("../../../services/business-service/src/models/Role").base;
  await bsMongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Payment.deleteMany({});
  await BusinessProfile.deleteMany({});
});

describe("Payments alias lookup", () => {
  it("returns payments stored using business subdocument _id when queried by business.businessId", async () => {
    const profile = await BusinessProfile.create({
      userId: ownerId,
      businesses: [
        {
          businessId: "BIZ-001",
          businessName: "Alias Test Business",
          businessRegistrationNumber: "BRN-001",
        },
      ],
    });

    const businessSubdocId = String(profile.businesses[0]._id);

    await Payment.create({
      paymentId: `PAY-${Date.now()}-A`,
      userId: ownerId,
      businessId: businessSubdocId,
      businessProfileId: profile._id,
      paymentType: "registration_fee",
      description: "Mayor's Permit Fee",
      amount: 1200,
      status: "pending",
    });

    const res = await request(app)
      .get("/api/business/payments?businessId=BIZ-001")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].businessId).toBe(businessSubdocId);
  });

  it("returns payments stored using business.businessId when queried by business subdocument _id", async () => {
    const profile = await BusinessProfile.create({
      userId: ownerId,
      businesses: [
        {
          businessId: "BIZ-002",
          businessName: "Alias Test Business 2",
          businessRegistrationNumber: "BRN-002",
        },
      ],
    });

    const businessSubdocId = String(profile.businesses[0]._id);

    await Payment.create({
      paymentId: `PAY-${Date.now()}-B`,
      userId: ownerId,
      businessId: "BIZ-002",
      businessProfileId: profile._id,
      paymentType: "registration_fee",
      description: "Sanitary Fee",
      amount: 900,
      status: "pending",
    });

    const res = await request(app)
      .get(`/api/business/payments?businessId=${businessSubdocId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].businessId).toBe("BIZ-002");
  });
});
