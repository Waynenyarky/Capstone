/**
 * Simple Form Definitions Test
 * Basic test to verify FormDefinition model works
 */

const mongoose = require("mongoose");

describe("FormDefinition Simple Test", () => {
  beforeAll(async () => {
    // Connect to existing MongoDB
    await mongoose.connect("mongodb://localhost:27017/capstone");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should connect to MongoDB", async () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("should load FormDefinition model", async () => {
    const FormDefinition = require("../../../services/admin-service/src/models/FormDefinition");
    expect(FormDefinition).toBeDefined();
  });

  it("should create a simple form definition", async () => {
    const FormDefinition = require("../../../services/admin-service/src/models/FormDefinition");

    const testForm = {
      formType: "permit",
      version: "1.0",
      name: "Test Form",
      status: "draft",
      sections: [],
      createdBy: new mongoose.Types.ObjectId(),
      updatedBy: new mongoose.Types.ObjectId(),
    };

    // Just try to create without waiting too long
    const created = await FormDefinition.create(testForm);
    expect(created.formType).toBe("permit");
    expect(created.status).toBe("draft");

    // Clean up
    await FormDefinition.deleteOne({ _id: created._id });
  }, 10000); // 10 second timeout
});
