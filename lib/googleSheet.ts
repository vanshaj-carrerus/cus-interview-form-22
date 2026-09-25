// Sends one row to the Google Apps Script web app (see apps-script/Code.gs).
export async function appendToSheet(row: Record<string, unknown>) {
  const url = process.env.GOOGLE_SCRIPT_URL;
  if (!url) throw new Error("GOOGLE_SCRIPT_URL is not set");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.GOOGLE_SCRIPT_SECRET, ...row }),
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });



  const text = await res.text();
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Apps Script returned non-JSON response (status ${res.status})`);
  }
  if (!data.ok) throw new Error(data.error || "Apps Script rejected the row");
}
