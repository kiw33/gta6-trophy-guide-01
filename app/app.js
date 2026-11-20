// Leonida Trophy Guide — tracker logic. Plain ES module, no dependencies, no
// network beyond fetching our own data/trophies.json. Progress lives in
// localStorage under STORE_KEY and never leaves the browser.
const STORE_KEY = 'leonida-trophy-guide-v1';

// Demo state used only for screenshots: ?demo=1 seeds exactly 7 earned
// trophies (1 platinum, 1 gold, 1 silver, 4 bronze) so the cover shows a
// part-filled tracker. A real visitor never sees this unless they add it.
const DEMO_EARNED = [
  'vice-got-a-price',
  'you-gotta-know-when-to-get-off',
  'cunning-stunts',
  'just-like-paradise',
  'paradise-lost',
  'master-of-none',
  'top-fun',
];

const params = new URLSearchParams(location.search);
const demoMode = params.get('demo') === '1';
const openIds = new Set((params.get('open') ?? '').split(',').filter(Boolean));
const scrollTarget = params.get('section');

const listEl = document.getElementById('trophy-list');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade-filter');
const kindEl = document.getElementById('kind-filter');
const hiddenOnlyEl = document.getElementById('hidden-only');
const missableOnlyEl = document.getElementById('missable-only');
const spoilerEl = document.getElementById('spoiler-toggle');
const countEl = document.getElementById('result-count');

let trophies = [];
let earned = new Set();
let spoilersOn = true;

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    earned = new Set(Array.isArray(raw.earned) ? raw.earned : []);
    spoilersOn = raw.spoilers !== false;
  } catch {
    earned = new Set();
    spoilersOn = true;
  }
  if (demoMode) {
    earned = new Set(DEMO_EARNED);
    spoilersOn = params.get('spoilers') !== 'off';
  } else if (params.get('spoilers') === 'on') {
    spoilersOn = true;
  } else if (params.get('spoilers') === 'off') {
    spoilersOn = false;
  }
  if (params.get('grade')) gradeEl.value = params.get('grade');
  spoilerEl.checked = spoilersOn;
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...earned],
      spoilers: spoilersOn,
    }));
  } catch {
    // Private mode or full storage: the page still works, it just forgets.
  }
}

function counts() {
  const by = (grade) => trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
  return {
    total: earned.size,
    platinum: by('platinum'),
    gold: by('gold'),
    silver: by('silver'),
    bronze: by('bronze'),
  };
}

function renderProgress() {
  const c = counts();
  const total = trophies.length || 55;
  const pct = Math.round((c.total / total) * 100);
  document.getElementById('stat-earned').textContent = String(c.total);
  document.getElementById('stat-platinum').textContent = `${c.platinum} / 1`;
  document.getElementById('stat-gold').textContent = `${c.gold} / 2`;
  document.getElementById('stat-silver').textContent = `${c.silver} / 6`;
  document.getElementById('stat-bronze').textContent = `${c.bronze} / 46`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-text').textContent =
    `${c.total} of ${total} trophies earned — ${pct}%`;
  document.getElementById('progress-bar').setAttribute('aria-valuenow', String(c.total));
}

function badge(t) {
  const tags = [`<span class="grade grade-${t.grade}">${t.grade}</span>`];
  tags.push(`<span class="tag">${t.kind}</span>`);
  if (t.hidden) tags.push('<span class="tag tag-hidden">Hidden</span>');
  if (t.missable) tags.push('<span class="tag tag-missable">Missable</span>');
  if (!t.confirmed) tags.push('<span class="tag tag-unconfirmed">Unconfirmed</span>');
  if (t.stage) tags.push(`<span class="tag">Roadmap step ${t.stage}</span>`);
  return tags.join(' ');
}

function trophyCard(t) {
  const isEarned = earned.has(t.id);
  const el = document.createElement('article');
  el.className = 'trophy' + (isEarned ? ' earned' : '');
  // Spoiler protection: a hidden story trophy stays masked until it is
  // earned. The platinum always shows, and earned trophies always show.
  if (spoilersOn && t.hidden && !isEarned) {
    el.classList.add('spoiler-hidden-card');
    el.innerHTML = `
      <div class="trophy-head"><h3>Hidden trophy</h3>${badge(t)}</div>
      <p class="trophy-desc">Spoiler protection is on. This trophy's name and description stay hidden until you earn it — tick it off below once it pops, or turn spoiler protection off to see it.</p>
      <label class="earned-check"><input type="checkbox" data-trophy="${t.id}"> I earned this one</label>`;
    return el;
  }
  const sources = (t.sources ?? [])
    .map((s) => `<a href="${s.url}" rel="noopener">${s.name}</a>`)
    .join(' · ');
  el.innerHTML = `
    <div class="trophy-head"><h3>${t.name}</h3>${badge(t)}</div>
    <p class="trophy-desc">${t.description}</p>
    <label class="earned-check"><input type="checkbox" data-trophy="${t.id}"${isEarned ? ' checked' : ''}> Earned</label>
    <details${openIds.has(t.id) ? ' open' : ''}>
      <summary>How to unlock it</summary>
      <p>${t.guide}</p>
      ${sources ? `<p class="sources">Sources: ${sources}</p>` : ''}
    </details>`;
  return el;
}

function visible(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
  if (hiddenOnlyEl.checked && !t.hidden) return false;
  if (missableOnlyEl.checked && !t.missable) return false;
  return true;
}

function renderList() {
  listEl.replaceChildren();
  const shown = trophies.filter(visible);
  countEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies.`;
  if (!shown.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No trophies match those filters. Clear the search or the filters to see the full list again.';
    listEl.append(p);
    return;
  }
  for (const t of shown) listEl.append(trophyCard(t));
}

function renderAll() {
  renderProgress();
  renderList();
}

listEl.addEventListener('change', (event) => {
  const box = event.target.closest('input[data-trophy]');
  if (!box) return;
  if (box.checked) earned.add(box.dataset.trophy);
  else earned.delete(box.dataset.trophy);
  saveState();
  renderAll();
});

for (const el of [searchEl, gradeEl, kindEl, hiddenOnlyEl, missableOnlyEl]) {
  el.addEventListener('input', renderList);
}

spoilerEl.addEventListener('change', () => {
  spoilersOn = spoilerEl.checked;
  saveState();
  renderList();
});

document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ earned: [...earned], exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import-file').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = new Set(trophies.map((t) => t.id));
    earned = new Set((data.earned ?? []).filter((id) => ids.has(id)));
    saveState();
    renderAll();
  } catch {
    countEl.textContent = 'That file could not be imported — it is not a progress file from this guide.';
  }
  event.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies in this browser?')) return;
  earned = new Set();
  saveState();
  renderAll();
});

const data = await fetch('data/trophies.json').then((r) => r.json());
trophies = data.trophies ?? data;
loadState();
renderAll();
if (scrollTarget) {
  document.getElementById(scrollTarget)?.scrollIntoView();
}
