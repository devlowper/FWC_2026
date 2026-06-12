/* ==========================================================================
   FIFA WORLD CUP 2026 - APP REDESIGN (JAVASCRIPT LOGIC)
   ========================================================================== */

'use strict';

// ─── API ENDPOINTS ───────────────────────────────────────────
const ENDPOINTS = {
  games: 'https://worldcup26.ir/get/games',
  stadiums: 'https://worldcup26.ir/get/stadiums',
  groups: 'https://worldcup26.ir/get/groups',
  teams: 'https://worldcup26.ir/get/teams',
  matches: 'https://api.football-data.org/v4/competitions/WC/matches'
};
const API_TOKEN = 'cd84896d1aa64006936b920d760407aa';

// Stadium UTC Offsets for June/July 2026
const STADIUM_OFFSETS = {
  '1': -6,  // Estadio Azteca, Mexico City
  '2': -5,  // AT&T Stadium, Arlington, TX
  '3': -7,  // SoFi Stadium, Los Angeles, CA
  '4': -4,  // MetLife Stadium, East Rutherford, NJ
  '5': -7,  // Rose Bowl, Pasadena, CA
  '6': -6,  // Estadio BBVA, Monterrey
  '7': -7,  // Levi's Stadium, Santa Clara, CA
  '8': -5,  // Arrowhead Stadium, Kansas City, MO
  '9': -5,  // NRG Stadium, Houston, TX
  '10': -5, // Q2 Stadium, Austin, TX
  '11': -4, // Gillette Stadium, Foxborough, MA
  '12': -7, // BC Place, Vancouver
  '13': -4, // Lincoln Financial Field, Philadelphia
  '14': -4, // BMO Field, Toronto
  '15': -6, // Empower Field, Denver, CO
  '16': -6, // Estadio Akron, Guadalajara
};

// Unsplash stadium images catalog (for high-fidelity visual cards)
const STADIUM_IMAGES = {
  '1': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
  '2': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&auto=format&fit=crop&q=80',
  '3': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=80',
  '4': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
  '5': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&auto=format&fit=crop&q=80',
  '6': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=80',
  '7': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
  '8': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&auto=format&fit=crop&q=80',
  '9': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=80',
  '10': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
  '11': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&auto=format&fit=crop&q=80',
  '12': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=80',
  '13': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
  '14': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&auto=format&fit=crop&q=80',
  '15': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=500&auto=format&fit=crop&q=80',
  '16': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80'
};

const STADIUM_NAME_IMAGE_KEYS = {
  'estadio azteca': '1',
  'at&t stadium': '2',
  'sofi stadium': '3',
  'metlife stadium': '4',
  'rose bowl': '5',
  'estadio bbva': '6',
  "levi's stadium": '7',
  'arrowhead stadium': '8',
  'nrg stadium': '9',
  'q2 stadium': '10',
  'gillette stadium': '11',
  'bc place': '12',
  'lincoln financial field': '13',
  'bmo field': '14',
  'empower field': '15',
  'estadio akron': '16'
};

// Stream Channel configurations
const STREAM_CHANNELS = [
  { id: '1', name: 'T Sports HD', category: 'Sports', url: 'http://103.151.61.12/T-Sports.kutta/video.m3u8' },
  { id: '2', name: 'BTV National (1080p)', category: 'General', url: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/1709.m3u8' },
  { id: '3', name: 'FIFA+', category: 'Sports', url: 'https://d2w9q46ikgrcwx.cloudfront.net/v1/sysdata_s_p_a_fifa_7/samsungheadend_us/latest/main/hls/playlist.m3u8' },
  { id: '4', name: 'FIFA+ English (720p)', category: 'Sports', url: 'https://a62dad94.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZJRkFQbHVzRW5nbGlzaF9ITFM/playlist.m3u8' }
];

// ─── STATE MANAGEMENT ─────────────────────────────────────────
let state = {
  games: [],
  teams: {},       // keyed by ID
  groups: [],      // groups standings
  stadiums: {},    // keyed by ID
  currentSection: 'home',
  currentGroupTab: 'A',
  scheduleSelectedDate: null,
  loaded: false,
  activeChannelId: '1',
  lastScores: {},
};

// ─── DYNAMIC COLOR EXTRACTION ─────────────────────────────────
const colorCache = {};

function extractAccentColor(imageUrl, callback) {
  if (!imageUrl) return callback(null);
  if (colorCache[imageUrl]) return callback(colorCache[imageUrl]);

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = imageUrl;

  img.onload = function() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 16;
      canvas.height = 16;
      ctx.drawImage(img, 0, 0, 16, 16);
      
      const imgData = ctx.getImageData(0, 0, 16, 16).data;
      
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        const pr = imgData[i];
        const pg = imgData[i+1];
        const pb = imgData[i+2];
        const pa = imgData[i+3];
        
        if (pa < 120) continue; // Skip transparency
        
        // Filter out pure whites, pure blacks, and grays
        const max = Math.max(pr, pg, pb);
        const min = Math.min(pr, pg, pb);
        if (max - min < 25) continue;
        
        r += pr;
        g += pg;
        b += pb;
        count++;
      }
      
      if (count > 0) {
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        const rgbStr = `rgb(${r}, ${g}, ${b})`;
        colorCache[imageUrl] = rgbStr;
        callback(rgbStr);
      } else {
        // Average color fallback
        let tr = 0, tg = 0, tb = 0, tc = 0;
        for (let i = 0; i < imgData.length; i += 4) {
          if (imgData[i+3] > 200) {
            tr += imgData[i];
            tg += imgData[i+1];
            tb += imgData[i+2];
            tc++;
          }
        }
        if (tc > 0) {
          const rgbStr = `rgb(${Math.round(tr/tc)}, ${Math.round(tg/tc)}, ${Math.round(tb/tc)})`;
          colorCache[imageUrl] = rgbStr;
          callback(rgbStr);
        } else {
          callback(null);
        }
      }
    } catch (e) {
      callback(null);
    }
  };

  img.onerror = function() {
    callback(null);
  };
}

// ─── THEME TOGGLE ─────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('wc26-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('wc26-theme', newTheme);
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const toggle = document.getElementById('mobile-menu-toggle');
  if (!menu) return;

  const isOpen = menu.classList.toggle('show');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  }
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const toggle = document.getElementById('mobile-menu-toggle');
  if (menu) menu.classList.remove('show');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  }
}

