import { writeFile } from "node:fs/promises";
import path from "node:path";
export async function writeAnalyticsConfig(directory) {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  if (value && !/^G-[A-Z0-9]+$/.test(value))
    throw new Error("NEXT_PUBLIC_GA_MEASUREMENT_ID không hợp lệ.");
  let counter = process.env.APK_COUNTER_API_URL || "";
  if (counter) {
    const url = new URL(counter);
    if ((url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) ||
        url.username || url.password || url.search || url.hash || !url.pathname.endsWith("/api/WebsiteMetrics/apk-click"))
      throw new Error("APK_COUNTER_API_URL không hợp lệ.");
    counter = url.href;
  }
  await writeFile(
    path.join(directory, "analytics-config.js"),
    `window.BBOOK_GA_MEASUREMENT_ID = ${JSON.stringify(value)};\nwindow.BBOOK_APK_COUNTER_URL = ${JSON.stringify(counter)};\n`,
  );
}
