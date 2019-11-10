import path from 'path';
import express from 'express';
const app = express();

app.use('/static', express.static(path.join(__dirname, '../static')));
app.use('/client_dist', express.static(path.join(__dirname, '../client_dist')));

app.get('/', (_req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(3001);
