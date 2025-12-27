// -------------------------
// 🌤 Ghibli Sky Weather Script
// -------------------------

const API_KEY = 'YOUR_API_KEY'; // <-- Replace with your OpenWeatherMap API key

// Elements
const rain = document.getElementById('rain');
const snow = document.getElementById('snow');
const shootingStars = document.getElementById('shooting-stars');
const soundToggle = document.getElementById('soundToggle');
const themeToggle = document.getElementById('themeToggle');
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const citySuggestions = document.getElementById('citySuggestions');
const bgm = document.getElementById('bgm');
let lastSearchedCity = '';
let suggestionTimeout;

// -------------------------
// 🔧 Helper Functions
// -------------------------
function showError(msg) {
  document.getElementById('error').textContent = msg;
}

function isValidCity(city) {
  const cityRegex = /^[a-zA-Z\s\-']+$/;
  return cityRegex.test(city);
}

// -------------------------
// 🔍 Auto-suggest for City Names
// -------------------------
cityInput.addEventListener('input', () => {
  const query = cityInput.value.trim();
  citySuggestions.innerHTML = '';

  if (query.length < 2) return;

  clearTimeout(suggestionTimeout);
  suggestionTimeout = setTimeout(() => fetchCitySuggestions(query), 300);
});

// -------------------------
// 🌟 Weather Fetching
// -------------------------
async function getWeather(city) {
  clearEffects();
  showError('');

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
    if (!res.ok) throw new Error('City not found');
    const data = await res.json();

    const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);
    const fData = await fRes.json();

    renderWeather(data, fData);
    applyTheme(data.weather[0].icon);
    applyEffects(data.weather[0].main, data.wind.speed);
    playWeatherBGM(data.weather[0].main);
  } catch (e) {
    showError(e.message);
  }
}

// -------------------------
// 📝 Render Weather Info
// -------------------------
function renderWeather(d, f) {
  document.getElementById('current').innerHTML = `
    <h2>${d.name}, ${d.sys.country}</h2>
    <div class="temp">${Math.round(d.main.temp)}°C</div>
    <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png">
    <p>${d.weather[0].description}</p>
  `;

  document.getElementById('extras').innerHTML = `
    💧 ${d.main.humidity}% · 🌬 ${d.wind.speed} m/s<br>
    🌅 ${new Date(d.sys.sunrise*1000).toLocaleTimeString()} |
    🌇 ${new Date(d.sys.sunset*1000).toLocaleTimeString()}
  `;

  document.getElementById('forecast').innerHTML =
    f.list
      .filter(i => i.dt_txt.includes('12:00'))
      .slice(0, 5)
      .map(d => `
        <div class="day">
          ${new Date(d.dt_txt).toLocaleDateString('en-US', { weekday: 'short' })}<br>
          <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png"><br>
          ${Math.round(d.main.temp)}°
        </div>
      `).join('');
}

// -------------------------
// 🌙 Theme Handling
// -------------------------
function applyTheme(icon) {
  document.body.classList.toggle('night', icon.includes('n'));
  if (icon.includes('n')) spawnShootingStar();
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('night');
});

// -------------------------
// ❄ Weather Effects
// -------------------------
function applyEffects(type, wind) {
  document.querySelectorAll('.cloud').forEach(c => {
    c.style.animationDuration = `${100 - wind * 5}s`;
  });

  if (type === 'Rain' || type === 'Drizzle' || type === 'Thunderstorm') spawnRain();
  if (type === 'Snow') spawnSnow();
}

function spawnRain() {
  rain.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random() * 100 + 'vw';
    drop.style.top = Math.random() * -100 + 'vh';
    drop.style.animationDelay = Math.random() * 0.8 + 's';
    drop.style.animationDuration = 0.6 + Math.random() * 0.4 + 's';
    rain.appendChild(drop);
  }
}

function spawnSnow() {
  snow.innerHTML = '';
  for (let i = 0; i < 50; i++) {
    const s = document.createElement('div');
    s.className = 'snowflake';
    s.style.left = Math.random() * 100 + 'vw';
    s.style.top = Math.random() * -100 + 'vh';
    s.style.animationDuration = 6 + Math.random() * 4 + 's';
    s.style.animationDelay = Math.random() * 4 + 's';
    snow.appendChild(s);
  }
}

function spawnShootingStar() {
  const s = document.createElement('div');
  s.className = 'shooting-star';
  s.style.top = Math.random() * 40 + 'vh';
  s.style.left = '-150px';
  shootingStars.appendChild(s);
  setTimeout(() => s.remove(), 2000);
}

function clearEffects() {
  rain.innerHTML = '';
  snow.innerHTML = '';
  shootingStars.innerHTML = '';
}

// -------------------------
// 🔍 Search Button + Validation
// -------------------------
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

function handleSearch() {
  const city = cityInput.value.trim();
  showError('');

  if (!city) { showError('Please enter a city name.'); return; }
  if (city.length < 2) { showError('City name is too short.'); return; }
  if (city.length > 50) { showError('City name is too long.'); return; }
  if (!isValidCity(city)) { showError('City name contains invalid characters.'); return; }
  if (city.toLowerCase() === lastSearchedCity) { showError('You already searched for this city.'); return; }

  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching...';
  lastSearchedCity = city.toLowerCase();

  getWeather(city).finally(() => {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  });
}

// -------------------------
// 🎵 Weather-based BGM
// -------------------------
const BGM = {
  Clear: ['effects/sunny.mp3'],
  Clouds: ['effects/cloudy.mp3'],
  Rain: ['effects/rain.mp3'],
  Snow: ['effects/snow.mp3'],
  Drizzle: ['effects/drizzle.mp3'],
  Thunderstorm: ['effects/thunder.mp3']
};

function playWeatherBGM(weatherMain) {
  let tracks;
  switch(weatherMain) {
    case 'Clear': tracks = BGM.Clear; break;
    case 'Clouds': tracks = BGM.Clouds; break;
    case 'Rain': tracks = BGM.Rain; break;
    case 'Drizzle': tracks = BGM.Drizzle; break;
    case 'Thunderstorm': tracks = BGM.Thunderstorm; break;
    case 'Snow': tracks = BGM.Snow; break;
    default: tracks = BGM.Clear;
  }

  const track = tracks[Math.floor(Math.random() * tracks.length)];
  if(bgm.src.endsWith(track)) return;
  bgm.src = track;
  bgm.play().catch(err => console.log('BGM autoplay blocked'));
}

// -------------------------
// 🔊 BGM Sound Toggle
// -------------------------
soundToggle.addEventListener('click', () => {
  if (bgm.paused) bgm.play();
  else bgm.pause();
});

bgm.addEventListener('play', () => { soundToggle.textContent = '🔊'; });
bgm.addEventListener('pause', () => { soundToggle.textContent = '🔇'; });

document.body.addEventListener('click', () => {
  bgm.play().catch(() => {});
}, { once: true });