// ─── NAVIGATION ───────────────────────────────────────────────
function showSection(id) {
  // Hide all section panels
  document.querySelectorAll('.section-panel').forEach(s => {
    s.classList.remove('active-section');
  });
  
  // Deactivate links in desktop navbar
  document.querySelectorAll('.navbar-link').forEach(b => {
    b.classList.remove('active');
  });

  // Deactivate links in mobile menu
  document.querySelectorAll('.mobile-menu-link').forEach(b => {
    b.classList.remove('active');
  });

  // Active requested section
  const section = document.getElementById(`section-${id}`);
  if (section) {
    section.classList.add('active-section');
  }

  // Sync button toggles
  const navBtn = document.getElementById(`nav-${id}`);
  if (navBtn) {
    navBtn.classList.add('active');
  }

  const mobileNavBtn = document.getElementById(`mobile-nav-${id}`);
  if (mobileNavBtn) {
    mobileNavBtn.classList.add('active');
  }

  closeMobileMenu();

  state.currentSection = id;

  // Render contents
  if (state.loaded) {
    if (id === 'home') renderHome();
    if (id === 'live') renderLive();
    if (id === 'schedule') renderSchedule();
    if (id === 'standings') renderStandings();
    if (id === 'venues') renderVenues();
    if (id === 'stream') renderStreamPage();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── COUNTDOWN TICKER ─────────────────────────────────────────
function updateCountdown() {
  const finalDate = new Date('2026-07-19T15:00:00-04:00'); // Final EDT
  const now = new Date();
  let diff = finalDate - now;

  const getEl = (id) => document.getElementById(id);

  if (diff <= 0) {
    if (getEl('cd-days')) getEl('cd-days').textContent = '00';
    if (getEl('cd-hours')) getEl('cd-hours').textContent = '00';
    if (getEl('cd-mins')) getEl('cd-mins').textContent = '00';
    if (getEl('cd-secs')) getEl('cd-secs').textContent = '00';
    return;
  }

  const days = Math.floor(diff / 86400000);
  diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const mins = Math.floor(diff / 60000);
  diff -= mins * 60000;
  const secs = Math.floor(diff / 1000);

  if (getEl('cd-days')) getEl('cd-days').textContent = String(days).padStart(2, '0');
  if (getEl('cd-hours')) getEl('cd-hours').textContent = String(hours).padStart(2, '0');
  if (getEl('cd-mins')) getEl('cd-mins').textContent = String(mins).padStart(2, '0');
  if (getEl('cd-secs')) getEl('cd-secs').textContent = String(secs).padStart(2, '0');
}

// ─── UTILITIES & PARSERS ──────────────────────────────────────
function getKickoffUTC(game) {
  if (!game) return null;
  if (game.utcDate) return new Date(game.utcDate);
  if (!game.local_date) return null;
  try {
    const [datePart, timePart] = game.local_date.split(' ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    const offsetHours = STADIUM_OFFSETS[String(game.stadium_id)] ?? -5;
    const utcMs = Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    return new Date(utcMs - offsetHours * 60 * 60000);
  } catch (e) {
    return null;
  }
}

function getMatchStatus(game) {
  if (game.is_simulated_live) return 'live';
  if (game.is_simulated_finished) return 'finished';

  const elapsed = (game.time_elapsed || '').toLowerCase();
  if (game.finished === 'TRUE' || game.finished === true || elapsed === 'finished') return 'finished';
  if (elapsed && elapsed !== 'notstarted' && elapsed !== 'not started' && elapsed !== '') return 'live';
  
  const kickoff = getKickoffUTC(game);
  if (kickoff) {
    const now = new Date();
    const diffMin = (now - kickoff) / 60000;
    if (diffMin >= 0) {
      return diffMin < 115 ? 'live' : 'finished';
    }
  }
  return 'upcoming';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [month, day, year] = datePart.split('/');
    const d = new Date(`${year}-${month}-${day}T${timePart}:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' • ' + timePart;
  } catch {
    return dateStr;
  }
}

function getStadiumName(stadiumId) {
  const s = state.stadiums[String(stadiumId)];
  return s ? s.name_en : `Stadium ${stadiumId}`;
}

function getStadiumImageUrl(stadium, index = 0) {
  const directImage = stadium.image_url || stadium.image || stadium.photo_url || stadium.photo || stadium.logo;
  if (directImage) return directImage;

  const idKey = String(stadium.id || stadium.stadium_id || stadium.venue_id || '').trim();
  if (STADIUM_IMAGES[idKey]) return STADIUM_IMAGES[idKey];

  const name = String(stadium.name_en || stadium.name || '').toLowerCase();
  const nameKey = STADIUM_NAME_IMAGE_KEYS[name];
  if (nameKey && STADIUM_IMAGES[nameKey]) return STADIUM_IMAGES[nameKey];

  const imageKeys = Object.keys(STADIUM_IMAGES);
  return STADIUM_IMAGES[imageKeys[index % imageKeys.length]];
}

function makeStadiumImageHtml(stadium, index = 0, height = 140) {
  const name = stadium.name_en || stadium.name || 'Host stadium';
  const city = stadium.city_en || stadium.city || '';
  const imageUrl = getStadiumImageUrl(stadium, index);

  return `
    <div class="venue-image-wrap" style="height: ${height}px;">
      <img src="${imageUrl}" alt="${name}" class="venue-image" loading="lazy" onerror="this.closest('.venue-image-wrap').classList.add('image-failed'); this.remove();">
      <div class="venue-image-fallback" aria-label="${name}">
        <i class="fa-solid fa-building-columns"></i>
        <span>${name}</span>
        ${city ? `<small>${city}</small>` : ''}
      </div>
    </div>`;
}

function formatCapacity(capacity) {
  if (!capacity) return '';
  const numericCapacity = Number(String(capacity).replace(/,/g, ''));
  return Number.isFinite(numericCapacity) ? numericCapacity.toLocaleString() : String(capacity);
}

function getStageLabel(type) {
  const map = { group:'Group Stage', r32:'Round of 32', r16:'Round of 16', qf:'Quarter-Final', sf:'Semi-Final', third:'3rd Place', final:'Final' };
  return map[type] || type?.toUpperCase() || '';
}

function getTeamName(game, side) {
  const teamId = game[`${side}_team_id`];
  const team = state.teams[String(teamId)];
  if (team) return team.name_en;
  return game[`${side}_team_name_en`] || game[`${side}_team_label`] || `TBD`;
}

function getTeamFlag(game, side) {
  const teamId = game[`${side}_team_id`];
  const team = state.teams[String(teamId)];
  return team ? team.flag : '';
}

function getSimulatedPossession(gameId) {
  const seed = parseInt(gameId) || 1;
  const val = Math.floor(Math.abs(Math.sin(seed * 77)) * 20) + 40; // values between 40% and 60%
  return { home: val, away: 100 - val };
}

function parseScheduleDate(dateStr) {
  if (!dateStr) return null;
  const datePart = String(dateStr).trim().split(/[ T]/)[0];
  const slashParts = datePart.split('/').map(Number);
  if (slashParts.length === 3) {
    const [month, day, year] = slashParts;
    if (!month || !day || !year) return null;
    return new Date(year, month - 1, day);
  }

  const dashParts = datePart.split('-').map(Number);
  if (dashParts.length === 3) {
    const [year, month, day] = dashParts;
    if (!month || !day || !year) return null;
    return new Date(year, month - 1, day);
  }

  return null;
}

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getScheduleDatePart(localDate) {
  return localDate ? String(localDate).trim().split(/[ T]/)[0] : null;
}

function getScheduleDateSortValue(dateStr) {
  const date = parseScheduleDate(dateStr);
  return date && !isNaN(date.getTime()) ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function getTodayScheduleDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDefaultScheduleDate(allDates) {
  if (!allDates.length) return null;

  const today = getTodayScheduleDate();
  const todayKey = getDateKey(today);
  const datedItems = allDates
    .map(dateStr => ({ dateStr, date: parseScheduleDate(dateStr) }))
    .filter(item => item.date && !isNaN(item.date.getTime()))
    .sort((a, b) => a.date - b.date);

  const todayMatch = datedItems.find(item => getDateKey(item.date) === todayKey);
  if (todayMatch) return todayMatch.dateStr;

  const upcoming = datedItems.find(item => item.date >= today);
  return upcoming ? upcoming.dateStr : datedItems[datedItems.length - 1]?.dateStr || allDates[0];
}

function ensureScheduleSelectedDate(allDates) {
  if (!allDates.length) {
    state.scheduleSelectedDate = null;
    return;
  }

  if (!state.scheduleSelectedDate || !allDates.includes(state.scheduleSelectedDate)) {
    state.scheduleSelectedDate = getDefaultScheduleDate(allDates);
  }
}

function scrollActiveDatePill(datesContainer) {
  if (!datesContainer) return;
  requestAnimationFrame(() => {
    const activePill = datesContainer.querySelector('.date-pill.active');
    if (activePill) {
      activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });
}

// Seeded pseudorandom score simulation
function getSimulatedLiveScore(game, elapsedMin) {
  const seed = parseInt(game.id) || 1;
  const pseudoRandom = (s) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const homeRand = pseudoRandom(seed * 11);
  const awayRand = pseudoRandom(seed * 17);
  
  let homeFinal = 0;
  if (homeRand > 0.85) homeFinal = 3;
  else if (homeRand > 0.6) homeFinal = 2;
  else if (homeRand > 0.25) homeFinal = 1;
  
  let awayFinal = 0;
  if (awayRand > 0.85) awayFinal = 3;
  else if (awayRand > 0.6) awayFinal = 2;
  else if (awayRand > 0.25) awayFinal = 1;

  let homeScore = 0;
  let awayScore = 0;

  for (let i = 0; i < homeFinal; i++) {
    const goalMin = Math.floor(pseudoRandom(seed * 13 + i) * 90) + 1;
    if (elapsedMin >= goalMin) homeScore++;
  }
  for (let i = 0; i < awayFinal; i++) {
    const goalMin = Math.floor(pseudoRandom(seed * 19 + i) * 90) + 1;
    if (elapsedMin >= goalMin) awayScore++;
  }

  return { homeScore, awayScore };
}

// ─── API ASYNC DATA RETRIEVAL ──────────────────────────────────
async function fetchJSON(url, useAuth = false) {
  const headers = {};
  if (useAuth) {
    headers['X-Auth-Token'] = API_TOKEN;
  }
  
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { headers, mode: 'cors' });
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    try {
      const res = await fetch(url, { headers, mode: 'cors' });
      if (!res.ok) throw new Error(`Direct HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Connection to endpoint failed: ${url}`);
      return null;
    }
  }
}

async function fetchAllData() {
  const [gamesData, stadiumsData, groupsData, teamsData] = await Promise.all([
    fetchJSON(ENDPOINTS.games),
    fetchJSON(ENDPOINTS.stadiums),
    fetchJSON(ENDPOINTS.groups),
    fetchJSON(ENDPOINTS.teams)
  ]);
  
  const matchesData = await fetchJSON(ENDPOINTS.matches, true);
  
  // Map teams
  if (teamsData && teamsData.teams) {
    state.teams = {};
    teamsData.teams.forEach(t => {
      state.teams[String(t.id)] = t;
    });
  }
  
  // Map stadiums
  if (stadiumsData && stadiumsData.stadiums) {
    state.stadiums = {};
    stadiumsData.stadiums.forEach(s => {
      state.stadiums[String(s.id)] = s;
    });
  }
  
  // Map groups
  if (groupsData && groupsData.groups) {
    state.groups = groupsData.groups;
  }
  
  // Map matches
  if (gamesData && gamesData.games) {
    state.games = gamesData.games.map(g => {
      let finalGame = g;
      const status = getMatchStatus(g);
      
      // Simulate live score states for fixtures that are currently active in local time
      if (status === 'live' && g.time_elapsed === 'notstarted') {
        const kickoff = getKickoffUTC(g);
        const now = new Date();
        const diffMin = kickoff ? Math.floor((now - kickoff) / 60000) : 0;
        
        let elapsedStr = `${diffMin}'`;
        if (diffMin > 45 && diffMin <= 60) elapsedStr = 'HT';
        else if (diffMin > 60) elapsedStr = `${diffMin - 15}'`;
        
        const { homeScore: simHome, awayScore: simAway } = getSimulatedLiveScore(g, diffMin);
        
        finalGame = {
          ...g,
          time_elapsed: elapsedStr,
          home_score: String(simHome),
          away_score: String(simAway),
          is_simulated_live: true
        };
      } else if (status === 'finished' && g.finished !== 'TRUE') {
        const { homeScore: simHome, awayScore: simAway } = getSimulatedLiveScore(g, 120);
        finalGame = {
          ...g,
          finished: 'TRUE',
          time_elapsed: 'finished',
          home_score: String(simHome),
          away_score: String(simAway),
          is_simulated_finished: true
        };
      }
      return finalGame;
    });
  }

  // Merge external live score feeds from API 2 (football-data.org)
  if (matchesData && matchesData.matches) {
    matchesData.matches.forEach(m => {
      const existingGame = state.games.find(g => String(g.id) === String(m.id));
      if (existingGame) {
        existingGame.home_score = m.score?.fullTime?.home !== null ? String(m.score.fullTime.home) : existingGame.home_score;
        existingGame.away_score = m.score?.fullTime?.away !== null ? String(m.score.fullTime.away) : existingGame.away_score;
        if (m.status === 'IN_PLAY' || m.status === 'LIVE' || m.status === 'PAUSED') {
          existingGame.time_elapsed = 'live';
          existingGame.finished = 'FALSE';
        } else if (m.status === 'FINISHED') {
          existingGame.time_elapsed = 'finished';
          existingGame.finished = 'TRUE';
        }
      }
    });
  }

  state.loaded = true;
  
  // Render active section
  showSection(state.currentSection);
}

