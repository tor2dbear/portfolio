/**
 * Portfolio Print Module
 * Generates a printable portfolio page by fetching project content
 */

(function () {
  'use strict';

  // Check if we're in portfolio-print mode
  const urlParams = new URLSearchParams(window.location.search);
  const isPrintMode = urlParams.get('mode') === 'portfolio-print';

  if (!isPrintMode) {
    return;
  }

  // Add print mode class to body
  document.documentElement.classList.add('portfolio-print-mode');

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', initPortfolioPrint);

  async function initPortfolioPrint() {
    // Get all project links from the portfolio grid
    const projectLinks = document.querySelectorAll(
      '.application-page__section--portfolio .summary-card a'
    );

    if (projectLinks.length === 0) {
      console.warn('No projects found for portfolio print');
      return;
    }

    // Create print container
    const printContainer = createPrintContainer();

    // Show loading state
    printContainer.innerHTML = `
      <div class="portfolio-print__loading">
        <p>Loading portfolio... (${projectLinks.length} projects)</p>
      </div>
    `;

    // Fetch all project content
    const projects = await fetchProjects(projectLinks);

    // Render projects
    renderProjects(printContainer, projects);

    // Add print controls
    addPrintControls(printContainer);

    // Auto-trigger print after a short delay (optional)
    // setTimeout(() => window.print(), 1000);
  }

  function createPrintContainer() {
    // Hide original content
    const originalContent = document.querySelector('.application-page');
    if (originalContent) {
      originalContent.style.display = 'none';
    }

    // Create print container
    const container = document.createElement('div');
    container.className = 'portfolio-print';
    container.id = 'portfolio-print';

    // Insert after header or at start of main
    const main = document.querySelector('#main') || document.body;
    main.insertBefore(container, main.firstChild);

    return container;
  }

  async function fetchProjects(projectLinks) {
    const projects = [];

    for (const link of projectLinks) {
      try {
        const url = link.href;
        const response = await fetch(url);
        const html = await response.text();

        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract project data
        const project = {
          url: url,
          title: doc.querySelector('h1')?.textContent || 'Untitled',
          description:
            doc.querySelector('.type-preamble')?.textContent || '',
          content: doc.querySelector('.post-content')?.innerHTML || '',
          images: extractImages(doc),
          meta: extractMeta(doc),
        };

        projects.push(project);
      } catch (error) {
        console.error('Failed to fetch project:', link.href, error);
      }
    }

    return projects;
  }

  function extractImages(doc) {
    const images = [];
    const imgElements = doc.querySelectorAll('.post-content img, figure img');

    imgElements.forEach((img, index) => {
      if (index < 4) {
        // Limit to 4 images per project
        images.push({
          src: img.src,
          alt: img.alt || '',
        });
      }
    });

    return images;
  }

  function extractMeta(doc) {
    const meta = {};
    const projectInfo = doc.querySelector('.project-info');

    if (projectInfo) {
      const items = projectInfo.querySelectorAll('.project-info__item');
      items.forEach((item) => {
        const dt = item.querySelector('dt');
        const dd = item.querySelector('dd');
        if (dt && dd) {
          meta[dt.textContent.trim()] = dd.textContent.trim();
        }
      });
    }

    return meta;
  }

  function renderProjects(container, projects) {
    const currentUrl = window.location.href.split('?')[0];

    let html = `
      <header class="portfolio-print__header">
        <h1>Portfolio</h1>
        <p class="portfolio-print__subtitle">Selected works</p>
      </header>
    `;

    projects.forEach((project, index) => {
      html += `
        <article class="portfolio-print__project">
          <header class="portfolio-print__project-header">
            <h2>${project.title}</h2>
            ${project.description ? `<p class="portfolio-print__description">${project.description}</p>` : ''}
          </header>

          ${renderMeta(project.meta)}
          ${renderImages(project.images)}

          <div class="portfolio-print__content">
            ${project.content}
          </div>
        </article>
      `;
    });

    html += `
      <footer class="portfolio-print__footer">
        <p>View online: <strong>${currentUrl}</strong></p>
      </footer>
    `;

    container.innerHTML = html;
  }

  function renderMeta(meta) {
    const entries = Object.entries(meta);
    if (entries.length === 0) return '';

    let html = '<dl class="portfolio-print__meta">';
    entries.forEach(([key, value]) => {
      html += `
        <div class="portfolio-print__meta-item">
          <dt>${key}</dt>
          <dd>${value}</dd>
        </div>
      `;
    });
    html += '</dl>';

    return html;
  }

  function renderImages(images) {
    if (images.length === 0) return '';

    let html = '<div class="portfolio-print__images">';
    images.forEach((img) => {
      html += `<figure><img src="${img.src}" alt="${img.alt}" loading="lazy"></figure>`;
    });
    html += '</div>';

    return html;
  }

  function addPrintControls(container) {
    const controls = document.createElement('div');
    controls.className = 'portfolio-print__controls';
    controls.innerHTML = `
      <a href="${window.location.href.split('?')[0]}" class="portfolio-print__back">&larr; Back to application</a>
      <button class="portfolio-print__print-btn" onclick="window.print()">Print / Save as PDF</button>
    `;

    container.insertBefore(controls, container.firstChild);
  }
})();
