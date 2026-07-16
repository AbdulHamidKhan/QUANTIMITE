// background.js
// Relays the parsed test-case payload from the content script to CPH's
// local listener (default port 27121). Done in the service worker rather
// than the content script so it isn't subject to leetcode.com's CSP.

const CPH_PORT = 27121;

// Clicking the toolbar icon now actually does something: it tells the
// content script on the active tab to run the same send action as the
// on-page button. Previously this icon had no click handler at all, so
// clicking it silently did nothing.
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id || !tab.url || !tab.url.includes("leetcode.com/problems/")) return;
  chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_SEND" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SEND_TO_CPH") return;

  (async () => {
    try {
      // IMPORTANT: use text/plain, not application/json, as the
      // Content-Type. application/json is not a CORS "simple" content
      // type, so Chrome sends an OPTIONS preflight first — and CPH's
      // local server doesn't implement OPTIONS or send back
      // Access-Control-Allow-Origin, so the preflight gets blocked before
      // the real POST ever goes out. text/plain avoids the preflight
      // entirely (this is the same trick Competitive Companion itself
      // uses), and CPH just JSON.parses the raw body regardless of the
      // header, so the payload is unaffected.
      const res = await fetch(`http://127.0.0.1:${CPH_PORT}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(message.payload),
      });
      sendResponse({ ok: res.ok });
    } catch (err) {
      console.error("[LeetCode CPH Companion] Failed to reach CPH:", err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  return true; // keep the message channel open for the async response
});
