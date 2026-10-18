(() => {
  if (window.BBOOK_RECORD_APK_CLICK) return;
  const target = window.BBOOK_APK_COUNTER_URL;
  if (!target) return;
  let url;
  try { url = new URL(target); } catch { return; }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return;
  if (url.username || url.password || url.search || url.hash) return;
  let pending = 0;
  window.BBOOK_RECORD_APK_CLICK = () => {
    try {
      if (localStorage.getItem("bbook_analytics_consent") !== "granted" || pending >= 20) return;
    } catch { return; }
    const eventId = window.crypto?.randomUUID?.();
    if (!eventId) return;
    pending++;
    async function attempt(number) {
      let retry = false;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        // Recheck consent before every attempt, including retries.
        if (localStorage.getItem("bbook_analytics_consent") !== "granted") return;
        const response = await fetch(url.href, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }), credentials: "omit", keepalive: true,
          signal: controller.signal,
        });
        retry = response.status >= 500;
      } catch { retry = true; }
      finally {
        clearTimeout(timeout);
        if (retry && number < 2) setTimeout(() => void attempt(number + 1), (number + 1) * 1500);
        else pending--;
      }
    }
    void attempt(0);
  };
})();
