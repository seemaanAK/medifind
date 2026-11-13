import { createApp } from './app.js';
import { CONFIG } from './config/index.js';

const app = createApp();

app.listen(CONFIG.port, () => {
  console.log(`[MediFind Server] Running on http://localhost:${CONFIG.port} in ${CONFIG.nodeEnv} mode`);
  console.log(`[MediFind Server] Health check available at http://localhost:${CONFIG.port}/api/health`);
});
