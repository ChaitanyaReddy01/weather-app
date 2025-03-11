import { useState, useEffect } from "react";
import "./App.css";
import React from 'react';


const WeatherApp = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [locationWeather, setLocationWeather] = useState(null);
  const [cityWeatherList, setCityWeatherList] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_KEY = "a8de69ee61d850dd7331376378cafc85"; // Replace with your API key

  const cities = ["New York", "London", "Tokyo", "Sydney", "Hyderabad"];

  const fetchWeatherByCity = async (cityName) => {
    if (!cityName.trim()) return;
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
        setWeather(null);
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
      console.error("Error fetching weather by coords:", error);
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
    const getLocationWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("Geolocation success:", latitude, longitude); // Debug log
            fetchWeatherByCoords(latitude, longitude);
          },
          (error) => {
            console.error("Geolocation error:", error.message); // Debug log
            fetchWeatherByCoords(40.7128, -74.0060); // Fallback to New York
            alert("Location access denied. Showing default location (New York).");
          },
          { timeout: 10000, maximumAge: 10000, enableHighAccuracy: true }
        );
      } else {
        console.warn("Geolocation not supported by browser"); // Debug log
        fetchWeatherByCoords(40.7128, -74.0060); // Fallback to New York
        alert("Geolocation not supported. Showing default location (New York).");
      }
    };

    getLocationWeather();
    fetchCityWeather();
  }, []);

  const getLocalTime = (timezoneOffset) => {
    const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const localDate = new Date(utc + timezoneOffset * 1000);
    return localDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h2>Weather</h2>
      </header>

      <main className="main-content">
        {loading && <div className="loading">Loading...</div>}

        <div className="search-section">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search for a city..."
          />
          <button onClick={() => fetchWeatherByCity(city)}>Search</button>
        </div>

        {locationWeather && !loading && (
          <div className="location-weather">
            <h2>Your Location: {locationWeather.name}</h2>
            <div className="weather-info">
              <img
                src={`https://openweathermap.org/img/wn/${locationWeather.weather[0].icon}@2x.png`}
                alt="weather icon"
              />
              <h3>{locationWeather.main.temp.toFixed(1)}°C</h3>
              <p>{locationWeather.weather[0].description}</p>
              <p>Local Time: {getLocalTime(locationWeather.timezone)}</p>
              <p>Humidity: {locationWeather.main.humidity}%</p>
              <p>Wind: {locationWeather.wind.speed} m/s</p>
            </div>
          </div>
        )}

        {weather && !loading && (
          <div className="searched-weather">
            <h2>{weather.name}</h2>
            <div className="weather-info">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt="weather icon"
              />
              <h3>{weather.main.temp.toFixed(1)}°C</h3>
              <p>{weather.weather[0].description}</p>
              <p>Local Time: {getLocalTime(weather.timezone)}</p>
              <p>Humidity: {weather.main.humidity}%</p>
              <p>Wind: {weather.wind.speed} m/s</p>
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