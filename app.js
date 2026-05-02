
const API_KEY = "d784ab9e8013d685a14a7c3e75a46f1c";

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const statusArea = document.getElementById('statusArea');
const weatherDisplay = document.getElementById('weatherDisplay');

const cityNameSpan = document.getElementById('cityName');
const countrySpan = document.getElementById('countryCode');
const tempSpan = document.getElementById('temperature');
const weatherIconImg = document.getElementById('weatherIcon');
const weatherDescSpan = document.getElementById('weatherDesc');
const humiditySpan = document.getElementById('humidity');
const windSpan = document.getElementById('windSpeed');
const pressureSpan = document.getElementById('pressure');
const feelsLikeSpan = document.getElementById('feelsLike');

function setStatus(type, message) {
    statusArea.innerHTML = '';
    if (type === 'loading') {
        statusArea.innerHTML = `<div class="status-message loading">⏳ ${message || 'Fetching weather data...'}</div>`;
        weatherDisplay.style.display = 'none';
    } else if (type === 'error') {
        statusArea.innerHTML = `<div class="status-message error">⚠️ ${message || 'Something went wrong. Please try again.'}</div>`;
        weatherDisplay.style.display = 'none';
    } else if (type === 'clear') {
        statusArea.innerHTML = '';
    }
}

function updateWeatherUI(data) {
    if (!data || !data.main) {
        setStatus('error', 'Invalid data received. Please try another city.');
        return;
    }
    

    const city = data.name || 'Unknown';
    const country = data.sys?.country || '';
    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    const humidity = data.main.humidity;
    const pressure = data.main.pressure;
    const windSpeed = data.wind?.speed;
    const description = data.weather?.[0]?.description || 'No description';
    const iconCode = data.weather?.[0]?.icon || '01d';
    
    cityNameSpan.textContent = city;
    countrySpan.textContent = country ? `📍 ${country}` : '';
    tempSpan.textContent = Math.round(temp);
    feelsLikeSpan.textContent = `${Math.round(feelsLike)}°`;
    humiditySpan.textContent = `${humidity}%`;
    pressureSpan.textContent = `${pressure} hPa`;
    
    const windKmh = (windSpeed * 3.6).toFixed(1);
    windSpan.textContent = `${windKmh} km/h`;
    weatherDescSpan.textContent = description;
    
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIconImg.src = iconUrl;
    weatherIconImg.alt = description;
    
    weatherDisplay.style.display = 'block';
    setStatus('clear', '');
}

async function fetchWeatherByCity(city) {
    if (!city || city.trim() === '') {
        setStatus('error', 'Please enter a city name! 🌍');
        return false;
    }
    setStatus('loading', `Searching for "${city}" ...`);
    weatherDisplay.style.display = 'none';
    
    try {
        const endpoint = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            let errorMsg = `City not found (${response.status})`;
            if (response.status === 401) errorMsg = 'API key invalid. Please replace with your OpenWeatherMap API key.';
            else if (response.status === 404) errorMsg = `"${city}" not found. Check spelling or try another city.`;
            else if (response.status === 429) errorMsg = 'Too many requests. Wait a moment and try again.';
            setStatus('error', errorMsg);
            return false;
        }
        
        const data = await response.json();
        updateWeatherUI(data);
        return true;
    } catch (err) {
        console.error(err);
        setStatus('error', 'Network error. Check your internet connection.');
        return false;
    }
}

async function fetchWeatherByCoords(lat, lon) {
    setStatus('loading', 'Getting weather at your location...');
    weatherDisplay.style.display = 'none';
    try {
        const endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            let errText = `Location error (${response.status})`;
            if (response.status === 401) errText = 'API key issue. Provide valid OpenWeather key.';
            setStatus('error', errText);
            return false;
        }
        const data = await response.json();
        updateWeatherUI(data);
        return true;
    } catch (err) {
        console.error(err);
        setStatus('error', 'Failed to fetch location weather. Network issue.');
        return false;
    }
}

function getUserLocationAndFetch() {
    if (!navigator.geolocation) {
        setStatus('error', 'Geolocation is not supported by your browser. Try searching manually.');
        return;
    }
    
    setStatus('loading', 'Requesting location access ...');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        },
        (error) => {
            console.warn('Geolocation error:', error);
            let errorMessage = 'Could not access your location. ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Permission denied. Allow location or type city manually.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Position unavailable. Try typing a city.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
            }
            setStatus('error', errorMessage);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
}

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city === '') {
        setStatus('error', 'Please type a city name 🌆');
        return;
    }
    fetchWeatherByCity(city);
});

geoBtn.addEventListener('click', () => {
    getUserLocationAndFetch();
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
        else setStatus('error', 'Enter a city name.');
    }
});

window.addEventListener('load', () => {
    fetchWeatherByCity('London');
});

console.log('✅ Weather App ready | Use search or geolocation. If API key fails, replace API_KEY variable with your OpenWeather API key.');