import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/lib/csv";

describe("CSV import parser", () => {
  it("parses quoted values and headers", () => {
    const rows = parseCsv(`admissionNo,name,gender
GW-0002,"Sara Ahmed",FEMALE
GW-0003,Ali,MALE`);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Sara Ahmed");
    expect(rows[1].admissionNo).toBe("GW-0003");
  });
});
