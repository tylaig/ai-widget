import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(routes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});