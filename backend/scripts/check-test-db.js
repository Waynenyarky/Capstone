const mongoose = require("mongoose");

async function checkTestDB() {
  try {
    await mongoose.connect(
      "mongodb+srv://capstone_app:g95fxnwa1wPDdyfA@capstone.efa2aqu.mongodb.net/test?appName=capstone",
    );
    console.log("Connected to: test database");

    const db = mongoose.connection.db;

    // Business owners
    const owners = await db
      .collection("users")
      .find({ "role.slug": "business_owner" })
      .toArray();
    console.log(`\nBusiness Owners (${owners.length}):`);
    owners.forEach((o, i) => {
      console.log(`  ${i + 1}. ${o.firstName} ${o.lastName} - ${o.email}`);
    });

    // Applications
    const apps = await db
      .collection("businessprofiles")
      .aggregate([
        { $unwind: "$businesses" },
        {
          $project: {
            businessName: "$businesses.businessName",
            applicationStatus: "$businesses.applicationStatus",
            submittedAt: "$businesses.submittedAt",
            submittedToLguOfficer: "$businesses.submittedToLguOfficer",
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    console.log(`\nApplications (${apps.length} shown):`);
    apps.forEach((app, i) => {
      console.log(
        `  ${i + 1}. ${app.businessName || "No Name"} - ${app.applicationStatus || "no-status"}`,
      );
      console.log(
        `     Submitted: ${app.submittedAt?.toISOString() || "No date"}`,
      );
      console.log(`     To LGU: ${app.submittedToLguOfficer}`);
      console.log("");
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkTestDB();
