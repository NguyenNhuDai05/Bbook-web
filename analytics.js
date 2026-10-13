(() => {
  const id = window.BBOOK_GA_MEASUREMENT_ID;
  if (!/^G-[A-Z0-9]+$/.test(id || "")) return;
  if (window.BBOOK_ANALYTICS_INITIALIZED) return;
  window.BBOOK_ANALYTICS_INITIALIZED = true;
  const key = "bbook_analytics_consent";
  let choice;
  try {
    choice = localStorage.getItem(key);
  } catch {
    /* Consent defaults to denied. */
  }
  let started = false;
  function start() {
    if (started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    // One automatic page_view for this static document. Strip query/hash to avoid PII.
    // Campaign parameters are explicitly allowlisted; do not put PII in UTM values.
    const params = new URLSearchParams(location.search);
    const campaign = {};
    for (const [utm, field] of [
      ["utm_source", "campaign_source"],
      ["utm_medium", "campaign_medium"],
      ["utm_campaign", "campaign_name"],
      ["utm_content", "campaign_content"],
    ]) {
      const value = params.get(utm);
      if (
        value &&
        /^[a-zA-Z0-9_. -]{1,100}$/.test(value) &&
        !/\d{7,}/.test(value)
      )
        campaign[field] = value;
    }
    let referrer = "";
    try {
      referrer = document.referrer ? new URL(document.referrer).origin : "";
    } catch {
      /* Ignore malformed referrer. */
    }
    window.gtag("config", id, {
      ...campaign,
      page_location: location.origin + location.pathname,
      page_referrer: referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.append(script);
  }
  const style = document.createElement("style");
  style.textContent =
    ".analytics-consent{position:fixed;bottom:16px;left:16px;right:16px;z-index:1000;max-width:620px;padding:20px;background:white;color:#1f2937;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 4px 24px #0002;font:14px/1.6 sans-serif}.analytics-consent button,.analytics-settings{padding:8px 12px;margin:8px 8px 0 0;border:1px solid #e5e7eb;border-radius:8px;background:#fff0f5;color:#9c2453;cursor:pointer}.analytics-settings{display:block;margin:12px auto;font:12px sans-serif}";
  document.head.append(style);
  const panel = document.createElement("section");
  panel.className = "analytics-consent";
  panel.setAttribute("aria-label", "Quyền riêng tư analytics");
  panel.innerHTML =
    '<strong>Thống kê truy cập website</strong><p>BBook sử dụng Google Analytics để đo lượt truy cập và lượt nhấn tải ứng dụng khi bạn đồng ý. Google nhận dữ liệu sử dụng và thiết bị. Lựa chọn không ảnh hưởng đến tải APK. <a href="/privacy/">Chính sách quyền riêng tư</a></p><button type="button" data-accept>Đồng ý</button><button type="button" data-reject>Từ chối</button>';
  function save(value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Session-only preference. */
    }
  }
  panel.querySelector("[data-accept]").onclick = () => {
    choice = "granted";
    save(choice);
    window[`ga-disable-${id}`] = false;
    if (started)
      window.gtag("consent", "update", { analytics_storage: "granted" });
    else start();
    panel.remove();
  };
  panel.querySelector("[data-reject]").onclick = () => {
    choice = "denied";
    save(choice);
    window[`ga-disable-${id}`] = true;
    if (window.gtag)
      window.gtag("consent", "update", { analytics_storage: "denied" });
    // Remove first-party GA cookies after withdrawal (host and parent domain variants).
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.trim().split("=")[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      document.cookie = `${name}=; Max-Age=0; path=/`;
      const parts = location.hostname.split(".");
      for (let i = 0; i < parts.length - 1; i++)
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${parts.slice(i).join(".")}`;
    }
    panel.remove();
  };
  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "analytics-settings";
  settings.textContent = "Tùy chọn thống kê / cookie";
  settings.onclick = () => {
    document.body.append(panel);
    panel.querySelector("button").focus();
  };
  (document.querySelector("footer") || document.body).append(settings);
  if (choice === "granted") start();
  else if (choice !== "denied") document.body.append(panel);
  window.addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    if (event.newValue === "granted")
      panel.querySelector("[data-accept]").onclick();
    else panel.querySelector("[data-reject]").onclick();
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a");
    if (
      !link ||
      event.defaultPrevented ||
      !event.isTrusted ||
      choice !== "granted" ||
      !started ||
      link.getAttribute("aria-disabled") === "true"
    )
      return;
    let name, destination;
    if (link.matches("[data-apk-download]")) {
      name = "apk_download_click";
      destination = "apk";
    } else if (
      link.matches('[data-store="android"]') &&
      /^https:\/\/play\.google\.com\//.test(link.href)
    ) {
      name = "play_store_click";
      destination = "google_play";
    }
    if (name)
      window.gtag("event", name, {
        button_location: link.closest("section")?.id || "landing",
        destination_type: destination,
        transport_type: "beacon",
      });
  });
})();
