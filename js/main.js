document.addEventListener('DOMContentLoaded', () => {
  const isArticlePage = window.location.pathname.includes('article.html');

  buildNav();
  buildSidebar();
  buildFooterCountries();
  initBackToTop();
  initNavToggle();

  if (isArticlePage) {
    renderArticleDetail();
  } else {
    initHomepage();
  }
});

/* ===== Navigation ===== */
function buildNav() {
  const navMenu = document.getElementById('navMenu');
  COUNTRIES.forEach(country => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="index.html?country=${country.id}" class="nav-link" data-country="${country.id}">
      <span class="country-emoji">${country.emoji}</span>${country.name}
    </a>`;
    navMenu.appendChild(li);
  });

  const currentCountry = getUrlParam('country');
  if (currentCountry) {
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.country === currentCountry);
    });
  }
}

/* ===== Homepage ===== */
function initHomepage() {
  const country = getUrlParam('country');
  const tag = getUrlParam('tag');
  const search = getUrlParam('search');
  let articles = [...ARTICLES];

  if (country && country !== 'all') {
    articles = articles.filter(a => a.country === country);
    const countryInfo = COUNTRIES.find(c => c.id === country);
    const title = document.getElementById('sectionTitle');
    if (countryInfo) {
      title.textContent = `${countryInfo.emoji} ${countryInfo.name}旅遊文章`;
    }

    const hero = document.getElementById('hero');
    if (hero && countryInfo) {
      hero.querySelector('.hero-title').textContent = `${countryInfo.emoji} ${countryInfo.name}`;
      hero.querySelector('.hero-desc').textContent = countryInfo.description;
    }
  }

  if (tag) {
    articles = articles.filter(a => a.tags.includes(tag));
    document.getElementById('sectionTitle').textContent = `標籤：${tag}`;
  }

  if (search) {
    const q = search.toLowerCase();
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
    document.getElementById('sectionTitle').textContent = `搜尋：${search}`;
  }

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  const count = document.getElementById('articleCount');
  count.textContent = `共 ${articles.length} 篇`;

  renderArticles(articles);
  initSearch();
}

/* ===== Render Article Cards ===== */
function renderArticles(articles) {
  const grid = document.getElementById('articlesGrid');
  grid.innerHTML = '';

  if (articles.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>找不到相關文章</h3>
        <p>換個關鍵字試試看吧！</p>
      </div>`;
    return;
  }

  const pageSize = 6;
  let currentPage = 1;
  const totalPages = Math.ceil(articles.length / pageSize);

  function showPage() {
    const start = 0;
    const end = currentPage * pageSize;
    const visible = articles.slice(start, end);

    grid.innerHTML = '';
    visible.forEach((article, index) => {
      const country = COUNTRIES.find(c => c.id === article.country);
      const card = document.createElement('div');
      card.className = `article-card${index === 0 ? ' featured' : ''}`;
      card.innerHTML = `
        <div class="article-card-image">
          <a href="article.html?id=${article.id}">
            <img src="${article.image}" alt="${article.title}" loading="lazy">
          </a>
          <span class="article-card-country">${country ? country.emoji + ' ' + country.name : ''}</span>
        </div>
        <div class="article-card-body">
          <div class="article-card-meta">
            <span class="date">${formatDate(article.date)}</span>
            <span class="read-time">${article.readTime} 分鐘閱讀</span>
            <span class="views">👁 ${formatViews(getViews(article))} 次觀看</span>
          </div>
          <a href="article.html?id=${article.id}">
            <h3 class="article-card-title">${article.title}</h3>
          </a>
          <p class="article-card-excerpt">${article.excerpt}</p>
          <div class="article-card-tags">
            ${article.tags.map(t => `<a href="index.html?tag=${t}" class="tag">#${t}</a>`).join('')}
          </div>
          <a href="article.html?id=${article.id}" class="read-more">繼續閱讀</a>
        </div>`;
      grid.appendChild(card);
    });

    const loadMore = document.getElementById('loadMore');
    if (loadMore) {
      loadMore.style.display = currentPage < totalPages ? 'block' : 'none';
    }
  }

  showPage();

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      showPage();
      window.scrollBy({ top: -100, behavior: 'smooth' });
    });
  }
}

/* ===== Article Detail ===== */
function renderArticleDetail() {
  const id = parseInt(getUrlParam('id'));
  const article = ARTICLES.find(a => a.id === id);
  const container = document.getElementById('articleDetail');

  if (!article) {
    container.innerHTML = `
      <div class="article-detail-body">
        <div class="no-results">
          <div class="no-results-icon">😕</div>
          <h3>找不到這篇文章</h3>
          <p><a href="index.html" style="color: var(--primary);">回到首頁</a></p>
        </div>
      </div>`;
    return;
  }

  const country = COUNTRIES.find(c => c.id === article.country);
  document.title = `${article.title} - 漫遊世界`;

  incrementViews(article.id);
  const currentViews = getViews(article);

  const prevArticle = ARTICLES.find(a => a.id === id - 1);
  const nextArticle = ARTICLES.find(a => a.id === id + 1);

  container.innerHTML = `
    <div class="article-hero-image">
      <img src="${article.image}" alt="${article.title}">
    </div>
    <div class="article-detail-body">
      <div class="article-breadcrumb">
        <a href="index.html">首頁</a>
        <span>›</span>
        <a href="index.html?country=${article.country}">${country ? country.emoji + ' ' + country.name : ''}</a>
        <span>›</span>
        <span>${article.title}</span>
      </div>
      <h1 class="article-detail-title">${article.title}</h1>
      <div class="article-detail-meta">
        <span>📅 ${formatDate(article.date)}</span>
        <span>⏱ ${article.readTime} 分鐘閱讀</span>
        <span>👁 ${formatViews(currentViews)} 次觀看</span>
        <span>${country ? country.emoji + ' ' + country.name : ''}</span>
      </div>
      <div class="article-detail-tags">
        ${article.tags.map(t => `<a href="index.html?tag=${t}" class="tag">#${t}</a>`).join('')}
      </div>
      <div class="article-detail-content">
        ${article.content}
      </div>
      <div class="article-nav">
        ${prevArticle ? `
          <a href="article.html?id=${prevArticle.id}" class="prev">
            <span class="article-nav-label">← 上一篇</span>
            <span class="article-nav-title">${prevArticle.title}</span>
          </a>` : '<div></div>'}
        ${nextArticle ? `
          <a href="article.html?id=${nextArticle.id}" class="next">
            <span class="article-nav-label">下一篇 →</span>
            <span class="article-nav-title">${nextArticle.title}</span>
          </a>` : '<div></div>'}
      </div>
    </div>`;

  renderRelatedArticles(article);
}

function renderRelatedArticles(article) {
  const relatedList = document.getElementById('relatedList');
  if (!relatedList) return;

  const related = ARTICLES
    .filter(a => a.country === article.country && a.id !== article.id)
    .slice(0, 4);

  relatedList.innerHTML = related.map(a => `
    <li class="popular-item">
      <a href="article.html?id=${a.id}" class="popular-item-image">
        <img src="${a.image}" alt="${a.title}" loading="lazy">
      </a>
      <div class="popular-item-info">
        <a href="article.html?id=${a.id}" class="popular-item-title">${a.title}</a>
        <div class="popular-item-date">${formatDate(a.date)}</div>
      </div>
    </li>`).join('');
}

/* ===== Sidebar ===== */
function buildSidebar() {
  buildCategoryList();
  buildPopularList();
  buildTagCloud();
}

function buildCategoryList() {
  const list = document.getElementById('categoryList');
  if (!list) return;

  COUNTRIES.forEach(country => {
    const count = ARTICLES.filter(a => a.country === country.id).length;
    const li = document.createElement('li');
    li.innerHTML = `<a href="index.html?country=${country.id}">
      <span>${country.emoji} ${country.name}</span>
      <span class="category-count">${count}</span>
    </a>`;
    list.appendChild(li);
  });
}

function buildPopularList() {
  const list = document.getElementById('popularList');
  if (!list) return;

  const popular = [...ARTICLES]
    .sort((a, b) => getViews(b) - getViews(a))
    .slice(0, 5);

  list.innerHTML = popular.map(a => `
    <li class="popular-item">
      <a href="article.html?id=${a.id}" class="popular-item-image">
        <img src="${a.image}" alt="${a.title}" loading="lazy">
      </a>
      <div class="popular-item-info">
        <a href="article.html?id=${a.id}" class="popular-item-title">${a.title}</a>
        <div class="popular-item-date">${formatDate(a.date)}</div>
      </div>
    </li>`).join('');
}

function buildTagCloud() {
  const cloud = document.getElementById('tagCloud');
  if (!cloud) return;

  const allTags = ARTICLES.flatMap(a => a.tags);
  const tagCount = {};
  allTags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });

  const sortedTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  cloud.innerHTML = sortedTags
    .map(([tag]) => `<a href="index.html?tag=${tag}" class="tag">#${tag}</a>`)
    .join('');
}

/* ===== Footer ===== */
function buildFooterCountries() {
  const list = document.getElementById('footerCountries');
  if (!list) return;

  list.innerHTML = COUNTRIES
    .map(c => `<li><a href="index.html?country=${c.id}">${c.emoji} ${c.name}</a></li>`)
    .join('');
}

/* ===== Search ===== */
function initSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  if (!input || !btn) return;

  function doSearch() {
    const q = input.value.trim();
    if (q) {
      window.location.href = `index.html?search=${encodeURIComponent(q)}`;
    }
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  const currentSearch = getUrlParam('search');
  if (currentSearch) {
    input.value = currentSearch;
  }
}

/* ===== Back to Top ===== */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ===== Mobile Nav Toggle ===== */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.main-nav')) {
      menu.classList.remove('open');
    }
  });
}

/* ===== View Count ===== */
function getViews(article) {
  const extra = parseInt(localStorage.getItem(`views_${article.id}`)) || 0;
  return (article.views || 0) + extra;
}

function incrementViews(articleId) {
  const key = `views_${articleId}`;
  const current = parseInt(localStorage.getItem(key)) || 0;
  localStorage.setItem(key, current + 1);
}

function formatViews(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '萬';
  }
  return num.toLocaleString();
}

/* ===== Utilities ===== */
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
