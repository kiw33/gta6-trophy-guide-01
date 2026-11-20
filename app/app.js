'use strict';

/* Leonida Trophy Guide — tracker logic.
   Loads app/data/trophies.json, renders the checklist, and keeps progress
   in localStorage. No network requests beyond the trophy data file itself. */

const DATA_URL = 'data/trophies.json';
const STORAGE_KEY = 'leonida-trophy-guide-v1';

const SOURCE_LINKS = {
  PowerPyx: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/',
  Exophase: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  PSNProfiles: 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
  SixShore: 'https://sixshore.com/gta-6/guides/trophies-and-achievements/',
  'GTA-Zone': 'https://gta-zone.com/news/gta-6-trophies-achievements/'
};

const KIND_LABELS = {
  all: 'All kinds',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  robberies: 'Robberies',
  side: 'Side quests',
  misc: 'Misc',
  online: 'Online',
  platinum: 'Platinum'
};

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

let allTrophies = [];
const earnedNames = new Set();
const filters = { query: '', grade: 'all', progress: 'all', kind: 'all' };
let spoilerOn = false;

const $ = (id) => document.getElementById(id);

function loadTrophyData() {
  return fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) throw new Error('Could not load ' + DATA_URL + ' (' + response.status + ')');
      return response.json();
    })
    .then((data) => {
      allTrophies = Array.isArray(data) ? data : data.trophies;
      if (!Array.isArray(allTrophies)) throw new Error('trophies.json has no trophies array');
      restoreSavedState();
      wireToolbarEvents();
      renderProgressSummary();
      renderTrophyList();
    })
    .catch((error) => {
      const list = $('trophyList');
      list.textContent = 'Could not load the trophy list: ' + error.message;
    });
}

function restoreSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) {
      saved.earned.forEach((name) => {
        if (allTrophies.some((t) => t.name === name)) earnedNames.add(name);
      });
    }
    if (typeof saved.spoiler === 'boolean') spoilerOn = saved.spoiler;
  } catch (error) {
    /* A corrupt save is ignored; the tracker just starts empty. */
  }
  $('spoilerToggle').checked = spoilerOn;
}

function saveProgressState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: Array.from(earnedNames).sort(),
      spoiler: spoilerOn
    }));
  } catch (error) {
    /* Private mode or a full store: progress just does not persist. */
  }
}

function renderProgressSummary() {
  const total = allTrophies.length;
  const earned = earnedNames.size;
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);
  $('progressFill').style.width = percent + '%';

  const byGrade = {};
  earnedNames.forEach((name) => {
    const trophy = allTrophies.find((t) => t.name === name);
    if (trophy) byGrade[trophy.grade] = (byGrade[trophy.grade] || 0) + 1;
  });
  const parts = GRADE_ORDER
    .filter((grade) => byGrade[grade])
    .map((grade) => byGrade[grade] + ' ' + grade);
  let text = earned + ' of ' + total + ' earned (' + percent + '%)';
  if (parts.length > 0) text += ' — ' + parts.join(' · ');
  text += earned === total && total > 0 ? ' — platinum complete!' : '. ' + (total - earned) + ' to go.';
  $('progressText').textContent = text;
}


function trophyMatchesFilters(trophy) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.progress === 'earned' && !earnedNames.has(trophy.name)) return false;
  if (filters.progress === 'unearned' && earnedNames.has(trophy.name)) return false;
  if (filters.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (filters.kind !== 'all' && trophy.kind !== filters.kind) {
    return false;
  }
  if (filters.query) {
    const haystack = [trophy.name, trophy.description, trophy.guide, trophy.target || '']
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(filters.query)) return false;
  }
  return true;
}

function renderTrophyList() {
  const list = $('trophyList');
  const focusName = keepCheckboxFocus(list);
  list.textContent = '';
  const visible = allTrophies.filter(trophyMatchesFilters);
  visible.forEach((trophy) => list.appendChild(buildTrophyCard(trophy)));
  $('showingText').textContent = 'Showing ' + visible.length + ' of ' + allTrophies.length + ' trophies';
  $('noResults').hidden = visible.length !== 0;
  if (focusName) {
    const box = list.querySelector('input[data-name="' + cssEscape(focusName) + '"]');
    if (box) box.focus();
  }
}

/* Remember which checkbox had focus before a re-render so checking a
   trophy does not drop keyboard users back to the top of the page. */
function keepCheckboxFocus(list) {
  const active = document.activeElement;
  if (active && active.dataset && active.dataset.name && list.contains(active)) {
    return active.dataset.name;
  }
  return null;
}

