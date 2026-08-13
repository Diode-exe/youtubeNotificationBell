// ==UserScript==
// @name         YouTube Notification Expander
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Replaces 9+ in the YouTube notification bell with the actual number
// @author       Diode-exe on GitHub
// @match        *://*.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let latestCount = null;

    function modifyBadge(number) {
        if (number === null || number === undefined) return;

        const badge = document.querySelector('.ytSpecIconBadgeShapeBadge')
                   || document.querySelector('ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge');

        if (badge && badge.textContent.trim() !== String(number)) {
            badge.textContent = number;
            console.log('Modified badge number to:', number);
        }
    }

    function init() {
        console.log('Tampermonkey script initialized on:', window.location.href);

        const originalFetch = window.fetch;

        // Hook window.fetch
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

            if (url.includes('/youtubei/v1/notification/get_unseen_count')) {
                try {
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();

                    const count = data?.actions?.[0]?.updateNotificationsUnseenCountAction?.unseenCount;
                    if (count !== undefined) {
                        latestCount = count;
                        console.log('Actual Unseen Count:', latestCount);
                        modifyBadge(latestCount);
                    }
                } catch (err) {
                    console.error('Failed to parse notification JSON:', err);
                }
            }

            return response;
        };

        // Watch DOM mutations so if YouTube re-renders the navbar/badge, we overwrite it back
        const observer = new MutationObserver(() => {
            if (latestCount !== null) {
                modifyBadge(latestCount);
            }
        });

        // Start observing when document body is available
        const startObserving = () => {
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true, characterData: true });
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
                }, { once: true });
            }
        };

        startObserving();
    }

    init();
})();