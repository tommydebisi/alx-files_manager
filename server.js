import express from 'express';
import router from './routes/index';

const app = express();

// parse request body to json, increased limit of data to be parsed
app.use(express.json({ limit: '4mb' }));

// apply router middleware
app.use(router);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Server running on port 5000...');
});
