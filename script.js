const root = document.documentElement;
const themeToggle = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('.theme-icon');
const themeLabel = document.querySelector('.theme-label');
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const progress = document.querySelector('#reading-progress');

function setTheme(theme) {
  root.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeIcon.textContent = isDark ? '☾' : '☼';
  themeLabel.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  localStorage.setItem('one-sol-theme', theme);
}

const savedTheme = localStorage.getItem('one-sol-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});

menuToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.document-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const card = trigger.closest('.document-card');
    const content = document.getElementById(trigger.getAttribute('aria-controls'));
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isOpen));
    card.classList.toggle('is-open', !isOpen);
    content.hidden = isOpen;
  });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

function updateReadingProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.transform = `scaleX(${percentage})`;
}

window.addEventListener('scroll', updateReadingProgress, { passive: true });
updateReadingProgress();

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function linkifyEmails(text) {
  return text.replace(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g, '<a href="mailto:$1">$1</a>');
}

function boldLeadingLabel(text) {
  return text.replace(/^([^:<]{2,60}?):\s/, '<strong>$1:</strong> ');
}

function parseLegalDocument(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  lines.shift();

  let updated = '';
  if (lines[0] && /^Última actualización:/i.test(lines[0])) {
    updated = lines.shift().replace(/^Última actualización:\s*/i, '');
  }

  const topHeaderPattern = /^\d+\.\s+.+$/;
  const subHeaderPattern = /^\d+\.\d+\s+.+$/;

  let sectionCount = 0;
  const html = lines
    .map((line) => {
      if (topHeaderPattern.test(line)) {
        sectionCount += 1;
        return `<h3>${escapeHtml(line)}</h3>`;
      }
      if (subHeaderPattern.test(line)) {
        return `<h3>${escapeHtml(line)}</h3>`;
      }
      return `<p>${boldLeadingLabel(linkifyEmails(escapeHtml(line)))}</p>`;
    })
    .join('');

  return { updated, sectionCount, html };
}

async function loadLegalDocument(container) {
  const source = container.dataset.docSrc;
  const updatedEl = container.querySelector('[data-doc-updated]');
  const countEl = container.querySelector('[data-doc-count]');
  const bodyEl = container.querySelector('[data-doc-body]');

  try {
    const response = await fetch(source, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`No se pudo cargar ${source}`);
    const text = await response.text();
    const { updated, sectionCount, html } = parseLegalDocument(text);

    updatedEl.textContent = updated ? `Última actualización: ${updated}` : '';
    countEl.textContent = sectionCount ? `${sectionCount} ${sectionCount === 1 ? 'sección' : 'secciones'}` : '';
    bodyEl.innerHTML = html;
  } catch (error) {
    updatedEl.textContent = '';
    countEl.textContent = '';
    bodyEl.innerHTML = '<p>No se pudo cargar el documento. Intenta recargar la página.</p>';
  }
}

document.querySelectorAll('[data-doc-src]').forEach(loadLegalDocument);
