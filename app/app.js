// Leonida Trophy Guide — checklist tracker for the 55 GTA VI trophies.
// Static, offline: the only file it fetches is its own data/trophies.json.
// Progress (earned trophy names) and the spoiler setting live in localStorage;
// export writes them to a file, import reads one back.
//
// Rebuilt 2026-11-20 under a live make.fun recording. Two fixes in this pass:
// the kind chips are built once instead of being rebuilt (and re-listened) on
// every render, and toggling a trophy's checkbox keeps keyboard focus on that
// trophy instead of dropping it when the list re-renders.
const STORE_KEY = 'leonida-trophy-guide-v1';
const SETTINGS_KEY = 'leonida-trophy-guide-settings-v1';

const KIND_LABELS = {
  all: 'All kinds',
  story: 'Story',
  missable: 'Missable',
  collectible: 'Collectibles',
  activity: 'Activities',
  robbery: 'Robberies',
  side: 'Side quests',
  misc: 'Misc',
  online: 'Online',
};
const KIND_ORDER = ['all', 'story', 'missable', 'collectible', 'activity', 'robbery', 'side', 'misc', 'online'];

const listEl = document.getElementById('trophy-list');
const countEl = document.getElementById('list-count');
const emptyEl = document.getElementById('empty-state');
const onlineEl = document.getElementById('online-note');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade-filter');
const earnedEl = document.getElementById('earned-filter');
const spoilerEl = document.getElementById('spoiler-toggle');
const chipsEl = document.getElementById('kind-chips');
const noteEl = document.getElementById('controls-note');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

let doc = null;
let earned = new Set();
let spoilerOn = true;
let kindFilter = 'all';

function loadStored() {
  try { earned = new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]')); }
  catch { earned = new Set(); }
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (typeof settings.spoilerOn === 'boolean') spoilerOn = settings.spoilerOn;
  } catch { /* keep defaults */ }
}

function saveStored() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort()));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ spoilerOn }));
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function kindLabel(t) {
  if (t.kind === 'platinum') return 'Platinum';
  if (t.kind === 'completion') return 'Completion';
  return KIND_LABELS[t.kind] ?? t.kind;
}

function stageLabel(t) {
  return `Roadmap ${t.stage}`;
}

function matchesFilters(t) {
  if (kindFilter === 'online') return false; // GTA VI has no online trophies
  if (kindFilter === 'missable' && !t.missable) return false;
  if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (earnedEl.value === 'earned' && !earned.has(t.name)) return false;
  if (earnedEl.value === 'todo' && earned.has(t.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sourceLinks(t) {
  if (!t.sources || !doc.sources) return null;
  const frag = document.createDocumentFragment();
  for (const key of t.sources) {
    const s = doc.sources[key];
    if (!s) continue;
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      frag.append(a);
    } else {
      const span = document.createElement('span');
      span.textContent = s.name;
      frag.append(span);
    }
  }
  return frag;
}

function trophyCard(t) {
  const isEarned = earned.has(t.name);
  const hiddenBySpoiler = spoilerOn && t.kind === 'story' && !isEarned;
  const card = document.createElement('article');
  card.className = 'trophy' + (isEarned ? ' earned' : '') + (t.missable ? ' missable-flag' : '');
  card.dataset.name = t.name;
  card.dataset.kind = t.kind;
  card.dataset.grade = t.grade;

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned;
  box.setAttribute('aria-label', `Mark ${hiddenBySpoiler ? 'story trophy' : t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name); else earned.delete(t.name);
    saveStored();
    render();
    // The re-render replaces this checkbox, so put focus back on the same
    // trophy's new checkbox instead of dropping the user at the top.
    const again = listEl.querySelector(`[data-name="${CSS.escape(t.name)}"] input[type="checkbox"]`);
    if (again) again.focus();
  });
  card.append(box);

  const body = document.createElement('div');

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const name = document.createElement('span');
  name.className = 'trophy-name';
  name.textContent = hiddenBySpoiler ? 'Hidden story trophy' : t.name;
  head.append(name);
  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${t.grade}`;
  badge.textContent = gradeLabel(t);
  head.append(badge);
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = kindLabel(t);
  head.append(kindTag);
  const stageTag = document.createElement('span');
  stageTag.className = 'tag';
  stageTag.textContent = stageLabel(t);
  head.append(stageTag);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = '⚠ Potentially missable';
    head.append(m);
  }
  if (t.hidden) {
    const h = document.createElement('span');
    h.className = 'tag';
    h.textContent = 'Hidden on PSN';
    head.append(h);
  }
  body.append(head);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = hiddenBySpoiler
    ? 'Story trophy — its name and description stay hidden until you earn it.'
    : `“${t.description}” — official description`;
  body.append(desc);

  if (hiddenBySpoiler) {
    const mask = document.createElement('p');
    mask.className = 'spoiler-mask';
    mask.textContent = 'Guide hidden until earned — turn “Hide story spoilers” off to read it now.';
    body.append(mask);
  } else {
    const guide = document.createElement('p');
    guide.className = 'trophy-guide';
    guide.textContent = t.guide;
    body.append(guide);
    const src = document.createElement('p');
    src.className = 'trophy-sources';
    src.textContent = 'Sources: ';
    const links = sourceLinks(t);
    if (links) src.append(links);
    body.append(src);
  }

  card.append(body);
  return card;
}

function renderRoadmap() {
  const steps = document.getElementById('roadmap-steps');
  steps.replaceChildren();
  for (const s of doc.roadmap) {
    const li = document.createElement('li');
    const no = document.createElement('span');
    no.className = 'step-no';
    no.textContent = `Step ${s.stage}`;
    li.append(no, document.createElement('br'));
    const title = document.createElement('strong');
    title.textContent = s.title;
    li.append(title, document.createElement('br'));
    const time = document.createElement('span');
    time.className = 'step-time';
    time.textContent = s.time;
    li.append(time);
    const p = document.createElement('p');
    p.textContent = s.text;
    li.append(p);
    steps.append(li);
  }
}

// Built once at startup; render() only flips the pressed state, instead of
// rebuilding the chips (and their listeners) on every keystroke or toggle.
function buildChips() {
  chipsEl.replaceChildren();
  for (const kind of KIND_ORDER) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = KIND_LABELS[kind];
    b.dataset.kind = kind;
    b.setAttribute('aria-pressed', String(kindFilter === kind));
    b.addEventListener('click', () => {
      kindFilter = kind;
      render();
    });
    chipsEl.append(b);
  }
}

function updateChips() {
  for (const b of chipsEl.children) {
    b.setAttribute('aria-pressed', String(b.dataset.kind === kindFilter));
  }
}

function renderSources() {
  const ul = document.getElementById('source-list');
  ul.replaceChildren();
  for (const key of Object.keys(doc.sources)) {
    const s = doc.sources[key];
    const li = document.createElement('li');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      li.append(a);
    } else {
      li.textContent = s.name;
    }
    ul.append(li);
  }
}

