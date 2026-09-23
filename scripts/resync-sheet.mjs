// Re-sends applications with sheetSynced: false to the Google Sheet.
// Usage: node --env-file=.env scripts/resync-sheet.mjs
//        node --env-file=.env scripts/resync-sheet.mjs --all   (re-send every application)
import { MongoClient } from "mongodb";

const FIELDS = [
  "position", "applyingDate", "fullName", "contactNumber", "email", "currentAddress",
  "whyJoin", "knowAboutRole", "whyChange", "whyHire", "currentEmployer", "salaryExpectation",
  "nightShift", "idealEnvironment", "reference", "medicalIssues", "joiningDate",
];

const APP_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

try {
  await client.connect();
  const col = client.db(process.env.MONGODB_DB || "interview").collection("applications");
  const filter = process.argv.includes("--all") ? {} : { sheetSynced: { $ne: true } };
  const pending = await col.find(filter).sort({ submittedAt: 1 }).toArray();
  console.log(`${pending.length} application(s) to sync`);

  for (const doc of pending) {
    const row = {
      secret: process.env.GOOGLE_SCRIPT_SECRET,
      id: doc._id.toString(),
      submittedAt: new Date(doc.submittedAt).toISOString(),
      skills: (doc.skills || []).join(", "),
      resumeUrl: doc.resumePublicId ? `${APP_URL}/api/resume/${doc._id}` : "",
    };
    for (const f of FIELDS) row[f] = doc[f] ?? "";

    const res = await fetch(process.env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      console.log(`✗ ${doc.fullName}: non-JSON response (status ${res.status}) - check GOOGLE_SCRIPT_URL`);
      continue;
    }
    if (data.ok) {
      await col.updateOne({ _id: doc._id }, { $set: { sheetSynced: true } });
      console.log(`✓ ${doc.fullName}`);
    } else {
      console.log(`✗ ${doc.fullName}: ${data.error}`);
    }
  }
} finally {
  await client.close();
}
