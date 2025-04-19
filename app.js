import express from 'express';
import cors from 'cors';
import axios from 'axios';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./frontend/public'));

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https://*.nasa.gov'],
  },
}));

app.use(helmet.referrerPolicy({ policy: 'same-origin' }));
app.use(helmet.crossOriginEmbedderPolicy({ policy: 'credentialless' }));


// Rate limiting middleware to limit requests to 100 per minute
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Middleware to set security headers
app.use(helmet({
  contentSecurityPolicy: false,
}));


// set ejs as the view engine in the frontend directory
app.set('views', './frontend/views');

app.set('view engine', 'ejs');

// NASA APOD API configuration
const API_KEY = process.env.NASA_API_KEY; // Ensure you have a .env file with your API key
const API_URL = `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`;

// Gallery route: Fetch last 10 days of APOD data
app.get('/', (req, res) => {
  const endDate = new Date().toISOString().split('T')[0]; // Today's date
  const startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 10 days ago
  const apiUrl = `${API_URL}&start_date=${startDate}&end_date=${endDate}`;

  axios.get(apiUrl)
    .then(response => {
      const apodData = response.data; // Array of APOD entries
      res.render('gallery', { apodData });
    })
    .catch(error => {
      console.error('Error fetching gallery data:', error.message);
      res.status(500).send('Error fetching data from APOD API');
    });
});

// Detail route: Fetch data for a specific date
app.get('/detail/:date', (req, res) => {
  const date = req.params.date;
  const apiUrl = `${API_URL}&date=${date}`;

  axios.get(apiUrl)
    .then(response => {
      const entry = response.data; // Single APOD entry
      res.render('detail', { entry });
    })
    .catch(error => {
      console.error('Error fetching detail data:', error.message);
      res.status(500).send('Error fetching data from APOD API');
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
