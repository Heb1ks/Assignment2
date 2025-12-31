
let map = null;
let marker = null;

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingMessage = document.getElementById('loadingMessage');
const weatherContent = document.getElementById('weatherContent');
const newsContent = document.getElementById('newsContent');
const currencyContent = document.getElementById('currencyContent');


function initMap() {
    map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}


function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function showLoading(show) {
    if (show) {
        loadingMessage.classList.add('show');
    } else {
        loadingMessage.classList.remove('show');
    }
}


function updateMap(lat, lon, cityName) {
    if (map) {
        map.setView([lat, lon], 13);

        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${cityName}</b><br>Lat: ${lat}<br>Lon: ${lon}`)
            .openPopup();
    }
}


async function fetchWeather(city) {
    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch weather data');
        }

        const data = await response.json();
        displayWeather(data);
        updateMap(data.coordinates.lat, data.coordinates.lon, data.city);

    } catch (error) {
        showError(error.message);
        weatherContent.innerHTML = '<p class="placeholder">Failed to load weather data</p>';
    }
}

function displayWeather(data) {
    const iconUrl = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;

    weatherContent.innerHTML = `
        <div class="weather-info">
            <div class="weather-main">
                <img src="${iconUrl}" alt="${data.description}">
                <div class="city-name">${data.city}, ${data.country}</div>
                <div class="temperature">${Math.round(data.temperature)}°C</div>
                <div class="description">${data.description}</div>
            </div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-label">Feels Like</div>
                    <div class="detail-value">${Math.round(data.feels_like)}°C</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Humidity</div>
                    <div class="detail-value">${data.humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pressure</div>
                    <div class="detail-value">${data.pressure} hPa</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Wind Speed</div>
                    <div class="detail-value">${data.wind_speed} m/s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Coordinates</div>
                    <div class="detail-value">${data.coordinates.lat.toFixed(2)}, ${data.coordinates.lon.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Rain (3h)</div>
                    <div class="detail-value">${data.rain_3h} mm</div>
                </div>
            </div>
        </div>
    `;
}


async function fetchNews(city) {
    try {
        const response = await fetch(`/api/news?city=${encodeURIComponent(city)}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch news');
        }

        const data = await response.json();
        displayNews(data);

    } catch (error) {
        showError(error.message);
        newsContent.innerHTML = '<p class="placeholder">Failed to load news</p>';
    }
}

function displayNews(data) {
    if (!data.articles || data.articles.length === 0) {
        newsContent.innerHTML = '<p class="placeholder">No news found for this city</p>';
        return;
    }

    const newsHTML = data.articles.map(article => `
        <div class="news-item">
            <h3>${article.title}</h3>
            <p>${article.description || 'No description available'}</p>
            <div class="news-meta">
                <span>${article.source}</span> • 
                <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
            <a href="${article.url}" target="_blank">Read more →</a>
        </div>
    `).join('');

    newsContent.innerHTML = `<div class="news-list">${newsHTML}</div>`;
}


async function fetchCurrency() {
    try {
        const response = await fetch('/api/currency?base=USD');

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch currency data');
        }

        const data = await response.json();
        displayCurrency(data);

    } catch (error) {
        showError(error.message);
        currencyContent.innerHTML = '<p class="placeholder">Failed to load currency data</p>';
    }
}


function displayCurrency(data) {
    const ratesHTML = Object.entries(data.rates).map(([code, rate]) => `
        <div class="currency-item">
            <div class="currency-code">${code}</div>
            <div class="currency-rate">${rate.toFixed(4)}</div>
        </div>
    `).join('');

    currencyContent.innerHTML = `
        <div class="currency-info">
            <div class="currency-header">
                <div class="currency-base">Base: ${data.base}</div>
                <div class="currency-date">Updated: ${data.date}</div>
            </div>
            <div class="currency-rates">
                ${ratesHTML}
            </div>
        </div>
    `;
}


async function handleSearch() {
    const city = cityInput.value.trim();

    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading(true);

    try {

        await Promise.all([
            fetchWeather(city),
            fetchNews(city)
        ]);
    } catch (error) {
        showError('Something went wrong. Please try again.');
    } finally {
        showLoading(false);
    }
}

searchBtn.addEventListener('click', handleSearch);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});


window.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchCurrency(); 
});
