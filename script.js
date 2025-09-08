// script.js
class WeatherApp {
    constructor() {
        // You'll need to get a free API key from OpenWeatherMap
        this.API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        this.ICON_URL = 'https://openweathermap.org/img/wn';
        
        this.initializeElements();
        this.bindEvents();
        this.updateDateTime();
        
        // For demo purposes, load sample data
        this.loadDemoData();
    }

    initializeElements() {
        this.locationInput = document.getElementById('locationInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.currentLocationBtn = document.getElementById('currentLocationBtn');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.weatherContainer = document.getElementById('weatherContainer');
        
        // Current weather elements
        this.currentLocation = document.getElementById('currentLocation');
        this.currentDate = document.getElementById('currentDate');
        this.currentTemp = document.getElementById('currentTemp');
        this.currentIcon = document.getElementById('currentIcon');
        this.currentDescription = document.getElementById('currentDescription');
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.pressure = document.getElementById('pressure');
        
        // Forecast elements
        this.hourlyForecast = document.getElementById('hourlyForecast');
        this.dailyForecast = document.getElementById('dailyForecast');
    }

    bindEvents() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.currentLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        this.locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
    }

    updateDateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        this.currentDate.textContent = now.toLocaleDateString('en-US', options);
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.errorMessage.style.display = 'none';
        this.weatherContainer.style.display = 'none';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.style.display = 'block';
        document.getElementById('errorText').textContent = message;
        this.weatherContainer.style.display = 'none';
        this.hideLoading();
    }

    showWeather() {
        this.weatherContainer.style.display = 'block';
        this.errorMessage.style.display = 'none';
        this.hideLoading();
    }

    async handleSearch() {
        const location = this.locationInput.value.trim();
        if (!location) {
            this.showError('Please enter a location');
            return;
        }

        if (this.API_KEY === 'YOUR_API_KEY_HERE') {
            this.showError('Please configure your OpenWeatherMap API key in script.js');
            return;
        }

        this.showLoading();
        
        try {
            await this.fetchWeatherData(location);
        } catch (error) {
            this.showError('Failed to fetch weather data. Please try again.');
            console.error('Weather fetch error:', error);
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await this.fetchWeatherDataByCoords(latitude, longitude);
                } catch (error) {
                    this.showError('Failed to fetch weather data for your location');
                    console.error('Weather fetch error:', error);
                }
            },
            () => {
                this.showError('Unable to retrieve your location');
            }
        );
    }

    async fetchWeatherData(location) {
        // Current weather
        const currentResponse = await fetch(
            `${this.BASE_URL}/weather?q=${location}&appid=${this.API_KEY}&units=metric`
        );
        
        if (!currentResponse.ok) {
            throw new Error('Location not found');
        }
        
        const currentData = await currentResponse.json();
        
        // 5-day forecast
        const forecastResponse = await fetch(
            `${this.BASE_URL}/forecast?q=${location}&appid=${this.API_KEY}&units=metric`
        );
        
        const forecastData = await forecastResponse.json();
        
        this.displayWeatherData(currentData, forecastData);
    }

    async fetchWeatherDataByCoords(lat, lon) {
        // Current weather
        const currentResponse = await fetch(
            `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
        );
        
        const currentData = await currentResponse.json();
        
        // 5-day forecast
        const forecastResponse = await fetch(
            `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
        );
        
        const forecastData = await forecastResponse.json();
        
        this.displayWeatherData(currentData, forecastData);
    }

    displayWeatherData(current, forecast) {
        // Display current weather
        this.currentLocation.textContent = `${current.name}, ${current.sys.country}`;
        this.currentTemp.textContent = `${Math.round(current.main.temp)}°C`;
        this.currentIcon.src = `${this.ICON_URL}/${current.weather[0].icon}@2x.png`;
        this.currentIcon.alt = current.weather[0].description;
        this.currentDescription.textContent = current.weather[0].description;
        this.feelsLike.textContent = `${Math.round(current.main.feels_like)}°C`;
        this.humidity.textContent = `${current.main.humidity}%`;
        this.windSpeed.textContent = `${current.wind.speed} m/s`;
        this.pressure.textContent = `${current.main.pressure} hPa`;

        // Display hourly forecast (next 8 hours)
        this.displayHourlyForecast(forecast.list.slice(0, 8));
        
        // Display daily forecast
        this.displayDailyForecast(this.processDailyForecast(forecast.list));
        
        this.showWeather();
    }

    displayHourlyForecast(hourlyData) {
        this.hourlyForecast.innerHTML = '';
        
        hourlyData.forEach(item => {
            const time = new Date(item.dt * 1000);
            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-item';
            
            hourElement.innerHTML = `
                <div class="time">${time.getHours()}:00</div>
                <img src="${this.ICON_URL}/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
                <div class="temp">${Math.round(item.main.temp)}°</div>
            `;
            
            this.hourlyForecast.appendChild(hourElement);
        });
    }

    processDailyForecast(forecastList) {
        const dailyData = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    humidity: item.main.humidity,
                    wind: item.wind.speed
                };
            }
            
            dailyData[dateKey].temps.push(item.main.temp);
        });
        
        return Object.values(dailyData).slice(0, 5);
    }

    displayDailyForecast(dailyData) {
        this.dailyForecast.innerHTML = '';
        
        dailyData.forEach((day, index) => {
            const maxTemp = Math.round(Math.max(...day.temps));
            const minTemp = Math.round(Math.min(...day.temps));
            
            const dayName = index === 0 ? 'Today' : 
                          day.date.toLocaleDateString('en-US', { weekday: 'long' });
            
            const dayElement = document.createElement('div');
            dayElement.className = 'daily-item';
            
            dayElement.innerHTML = `
                <div class="day">${dayName}</div>
                <div class="weather-info">
                    <img src="${this.ICON_URL}/${day.weather.icon}.png" alt="${day.weather.description}">
                    <span>${day.weather.main}</span>
                </div>
                <div class="temps">
                    <span class="high">${maxTemp}°</span>
                    <span class="low">${minTemp}°</span>
                </div>
            `;
            
            this.dailyForecast.appendChild(dayElement);
        });
    }

    // Demo data for when API key is not configured
    loadDemoData() {
        if (this.API_KEY === 'YOUR_API_KEY_HERE') {
            setTimeout(() => {
                this.displayDemoData();
            }, 1000);
        }
    }

    displayDemoData() {
        // Demo current weather
        this.currentLocation.textContent = 'New York, US';
        this.currentTemp.textContent = '22°C';
        this.currentIcon.src = `${this.ICON_URL}/01d@2x.png`;
        this.currentDescription.textContent = 'Clear sky';
        this.feelsLike.textContent = '25°C';
        this.humidity.textContent = '65%';
        this.windSpeed.textContent = '3.2 m/s';
        this.pressure.textContent = '1013 hPa';

        // Demo hourly forecast
        const demoHours = [
            { time: '14:00', icon: '01d', temp: '22' },
            { time: '15:00', icon: '01d', temp: '24' },
            { time: '16:00', icon: '02d', temp: '25' },
            { time: '17:00', icon: '02d', temp: '23' },
            { time: '18:00', icon: '03d', temp: '21' },
            { time: '19:00', icon: '03d', temp: '19' },
            { time: '20:00', icon: '04d', temp: '18' },
            { time: '21:00', icon: '04d', temp: '17' }
        ];

        this.hourlyForecast.innerHTML = '';
        demoHours.forEach(hour => {
            const hourElement = document.createElement('div');
            hourElement.className = 'hourly-item';
            hourElement.innerHTML = `
                <div class="time">${hour.time}</div>
                <img src="${this.ICON_URL}/${hour.icon}.png" alt="Weather">
                <div class="temp">${hour.temp}°</div>
            `;
            this.hourlyForecast.appendChild(hourElement);
        });

        // Demo daily forecast
        const demoDays = [
            { day: 'Today', icon: '01d', weather: 'Sunny', high: '25', low: '15' },
            { day: 'Tomorrow', icon: '02d', weather: 'Partly Cloudy', high: '23', low: '14' },
            { day: 'Wednesday', icon: '10d', weather: 'Rain', high: '19', low: '12' },
            { day: 'Thursday', icon: '04d', weather: 'Cloudy', high: '21', low: '13' },
            { day: 'Friday', icon: '01d', weather: 'Sunny', high: '26', low: '16' }
        ];

        this.dailyForecast.innerHTML = '';
        demoDays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'daily-item';
            dayElement.innerHTML = `
                <div class="day">${day.day}</div>
                <div class="weather-info">
                    <img src="${this.ICON_URL}/${day.icon}.png" alt="${day.weather}">
                    <span>${day.weather}</span>
                </div>
                <div class="temps">
                    <span class="high">${day.high}°</span>
                    <span class="low">${day.low}°</span>
                </div>
            `;
            this.dailyForecast.appendChild(dayElement);
        });

        this.showWeather();
    }
}

// Initialize the weather app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
