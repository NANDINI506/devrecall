const Subject = require("../models/Subject");
const subjects = require("./subjects");

// Seeds or upgrades starter subjects with full in-depth interview curriculum
async function seedSubjects() {
  let updated = 0;
  for (const s of subjects) {
    const existing = await Subject.findOne({ slug: s.slug });
    if (!existing) {
      await Subject.create({ ...s, isCustom: false });
      updated++;
    } else {
      // Upgrade existing starter subjects to the comprehensive topics, Q&A, and references
      existing.name = s.name;
      existing.icon = s.icon;
      existing.color = s.color;
      existing.description = s.description;
      existing.topics = s.topics;
      await existing.save();
      updated++;
    }
  }
  console.log(`🌱 Synced ${updated} master starter subject(s) with full interview content`);
}

module.exports = { seedSubjects };
