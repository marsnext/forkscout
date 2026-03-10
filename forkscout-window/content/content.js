// forkscout-window/content/content.js — Content script: send page context to side panel

// Respond to GET_CONTEXT requests from the side panel
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_CONTEXT") {
    sendResponse({
      url: location.href,
      title: document.title,
      selectedText: window.getSelection()?.toString().trim() || undefined
    });
    return true;
  }

  // EXECUTE_SCRIPT: run arbitrary JS sent from side panel (owner-only sandbox)
  if (msg.type === "EXECUTE_SCRIPT" && msg.code) {
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(msg.code)();
      sendResponse({ ok: true, result: String(result ?? "") });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
    return true;
  }
});

// Push selection changes to side panel automatically
document.addEventListener("selectionchange", () => {
  const sel = window.getSelection()?.toString().trim();
  if (!sel) return;
  chrome.runtime
    .sendMessage({
      type: "PAGE_CONTEXT",
      url: location.href,
      title: document.title,
      selectedText: sel
    })
    .catch(() => {});
});
