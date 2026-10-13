import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { writeAnalyticsConfig } from "./analytics-config.mjs";
const source = await readFile(
  new URL("../analytics.js", import.meta.url),
  "utf8",
);
function run(id, consent) {
  const listeners = {};
  const scripts = [];
  const buttons = {};
  const elements = [];
  const element = () => ({
    append(child) {
      scripts.push(child);
    },
    setAttribute() {},
    remove() {},
    focus() {},
    querySelector(selector) {
      return (buttons[selector] ||= element());
    },
  });
  const document = {
    head: element(),
    body: element(),
    referrer: "",
    cookie: "",
    createElement() {
      const e = element();
      elements.push(e);
      return e;
    },
    querySelector() {
      return null;
    },
    addEventListener(name, handler) {
      listeners[name] = handler;
    },
  };
  const window = {
    BBOOK_GA_MEASUREMENT_ID: id,
    addEventListener(name, handler) {
      listeners[name] = handler;
    },
  };
  const localStorage = {
    getItem() {
      return consent;
    },
    setItem(_key, value) {
      consent = value;
    },
  };
  vm.runInNewContext(source, {
    window,
    document,
    localStorage,
    location: {
      origin: "https://bbookmakeup.com",
      pathname: "/",
      search: "?utm_source=facebook&utm_campaign=launch&email=secret",
      hostname: "bbookmakeup.com",
    },
    URL,
    URLSearchParams,
  });
  return {
    window,
    buttons,
    listeners,
    scripts,
    elements,
    rerun() {
      vm.runInNewContext(source, { window });
    },
  };
}
test("no tag without ID or affirmative consent; only one pageview config", () => {
  assert.equal(run("", null).scripts.length, 0);
  const denied = run("G-TEST", "denied");
  assert.equal(denied.window.gtag, undefined);
  const accepted = run("G-TEST", "granted");
  assert.equal(
    accepted.window.dataLayer.filter((args) => args[0] === "config").length,
    1,
  );
  assert.equal(accepted.scripts.filter((e) => e.src).length, 1);
  assert.equal(
    accepted.window.dataLayer.find((args) => args[0] === "config")[2]
      .page_location,
    "https://bbookmakeup.com/",
  );
  const config = accepted.window.dataLayer.find(
    (args) => args[0] === "config",
  )[2];
  assert.equal(config.campaign_source, "facebook");
  assert.equal(config.campaign_name, "launch");
  assert.ok(!JSON.stringify(config).includes("secret"));
  accepted.rerun();
  assert.equal(accepted.scripts.filter((e) => e.src).length, 1);
});
test("Play Store URL only, no navigation cancellation, no synthetic or canceled click", () => {
  const result = run("G-TEST", "granted");
  const link = {
    href: "https://play.google.com/store/apps/details?id=com.example",
    matches(selector) {
      return selector === '[data-store="android"]';
    },
    getAttribute() {
      return null;
    },
    closest() {
      return { id: "download" };
    },
  };
  const click = {
    target: {
      closest() {
        return link;
      },
    },
    defaultPrevented: false,
    isTrusted: true,
  };
  result.listeners.click({ ...click, isTrusted: false });
  result.listeners.click({ ...click, defaultPrevented: true });
  assert.equal(
    result.window.dataLayer.filter((args) => args[0] === "event").length,
    0,
  );
  result.listeners.click(click);
  const event = result.window.dataLayer.find((args) => args[0] === "event");
  assert.equal(event[1], "play_store_click");
  assert.equal(event[2].destination_type, "google_play");
  assert.equal(click.defaultPrevented, false);
  link.href = "https://expo.dev/example";
  result.listeners.click(click);
  assert.equal(
    result.window.dataLayer.filter((args) => args[0] === "event").length,
    1,
  );
});
test("storage withdrawal disables other tab; reaccept never inserts duplicate tag", () => {
  const result = run("G-TEST", "granted");
  result.listeners.storage({
    key: "bbook_analytics_consent",
    newValue: "denied",
  });
  assert.equal(result.window["ga-disable-G-TEST"], true);
  result.listeners.storage({
    key: "bbook_analytics_consent",
    newValue: "granted",
  });
  assert.equal(result.window["ga-disable-G-TEST"], false);
  assert.equal(result.scripts.filter((e) => e.src).length, 1);
});
test("config generator reads environment, permits absent ID, rejects script injection", async () => {
  const original = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const directory = await mkdtemp(path.join(tmpdir(), "bbook-ga-test-"));
  try {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    await writeAnalyticsConfig(directory);
    assert.equal(
      await readFile(path.join(directory, "analytics-config.js"), "utf8"),
      'window.BBOOK_GA_MEASUREMENT_ID = "";\n',
    );
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
    await writeAnalyticsConfig(directory);
    assert.ok(
      (
        await readFile(path.join(directory, "analytics-config.js"), "utf8")
      ).includes("G-TEST123"),
    );
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-</script>";
    await assert.rejects(writeAnalyticsConfig(directory));
  } finally {
    if (original === undefined)
      delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = original;
    // Only the exact directory returned by mkdtemp is removed.
    assert.ok(directory.startsWith(path.join(tmpdir(), "bbook-ga-test-")));
    await rm(directory, { recursive: true });
  }
});
test("one APK event per click, disabled Play ignored; consent withdrawal and reaccept", () => {
  const result = run("G-TEST", "granted");
  const link = {
    matches(selector) {
      return selector === "[data-apk-download]";
    },
    getAttribute() {
      return null;
    },
    closest() {
      return { id: "download" };
    },
  };
  const click = {
    target: {
      closest() {
        return link;
      },
    },
    defaultPrevented: false,
    isTrusted: true,
  };
  result.listeners.click(click);
  assert.equal(
    result.window.dataLayer.filter((args) => args[0] === "event").length,
    1,
  );
  link.getAttribute = () => "true";
  result.listeners.click(click);
  assert.equal(
    result.window.dataLayer.filter((args) => args[0] === "event").length,
    1,
  );
  result.buttons["[data-reject]"].onclick();
  link.getAttribute = () => null;
  result.listeners.click(click);
  assert.equal(
    result.window.dataLayer.filter((args) => args[0] === "event").length,
    1,
  );
  result.buttons["[data-accept]"].onclick();
  result.listeners.click(click);
  assert.equal(
    result.window.dataLayer.filter((args) => args[0] === "event").length,
    2,
  );
  assert.equal(
    result.window.dataLayer.filter((args) => args[0] === "config").length,
    1,
  );
  assert.equal(result.scripts.filter((e) => e.src).length, 1);
});
