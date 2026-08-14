const { Prisma, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const email = (process.argv[2] || process.env.FIND_EMAIL || "").trim();

if (!email) {
  console.error("Usage: node scripts/find-email.js <email>");
  console.error("   or: FIND_EMAIL=<email> node scripts/find-email.js");
  process.exit(1);
}

function delegateName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

async function main() {
  console.log("Searching for:", email);

  const results = [];
  const skipped = [];

  for (const model of Prisma.dmmf.datamodel.models) {
    const stringFields = model.fields.filter(
      (field) =>
        field.kind === "scalar" &&
        field.type === "String" &&
        !field.isList
    );

    if (stringFields.length === 0) continue;

    const delegate = prisma[delegateName(model.name)];
    if (!delegate || typeof delegate.findMany !== "function") continue;

    try {
      const rows = await delegate.findMany({
        where: {
          OR: stringFields.map((field) => ({ [field.name]: email })),
        },
        take: 5,
      });

      if (rows.length === 0) continue;

      const columns = [
        ...new Set(
          rows.flatMap((row) =>
            stringFields
              .filter((field) => row[field.name] === email)
              .map((field) => field.name)
          )
        ),
      ];

      results.push({
        model: model.name,
        columns,
        data: rows,
      });
    } catch (error) {
      skipped.push({
        model: model.name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (results.length === 0) {
    console.log("❌ Email not found in any Prisma-managed string field");
  } else {
    console.log("✅ FOUND:");
    for (const result of results) {
      console.log("\n---");
      console.log("Model:", result.model);
      console.log("Columns:", result.columns.join(", ") || "unknown");
      console.log(result.data);
    }
  }

  if (skipped.length > 0) {
    console.warn(`\n⚠️ Skipped ${skipped.length} model(s) because their lookup failed:`);
    for (const item of skipped) {
      console.warn(`- ${item.model}: ${item.reason}`);
    }
  }
}

main()
  .catch((error) => {
    console.error("Email search failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
