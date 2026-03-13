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

  const pairs = [
    ['(.target).value', '(e.target as any).value'],
    ['(.target).files', '(e.target as any).files'],
    ['ny(.target).value', '($event.target as any).value'], // Just in case ny survived
  ];

  pairs.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  });

  if (changed) fs.writeFileSync(f, content);
});

console.log('Fixed powershell string interpolation destruction.');