function renderProgress() {
  const total = doc.trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  progressFill.style.width = `${pct}%`;
  const byGrade = {};
  for (const t of doc.trophies) if (earned.has(t.name)) byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
  const parts = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g] ?? 0} ${g}`)
    .join(' · ');
  progressText.textContent = done === total
    ? `Platinum earned — ${done} of ${total} trophies!`
    : `${done} of ${total} earned (${pct}%) — ${parts}. ${total - done} to go.`;
}

function render() {
  renderProgress();
  updateChips();
  const shown = doc.trophies.filter(matchesFilters);
  listEl.replaceChildren();
  for (const t of shown) listEl.append(trophyCard(t));
  countEl.textContent = kindFilter === 'online'
    ? 'Showing 0 of 55 trophies'
    : `Showing ${shown.length} of ${doc.trophies.length} trophies`;
  emptyEl.hidden = shown.length !== 0 || kindFilter === 'online';
  onlineEl.hidden = kindFilter !== 'online';
  noteEl.textContent = spoilerOn
    ? 'Spoiler protection is on: story trophies stay hidden until you earn them (or turn it off).'
    : 'Spoiler protection is off: every story trophy name and guide is visible.';
  spoilerEl.checked = spoilerOn;
}

function exportProgress() {
  const payload = {
    app: 'leonida-trophy-guide',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const known = new Set(doc.trophies.map((t) => t.name));
    const valid = names.filter((n) => typeof n === 'string' && known.has(n));
    earned = new Set(valid);
    saveStored();
    render();
    noteEl.textContent = `Imported ${valid.length} earned trophies${names.length - valid.length ? ` (${names.length - valid.length} unknown names skipped)` : ''}.`;
  } catch {
    noteEl.textContent = 'That file could not be imported — it is not a progress export from this guide.';
  }
}

document.getElementById('export-btn').addEventListener('click', exportProgress);
document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importProgress(file);
  e.target.value = '';
});
document.getElementById('reset-btn').addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveStored();
    render();
  }
});
spoilerEl.addEventListener('change', () => { spoilerOn = spoilerEl.checked; saveStored(); render(); });
searchEl.addEventListener('input', render);
gradeEl.addEventListener('change', render);
earnedEl.addEventListener('change', render);

loadStored();
buildChips();
const res = await fetch('data/trophies.json');
doc = await res.json();
renderRoadmap();
renderSources();
render();
window.__guideReady = true;
