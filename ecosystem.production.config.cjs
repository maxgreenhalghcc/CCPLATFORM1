module.exports = {
  apps: [
    {
      name: 'cc_api',
      cwd: '/opt/CCPLATFORM1/api',
      script: 'dist/main.js',
      interpreter: 'node',
      env_file: '/opt/CCPLATFORM1/.env.local',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'cc_web',
      cwd: '/opt/CCPLATFORM1/web',
      script: '/opt/CCPLATFORM1/web/node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      interpreter: 'node',
      env_file: '/opt/CCPLATFORM1/.env.local',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
    {
      name: 'cc_recipe',
      cwd: '/opt/CCPLATFORM1/recipe',
      script: 'python3',
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 4001',
      interpreter: 'none',
      env_file: '/opt/CCPLATFORM1/.env.local',
      env: {
        RECIPE_PORT: '4001',
      },
    },
  ],
};
