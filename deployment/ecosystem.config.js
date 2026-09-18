module.exports = {
  apps: [
    {
      name: 'aura-privacy-dating-api',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 7000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 7000,
      },
    },
  ],
};
