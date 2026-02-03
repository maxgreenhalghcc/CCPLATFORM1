module.exports = {
  apps: [
    {
      name: 'ccplatform1-api-staging',
      cwd: '/home/openclaw/.openclaw/workspace/CCPLATFORM1/api',
      script: 'dist/main.js',
      interpreter: 'node',
      env_file: '/home/openclaw/.openclaw/workspace/CCPLATFORM1/.env.staging.local',
      env: {
        NODE_ENV: 'production',
        API_PORT: '4100',
      },
    },
    {
      name: 'ccplatform1-web-staging',
      cwd: '/home/openclaw/.openclaw/workspace/CCPLATFORM1/web',
      script: '/home/openclaw/.openclaw/workspace/CCPLATFORM1/web/node_modules/next/dist/bin/next',
      args: 'start -p 3100',
      interpreter: 'node',
      env_file: '/home/openclaw/.openclaw/workspace/CCPLATFORM1/.env.staging.local',
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
      },
    },
  ],
};
