// Simple line icons (24×24, stroke = currentColor)
window.MAMAPA_ICONS = (function () {
  const w = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    // baby on a changing mat
    changing: w('<rect x="3" y="14" width="18" height="4" rx="1.5"/><path d="M5 18v3M19 18v3"/><circle cx="7.5" cy="10.5" r="2"/><path d="M10 12h6.5a2 2 0 0 0 0-4H12"/>'),
    // stacked toy blocks
    playarea: w('<rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/><rect x="8.5" y="5" width="7" height="7" rx="1"/>'),
    // slide
    playground: w('<path d="M5 21V7h4v14"/><path d="M5 11h4M5 15h4"/><path d="M9 7c4 0 5 3 6.5 7S19 20 21 21"/>'),
    // coffee cup, no smoke
    nosmoke: w('<path d="M4 10h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 12h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-1 1.2 1 2 0 3.4M12 3c-1 1.2 1 2 0 3.4"/>'),
    // baby bottle
    nursing: w('<path d="M10 3h4M10.5 3v2.5L9 8v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8l-1.5-2.5V3"/><path d="M9 12h3M9 15.5h3"/>'),
    // stroller
    stroller: w('<path d="M3 5h2l2.2 9h10.3l2-6.5H7"/><path d="M12 7.5V3a5 5 0 0 1 5 4.5"/><circle cx="8.5" cy="18.5" r="2"/><circle cx="16.5" cy="18.5" r="2"/>'),
    plus: w('<path d="M12 5v14M5 12h14"/>'),
    search: w('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    chevron: w('<path d="M9 5l7 7-7 7"/>'),
    close: w('<path d="M6 6l12 12M18 6L6 18"/>'),
    pin: w('<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>'),
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/></svg>',
    external: w('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    user: w('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
    camera: w('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>')
  };
})();
