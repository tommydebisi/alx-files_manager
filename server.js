import express from 'express';
import router from './routes';

const app = express();

// parse request body to json
app.use(express.json());

// apply router middleware
app.use(router);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Server running on port 5000...');
});
