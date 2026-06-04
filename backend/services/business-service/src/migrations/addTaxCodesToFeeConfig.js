const FEE_TAXONOMY = require("../../../../shared/constants/feeTaxonomy");
const FeeConfiguration = require("../models/FeeConfiguration");

async function migrate() {
  for (const entry of FEE_TAXONOMY) {
    const result = await FeeConfiguration.updateMany(
      {
        lineOfBusiness: { $regex: new RegExp(`^${entry.label}$`, "i") },
        taxCode: { $in: [null, ""] },
      },
      { $set: { taxCode: entry.taxCode } },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `  Updated ${result.modifiedCount} ${entry.label} -> ${entry.taxCode}`,
      );
    }
  }
  console.log("Migration complete: taxCodes added to FeeConfiguration");
}

module.exports = { migrate };
