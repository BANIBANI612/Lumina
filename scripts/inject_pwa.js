const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) files.push(...walk(fp));
    else if (stat.isFile() && name === 'code.html') files.push(fp);
  }
  return files;
}

function inject(file) {
  let src = fs.readFileSync(file, 'utf8');
  const headTag = '</head>';
  const bodyTag = '</body>';
  if (!src.includes('manifest.json')) {
    const headInsert = '\n  <link rel="manifest" href="/manifest.json">\n  <meta name="theme-color" content="#4d41df">\n  <script type="module" src="/scripts/supabase-init.js" defer></script>\n';
    src = src.replace(headTag, headInsert + headTag);
  }
  if (!src.includes('serviceWorker') && src.includes(bodyTag)) {
    const swScript = `\n<script>\nif ('serviceWorker' in navigator) {\n  window.addEventListener('load', () => {\n    navigator.serviceWorker.register('/sw.js').catch(console.error);\n  });\n}\n</script>\n`;
    src = src.replace(bodyTag, swScript + bodyTag);
  }
  // backup original
  fs.writeFileSync(file + '.bak', fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, src, 'utf8');
  console.log('Injected:', file);
}

const files = walk(root);
files.forEach(inject);
console.log('Done. Reviewed', files.length, 'files.');
