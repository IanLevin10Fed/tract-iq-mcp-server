import express from "express";

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/search', (req, res) => {
  const { address } = req.body;
  res.json({
    address,
    population: 281406,
    occupancyRate: '85%',
    medianIncome: '$573,387',
    facilities: 63,
    squareFootage: '4,252,660'
  });
});

app.listen(8080, () => console.log('Running on 8080'));