// ─── CARD BUILDER ─────────────────────────────────────────────
function makeSportMatchCard(game, index = 0, isLiveTab = false) {
  const status = getMatchStatus(game);
  const homeName = getTeamName(game, 'home');
  const awayName = getTeamName(game, 'away');
  const homeFlag = getTeamFlag(game, 'home');
  const awayFlag = getTeamFlag(game, 'away');
  const delay = index * 50;
  
  let statusHtml = '';
  if (status === 'live') {
    statusHtml = `
      <div class="live-indicator">
        <span class="live-dot"></span>
        <span>Live ${game.time_elapsed ? game.time_elapsed + "'" : ''}</span>
      </div>`;
  } else if (status === 'finished') {
    statusHtml = `<span class="btn btn-outline btn-sm" style="color:var(--text-secondary); border-color:var(--border-color); cursor:default; font-size:0.65rem; padding:4px 8px; border-radius:6px;"><i class="fa-solid fa-circle-check"></i> FT</span>`;
  } else {
    const timeStr = game.local_date ? game.local_date.split(' ')[1] : '';
    const ampmTime = timeStr ? new Date(`1970/01/01 ${timeStr}`).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : 'VS';
    statusHtml = `<span class="btn btn-outline btn-sm" style="color:var(--accent-color); border-color:var(--border-color); cursor:default; font-size:0.65rem; padding:4px 8px; border-radius:6px;"><i class="fa-solid fa-clock"></i> ${ampmTime}</span>`;
  }
  
  const stageLabel = game.group ? `Group ${game.group}` : getStageLabel(game.type);
  
  const flagHtml = (flag, name) => flag
    ? `<img src="${flag}" alt="${name}" class="team-flag-img" onerror="this.style.opacity=0">`
    : `<div class="team-flag-img" style="background-color:var(--bg-secondary); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-flag" style="font-size:10px; color:var(--text-secondary);"></i></div>`;
  
  const cardId = `match-card-${game.id}`;
  
  // Dynamic color extraction
  if (homeFlag) {
    extractAccentColor(homeFlag, (color) => {
      if (color) {
        const cardEl = document.getElementById(cardId);
        if (cardEl) {
          cardEl.style.setProperty('--card-accent', color);
          cardEl.style.setProperty('--card-accent-border', `rgba(${color.replace(/rgb\(|rgba\(|\)/g, '')}, 0.25)`);
        }
      }
    });
  }
  
  // Possession Split bar statistics
  let possessionHtml = '';
  if (isLiveTab || status === 'live') {
    const possession = getSimulatedPossession(game.id);
    possessionHtml = `
      <div class="possession-container">
        <div class="possession-header">
          <span><i class="fa-solid fa-shield-halved"></i> ${possession.home}% Possession</span>
          <span>${possession.away}% <i class="fa-solid fa-shield-halved"></i></span>
        </div>
        <div class="possession-track">
          <div class="possession-home" style="width: ${possession.home}%;"></div>
          <div class="possession-away"></div>
        </div>
      </div>`;
  }
  
  return `
    <div class="card" id="${cardId}" style="animation-delay: ${delay}ms;">
      <div class="match-header">
        <span class="match-stage">${stageLabel}</span>
        ${statusHtml}
      </div>
      <div class="match-teams">
        <div class="match-team-row">
          <div class="team-details">
            ${flagHtml(homeFlag, homeName)}
            <span class="team-name-text">${homeName}</span>
          </div>
          <span class="team-score-val">${status !== 'upcoming' ? game.home_score : '-'}</span>
        </div>
        <div class="match-team-row">
          <div class="team-details">
            ${flagHtml(awayFlag, awayName)}
            <span class="team-name-text">${awayName}</span>
          </div>
          <span class="team-score-val">${status !== 'upcoming' ? game.away_score : '-'}</span>
        </div>
      </div>
      ${possessionHtml}
      <div class="match-footer" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
        <span class="match-venue"><i class="fa-solid fa-location-pin"></i> ${getStadiumName(game.stadium_id)}</span>
        <span class="match-time"><i class="fa-solid fa-calendar"></i> ${formatDate(game.local_date)}</span>
      </div>
    </div>`;
}

