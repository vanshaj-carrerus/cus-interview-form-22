"use client";

import QRCode from "qrcode";

const BLUE = "#1e3a8a";
const QR_OPTIONS = { errorCorrectionLevel: "M" as const, margin: 1, color: { dark: BLUE, light: "#ffffff" } };

function download(canvas: HTMLCanvasElement, fileName: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, "image/png");
}

// Small poster: 1080 x 1440 px, sized for sharing on phones (WhatsApp, Instagram).
async function downloadPoster(url: string) {
  const W = 1080;
  const H = 1440;
  const k = W / 2400; // layout below is designed at 2400 px wide
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";

  ctx.fillStyle = "#64748b";
  ctx.font = `600 ${64 * k}px ${font}`;
  ctx.fillText("CUSTECH SOLUTIONS", W / 2, 300 * k);

  ctx.fillStyle = BLUE;
  ctx.font = `800 ${190 * k}px ${font}`;
  ctx.fillText("SCAN TO APPLY", W / 2, 520 * k);

  ctx.fillStyle = "#475569";
  ctx.font = `400 ${72 * k}px ${font}`;
  ctx.fillText("Scan with your phone camera to open", W / 2, 680 * k);
  ctx.fillText("the job application form", W / 2, 780 * k);

  const qrSize = Math.round(1800 * k);
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { ...QR_OPTIONS, width: qrSize });
  ctx.drawImage(qr, (W - qrSize) / 2, 920 * k, qrSize, qrSize);

  ctx.fillStyle = "#334155";
  ctx.font = `500 ${64 * k}px ${font}`;
  ctx.fillText(url, W / 2, 2920 * k, W - 200 * k);

  download(canvas, "job-application-qr-poster.png");
}

async function downloadQrOnly(url: string) {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, { ...QR_OPTIONS, width: 256 });
  download(canvas, "job-application-qr.png");
}

export default function QrActions({ url }: { url: string }) {
  return (
    <div className="mt-5 flex flex-col gap-3 print:hidden">
      <button
        type="button"
        onClick={() => downloadPoster(url)}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Download poster (1080 × 1440)
      </button>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => downloadQrOnly(url)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          QR only (256 px)
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Print
        </button>
      </div>
    </div>
  );
}
