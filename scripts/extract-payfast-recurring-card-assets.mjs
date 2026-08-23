import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "pf-cards-"));
const zip = join(dir, "methods.zip");
const out = join(dir, "out");
execFileSync("curl", ["-fsSL", "https://payfast.io/wp-content/uploads/2026/06/Payment-Methods-Logo-Pack.zip", "-o", zip]);
execFileSync("unzip", ["-qq", zip, "-d", out]);
for (const [label, relative] of [
  ["MASTERCARD", "Payment Methods Logo Pack/Mastercard/svg/Master Card.svg"],
  ["VISA", "Payment Methods Logo Pack/Visa/svg/Visa.svg"],
]) {
  const content = readFileSync(join(out, relative), "utf8");
  console.log(`PAYFAST_${label}_SVG_BASE64 ${Buffer.from(content).toString("base64")}`);
}
