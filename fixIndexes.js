import mongoose from "mongoose";

const runFix = async () => {
  try {
    await mongoose.connect("mongodb+srv://shivanshchaurasiya2004:shivansh%402004@cluster0.1fgiudn.mongodb.net/videotube"); // ✅ Added DB name here

    const db = mongoose.connection.db;
    const indexes = await db.collection("users").indexes();

    console.log("Current Indexes:", indexes);

    const badIndex = indexes.find((idx) => idx.name === "userName_1");
    if (badIndex) {
      await db.collection("users").dropIndex("userName_1");
      console.log("❌ Dropped invalid index: userName_1");
    }

    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    console.log("✅ Created correct index on username");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error fixing index:", error);
    process.exit(1);
  }
};

runFix();
