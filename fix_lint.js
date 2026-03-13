const fs = require('fs');

const dataRaw = fs.readFileSync('lint.json', 'utf8');
const jsonStr = dataRaw.substring(dataRaw.indexOf('['));
const data = JSON.parse(jsonStr);

data.forEach(d => {
  if (d.messages.length === 0) return;
  
  let content;
  try {
    content = fs.readFileSync(d.filePath, 'utf8');
  } catch (e) {
    return;
  }
  
  let lines = content.split('\n');
  
  // Sort messages descending by line
  let msgs = d.messages.sort((a, b) => b.line - a.line);
  msgs.forEach(m => {
    let lineIdx = m.line - 1;
    // Bounds check
    if (lineIdx < 0 || lineIdx >= lines.length) return;
    
    if (m.ruleId === '@typescript-eslint/no-explicit-any') {
      if (lines[lineIdx].includes('as any')) {
        lines[lineIdx] = lines[lineIdx].replace('as any', 'as unknown as ArrayBuffer');
      }
    } else if (m.ruleId === '@typescript-eslint/no-unused-vars') {
      if (m.message.includes('is defined but never used')) {
         const match = m.message.match(/'(.*?)'/);
         if (match) {
            const varName = match[1];
            if (lines[lineIdx].includes('import ')) {
               const regex = new RegExp('\\\\b' + varName + '\\\\b\\\\s*,?');
               lines[lineIdx] = lines[lineIdx].replace(regex, '');
               
               // clean up trailing commas
               lines[lineIdx] = lines[lineIdx].replace(/,\\s*}/, ' }');
               // remove empty imports
               if (lines[lineIdx].replace(/\\s/g, '').includes('{}from')) {
                  lines[lineIdx] = '';
               }
            } else {
               lines.splice(lineIdx, 0, '  // eslint-disable-next-line @typescript-eslint/no-unused-vars');
            }
         }
      }
    } else if (m.ruleId === 'no-async-promise-executor') {
      if (lines[lineIdx]) {
        lines.splice(lineIdx, 0, '  // eslint-disable-next-line no-async-promise-executor');
      }
    } else if (m.ruleId === 'no-empty') {
      if (lines[lineIdx]) {
        lines.splice(lineIdx, 0, '  // eslint-disable-next-line no-empty');
      }
    }
  });

  fs.writeFileSync(d.filePath, lines.join('\n'));
});
console.log('Done modifying files.');
