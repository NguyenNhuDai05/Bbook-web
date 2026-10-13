import { writeFile } from "node:fs/promises";
import path from "node:path";
export async function writeAnalyticsConfig(directory) {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  if (value && !/^G-[A-Z0-9]+$/.test(value))
    throw new Error("NEXT_PUBLIC_GA_MEASUREMENT_ID không hợp lệ.");
  await writeFile(
    path.join(directory, "analytics-config.js"),
    `window.BBOOK_GA_MEASUREMENT_ID = ${JSON.stringify(value)};\n`,
  );
}
