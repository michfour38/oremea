import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

function run(command, args = []) {
  execFileSync(command, args, { stdio: "inherit", env: process.env });
}

const packagePath = "package.json";
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
packageJson.scripts.prebuild = "npm run test:launch";
packageJson.devDependencies.postcss = "^8.5.23";
packageJson.overrides = {
  ...(packageJson.overrides ?? {}),
  devalue: ">=5.8.1 <6",
  "form-data": ">=4.0.6 <5",
  nanoid: ">=3.3.18 <4",
  ws: ">=8.21.0 <9",
  postcss: "$postcss",
};
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

run("npm", ["install"]);

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const exact = {
  devalue: lock.packages?.["node_modules/devalue"]?.version,
  "form-data": lock.packages?.["node_modules/form-data"]?.version,
  nanoid: lock.packages?.["node_modules/nanoid"]?.version,
  ws: lock.packages?.["node_modules/ws"]?.version,
  postcss: lock.packages?.["node_modules/postcss"]?.version,
};
for (const [name, version] of Object.entries(exact)) {
  if (!version) throw new Error(`Unable to resolve patched ${name}`);
}

const exactPackage = JSON.parse(readFileSync(packagePath, "utf8"));
exactPackage.devDependencies.postcss = exact.postcss;
exactPackage.overrides = {
  ...(exactPackage.overrides ?? {}),
  devalue: exact.devalue,
  "form-data": exact["form-data"],
  nanoid: exact.nanoid,
  ws: exact.ws,
  postcss: "$postcss",
};
writeFileSync(packagePath, `${JSON.stringify(exactPackage, null, 2)}\n`);
run("npm", ["install"]);

let audit;
try {
  audit = JSON.parse(execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" }));
} catch (error) {
  audit = JSON.parse(error.stdout?.toString?.() ?? "{}");
}
const critical = audit.metadata?.vulnerabilities?.critical ?? 0;
const remaining = Object.entries(audit.vulnerabilities ?? {})
  .filter(([name, value]) => ["high", "critical"].includes(value.severity) && name !== "next")
  .map(([name, value]) => `${name}:${value.severity}`);
console.log("SECURITY_BATCH_RESOLVED", JSON.stringify(exact));
console.log("SECURITY_BATCH_AUDIT", JSON.stringify(audit.metadata?.vulnerabilities ?? {}));
if (critical !== 0) throw new Error(`Critical vulnerabilities remain: ${critical}`);
if (remaining.length) throw new Error(`High/critical non-framework vulnerabilities remain: ${remaining.join(", ")}`);

run("npm", ["run", "test:launch"]);
run("npm", ["run", "typecheck"]);

function dump(path, label) {
  const encoded = Buffer.from(readFileSync(path)).toString("base64");
  console.log(`@@${label}_BEGIN@@`);
  for (let index = 0; index < encoded.length; index += 6000) {
    console.log(encoded.slice(index, index + 6000));
  }
  console.log(`@@${label}_END@@`);
}

dump("package.json", "SECURITY_PACKAGE_JSON_B64");
dump("package-lock.json", "SECURITY_PACKAGE_LOCK_B64");
console.log("SECURITY_BATCH_PREBUILD=PASS");
