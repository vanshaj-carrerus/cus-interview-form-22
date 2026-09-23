import { after } from "next/server";
import { getDb } from "@/lib/mongodb";
import { uploadPdf } from "@/lib/cloudinary";
import { appendToSheet } from "@/lib/googleSheet";

export const runtime = "nodejs";

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

const TEXT_FIELDS = [
  "position",
  "applyingDate",
  "fullName",
  "contactNumber",
  "email",
  "currentAddress",
  "whyJoin",
  "knowAboutRole",
  "whyChange",
  "whyHire",
  "currentEmployer",
  "salaryExpectation",
  "nightShift",
  "idealEnvironment",
  "reference",
  "medicalIssues",
  "joiningDate",
] as const;

const REQUIRED: (typeof TEXT_FIELDS)[number][] = ["position", "fullName", "contactNumber", "email"];

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const data = Object.fromEntries(
    TEXT_FIELDS.map((key) => [key, String(form.get(key) ?? "").trim()]),
  ) as Record<(typeof TEXT_FIELDS)[number], string>;

  const missing = REQUIRED.filter((key) => !data[key]);
  if (missing.length) {
    return Response.json(
      { ok: false, error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }
  if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    return Response.json({ ok: false, error: "Invalid email address" }, { status: 400 });
  }

  let skills: string[] = [];
  try {
    const parsed = JSON.parse(String(form.get("skills") ?? "[]"));
    if (Array.isArray(parsed)) skills = parsed.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    // ignore malformed skills, treat as empty
  }

  // Resume upload (optional)
  let resumeUrl = "";
  let resumePublicId = "";
  const resume = form.get("resume");
  if (resume instanceof File && resume.size > 0) {
    const isPdf = resume.type === "application/pdf" || /\.pdf$/i.test(resume.name);
    if (!isPdf) {
      return Response.json({ ok: false, error: "Resume must be a PDF" }, { status: 400 });
    }
    if (resume.size > MAX_RESUME_BYTES) {
      return Response.json({ ok: false, error: "Resume must be 5 MB or smaller" }, { status: 400 });
    }
    try {
      const buffer = Buffer.from(await resume.arrayBuffer());
      const uploaded = await uploadPdf(buffer, resume.name);
      resumeUrl = uploaded.secure_url;
      resumePublicId = uploaded.public_id;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      const detail =
        process.env.NODE_ENV !== "production" && err && typeof err === "object" && "message" in err
          ? ` (${String(err.message)})`
          : "";
      return Response.json({ ok: false, error: `Could not upload resume${detail}` }, { status: 502 });
    }
  }

  const submittedAt = new Date();
  const doc = { ...data, skills, resumeUrl, resumePublicId, submittedAt, sheetSynced: false };

  // MongoDB is the source of truth.
  let insertedId;
  try {
    const db = await getDb();
    const result = await db.collection("applications").insertOne(doc);
    insertedId = result.insertedId;
  } catch (err) {
    console.error("MongoDB insert failed", err);
    return Response.json({ ok: false, error: "Could not save application" }, { status: 500 });
  }

  // Cloudinary's own PDF link is blocked for public delivery, so the sheet gets
  // our /api/resume/<id> link, which serves the file through a signed URL.
  const appUrl = (process.env.APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const sheetResumeUrl = resumePublicId ? `${appUrl}/api/resume/${insertedId.toString()}` : "";

  // Google Sheet is a mirror: sync it after responding so the candidate doesn't
  // wait on Apps Script. A failure here leaves sheetSynced: false in MongoDB.
  after(async () => {
    try {
      await appendToSheet({
        id: insertedId.toString(),
        submittedAt: submittedAt.toISOString(),
        ...data,
        skills: skills.join(", "),
        resumeUrl: sheetResumeUrl,
      });
      const db = await getDb();
      await db.collection("applications").updateOne({ _id: insertedId }, { $set: { sheetSynced: true } });
    } catch (err) {
      console.error("Google Sheet sync failed:", err);
    }
  });

  return Response.json({ ok: true, id: insertedId.toString() });
}