function cssEscape(value) {
  return value.replace(/["\\]/g, '\\$&');
}

function buildTrophyCard(trophy) {
  const earned = earnedNames.has(trophy.name);
  const spoilerHidden = spoilerOn && trophy.kind === 'story' && !earned;

  const card = document.createElement('article');
  card.className = 'trophy-card' + (earned ? ' earned' : '') + (trophy.missable ? ' missable-flag' : '') + (spoilerHidden ? ' spoiler-hidden' : '');

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned;
  check.dataset.name = trophy.name;
  check.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  check.addEventListener('change', () => {
    if (check.checked) earnedNames.add(trophy.name);
    else earnedNames.delete(trophy.name);
    saveProgressState();
    renderProgressSummary();
    renderTrophyList();
  });
  card.appendChild(check);

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const title = document.createElement('h3');
  title.textContent = spoilerHidden ? 'Hidden story trophy' : trophy.name;
  head.appendChild(title);

  const badge = document.createElement('span');
  badge.className = 'grade-badge grade-' + trophy.grade;
  badge.textContent = trophy.grade;
  head.appendChild(badge);

  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
  head.appendChild(kindTag);

  const stageTag = document.createElement('span');
  stageTag.className = 'tag';
  stageTag.textContent = 'Roadmap ' + trophy.stage;
  head.appendChild(stageTag);

  if (trophy.hidden) {
    const hiddenTag = document.createElement('span');
    hiddenTag.className = 'tag';
    hiddenTag.textContent = 'Hidden on PSN';
    head.appendChild(hiddenTag);
  }
  if (trophy.missable) {
    const missTag = document.createElement('span');
    missTag.className = 'tag missable-tag';
    missTag.textContent = 'Missable';
    head.appendChild(missTag);
  }
  if (trophy.unconfirmed) {
    const uncTag = document.createElement('span');
    uncTag.className = 'tag unconfirmed-tag';
    uncTag.textContent = 'Unconfirmed';
    head.appendChild(uncTag);
  }
  card.appendChild(head);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = spoilerHidden
    ? 'Story trophy — its name and description stay hidden until you earn it.'
    : '“' + trophy.description + '” — official description';
  card.appendChild(desc);

  if (!spoilerHidden && trophy.target) {
    const target = document.createElement('p');
    target.className = 'trophy-target';
    target.textContent = trophy.target;
    card.appendChild(target);
  }

  const guide = document.createElement('p');
  guide.className = 'trophy-guide' + (trophy.unconfirmed ? ' unconfirmed-note' : '');
  guide.textContent = spoilerHidden
    ? 'Guide hidden until earned — turn “Hide story spoilers” off to read it now.'
    : trophy.guide;
  card.appendChild(guide);

  if (!spoilerHidden) {
    const sources = document.createElement('p');
    sources.className = 'trophy-sources';
    sources.appendChild(document.createTextNode('Sources: '));
    (trophy.sources || ['PowerPyx']).forEach((sourceName, index) => {
      if (index > 0) sources.appendChild(document.createTextNode(' '));
      const link = document.createElement('a');
      link.href = SOURCE_LINKS[sourceName] || '#';
      link.textContent = sourceName === 'PowerPyx'
        ? 'PowerPyx — GTA 6 Trophy Guide & Roadmap'
        : sourceName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      sources.appendChild(link);
    });
    card.appendChild(sources);
  }

  return card;
}


function updateSpoilerNote() {
  $('spoilerNote').textContent = spoilerOn
    ? 'Spoiler protection is on: story trophies stay hidden until you earn them (or turn it off).'
    : 'Spoiler protection is off: every story trophy name and guide is visible.';
}

function exportProgressFile() {
  const payload = {
    app: 'leonida-trophy-guide',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: Array.from(earnedNames).sort(),
    spoiler: spoilerOn
  };
  const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgressFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error('not a progress file');
      const known = new Set(allTrophies.map((t) => t.name));
      const imported = data.earned.filter((name) => known.has(name));
      earnedNames.clear();
      imported.forEach((name) => earnedNames.add(name));
      if (typeof data.spoiler === 'boolean') {
        spoilerOn = data.spoiler;
        $('spoilerToggle').checked = spoilerOn;
      }
      saveProgressState();
      updateSpoilerNote();
      renderProgressSummary();
      renderTrophyList();
    } catch (error) {
      window.alert('That file is not a Leonida Trophy Guide progress export.');
    }
  };
  reader.readAsText(file);
}

function resetProgress() {
  if (!window.confirm('Clear every earned trophy? This cannot be undone.')) return;
  earnedNames.clear();
  saveProgressState();
  renderProgressSummary();
  renderTrophyList();
}

function wireToolbarEvents() {
  $('searchInput').addEventListener('input', (event) => {
    filters.query = event.target.value.trim().toLowerCase();
    renderTrophyList();
  });
  $('gradeSelect').addEventListener('change', (event) => {
    filters.grade = event.target.value;
    renderTrophyList();
  });
  $('progressSelect').addEventListener('change', (event) => {
    filters.progress = event.target.value;
    renderTrophyList();
  });
  $('spoilerToggle').addEventListener('change', (event) => {
    spoilerOn = event.target.checked;
    saveProgressState();
    updateSpoilerNote();
    renderTrophyList();
  });
  $('kindChips').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-kind]');
    if (!chip) return;
    filters.kind = chip.dataset.kind;
    document.querySelectorAll('#kindChips .chip').forEach((button) => {
      button.classList.toggle('active', button === chip);
    });
    renderTrophyList();
  });
  $('exportBtn').addEventListener('click', exportProgressFile);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (event) => {
    importProgressFile(event.target.files[0]);
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', resetProgress);
  updateSpoilerNote();
}

loadTrophyData();
