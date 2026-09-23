import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const REQUIRED_ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

function configure() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length) throw new Error(`Missing Cloudinary env vars: ${missing.join(", ")}`);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
    api_key: process.env.CLOUDINARY_API_KEY!.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
    secure: true,
  });
}

// Cloudinary blocks public delivery of PDFs by default, so the plain
// secure_url returns 401. This builds a short-lived, API-signed link instead.
export function signedPdfUrl(publicId: string, expiresInSeconds = 300): string {
  configure();
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "upload",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

export function uploadPdf(buffer: Buffer, fileName: string): Promise<UploadApiResponse> {
  configure();
  const baseName = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "_");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: process.env.CLOUDINARY_FOLDER || "interview-resumes",
        public_id: `${baseName}_${Date.now()}.pdf`,
        timeout: 60_000,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}
