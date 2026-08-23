// ── Configuración ────────────────────────────────
const STORAGE_KEY = '1sol-theme';
const DOCS = {
  terms:   'terminos.html',
  privacy: 'privacidad.html',
};

const activeClasses   = ['bg-blue-900', 'text-white', 'border-blue-900', 'shadow-md'];
const inactiveClasses = [
  'bg-white', 'text-slate-700', 'border-slate-200', 'hover:border-blue-900/60',
  'dark:bg-slate-800', 'dark:text-slate-300', 'dark:border-slate-700',
];

// ── Dark Mode ────────────────────────────────────
const html   = document.documentElement;
const toggle = document.getElementById('darkToggle');

function applyTheme(dark) {
  html.classList.toggle('dark', dark);
  toggle.checked = dark;
}

const savedTheme  = localStorage.getItem(STORAGE_KEY);
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

toggle.addEventListener('change', () => {
  applyTheme(toggle.checked);
  localStorage.setItem(STORAGE_KEY, toggle.checked ? 'dark' : 'light');
});

// ── Carga de documentos con fetch ────────────────
const viewer   = document.getElementById('doc-viewer');
const cache    = {};        // caché para no repetir fetch

async function showDoc(docId) {
  // Estado de botones
  const btnTerms   = document.getElementById('btn-terms');
  const btnPrivacy = document.getElementById('btn-privacy');

  [btnTerms, btnPrivacy].forEach(btn => {
    activeClasses.forEach(c   => btn.classList.remove(c));
    inactiveClasses.forEach(c => btn.classList.add(c));
  });
  const activeBtn = docId === 'terms' ? btnTerms : btnPrivacy;
  inactiveClasses.forEach(c => activeBtn.classList.remove(c));
  activeClasses.forEach(c   => activeBtn.classList.add(c));

  // Si ya está en caché, insertar directamente
  if (cache[docId]) {
    renderContent(cache[docId]);
    return;
  }

  // Skeleton mientras carga
  viewer.innerHTML = `
    <div class="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7 sm:p-10 space-y-4">
      <div class="skeleton h-4 w-32"></div>
      <div class="skeleton h-7 w-3/4"></div>
      <div class="skeleton h-px w-full my-2"></div>
      <div class="skeleton h-4 w-full"></div>
      <div class="skeleton h-4 w-5/6"></div>
      <div class="skeleton h-4 w-4/6"></div>
      <div class="skeleton h-5 w-48 mt-4"></div>
      <div class="skeleton h-4 w-full"></div>
      <div class="skeleton h-4 w-full"></div>
      <div class="skeleton h-4 w-3/4"></div>
    </div>`;

  try {
    const res  = await fetch(DOCS[docId]);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    cache[docId] = html;
    renderContent(html);
  } catch (err) {
    viewer.innerHTML = `
      <div class="rounded-2xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 shadow-sm p-10 text-center">
        <p class="text-slate-500 dark:text-slate-400 text-sm">No se pudo cargar el documento. Inténtalo de nuevo.</p>
        <button onclick="showDoc('${docId}')"
          class="mt-4 text-xs font-semibold px-4 py-2 rounded-xl bg-blue-900 text-white hover:bg-blue-800">
          Reintentar
        </button>
      </div>`;
  }
}

function renderContent(html) {
  viewer.innerHTML = html;
  // Reiniciar animación
  const article = viewer.querySelector('article');
  if (article) {
    article.classList.remove('doc-fade');
    void article.offsetWidth;
    article.classList.add('doc-fade');
  }
  // Scroll suave en móvil
  if (window.innerWidth < 1024) {
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Carga inicial ────────────────────────────────
showDoc('terms');
