// Startup file Passenger (diunggah sebagai server.js di folder aplikasi cPanel).
// Menjalankan rilis yang tercatat di file RELEASE: releases/<RELEASE>/server.js (Next.js standalone).
// node_modules dipakai bersama dari folder aplikasi; Node menemukannya dengan menelusuri folder induk.
// Rollback: tulis nama rilis sebelumnya ke RELEASE lalu ubah tmp/restart.txt.
const fs = require("node:fs");
const path = require("node:path");

const release = fs.readFileSync(path.join(__dirname, "RELEASE"), "utf8").trim();
require(path.join(__dirname, "releases", release, "server.js"));
