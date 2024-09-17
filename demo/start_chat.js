module.exports = {
    apps: [
      {
        name: 'vite-server',
        script: 'node',
        args: 'node_modules/vite/bin/vite.js',
        watch: true
      },
      {
        name: 'npm-dev',
        script: 'npm',
        args: 'run dev',
        watch: true
      }
    ]
  };