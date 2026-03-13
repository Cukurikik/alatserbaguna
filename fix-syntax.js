const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join('src', 'app', 'modules', 'audio');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(AUDIO_DIR);

files.filter(f => f.endsWith('.component.ts')).forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  if (content.includes('\\$any')) {
    content = content.replace(/\\\$\s*any/g, '$any');
    changed = true;
  }

  if (changed) fs.writeFileSync(f, content);
});

console.log('Fixed escaped any function syntax.');
