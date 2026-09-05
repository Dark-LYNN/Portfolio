const path = require("path");

const dist = path.join(__dirname, "new", "dist");
const serveBin = path.join(__dirname, "new", "node_modules", ".bin", "serve");
const port = process.env.PORT || "3000";

module.exports = {
  apps: [
    {
      name: "lynnux-portfolio",
      script: serveBin,
      // -s = single/SPA mode: unknown routes (e.g. /interactive) serve index.html
      args: `-s ${dist} -l ${port}`,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
