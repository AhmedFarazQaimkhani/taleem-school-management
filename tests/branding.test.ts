import { describe, expect, it } from "vitest";
import { brandFooter, brandHeader, schoolInitials, sniffImage } from "../src/lib/branding";

describe("school branding", () => {
  it("falls back to the school name when header is empty", () => {
    expect(brandHeader({ name: "Greenwood High School", headerText: "  " })).toBe("Greenwood High School");
    expect(brandHeader({ name: "Greenwood High School", headerText: "Excellence in Education" })).toBe(
      "Excellence in Education",
    );
  });

  it("treats blank footer as empty", () => {
    expect(brandFooter({ name: "School", footerText: "  " })).toBe("");
    expect(brandFooter({ name: "School", footerText: "Principal office" })).toBe("Principal office");
  });

  it("builds initials from the school name", () => {
    expect(schoolInitials("Greenwood High School")).toBe("GH");
    expect(schoolInitials("")).toBe("S");
  });

  it("accepts PNG magic bytes and rejects empty buffers", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImage(png)).toEqual({ ext: "png", contentType: "image/png" });
    expect(sniffImage(Buffer.from([1, 2, 3]))).toBeNull();
  });
});
