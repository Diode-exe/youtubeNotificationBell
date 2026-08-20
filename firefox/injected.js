(function() {
    'use strict';

    let latestCount = null;

    function modifyBadge(number) {
        if (number == null) return;

        const badge = document.querySelector('.ytSpecIconBadgeShapeBadge')
            || document.querySelector('ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge');

        if (badge && badge.textContent.trim() !== String(number)) {
            badge.textContent = number;
            console.log('[YTExpand] Modified badge number to:', number);
        }
    }

    function startObserver() {
        const observer = new MutationObserver(() => {
            if (latestCount !== null) {
                modifyBadge(latestCount);
            }
        });

        const observe = () => {
            if (!document.body) return;
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        };

        if (document.body) {
            observe();
        } else {
            window.addEventListener('DOMContentLoaded', observe, { once: true });
        }
    }

    async function patchedFetch(originalFetch, thisArg, args) {
        const response = await originalFetch.apply(thisArg, args);
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

        if (url.includes('/youtubei/v1/notification/get_unseen_count')) {
            try {
                const clonedResponse = response.clone();
                const data = await clonedResponse.json();
                const count = data?.actions?.[0]?.updateNotificationsUnseenCountAction?.unseenCount;

                if (count !== undefined) {
                    latestCount = count;
                    console.log('[YTExpand] Actual unseen count:', latestCount);
                    modifyBadge(latestCount);
                }
            } catch (err) {
                console.error('[YTExpand] Failed to parse notification JSON:', err);
            }
        }

        return response;
    }

    function init() {
        if (window.__ytNotificationBellFetchHooked) {
            return;
        }
        window.__ytNotificationBellFetchHooked = true;

        const originalFetch = window.fetch;
        if (typeof originalFetch !== 'function') {
            console.warn('[YTExpand] window.fetch is unavailable.');
            return;
        }

        window.fetch = function(...args) {
            return patchedFetch(originalFetch, this, args);
        };

        startObserver();
        console.log('[YTExpand] Page hook initialized on:', window.location.href);
    }

    init();
})();
