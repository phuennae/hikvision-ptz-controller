module.exports = {
  apps: [
    {
      name: "hikvision-web",
      script: "server.js"
    },
    {
      name: "tunnel-web",
      script: "./node_modules/localtunnel/bin/lt.js",
      args: "--port 3000 --subdomain phuenpa-cctv-web"
    }
  ]
};