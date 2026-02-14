function initWritingTagFilter() {
  const params = new URLSearchParams(window.location.search);
  const tag = (params.get('tag') || '').trim().toLowerCase();

  if (!tag) {
    return;
  }

  const path = window.location.pathname;
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  const isWritingList =
    /(?:^|\/)writing\/$/.test(normalizedPath) ||
    /(?:^|\/)sv\/texter\/$/.test(normalizedPath) ||
    /(?:^|\/)post\/$/.test(normalizedPath);

  if (!isWritingList) {
    return;
  }

  const cards = document.querySelectorAll('.place-article > .article-card[data-tags]');
  if (!cards.length) {
    return;
  }

  cards.forEach((card) => {
    const wrapper = card.closest('.place-article');
    if (!wrapper) {
      return;
    }

    const tags = (card.getAttribute('data-tags') || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const isMatch = tags.includes(tag);
    wrapper.hidden = !isMatch;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWritingTagFilter);
} else {
  initWritingTagFilter();
}