// ─── SPOTLIGHT CARD BUILDER ───────────────────────────────────
function makeSpotlightCard(game, type, index = 0) {
  const isNext = type === 'next';
  if (!game) {
    return `
      <div class="spotlight-card">
        <div class="spotlight-label"><i class="fa-solid ${isNext ? 'fa-clock' : 'fa-flag-checkered'}"></i> ${isNext ? 'Next Match' : 'Latest Result'}</div>
        <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-secondary);">No matches listed.</div>
      </div>`;
  }

  const homeName = getTeamName(game, 'home');
  const awayName = getTeamName(game, 'away');
  const homeFlag = getTeamFlag(game, 'home');
  const awayFlag = getTeamFlag(game, 'away');
  const stadName = getStadiumName(game.stadium_id);
  const stageLabel = game.group ? `Group ${game.group}` : getStageLabel(game.type);
  
  const flagHtml = (flag, name) => flag
    ? `<img src="${flag}" alt="${name}" class="spotlight-flag" onerror="this.style.opacity=0">`
    : `<div class="spotlight-flag" style="background-color:var(--bg-secondary); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-flag" style="font-size:24px; color:var(--text-secondary);"></i></div>`;

  const scoreHtml = isNext
    ? `<span class="spotlight-vs">VS</span>`
    : `<span>${game.home_score}</span><span style="color: var(--accent-color); font-weight: 900;">-</span><span>${game.away_score}</span>`;

  const cardId = `spotlight-card-${game.id}`;
  
  if (homeFlag) {
    extractAccentColor(homeFlag, (color) => {
      if (color) {
        const cardEl = document.getElementById(cardId);
        if (cardEl) {
          cardEl.style.setProperty('--card-accent-border', `rgba(${color.replace(/rgb\(|rgba\(|\)/g, '')}, 0.25)`);
          cardEl.style.setProperty('--card-accent', color);
        }
      }
    });
  }

  return `
    <div class="spotlight-card" id="${cardId}">
      <div class="spotlight-label"><i class="fa-solid ${isNext ? 'fa-clock' : 'fa-flag-checkered'}"></i> ${isNext ? 'Next Match' : 'Latest Result'}</div>
      <div class="spotlight-match-display">
        <div class="spotlight-team">
          ${flagHtml(homeFlag, homeName)}
          <div class="spotlight-team-name">${homeName}</div>
        </div>
        <div class="spotlight-score-block">
          <div class="spotlight-scores">${scoreHtml}</div>
        </div>
        <div class="spotlight-team">
          ${flagHtml(awayFlag, awayName)}
          <div class="spotlight-team-name">${awayName}</div>
        </div>
      </div>
      <div class="spotlight-details">
        <div class="spotlight-detail-item"><i class="fa-solid fa-trophy"></i> <span>${stageLabel}</span></div>
        <div class="spotlight-detail-item"><i class="fa-solid fa-location-pin"></i> <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">${stadName}</span></div>
        <div class="spotlight-detail-item"><i class="fa-solid fa-calendar"></i> <span>${formatDate(game.local_date)}</span></div>
      </div>
    </div>`;
}

// ─── PAGE RENDERERS ───────────────────────────────────────────

