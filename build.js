// ═══════════════════════════════════════════════════════════════
// Datun AI — Frontend Build Script
// ─────────────────────────────────────────────────────────────
// Purpose:
//   1. Minify index.html (HTML + inline CSS + inline JS)
//   2. Copy static assets (og-image, robots.txt, sitemap.xml)
//   3. Preserve ALL top-level function names (HTML onclick handlers)
//   4. Conservative config — no aggressive obfuscation that can
//      break Auth0 SDK dynamic calls or Google Analytics
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Static assets to copy as-is into dist/
const STATIC_ASSETS = [
  'og-image.jpg',
  'robots.txt',
  'sitemap.xml'
];

// ─────────────────────────────────────────────────────────────
// MINIFICATION CONFIG — SAFE DEFAULTS
// ─────────────────────────────────────────────────────────────
const MINIFY_OPTIONS = {
  // HTML minification
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyURLs: false,
  sortAttributes: false,
  sortClassName: false,

  // CSS minification — conservative (level 1 only)
  minifyCSS: {
    level: 1
  },

  // JS minification via terser — CONSERVATIVE
  // Critical: preserve top-level function names because HTML
  // has inline handlers like onclick="goPage('chat')" that will
  // break if terser renames those globals.
  minifyJS: {
    compress: {
      drop_console: false,
      drop_debugger: true,
      dead_code: true,
      conditionals: true,
      evaluate: true,
      loops: true,
      if_return: true,
      join_vars: true,
      unused: false,
      toplevel: false,
      passes: 1
    },
    mangle: {
      toplevel: false,
      keep_fnames: false,
      reserved: [
        'goPage', 'goHome', 'toggleMob', 'closeMob',
        'startConsult', 'selectLang', 'startNewConsultation',
        'sendMsg', 'sendPhoto', 'handlePhotoUpload', 'handleKey', 'autoResize',
        'toggleVoice',
        'loginWithGoogle', 'doEmailAuth', 'doForgotPassword',
        'showForgotPassword', 'showLoginForm',
        'loadConsultation', 'resumeThis', 'startFreshFromPicker',
        'openDrawer', 'closeDrawer', 'doLogout',
        'toggleLangDropdown', 'changeLang',
        'downloadReport', 'initAuth0',
        'deleteConsultation'
      ]
    },
    format: {
      comments: false,
      beautify: false
    }
  }
};

async function build() {
  const startTime = Date.now();
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║    Datun AI Frontend Build Starting       ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  try {
    // Ensure dist/ exists and is clean
    if (fs.existsSync(DIST)) {
      fs.rmSync(DIST, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST, { recursive: true });
    console.log('✓ Cleaned dist/ directory');

    // 1. Read & minify index.html
    const srcPath = path.join(ROOT, 'index.html');
    if (!fs.existsSync(srcPath)) {
      throw new Error('index.html not found in repo root');
    }
    const source = fs.readFileSync(srcPath, 'utf8');
    const srcKB = (source.length / 1024).toFixed(1);
    console.log('✓ Source index.html: ' + srcKB + ' KB');

    console.log('  Minifying HTML + inline CSS + inline JS...');
    const minified = await minify(source, MINIFY_OPTIONS);
    const outKB = (minified.length / 1024).toFixed(1);
    const savedPct = (100 - (minified.length / source.length) * 100).toFixed(1);
    console.log('✓ Minified:         ' + outKB + ' KB  (' + savedPct + '% smaller)');

    fs.writeFileSync(path.join(DIST, 'index.html'), minified);
    console.log('✓ Written: dist/index.html');

    // 2. Copy static assets
    console.log('');
    console.log('  Copying static assets...');
    let copied = 0;
    for (const asset of STATIC_ASSETS) {
      const srcAsset = path.join(ROOT, asset);
      if (fs.existsSync(srcAsset)) {
        fs.copyFileSync(srcAsset, path.join(DIST, asset));
        console.log('  ✓ ' + asset);
        copied++;
      } else {
        console.log('  ⚠ ' + asset + ' not found, skipping');
      }
    }

    // 3. Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║         Build Complete                    ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('  Time elapsed:  ' + elapsed + 's');
    console.log('  Size saved:    ' + savedPct + '%');
    console.log('  Files output:  ' + (copied + 1) + ' (index.html + ' + copied + ' assets)');
    console.log('');

  } catch (err) {
    console.error('');
    console.error('╔═══════════════════════════════════════════╗');
    console.error('║         Build Failed                      ║');
    console.error('╚═══════════════════════════════════════════╝');
    console.error('  Error:', err.message);
    if (err.stack) console.error(err.stack);
    console.error('');
    process.exit(1);
  }
}

build();
