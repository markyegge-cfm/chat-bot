// src/index.ts
import express, { type Application, type Request, type Response } from 'express';

const app: Application = express();
const PORT: number = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express & TypeScript Server');
});

app.listen(PORT, () => {
  console.log(`Server is Fire at http://localhost:${PORT}`);
});