// Home Page
function renderHome() {
  // 1. Latest Completed/In-Progress match card
  const activeOrFinished = state.games
    .filter(g => getMatchStatus(g) === 'finished' || getMatchStatus(g) === 'live')
    .sort((a, b) => new Date(b.local_date) - new Date(a.local_date))[0];
  
  const latestMatchContainer = document.getElementById('home-latest-match-card');
  if (latestMatchContainer) {
    if (activeOrFinished) {
      latestMatchContainer.innerHTML = makeSportMatchCard(activeOrFinished, 0, true);
    } else if (state.games.length > 0) {
      latestMatchContainer.innerHTML = makeSportMatchCard(state.games[0], 0, true);
    }
  }

  // 2. Next Match Card Countdown Details
  const nextGame = state.games
    .filter(g => getMatchStatus(g) === 'upcoming')
    .sort((a, b) => new Date(a.local_date) - new Date(b.local_date))[0];

  const nextMatchDetails = document.getElementById('home-next-match-details');
  if (nextMatchDetails && nextGame) {
    const home = getTeamName(nextGame, 'home');
    const away = getTeamName(nextGame, 'away');
    const venue = getStadiumName(nextGame.stadium_id);
    const dateFormatted = formatDate(nextGame.local_date);
    nextMatchDetails.innerHTML = `
      <div style="margin-bottom:4px; font-size:0.95rem; font-weight:800; color:var(--text-primary);">${home} vs ${away}</div>
      <div style="font-size:0.75rem; color:var(--text-secondary); font-weight:500;">
        <i class="fa-solid fa-location-pin"></i> ${venue} • <i class="fa-solid fa-calendar"></i> ${dateFormatted}
      </div>
    `;
  }

  // 3. Fixtures Horizontal scroll bar
  const upcomingGames = state.games.filter(g => getMatchStatus(g) === 'upcoming');
  const scrollList = document.getElementById('home-fixtures-horizontal-list');
  if (scrollList) {
    if (upcomingGames.length === 0) {
      scrollList.innerHTML = `<div class="empty-state" style="width:100%;"><p class="empty-state-title">No upcoming matches scheduled</p></div>`;
    } else {
      scrollList.innerHTML = upcomingGames.map((g, idx) => makeSportMatchCard(g, idx)).join('');
    }
  }

  // 4. Groups Overview grid
  const groupsList = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const groupsContainer = document.getElementById('home-groups');
  if (groupsContainer) {
    groupsContainer.innerHTML = groupsList.map((grp, index) => {
      const grpObj = state.groups.find(g => g.name === grp);
      const sortedTeams = grpObj ? grpObj.teams.sort((a, b) => (parseInt(b.pts)||0) - (parseInt(a.pts)||0) || (parseInt(b.gd)||0) - (parseInt(a.gd)||0)) : [];
      const delay = index * 40;
      
      return `
        <div class="card" onclick="showSection('standings'); switchGroupTab('${grp}')" style="animation-delay: ${delay}ms; cursor: pointer; display:flex; flex-direction:column; justify-content:space-between; min-height: 200px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent-color);"><i class="fa-solid fa-users"></i> GROUP ${grp}</span>
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary);">Pts</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; flex-grow: 1;">
            ${sortedTeams.slice(0, 4).map(t => {
              const teamInfo = state.teams[String(t.team_id)];
              const name = teamInfo ? teamInfo.name_en : `Team ${t.team_id}`;
              const flag = teamInfo ? teamInfo.flag : '';
              return `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 8px; overflow:hidden;">
                    ${flag ? `<img src="${flag}" alt="${name}" style="width: 20px; height: 14px; object-fit: cover; border-radius: 2px; border:1px solid var(--border-color);" onerror="this.style.opacity=0">` : ''}
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${name}</span>
                  </div>
                  <span style="font-family: ui-monospace, monospace; font-size: 0.8rem; font-weight: 800; color: var(--text-secondary);">${t.pts}</span>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  }

  // 5. Latest Results list
  const finishedGames = state.games
    .filter(g => getMatchStatus(g) === 'finished')
    .slice(0, 3);
  const resultsContainer = document.getElementById('home-latest-results');
  if (resultsContainer) {
    if (finishedGames.length === 0) {
      resultsContainer.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p class="empty-state-title">No completed matches available</p></div>`;
    } else {
      resultsContainer.innerHTML = finishedGames.map((g, idx) => makeSportMatchCard(g, idx)).join('');
    }
  }

  // 6. Host Stadiums grid
  const stadiumsGrid = document.getElementById('home-stadiums-grid');
  if (stadiumsGrid) {
    const stadiumsList = (Object.values(state.stadiums).length > 0 ? Object.values(state.stadiums) : STADIUM_FALLBACK).slice(0, 3);
    stadiumsGrid.innerHTML = stadiumsList.map((s, index) => {
      const delay = index * 50;
      const name = s.name_en || s.name || 'Stadium';
      const country = s.country_en || s.country || '';
      const city = s.city_en || s.city || '';
      const capacity = formatCapacity(s.capacity);
      return `
        <div class="card" style="animation-delay: ${delay}ms; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
          ${makeStadiumImageHtml(s, index, 120)}
          <div style="padding: 16px;">
            <span style="font-size: 0.65rem; font-weight: 800; color: var(--accent-color); text-transform: uppercase; letter-spacing: 0.05em;">${country}</span>
            <h4 style="font-size: 0.95rem; font-weight: 800; margin-top: 2px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${name}</h4>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; font-size:0.75rem; color:var(--text-secondary);">
              <span><i class="fa-solid fa-location-pin"></i> ${city}</span>
              ${capacity ? `<span><i class="fa-solid fa-users"></i> ${capacity}</span>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  }
}

// Live Scores Page
function renderLive() {
  const liveGames = state.games.filter(g => getMatchStatus(g) === 'live');
  const container = document.getElementById('live-container');
  const emptyEl = document.getElementById('live-empty');

  if (liveGames.length === 0) {
    if (container) {
      container.innerHTML = '';
      container.classList.add('hidden');
    }
    if (emptyEl) emptyEl.classList.remove('hidden');
  } else {
    if (container) {
      container.classList.remove('hidden');
      container.innerHTML = liveGames.map((g, idx) => makeSportMatchCard(g, idx, true)).join('');
    }
    if (emptyEl) emptyEl.classList.add('hidden');
  }

  renderLiveSchedule();
  renderLiveGroupTabs();
  renderGroupTable(state.currentGroupTab, 'live-standings-container');
}

function renderLiveSchedule() {
  const container = document.getElementById('live-schedule-container');
  const datesContainer = document.getElementById('live-schedule-dates');
  if (!state.games.length || !container) return;

  const allDates = [...new Set(state.games.map(g => getScheduleDatePart(g.local_date)))]
    .filter(Boolean)
    .sort((a, b) => getScheduleDateSortValue(a) - getScheduleDateSortValue(b));

  ensureScheduleSelectedDate(allDates);

  if (datesContainer) {
    datesContainer.innerHTML = allDates.map(dateStr => {
      const d = parseScheduleDate(dateStr);
      if (!d || isNaN(d.getTime())) return '';
      const dayAbbr = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const monthAbbr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const dateNum = d.getDate();
      const isActive = dateStr === state.scheduleSelectedDate;

      return `
        <button onclick="setScheduleDate('${dateStr}')" class="date-pill ${isActive ? 'active' : ''}" data-date="${dateStr}">
          <span class="date-day">${dayAbbr}</span>
          <span class="date-num">${monthAbbr} ${dateNum}</span>
        </button>`;
    }).join('');
    scrollActiveDatePill(datesContainer);
  }

  const games = state.games.filter(g => getScheduleDatePart(g.local_date) === state.scheduleSelectedDate);
  container.innerHTML = games.length
    ? games.map((g, idx) => makeSportMatchCard(g, idx)).join('')
    : `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
        <div class="empty-state-title">No Matches Scheduled</div>
        <div class="empty-state-desc">There are no matches scheduled for this date.</div>
      </div>`;
}

function renderLiveGroupTabs() {
  const tabsContainer = document.getElementById('live-group-tabs');
  if (!tabsContainer) return;

  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  tabsContainer.innerHTML = groups.map(g => `
    <button class="tab-btn ${g === state.currentGroupTab ? 'active' : ''}" data-group="${g}" onclick="switchGroupTab('${g}')">${g}</button>`
  ).join('');
}

function renderLiveStandings(grp) {
  const container = document.getElementById('live-standings-container');
  const section = document.getElementById('live-standings-block');
  if (!container || !section) return;

  const rows = computeGroupStandings(grp);
  if (rows.length === 0) {
    section.classList.add('hidden');
    return;
  }

  const buildLiveRows = (teams) => teams.map((t, i) => {
    const isQ = i < 2;
    const rankClass = isQ ? 'bold' : '';
    const formHtml = getTeamFormDots(t.id, grp);
    
    // Trophy icon for 1st place
    const rankDisplay = i === 0 
      ? `<i class="fa-solid fa-trophy" style="color:var(--gold-star); font-size:0.9rem;"></i>` 
      : `<span class="table-num-cell ${rankClass}">${i+1}</span>`;

    return `
      <tr class="${isQ ? 'qualifying' : ''}" data-team-id="${t.id}">
        <td style="width: 50px; text-align: center;">${rankDisplay}</td>
        <td>
          <div class="table-team-cell">
            ${t.flag ? `<img src="${t.flag}" alt="${t.name}" class="table-team-flag" onerror="this.style.opacity=0">` : '<div class="table-team-flag" style="background-color:var(--bg-secondary);"></div>'}
            <span class="table-team-name">${t.name}</span>
          </div>
        </td>
        <td class="table-num-cell" style="text-align: center;">${t.P}</td>
        <td class="table-num-cell" style="text-align: center; color: var(--text-secondary);">${t.W}</td>
        <td class="table-num-cell" style="text-align: center; color: var(--text-secondary);">${t.D}</td>
        <td class="table-num-cell" style="text-align: center; color: var(--text-secondary);">${t.L}</td>
        <td class="table-num-cell bold" style="text-align: center; color: ${t.GD > 0 ? 'var(--success)' : t.GD < 0 ? 'var(--danger)' : 'var(--text-secondary)'}">${(t.GD > 0 ? '+' : '') + t.GD}</td>
        <td class="table-num-cell bold" style="text-align: center;">${t.Pts}</td>
        <td style="text-align: center; width: 120px;">
          <div class="table-form-cell">
            ${formHtml}
          </div>
        </td>
      </tr>`;
  }).join('');

  const thead = `<thead><tr>
    <th style="width: 50px; text-align: center;">Pos</th>
    <th>Team</th>
    <th style="text-align: center; width: 50px;">P</th>
    <th style="text-align: center; width: 50px;">W</th>
    <th style="text-align: center; width: 50px;">D</th>
    <th style="text-align: center; width: 50px;">L</th>
    <th style="text-align: center; width: 60px;">GD</th>
    <th style="text-align: center; width: 60px;">Pts</th>
    <th style="text-align: center; width: 120px;">Form</th>
  </tr></thead>`;

  const liveRowsHtml = buildLiveRows(rows);

  container.innerHTML = `
    <div style="border: 1px solid var(--border-color); border-radius: 12px; background-color: var(--bg-card); overflow: hidden; margin-top: 16px;">
      <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent-color);">LIVE STANDINGS — GROUP ${grp}</span>
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">${rows.length} Teams</span>
        </div>
        <div class="live-indicator">
          <span class="live-dot"></span>
          <span>In Progress</span>
        </div>
      </div>
      <div class="table-responsive" style="border: none; border-radius: 0; box-shadow: none;">
        <table class="standings-table">
          ${thead}
          <tbody>
            ${liveRowsHtml}
          </tbody>
        </table>
      </div>
      <div style="padding: 12px; border-top: 1px solid var(--border-color); text-align: center; background-color: var(--bg-secondary);">
        <button onclick="showSection('live'); switchGroupTab('${grp}')" style="background: none; border: none; cursor: pointer; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
          See Full Group ${grp} Standings &rarr;
        </button>
      </div>
    </div>`;

  section.classList.remove('hidden');
}

// Schedule Page
function renderSchedule() {
  const container = document.getElementById('schedule-container');
  const datesContainer = document.getElementById('schedule-dates');

  if (!state.games.length || !container) return;

  const allDates = [...new Set(state.games.map(g => getScheduleDatePart(g.local_date)))]
    .filter(Boolean)
    .sort((a, b) => getScheduleDateSortValue(a) - getScheduleDateSortValue(b));

  ensureScheduleSelectedDate(allDates);

  if (datesContainer) {
    datesContainer.innerHTML = allDates.map(dateStr => {
      const d = parseScheduleDate(dateStr);
      if (!d || isNaN(d.getTime())) return '';
      const dayAbbr = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const monthAbbr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const dateNum = d.getDate();
      const isActive = dateStr === state.scheduleSelectedDate;

      return `
        <button onclick="setScheduleDate('${dateStr}')" class="date-pill ${isActive ? 'active' : ''}" data-date="${dateStr}">
          <span class="date-day">${dayAbbr}</span>
          <span class="date-num">${monthAbbr} ${dateNum}</span>
        </button>`;
    }).join('');
    scrollActiveDatePill(datesContainer);
  }

  const games = state.games.filter(g => getScheduleDatePart(g.local_date) === state.scheduleSelectedDate);

  if (games.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
        <div class="empty-state-title">No Matches Scheduled</div>
        <div class="empty-state-desc">There are no matches scheduled for this date.</div>
      </div>`;
    return;
  }

  container.innerHTML = games.map((g, idx) => makeSportMatchCard(g, idx)).join('');
}

function setScheduleDate(dateStr) {
  state.scheduleSelectedDate = dateStr;
  renderSchedule();
  renderLiveSchedule();
}

// Standings Page
function switchGroupTab(grp) {
  state.currentGroupTab = grp;
  document.querySelectorAll('.tab-btn').forEach(t => {
    t.classList.toggle('active', t.dataset.group === grp);
  });
  renderGroupTable(grp);
  renderGroupTable(grp, 'live-standings-container');
}

function renderGroupTable(grp, containerId = 'standings-container') {
  const rows = computeGroupStandings(grp);
  const container = document.getElementById(containerId);
  if (!container) return;

  const buildRows = (teams, hasData) => teams.map((t, i) => {
    const isQ = i < 2;
    const rankClass = isQ ? 'bold' : '';
    const formHtml = hasData ? getTeamFormDots(t.id, grp) : `
      <span class="form-dot empty"></span>
      <span class="form-dot empty"></span>
      <span class="form-dot empty"></span>`;
    
    const rankDisplay = i === 0 
      ? `<i class="fa-solid fa-trophy" style="color:var(--gold-star); font-size:0.9rem;"></i>` 
      : `<span class="table-num-cell ${rankClass}">${i+1}</span>`;

    return `
      <tr class="${isQ ? 'qualifying' : ''}" data-team-id="${t.id}">
        <td style="width: 50px; text-align: center;">${rankDisplay}</td>
        <td>
          <div class="table-team-cell">
            ${t.flag ? `<img src="${t.flag}" alt="${t.name}" class="table-team-flag" onerror="this.style.opacity=0">` : '<div class="table-team-flag" style="background-color:var(--bg-secondary);"></div>'}
            <span class="table-team-name">${t.name}</span>
          </div>
        </td>
        <td class="table-num-cell" style="text-align: center;">${hasData ? t.P : 0}</td>
        <td class="table-num-cell" style="text-align: center; color: var(--text-secondary);">${hasData ? t.W : 0}</td>
        <td class="table-num-cell" style="text-align: center; color: var(--text-secondary);">${hasData ? t.D : 0}</td>
        <td class="table-num-cell" style="text-align: center; color: var(--text-secondary);">${hasData ? t.L : 0}</td>
        <td class="table-num-cell bold" style="text-align: center; color: ${hasData && t.GD > 0 ? 'var(--success)' : hasData && t.GD < 0 ? 'var(--danger)' : 'var(--text-secondary)'}">${hasData ? (t.GD > 0 ? '+' : '') + t.GD : '0'}</td>
        <td class="table-num-cell bold" style="text-align: center;">${hasData ? t.Pts : 0}</td>
        <td style="text-align: center; width: 120px;">
          <div class="table-form-cell">
            ${formHtml}
          </div>
        </td>
      </tr>`;
  }).join('');

  const thead = `<thead><tr>
    <th style="width: 50px; text-align: center;">Pos</th>
    <th>Team</th>
    <th style="text-align: center; width: 50px;">P</th>
    <th style="text-align: center; width: 50px;">W</th>
    <th style="text-align: center; width: 50px;">D</th>
    <th style="text-align: center; width: 50px;">L</th>
    <th style="text-align: center; width: 60px;">GD</th>
    <th style="text-align: center; width: 60px;">Pts</th>
    <th style="text-align: center; width: 120px;">Form</th>
  </tr></thead>`;

  let teamObjs = [];
  let hasData = true;

  if (rows.length === 0) {
    const groupTeams = Object.values(state.teams).filter(t => t.groups === grp);
    if (groupTeams.length === 0) {
      container.innerHTML = `<div class="card empty-state"><p class="empty-state-title">No data available for Group ${grp}</p></div>`;
      return;
    }
    teamObjs = groupTeams.map((t, i) => ({ id: t.id, flag: t.flag, name: t.name_en, P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0 }));
    hasData = false;
  } else {
    teamObjs = rows;
  }

  const tbodyHtml = buildRows(teamObjs, hasData);
  container.innerHTML = `
    <div class="table-responsive">
      <table class="standings-table">
        ${thead}
        <tbody>
          ${tbodyHtml}
        </tbody>
      </table>
    </div>`;
}

function renderStandings() {
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const tabsContainer = document.getElementById('group-tabs');
  if (tabsContainer) {
    if (!tabsContainer.innerHTML) {
      tabsContainer.innerHTML = groups.map(g => `
        <button class="tab-btn ${g === state.currentGroupTab ? 'active' : ''}" data-group="${g}" onclick="switchGroupTab('${g}')">${g}</button>`
      ).join('');
    }
    renderGroupTable(state.currentGroupTab);
  }
}

// Live Stream Page
let currentHlsInstance = null;

function playStream(url) {
  const video = document.getElementById('video-player');
  if (!video) return;
  
  if (currentHlsInstance) {
    currentHlsInstance.destroy();
    currentHlsInstance = null;
  }
  
  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    currentHlsInstance = hls;
    video.play().catch(e => console.log("Auto-play blocked by browser."));
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().catch(e => console.log("Auto-play blocked by browser."));
  }
}

function selectChannel(id) {
  state.activeChannelId = id;
  const channel = STREAM_CHANNELS.find(c => c.id === id);
  if (channel) {
    playStream(channel.url);
    renderChannelsList();
  }
}

function renderChannelsList() {
  const container = document.getElementById('stream-channels-list');
  if (!container) return;
  
  container.innerHTML = STREAM_CHANNELS.map(c => `
    <div class="card channel-card ${state.activeChannelId === c.id ? 'active-channel' : ''}" onclick="selectChannel('${c.id}')" style="cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 12px;">
      <div style="width: 40px; height: 40px; background-color: var(--accent-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 1.2rem;">
        <i class="fa-solid fa-play"></i>
      </div>
      <div>
        <h4 style="font-size: 0.9rem; font-weight: 800;">${c.name}</h4>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">${c.category}</span>
      </div>
    </div>`).join('');
}

function switchStreamTab(tabId) {
  document.querySelectorAll('.stream-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.stream-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const activeBtn = Array.from(document.querySelectorAll('.stream-tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');
  
  const activeContent = document.getElementById(`stream-tab-${tabId}`);
  if (activeContent) activeContent.classList.add('active');
}

function renderStreamPage() {
  const liveGames = state.games.filter(g => getMatchStatus(g) === 'live');
  const playerEl = document.getElementById('stream-player-area');
  const emptyEl = document.getElementById('stream-empty');

  if (!playerEl || !emptyEl) return;

  emptyEl.classList.add('hidden');
  playerEl.classList.remove('hidden');

  // Load channel selection feeds
  renderChannelsList();

  // Highlight default channel 1 if not playing
  if (!currentHlsInstance) {
    selectChannel(state.activeChannelId);
  }

  // Next Match Live Ticker sidebar
  const nextGame = state.games
    .filter(g => getMatchStatus(g) === 'upcoming')
    .sort((a, b) => new Date(a.local_date) - new Date(b.local_date))[0];

  const tickerEl = document.getElementById('stream-next-match-ticker');
  if (tickerEl && nextGame) {
    const homeName = getTeamName(nextGame, 'home');
    const awayName = getTeamName(nextGame, 'away');
    const timeStr = nextGame.local_date ? nextGame.local_date.split(' ')[1] : '';
    tickerEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <i class="fa-solid fa-clock" style="color:var(--accent-color);"></i>
        <span style="font-size:0.85rem; font-weight:700;">${homeName} vs ${awayName}</span>
      </div>
      <span style="font-family:ui-monospace, monospace; font-size:0.7rem; color:var(--text-secondary); background:var(--bg-secondary); padding:4px 8px; border-radius:4px;">Kickoff ${timeStr}</span>
    `;
  }

  // Populate Schedule tab content
  const scheduleTicker = document.getElementById('stream-schedule-ticker');
  if (scheduleTicker) {
    const todayFixtures = state.games.slice(0, 4);
    scheduleTicker.innerHTML = todayFixtures.map(f => {
      const home = getTeamName(f, 'home');
      const away = getTeamName(f, 'away');
      const time = f.local_date ? f.local_date.split(' ')[1] : '';
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color); font-size:0.8rem;">
          <span style="font-weight:700;">${home} vs ${away}</span>
          <span style="font-family:ui-monospace, monospace; font-weight:800; color:var(--accent-color);">${time}</span>
        </div>`;
    }).join('');
  }

  // Pick first game for details sidebar
  if (state.games.length > 0) {
    selectStream(state.games[0].id);
  }
}

function selectStream(gameId) {
  const game = state.games.find(g => g.id === String(gameId));
  if (!game) return;

  const homeName = getTeamName(game, 'home');
  const awayName = getTeamName(game, 'away');

  const row = (label, value) => `
    <div class="stream-detail-row" style="border-bottom: 1px solid var(--border-color); padding: 8px 0;">
      <span class="stream-detail-label">${label}</span>
      <span class="stream-detail-value">${value}</span>
    </div>`;

  const possession = getSimulatedPossession(game.id);

  const infoEl = document.getElementById('stream-match-info');
  if (infoEl) {
    infoEl.innerHTML =
      `<div style="font-weight: 800; font-size: 1rem; margin-bottom: 12px; color: var(--accent-color);">${homeName} vs ${awayName}</div>` +
      row('Home',  homeName) +
      row('Away',  awayName) +
      row('Score', `<span style="font-family: ui-monospace, monospace; font-weight: 900; color: var(--accent-color);">${game.home_score}–${game.away_score}</span>`) +
      row('Possession', `<span style="font-family:ui-monospace, monospace;">${possession.home}% - ${possession.away}%</span>`) +
      row('Stage', getStageLabel(game.type) || `Group ${game.group}`) +
      row('Venue', getStadiumName(game.stadium_id)) +
      row('Match Clock', `<span style="color:var(--color-live); font-weight:800;"><i class="fa-solid fa-clock"></i> ${game.time_elapsed ? game.time_elapsed + "'" : 'LIVE'}</span>`);
  }
}

// Host Stadiums Page
function renderVenues() {
  const container = document.getElementById('venues-container');
  if (!container) return;

  const stadiums = Object.values(state.stadiums).length > 0
    ? Object.values(state.stadiums)
    : STADIUM_FALLBACK;

  const countryCode = { 'USA':'US','Mexico':'MX','Canada':'CA' };

  container.innerHTML = stadiums.map((s, index) => {
    const name = s.name_en || s.name || 'Stadium';
    const city = s.city_en || s.city || '';
    const country = s.country_en || s.country || '';
    const capacity = formatCapacity(s.capacity);
    const cc = countryCode[country] || '';
    const delay = index * 50;

    return `
      <div class="card" style="animation-delay: ${delay}ms; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
        ${makeStadiumImageHtml(s, index, 140)}
        <div style="padding: 16px;">
          <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px; display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <p style="font-size: 0.65rem; font-weight: 800; color: var(--accent-color); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${country}</p>
              <h3 style="font-size: 0.95rem; font-weight: 800;">${name}</h3>
            </div>
            ${cc ? `<img src="https://flagcdn.com/w40/${cc.toLowerCase()}.png" alt="${country}" style="height: 14px; border: 1px solid var(--border-color); margin-top:4px;">` : ''}
          </div>
          <div class="venue-details">
            <div class="venue-meta">
              <span class="venue-label">City</span>
              <span class="venue-val">${city}</span>
            </div>
            ${capacity ? `
            <div class="venue-meta" style="border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 4px;">
              <span class="venue-label">Capacity</span>
              <span class="venue-val" style="font-family: ui-monospace, monospace;">${capacity}</span>
            </div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// Compute group standings based on local matches list
function computeGroupStandings(group) {
  const groupGames = state.games.filter(g => g.group === group && g.type === 'group');
  const teamSet = new Set();
  groupGames.forEach(g => {
    if (g.home_team_id && g.home_team_id !== '0') teamSet.add(String(g.home_team_id));
    if (g.away_team_id && g.away_team_id !== '0') teamSet.add(String(g.away_team_id));
  });

  const standings = {};
  teamSet.forEach(id => {
    const team = state.teams[id];
    standings[id] = { id, name: team?.name_en || `Team ${id}`, flag: team?.flag || '', P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0 };
  });

  groupGames.forEach(g => {
    const status = getMatchStatus(g);
    if (status !== 'finished' && status !== 'live') return;
    const hid = String(g.home_team_id);
    const aid = String(g.away_team_id);
    const hs = parseInt(g.home_score) || 0;
    const as_ = parseInt(g.away_score) || 0;
    if (!standings[hid] || !standings[aid]) return;

    standings[hid].P++; standings[aid].P++;
    standings[hid].GF += hs; standings[hid].GA += as_;
    standings[aid].GF += as_; standings[aid].GA += hs;
    standings[hid].GD = standings[hid].GF - standings[hid].GA;
    standings[aid].GD = standings[aid].GF - standings[aid].GA;

    if (hs > as_) { standings[hid].W++; standings[hid].Pts+=3; standings[aid].L++; }
    else if (hs < as_) { standings[aid].W++; standings[aid].Pts+=3; standings[hid].L++; }
    else { standings[hid].D++; standings[hid].Pts++; standings[aid].D++; standings[aid].Pts++; }
  });

  return Object.values(standings).sort((a,b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF);
}

function getTeamFormDots(teamId, group) {
  const teamGames = state.games.filter(g => 
    g.group === group && 
    g.type === 'group' && 
    (String(g.home_team_id) === String(teamId) || String(g.away_team_id) === String(teamId))
  );
  
  teamGames.sort((a,b) => {
    const dateA = getKickoffUTC(a) || new Date(0);
    const dateB = getKickoffUTC(b) || new Date(0);
    return dateA - dateB;
  });

  return teamGames.map(g => {
    const status = getMatchStatus(g);
    if (status === 'upcoming') {
      return `<span class="form-dot empty" title="Upcoming Match"></span>`;
    }
    
    if (status === 'live') {
      return `<span class="form-dot" style="background-color: var(--accent-color);" title="Live Match">L</span>`;
    }

    const isHome = String(g.home_team_id) === String(teamId);
    const hs = parseInt(g.home_score) || 0;
    const as_ = parseInt(g.away_score) || 0;
    
    let result = 'D';
    if (hs > as_) {
      result = isHome ? 'W' : 'L';
    } else if (hs < as_) {
      result = isHome ? 'L' : 'W';
    }

    if (result === 'W') {
      return `<span class="form-dot win" title="Win">W</span>`;
    } else if (result === 'L') {
      return `<span class="form-dot loss" title="Loss">L</span>`;
    } else {
      return `<span class="form-dot draw" title="Draw">D</span>`;
    }
  }).join('');
}

// ─── INTERSECTION OBSERVER TICK COUNTERS ───────────────────────
function animateCountUp(el) {
  const target = parseInt(el.getAttribute('data-target')) || 0;
  const duration = 1000; 
  const startTime = performance.now();
  
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(progress * (2 - progress) * target); 
    el.textContent = value;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }
  requestAnimationFrame(update);
}

function initStatCounter() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCountUp(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stat-num').forEach(num => {
    observer.observe(num);
  });
}

// ─── AUTO-REFRESH FIXTURES ─────────────────────────────────────
let refreshInterval = null;

function startAutoRefresh() {
  refreshInterval = setInterval(async () => {
    await fetchAllData();
  }, 30000); // Poll every 30 seconds
}

// ─── STADIUM FALLBACK DATA ────────────────────────────────────
const STADIUM_FALLBACK = [
  { id:'1', name_en:'Estadio Azteca', city_en:'Mexico City', country_en:'Mexico', capacity:'87,523' },
  { id:'2', name_en:'AT&T Stadium', city_en:'Arlington, TX', country_en:'USA', capacity:'80,000' },
  { id:'3', name_en:'SoFi Stadium', city_en:'Los Angeles, CA', country_en:'USA', capacity:'70,240' },
  { id:'4', name_en:'MetLife Stadium', city_en:'East Rutherford, NJ', country_en:'USA', capacity:'82,500' },
  { id:'5', name_en:'Rose Bowl', city_en:'Pasadena, CA', country_en:'USA', capacity:'90,888' },
  { id:'6', name_en:'Estadio BBVA', city_en:'Monterrey', country_en:'Mexico', capacity:'51,348' },
  { id:'7', name_en:"Levi's Stadium", city_en:'Santa Clara, CA', country_en:'USA', capacity:'68,500' },
  { id:'8', name_en:'Arrowhead Stadium', city_en:'Kansas City, MO', country_en:'USA', capacity:'76,416' },
  { id:'9', name_en:'NRG Stadium', city_en:'Houston, TX', country_en:'USA', capacity:'72,220' },
  { id:'10', name_en:'Q2 Stadium', city_en:'Austin, TX', country_en:'USA', capacity:'20,738' },
  { id:'11', name_en:'Gillette Stadium', city_en:'Foxborough, MA', country_en:'USA', capacity:'65,878' },
  { id:'12', name_en:"BC Place", city_en:'Vancouver', country_en:'Canada', capacity:'54,500' },
  { id:'13', name_en:'Lincoln Financial Field', city_en:'Philadelphia, PA', country_en:'USA', capacity:'69,328' },
  { id:'14', name_en:'BMO Field', city_en:'Toronto', country_en:'Canada', capacity:'30,000' },
  { id:'15', name_en:'Empower Field', city_en:'Denver, CO', country_en:'USA', capacity:'76,125' },
  { id:'16', name_en:'Estadio Akron', city_en:'Guadalajara', country_en:'Mexico', capacity:'49,850' },
];

// ─── APP INITIALIZATION ────────────────────────────────────────
async function init() {
  initTheme();

  // Run countdown tickers
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Initial fetch and render
  await fetchAllData();

  // Activate count counters on visible viewport
  initStatCounter();

  // Start polling service
  startAutoRefresh();
}

document.addEventListener('DOMContentLoaded', init);
window.switchStreamTab = switchStreamTab;
window.selectChannel = selectChannel;
window.switchGroupTab = switchGroupTab;
window.setScheduleDate = setScheduleDate;
window.toggleTheme = toggleTheme;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.showSection = showSection;
