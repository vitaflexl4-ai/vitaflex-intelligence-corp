#!/usr/bin/env node

/**
 * Vitaflex Intelligence Corp — Live Watcher & Instant Auto-Updater
 * 
 * Watches workspace source files (admin.html, index.html, server.js, assets)
 * and automatically triggers build.js whenever any change is detected.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WATCH_FILES = ['admin.html', 'index.html', 'cloudflare-worker.js', 'server.js'];
const WATCH_DIRS = ['assets', 'audio'];

let debounceTimer = null;

function triggerBuild(triggerName) {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    console.log(`\n\x1b[33m⚡ Change detected in [${triggerName}] — Triggering auto-update pipeline...\x1b[0m`);
    try {
      execSync('node build.js', { stdio: 'inherit', cwd: __dirname });
    } catch (err) {
      console.error('\x1b[31m✖ Auto-update failed:\x1b[0m', err.message);
    }
  }, 400);
}

console.log('\x1b[36m\x1b[1m⚡ VITAFLEX INTELLIGENCE CORP // LIVE FEATURE WATCHER STARTED\x1b[0m');
console.log('Watching files for instant auto-sync & packaging:\n - ' + WATCH_FILES.join('\n - '));

WATCH_FILES.forEach(file => {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    fs.watch(p, (eventType) => {
      triggerBuild(file);
    });
  }
});

WATCH_DIRS.forEach(dir => {
  const p = path.join(__dirname, dir);
  if (fs.existsSync(p)) {
    fs.watch(p, { recursive: true }, (eventType, filename) => {
      if (filename) triggerBuild(`${dir}/${filename}`);
    });
  }
});

console.log('\n\x1b[32m✔ Active and listening. Any edits you make will immediately auto-sync and re-package.\x1b[0m\n');
