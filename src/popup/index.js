const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', async () => {
    // Элементы UI
    const UIElements = {
        tabs: {
            settings: document.getElementById('tab-settings'),
            sites: document.getElementById('tab-sites'),
        },
        content: {
            settings: document.getElementById('content-settings'),
            sites: document.getElementById('content-sites'),
        },
        controls: {
            enabledToggle: document.getElementById('enabled-toggle'),
            hoverToggle: document.getElementById('hover-toggle'),
            blurSlider: document.getElementById('blur-slider'),
            blurValue: document.getElementById('blur-value'),
            modeRadios: document.querySelectorAll('input[name="mode"]')
        },
        sites: {
            description: document.getElementById('sites-description'),
            input: document.getElementById('site-input'),
            addBtn: document.getElementById('add-site-btn'),
            addCurrentBtn: document.getElementById('add-current-site-btn'),
            list: document.getElementById('sites-list'),
        }
    };

    let settings = {};

    // Загрузка настроек из хранилища
    async function loadSettings() {
        const data = await browserAPI.storage.local.get(null);
        settings = {
            isEnabled: data.isEnabled ?? true,
            hoverUnblur: data.hoverUnblur ?? true,
            blurAmount: data.blurAmount ?? 10,
            mode: data.mode ?? 'blacklist',
            sites: data.sites ?? [],
        };
        updateUI();
    }

    // Сохранение настроек
    function saveSettings() {
        browserAPI.storage.local.set(settings);
    }

    // Обновление UI в соответствии с настройками
    function updateUI() {
        // Настройки
        UIElements.controls.enabledToggle.checked = settings.isEnabled;
        UIElements.controls.hoverToggle.checked = settings.hoverUnblur;
        UIElements.controls.blurSlider.value = settings.blurAmount;
        UIElements.controls.blurValue.textContent = `${settings.blurAmount}px`;
        document.querySelector(`input[name="mode"][value="${settings.mode}"]`).checked = true;

        // Сайты
        updateSitesDescription();
        renderSitesList();
    }

    // Обновление описания для вкладки "Сайты"
    function updateSitesDescription() {
        UIElements.sites.description.textContent = settings.mode === 'blacklist'
            ? 'На сайтах из этого списка изображения НЕ будут размываться.'
            : 'Изображения будут размываться ТОЛЬКО на сайтах из этого списка.';
    }

    // Рендеринг списка сайтов
    function renderSitesList() {
        const list = UIElements.sites.list;
        // очищаем без innerHTML
        list.replaceChildren();

        const sites = Array.isArray(settings.sites) ? settings.sites : [];

        if (sites.length === 0) {
            const li = document.createElement('li');
            li.className = 'p-2 text-gray-500 text-center';
            li.textContent = 'Список пуст';
            list.append(li);
            return;
        }

        const frag = document.createDocumentFragment();

        sites.forEach((site, index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-2 border-b border-gray-200 last:border-b-0';

            const span = document.createElement('span');
            span.className = 'text-sm';
            // на случай не-строки
            span.textContent = String(site);

            const btn = document.createElement('button');
            btn.className = 'remove-site-btn text-red-500 hover:text-red-700 text-xl font-bold';
            btn.type = 'button';
            btn.dataset.index = String(index);
            btn.append(document.createTextNode('×'));

            li.append(span, btn);
            frag.append(li);
        });

        list.append(frag);
    }

    // --- Обработчики событий ---

    // Переключение табов
    UIElements.tabs.settings.addEventListener('click', () => switchTab('settings'));
    UIElements.tabs.sites.addEventListener('click', () => switchTab('sites'));

    function switchTab(tabName) {
        if (tabName === 'settings') {
            UIElements.content.settings.classList.remove('hidden');
            UIElements.content.sites.classList.add('hidden');
            UIElements.tabs.settings.classList.add('border-blue-500', 'text-blue-500');
            UIElements.tabs.sites.classList.remove('border-blue-500', 'text-blue-500');
        } else {
            UIElements.content.settings.classList.add('hidden');
            UIElements.content.sites.classList.remove('hidden');
            UIElements.tabs.sites.classList.add('border-blue-500', 'text-blue-500');
            UIElements.tabs.settings.classList.remove('border-blue-500', 'text-blue-500');
        }
    }

    // Изменение настроек
    UIElements.controls.enabledToggle.addEventListener('change', (e) => {
        settings.isEnabled = e.target.checked;
        saveSettings();
    });

    UIElements.controls.hoverToggle.addEventListener('change', (e) => {
        settings.hoverUnblur = e.target.checked;
        saveSettings();
    });

    UIElements.controls.blurSlider.addEventListener('input', (e) => {
        settings.blurAmount = e.target.value;
        UIElements.controls.blurValue.textContent = `${settings.blurAmount}px`;
    });

    UIElements.controls.blurSlider.addEventListener('change', (e) => {
        settings.blurAmount = e.target.value;
        saveSettings();
    });

    UIElements.controls.modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                settings.mode = e.target.value;
                updateSitesDescription();
                saveSettings();
            }
        });
    });

    // Управление сайтами
    UIElements.sites.addBtn.addEventListener('click', () => addSite(UIElements.sites.input.value));
    UIElements.sites.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addSite(UIElements.sites.input.value);
    });

    UIElements.sites.addCurrentBtn.addEventListener('click', async () => {
        const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
            try {
                const url = new URL(tab.url);
                addSite(url.hostname);
            } catch (error) {
                console.error("Invalid URL:", tab.url);
            }
        }
    });

    UIElements.sites.list.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-site-btn')) {
            const index = e.target.dataset.index;
            settings.sites.splice(index, 1);
            saveSettings();
            renderSitesList();
        }
    });

    function addSite(siteUrl) {
        if (!siteUrl) return;
        const hostname = siteUrl.trim().toLowerCase();
        if (hostname && !settings.sites.includes(hostname)) {
            settings.sites.push(hostname);
            saveSettings();
            renderSitesList();
        }
        UIElements.sites.input.value = '';
    }

    // Инициализация
    loadSettings();
});