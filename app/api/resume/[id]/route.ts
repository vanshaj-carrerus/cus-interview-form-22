import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { signedPdfUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";

// Permanent resume link for the Google Sheet: /api/resume/<applicationId>
// Streams the PDF from Cloudinary through a fresh signed URL so it opens in the browser.
export async function GET(_req: Request, ctx: RouteContext<"/api/resume/[id]">) {
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return new Response("Not found", { status: 404 });

  const db = await getDb();
  const app = await db
    .collection("applications")
    .findOne({ _id: new ObjectId(id) }, { projection: { resumePublicId: 1, fullName: 1 } });
  if (!app?.resumePublicId) return new Response("Resume not found", { status: 404 });

  const upstream = await fetch(signedPdfUrl(app.resumePublicId), {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!upstream.ok || !upstream.body) {
    console.error("Resume fetch failed", upstream.status, upstream.headers.get("x-cld-error"));
    return new Response("Could not load resume", { status: 502 });
  }

  const fileName = `${String(app.fullName || "resume").replace(/[^a-zA-Z0-9_-]+/g, "_")}_resume.pdf`;
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
