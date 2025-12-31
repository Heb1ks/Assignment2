import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ===== TEST ROUTE =====
app.get("/", (req, res) => {
    res.send("Server is working");
});

// ===== OPENWEATHER API =====
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

app.get("/api/weather", async (req, res) => {
    try {
        const city = req.query.city;

        // Validation
        if (!city) {
            return res.status(400).json({ error: "City is required" });
        }

        // Request to OpenWeather
        const response = await fetch(
            `${WEATHER_URL}?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );

        if (!response.ok) {
            return res.status(404).json({ error: "City not found" });
        }

        const data = await response.json();

        // Response to frontend
        res.json({
            city: data.name,
            country: data.sys.country,
            temperature: data.main.temp,
            feels_like: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            wind_speed: data.wind.speed,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            coordinates: {
                lat: data.coord.lat,
                lon: data.coord.lon
            },
            rain_3h: data.rain ? data.rain["3h"] || 0 : 0
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// ===== NEWS API (Additional API #1) =====
const NEWS_URL = "https://newsapi.org/v2/everything";

app.get("/api/news", async (req, res) => {
    try {
        const city = req.query.city || "world";

        // Validation
        if (!city) {
            return res.status(400).json({ error: "City parameter is required" });
        }

        // Request to News API
        const response = await fetch(
            `${NEWS_URL}?q=${city}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
        );

        if (!response.ok) {
            return res.status(404).json({ error: "News not found" });
        }

        const data = await response.json();

        // Response to frontend
        res.json({
            articles: data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                publishedAt: article.publishedAt,
                source: article.source.name,
                image: article.urlToImage
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// ===== EXCHANGE RATE API (Additional API #2) =====
const EXCHANGE_URL = "https://api.exchangerate-api.com/v4/latest";

app.get("/api/currency", async (req, res) => {
    try {
        const base = req.query.base || "USD";

        // Validation
        if (!base) {
            return res.status(400).json({ error: "Base currency is required" });
        }

        // Request to Exchange Rate API
        const response = await fetch(`${EXCHANGE_URL}/${base}`);

        if (!response.ok) {
            return res.status(404).json({ error: "Currency data not found" });
        }

        const data = await response.json();

        // Response to frontend - showing main currencies
        res.json({
            base: data.base,
            date: data.date,
            rates: {
                USD: data.rates.USD,
                EUR: data.rates.EUR,
                GBP: data.rates.GBP,
                JPY: data.rates.JPY,
                CNY: data.rates.CNY,
                RUB: data.rates.RUB,
                KZT: data.rates.KZT
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// ===== ERROR HANDLING =====
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

///qqqqq