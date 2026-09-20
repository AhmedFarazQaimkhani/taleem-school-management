export type SchoolBrand = {
  name: string;
  headerText?: string | null;
  footerText?: string | null;
  logoKey?: string | null;
};

export function brandHeader(brand: SchoolBrand) {
  const text = brand.headerText?.trim();
  return text || brand.name;
}

export function brandFooter(brand: SchoolBrand) {
  return brand.footerText?.trim() || "";
}

export function logoSrc(logoKey?: string | null) {
  if (!logoKey) return null;
  return `/api/branding/logo?v=${encodeURIComponent(logoKey)}`;
}

export function schoolInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2);
  return (parts.join("") || "S").toUpperCase();
}

const MAX_LOGO_BYTES = 1_000_000;

export function sniffImage(buf: Buffer): { ext: string; contentType: string } | null {
  if (buf.length < 12 || buf.length > MAX_LOGO_BYTES) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: "png", contentType: "image/png" };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}

export const MAX_LOGO_BYTES_LIMIT = MAX_LOGO_BYTES;
