module.exports = {
  apps: [{
    name: "talent-match",
    script: "npm",
    args: "start",
    cwd: process.cwd(),
    env: {
      NODE_ENV: "production",
      PORT: "3000"
    },
    watch: false,
    instances: 1,
    exec_mode: "fork"
  }]
};

