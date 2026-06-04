const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const FormDefinition = require("./src/models/FormDefinition");
const FormGroup = require("./src/models/FormGroup");

// Import the updated sections from seedFormDefinitions
const {
  unifiedBusinessPermitSections,
} = require("./src/migrations/seedFormDefinitions");

async function updateAccreditationSection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/capstone_project",
    );
    console.log("Connected to MongoDB");

    // Find the active permit form definition
    const permitForm = await FormDefinition.findOne({
      formType: "permit",
      industryScope: "all",
      status: "published",
    }).sort({ version: -1 });

    if (!permitForm) {
      console.log("No active permit form found");
      return;
    }

    console.log(
      "Found permit form:",
      permitForm.name,
      "version:",
      permitForm.version,
    );

    // Find the accreditation section and update it
    const accreditationSectionIndex = permitForm.sections.findIndex(
      (section) => section.category === "Accreditation / License",
    );

    if (accreditationSectionIndex === -1) {
      console.log("Accreditation section not found");
      return;
    }

    // Get the updated accreditation section from the seed data
    const updatedAccreditationSection = unifiedBusinessPermitSections.find(
      (section) => section.category === "Accreditation / License",
    );

    if (!updatedAccreditationSection) {
      console.log("Updated accreditation section not found in seed data");
      return;
    }

    // Update the section
    permitForm.sections[accreditationSectionIndex] =
      updatedAccreditationSection;
    permitForm.updatedAt = new Date();
    permitForm.updatedBy = "system_update";

    await permitForm.save();
    console.log("✅ Accreditation section updated successfully!");

    console.log("Updated fields:");
    const groupFields = updatedAccreditationSection.items[0].groupFields;
    groupFields.forEach((field) => {
      console.log(
        `- ${field.label}: ${field.type}${field.dropdownOptions ? ` with ${field.dropdownOptions.length} options` : ""}`,
      );
    });
  } catch (error) {
    console.error("Update failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

if (require.main === module) {
  updateAccreditationSection();
}

module.exports = { updateAccreditationSection };
