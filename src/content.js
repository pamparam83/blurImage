// Этот скрипт выполняется на каждой странице, где разрешены content_scripts.
// Он может взаимодействовать с DOM страницы и отправлять сообщения в фоновый скрипт.
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log("Image Blurrer content script loaded.");

let settings = {};
let styleElement = null;
let hoverStyleElement = null;

// Функция для применения или обновления стилей размытия
function applyBlurStyles() {
    if (!styleElement) {
        styleElement = document.createElement('style');
        document.documentElement.appendChild(styleElement);
    }

    if (!hoverStyleElement) {
        hoverStyleElement = document.createElement('style');
        document.documentElement.appendChild(hoverStyleElement);
    }

    const { isEnabled, blurAmount, mode, sites, hoverUnblur } = settings;
    const currentHostname = window.location.hostname;

    let shouldBlur = false;
    if (isEnabled) {
        const isInList = sites.some(site => currentHostname.includes(site));
        if (mode === 'blacklist' && !isInList) {
            shouldBlur = true;
        } else if (mode === 'whitelist' && isInList) {
            shouldBlur = true;
        }
    }

    if (shouldBlur) {
        // Основные стили размытия
        styleElement.textContent = `
            img, video, [style*="background-image"] {
                filter: blur(${blurAmount}px) !important;
                transition: filter 0.2s ease-in-out;
            }
        `;

        // Стили для снятия размытия при наведении
        if (hoverUnblur) {
            hoverStyleElement.textContent = `
                img:hover, video:hover, [style*="background-image"]:hover {
                    filter: blur(0px) !important;
                }
            `;
        } else {
            hoverStyleElement.textContent = '';
        }
    } else {
        styleElement.textContent = '';
        hoverStyleElement.textContent = '';
    }
}

// Принудительное размытие на 5 секунд
function applyManualBlur() {
    const manualStyle = document.createElement('style');
    document.documentElement.appendChild(manualStyle);
    manualStyle.textContent = `
        img, video, [style*="background-image"] {
            filter: blur(10px) !important;
            transition: filter 0.2s ease-in-out;
        }
    `;
    setTimeout(() => {
        manualStyle.remove();
    }, 5000);
}

// Загружаем настройки и применяем стили при запуске
async function initialize() {
    const data = await browserAPI.storage.local.get(null);
    settings = {
        isEnabled: data.isEnabled ?? true,
        blurAmount: data.blurAmount ?? 10,
        mode: data.mode ?? 'blacklist',
        sites: data.sites ?? [],
        hoverUnblur: data.hoverUnblur ?? true, // Новая настройка
    };
    applyBlurStyles();
}

// Слушаем изменения в хранилище
browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        Object.keys(changes).forEach(key => {
            settings[key] = changes[key].newValue;
        });
        applyBlurStyles();
    }
});

// Слушаем сообщения от popup (для ручного размытия)
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MANUAL_BLUR') {
        applyManualBlur();
    }
});

// Инициализация при загрузке скрипта
initialize();