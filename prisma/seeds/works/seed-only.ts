import { seedWorks } from "./run";

seedWorks()
  .then(() => {
    console.log("WORKS-only seed completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("WORKS-only seed failed:");
    console.error(error);
    process.exit(1);
  });
