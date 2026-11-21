/**
 * PM2 process config for the NestJS API on AWS Lightsail (or any VPS).
 *
 * Start:    pm2 start ecosystem.config.js
 * Restart:  pm2 restart quilo-api
 * Logs:     pm2 logs quilo-api
 *
 * IMPORTANT: keep this to a SINGLE instance. The push-notification worker
 * runs inside the API process (Redis BLPOP loop); running multiple instances
 * would deliver duplicate push notifications.
 */
module.exports = {
  apps: [
    {
      name: 'quilo-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      // Reads the rest (DB, Redis, JWT, etc.) from the .env file in this folder.
    },
  ],
};
