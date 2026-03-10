// forkscout-window/background.js — Service worker: side panel + context menu + message routing

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Context menu: "Ask Forkscout about this page"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-forkscout",
    title: "Ask Forkscout about this",
    contexts: ["selection", "page", "link", "image"]
  });
  chrome.contextMenus.create({
    id: "forkscout-summarize",
    title: "Summarize this page",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  // Ensure side panel is open
  await chrome.sidePanel.open({ tabId: tab.id });

  const payload =
    info.menuItemId === "forkscout-summarize"
      ? {
          type: "INJECT_PROMPT",
          prompt: "Summarize the content of this page for me."
        }
      : {
          type: "INJECT_PROMPT",
          prompt: `Tell me about: "${info.selectionText ?? info.linkUrl ?? "this page"}"`
        };

  // Small delay so side panel has time to initialize
  setTimeout(() => {
    chrome.runtime.sendMessage(payload);
  }, 400);
});

// Relay messages between content script ↔ side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // PAGE_CONTEXT: content script sends page info → side panel receives it
  if (message.type === "PAGE_CONTEXT") {
    chrome.runtime.sendMessage(message).catch(() => {}); // fan out to side panel
    sendResponse({ ok: true });
    return true;
  }

  // EXECUTE_ON_PAGE: side panel asks service worker to run script in active tab
  if (message.type === "EXECUTE_ON_PAGE") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab?.id) return sendResponse({ ok: false, error: "No active tab" });
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: /** @type {() => unknown} */ (new Function(message.code)),
          world: "MAIN"
        });
        sendResponse({ ok: true, result: results?.[0]?.result });
      } catch (err) {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    });
    return true; // keep channel open for async sendResponse
  }

  // GET_PAGE_CONTEXT: side panel requests current page info
  if (message.type === "GET_PAGE_CONTEXT") {
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      if (!tab?.id) return sendResponse({ ok: false });
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            url: location.href,
            title: document.title,
            text: document.body?.innerText?.slice(0, 8000) ?? "",
            selectedText: window.getSelection()?.toString() ?? ""
          })
        });
        sendResponse({ ok: true, context: results?.[0]?.result });
      } catch (err) {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    });
    return true;
  }
});

// Update side panel with new tab context when user switches tabs
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => ({ url: location.href, title: document.title })
    })
    .then((results) => {
      chrome.runtime
        .sendMessage({
          type: "TAB_CHANGED",
          context: results?.[0]?.result
        })
        .catch(() => {});
    })
    .catch(() => {});
});
