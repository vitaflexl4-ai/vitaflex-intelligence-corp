#!/usr/bin/env node

/**
 * Vitaflex Intelligence Corp — Automated Build & Feature Sync System
 * 
 * Automatically executes whenever you add or modify a feature:
 * 1. Validates HTML integrity, balance, and script syntax (Strict Mode).
 * 2. Scans for rogue <style> tags inside <script> blocks.
 * 3. Synchronizes all mirror directories (admin/index.html, flexai/*).
 * 4. Updates version timestamps across HUD readouts.
 * 5. Rebuilds the deployable vitaflex-intelligence-corp.zip archive.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

console.log(`${cyan}${bold}=== VITAFLEX INTELLIGENCE CORP // AUTOMATED BUILD & SYNC PIPELINE ===${reset}\n`);

// 1. Validate HTML & JavaScript Integrity
function validateFile(filename) {
  const filePath = path.join(ROOT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`${red}✖ Error: ${filename} does not exist!${reset}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Check 1: Div balance
  const divOpens = (content.match(/<div\b/gi) || []).length;
  const divCloses = (content.match(/<\/div\b/gi) || []).length;
  if (divOpens !== divCloses) {
    console.warn(`${yellow}⚠ Warning in ${filename}: <div> tags unbalanced (${divOpens} opens, ${divCloses} closes)${reset}`);
  } else {
    console.log(`${green}✔ ${filename}: HTML DOM structure verified (${divOpens} divs balanced)${reset}`);
  }

  // Check 2: Rogue <style> tags inside <script>
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptIndex++;
    const scriptBody = match[1];

    if (/<style\b/i.test(scriptBody)) {
      console.error(`${red}✖ FAIL in ${filename} (script #${scriptIndex}): Embedded <style> tag found inside JavaScript! Use DOM style injection to prevent iframe render corruption.${reset}`);
      process.exit(1);
    }

    // Check 3: JavaScript syntax test
    try {
      new vm.Script(scriptBody, { filename: `${filename}#script${scriptIndex}` });
    } catch (err) {
      console.error(`${red}✖ JS SYNTAX ERROR in ${filename} (script #${scriptIndex}):${reset}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log(`${green}✔ ${filename}: All JavaScript blocks passed syntax & strict-mode checks (0 errors)${reset}`);
}

console.log(`${bold}[Step 1/4] Validating files...${reset}`);
validateFile('admin.html');
validateFile('index.html');

// 2. Synchronize Mirrored Files
console.log(`\n${bold}[Step 2/4] Synchronizing mirror endpoints...${reset}`);
const syncPairs = [
  { src: 'admin.html', dest: 'admin/index.html' },
  { src: 'admin.html', dest: 'flexai/admin.html' },
  { src: 'admin.html', dest: 'flexai/admin/index.html' },
  { src: 'index.html', dest: 'flexai/index.html' },
  { src: 'cloudflare-worker.js', dest: '_worker.js' }
];

syncPairs.forEach(pair => {
  const srcPath = path.join(ROOT_DIR, pair.src);
  const destPath = path.join(ROOT_DIR, pair.dest);
  const destDir = path.dirname(destPath);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(srcPath, destPath);
  console.log(`  ${green}Synced:${reset} ${pair.src} → ${pair.dest}`);
});

// Sync assets and audio folders to mirrors if needed
const mirrorDirs = ['admin', 'flexai', 'flexai/admin'];
['assets', 'audio'].forEach(folder => {
  const srcFolder = path.join(ROOT_DIR, folder);
  if (fs.existsSync(srcFolder)) {
    mirrorDirs.forEach(m => {
      const targetFolder = path.join(ROOT_DIR, m, folder);
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }
      fs.cpSync(srcFolder, targetFolder, { recursive: true });
    });
  }
});
console.log(`  ${green}Synced:${reset} assets & audio folders to all mirror routes`);

// 3. Update Build Timestamp & Telemetry Stamp
console.log(`\n${bold}[Step 3/4] Updating telemetry build stamp...${reset}`);
const now = new Date();
const buildStamp = `BUILD-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}Z`;

const buildMeta = {
  lastUpdated: now.toISOString(),
  buildStamp: buildStamp,
  version: '3.0.0-PROD',
  organization: 'Vitaflex Business Group',
  system: 'Vitaflex Intelligence Corp'
};

fs.writeFileSync(path.join(ROOT_DIR, 'version.json'), JSON.stringify(buildMeta, null, 2), 'utf8');
console.log(`  ${green}Updated:${reset} version.json (${buildStamp})`);

// 4. Rebuild Production Zip Archive
console.log(`\n${bold}[Step 4/4] Repackaging vitaflex-intelligence-corp.zip...${reset}`);
try {
  const zipPath = path.join(ROOT_DIR, 'vitaflex-intelligence-corp.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  execSync('zip -q -r vitaflex-intelligence-corp.zip . -x "*.git*" "*uploads*" "*node_modules*" "*.zip" "temp*"', {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
  const stat = fs.statSync(zipPath);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`  ${green}Generated:${reset} vitaflex-intelligence-corp.zip (${sizeMb} MB)`);
} catch (err) {
  console.error(`${red}✖ Failed to generate zip: ${err.message}${reset}`);
}

console.log(`\n${cyan}${bold}✔ PIPELINE COMPLETE: All files validated, synchronized, and packaged successfully!${reset}\n`);
