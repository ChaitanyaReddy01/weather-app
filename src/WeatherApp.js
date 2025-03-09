import { useState, useEffect } from "react";
import "./App.css";

const WeatherApp = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [locationWeather, setLocationWeather] = useState(null);
  const [cityWeatherList, setCityWeatherList] = useState([]);
  const [locationForecastType, setLocationForecastType] = useState("hourly");
  const [searchForecastType, setSearchForecastType] = useState("hourly");
  const [loading, setLoading] = useState(false);
  const API_KEY = "a8de69ee61d850dd7331376378cafc85"; // Replace with your OpenWeather API Key

  const cities = ["New York", "London", "Tokyo", "Sydney", "Hyderabad"];

  const fetchWeatherByCity = async (cityName) => {
    setLoading(true);
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
        ),
      ]);
      const weatherData = await weatherResponse.json();
      const forecastData = await forecastResponse.json();
      if (weatherData.cod === 200) {
        setWeather({ ...weatherData, forecast: forecastData });
      } else {
        alert("City not found");
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    try {
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        ),
      ]);
      const weatherData = await weatherResponse.json();
      const forecastData = await forecastResponse.json();
      if (weatherData.cod === 200) {
        setLocationWeather({ ...weatherData, forecast: forecastData });
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCityWeather = async () => {
    try {
      const cityWeatherData = await Promise.all(
        cities.map(async (cityName) => {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
          );
          return response.json();
        })
      );
      setCityWeatherList(cityWeatherData);
    } catch (error) {
      console.error("Error fetching city weather:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (navigator.geolocation) {
      const timeoutId = setTimeout(() => {
        console.warn("Geolocation timeout, using fallback.");
        fetchWeatherByCoords(40.7128, -74.0060); // Fallback: New York
        alert("Location access took too long. Showing default location (New York).");
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error("Geolocation error:", error);
          fetchWeatherByCoords(40.7128, -74.0060);
          alert("Location access denied. Showing default location (New York).");
        },
        { timeout: 5000, maximumAge: 10000 }
      );
    } else {
      fetchWeatherByCoords(40.7128, -74.0060);
    }
    fetchCityWeather();
  }, []);

  const getLocalTime = (timezoneOffset) => {
    const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const localDate = new Date(utc + timezoneOffset * 1000);
    return localDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearch = debounce((cityName) => {
    if (cityName) fetchWeatherByCity(cityName);
  }, 500);

  return (
    <div className="app-container">
      <header className="header">
        <h2>Weather</h2>
      </header>

      <main className="main-content">
        {loading && <div className="loading">Loading...</div>}

        {locationWeather && !loading && (
          <div className="location-weather">
            <div className="location-header">
              <h1>{locationWeather.name}</h1>
              <div className="forecast-toggle">
                <button
                  onClick={() => setLocationForecastType("hourly")}
                  className={locationForecastType === "hourly" ? "active" : ""}
                >
                  Hourly
                </button>
                <button
                  onClick={() => setLocationForecastType("daily")}
                  className={locationForecastType === "daily" ? "active" : ""}
                >
                  Daily
                </button>
              </div>
            </div>
            <div className="weather-info">
              <img
                src={`https://openweathermap.org/img/wn/${locationWeather.weather[0].icon}@2x.png`}
                alt="weather icon"
                onError={(e) => (e.target.src = "https://openweathermap.org/img/wn/01d@2x.png")} // Fallback icon
              />
              <div>
                <h2>{locationWeather.main.temp.toFixed(1)}°C</h2>
                <p>{locationWeather.weather[0].description}</p>
              </div>
            </div>
            <div className="weather-details">
              <p>Local Time: {getLocalTime(locationWeather.timezone)}</p>
              <p>Feels like: {locationWeather.main.feels_like.toFixed(1)}°C</p>
              <p>Humidity: {locationWeather.main.humidity}%</p>
              <p>Wind: {locationWeather.wind.speed} m/s</p>
            </div>
            <div className="forecast-section">
              {locationWeather.forecast && (
                <div className={locationForecastType === "hourly" ? "hourly-forecast" : "daily-forecast"}>
                  {locationForecastType === "hourly"
                    ? locationWeather.forecast.list.slice(0, 8).map((hour, index) => (
                        <div key={index} className="forecast-item">
                          <p>{new Date(hour.dt * 1000).getHours()}:00</p>
                          <img
                            src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                            alt="weather icon"
                            onError={(e) => (e.target.src = "https://openweathermap.org/img/wn/01d.png")} // Fallback icon
                          />
                          <p>{hour.main.temp.toFixed(1)}°C</p>
                        </div>
                      ))
                    : locationWeather.forecast.list
                        .filter((_, index) => index % 8 === 0)
                        .slice(0, 7)
                        .map((day, index) => (
                          <div key={index} className="forecast-item">
                            <p>{new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short" })}</p>
                            <img
                              src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                              alt="weather icon"
                              onError={(e) => (e.target.src = "https://openweathermap.org/img/wn/01d.png")} // Fallback icon
                            />
                            <p>{day.main.temp.toFixed(1)}°C</p>
                          </div>
                        ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="search-section">
          <input
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search for a city..."
          />
          <button onClick={() => fetchWeatherByCity(city)}>Search</button>
        </div>

        {weather && !loading && (
          <div className="searched-weather">
            <div className="location-header">
              <h2>{weather.name}</h2>
              <div className="forecast-toggle">
                <button
                  onClick={() => setSearchForecastType("hourly")}
                  className={searchForecastType === "hourly" ? "active" : ""}
                >
                  1 Day
                </button>
                <button
                  onClick={() => setSearchForecastType("daily")}
                  className={searchForecastType === "daily" ? "active" : ""}
                >
                  7 Days
                </button>
              </div>
            </div>
            <div className="weather-info">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt="weather icon"
                onError={(e) => (e.target.src = "https://openweathermap.org/img/wn/01d@2x.png")} // Fallback icon
              />
              <div>
                <h3>{weather.main.temp.toFixed(1)}°C</h3>
                <p>{weather.weather[0].description}</p>
              </div>
            </div>
            <div className="weather-details">
              <p>Local Time: {getLocalTime(weather.timezone)}</p>
              <p>Feels like: {weather.main.feels_like.toFixed(1)}°C</p>
              <p>Humidity: {weather.main.humidity}%</p>
              <p>Wind: {weather.wind.speed} m/s</p>
            </div>
            <div className="forecast-section">
              {weather.forecast && (
                <div className={searchForecastType === "hourly" ? "hourly-forecast" : "daily-forecast"}>
                  {searchForecastType === "hourly"
                    ? weather.forecast.list.slice(0, 8).map((hour, index) => (
                        <div key={index} className="forecast-item">
                          <p>{new Date(hour.dt * 1000).getHours()}:00</p>
                          <img
                            src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                            alt="weather icon"
                            onError={(e) => (e.target.src = "https://openweathermap.org/img/wn/01d.png")} // Fallback icon
                          />
                          <p>{hour.main.temp.toFixed(1)}°C</p>
                        </div>
                      ))
                    : weather.forecast.list
                        .filter((_, index) => index % 8 === 0)
                        .slice(0, 7)
                        .map((day, index) => (
                          <div key={index} className="forecast-item">
                            <p>{new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short" })}</p>
                            <img
                              src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                              alt="weather icon"
                              onError={(e) => (e.target.src = "https://openweathermap.org/img/wn/01d.png")} // Fallback icon
                            />
                            <p>{day.main.temp.toFixed(1)}°C</p>
                          </div>
                        ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="city-weather">
          {cityWeatherList.map((data, index) => (
            <div key={index} className="city-card">
              <h3>{data.name}</h3>
              <p>{getLocalTime(data.timezone)}</p>
              <img
                src={`https://openweathermap.org/img/wn/${data.weather[0].icon}.png`}
                alt="weather icon"
                onError={(e) => (e.target.src = "https://openweathermap.org/img/wn/01d.png")} // Fallback icon
              />
              <h4>{data.main.temp.toFixed(1)}°C</h4>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>Weather App © 2025</p>
      </footer>
    </div>
  );
};

export default WeatherApp;