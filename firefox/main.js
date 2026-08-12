(function() {
    'use strict';

    // Content scripts run in an isolated world in extensions. Inject into page
    // context so patching window.fetch affects YouTube's own network calls.
    if (document.documentElement.dataset.ytNotificationBellInjected === '1') {
        return;
    }
    document.documentElement.dataset.ytNotificationBellInjected = '1';

    const script = document.createElement('script');
    script.src = browser.runtime.getURL('injected.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
})();