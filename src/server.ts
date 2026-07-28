import 'dotenv/config';

import { app } from './app.js';

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  console.log('');
  console.log('🚀 Phone Store API iniciada');
  console.log(`🔗 http://localhost:${port}`);
  console.log(`❤️  http://localhost:${port}/health`);
  console.log('');
});