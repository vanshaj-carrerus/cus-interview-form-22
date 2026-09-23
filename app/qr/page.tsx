import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import PrintButton from "./PrintButton";

export const metadata: Metadata = { title: "Scan to Apply" };

// Form address encoded in the QR. Set APP_URL once the app is online;
// locally it falls back to the address this page was opened with.
async function getFormUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "") + "/";
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/`;
}

export default async function QrPage() {
  const url = await getFormUrl();
  const options = { errorCorrectionLevel: "M" as const, margin: 1, color: { dark: "#1e3a8a", light: "#ffffff" } };
  const svg = await QRCode.toString(url, { ...options, type: "svg" });
  const png = await QRCode.toDataURL(url, { ...options, width: 1024 });
  const isLocalhost = /\/\/(localhost|127\.0\.0\.1)/.test(url);

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-100 px-4 py-8 print:bg-white">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm print:border-0 print:shadow-none">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Custech Solutions</p>
        <h1 className="mt-1 text-2xl font-extrabold uppercase tracking-tight text-blue-900">Scan to Apply</h1>
        <p className="mt-1 text-sm text-slate-500">Scan with your phone camera to open the job application form.</p>

        <div
          className="mx-auto mt-5 w-full max-w-64 [&>svg]:h-auto [&>svg]:w-full"
          role="img"
          aria-label={`QR code for ${url}`}
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <p className="mt-3 break-all font-mono text-xs text-slate-600">{url}</p>

        {isLocalhost && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800 print:hidden">
            This QR points to <b>localhost</b>, which phones can&apos;t open. Open this page using your
            computer&apos;s network address instead, e.g. <span className="font-mono">http://192.168.1.43:3000/qr</span>,
            or set APP_URL once the site is online.
          </p>
        )}

        <div className="mt-5 flex gap-3 print:hidden">
          <a
            href={png}
            download="job-application-qr.png"
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Download PNG
          </a>
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
