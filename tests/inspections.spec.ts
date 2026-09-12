import { describe, expect, it } from "vitest";
import { inspections } from "../src/lib/data/inspections";

describe("datos de inspecciones", () => {
  it("expone los tres registros sintéticos con estados válidos", () => {
    expect(inspections).toHaveLength(3);
    expect(inspections.every((inspection) =>
      inspection.id &&
      inspection.location &&
      inspection.date &&
      inspection.inspector &&
      ["ok", "attention"].includes(inspection.status) &&
      inspection.findings >= 0 &&
      inspection.summary,
    )).toBe(true);
  });
});