// Поддержка Chrome и Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log("Image Blurrer background script loaded.");

browserAPI.runtime.onInstalled.addListener(() => {
    console.log("Image Blurrer extension installed or updated.");
});

browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_CURRENT_TAB_HOSTNAME") {
        browserAPI.tabs.query({ active: true, currentWindow: true })
            .then((tabs) => {
                if (tabs[0]?.url) {
                    try {
                        const url = new URL(tabs[0].url);
                        sendResponse({ hostname: url.hostname });
                    } catch (error) {
                        console.error("Invalid URL in active tab:", tabs[0].url, error);
                        sendResponse({ hostname: null });
                    }
                } else {
                    sendResponse({ hostname: null });
                }
            })
            .catch((error) => {
                console.error("Error querying tabs:", error);
                sendResponse({ hostname: null });
            });
        return true; // Указываем, что ответ будет асинхронным
    }
});