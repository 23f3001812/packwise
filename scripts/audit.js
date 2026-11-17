const fs = require('fs');
const path = require('path');

// Comprehensive emoji regex matching all Unicode emoji ranges
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{231A}-\u{23F3}\u{2934}-\u{2935}\u{25AA}-\u{25FE}]/u;

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', '.expo', '.git', 'dist'].includes(file)) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const frontendFiles = walk('frontend');
const backendFiles = walk('backend');

console.log('--- SCANNING FRONTEND FOR EMOJIS ---');
const emojiOccurrences = [];
for (const f of frontendFiles) {
  if (f.endsWith('package.json') || f.endsWith('package-lock.json')) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      emojiOccurrences.push({ file: f, line: idx + 1, text: line.trim() });
    }
  });
}

console.log('Total frontend files with emojis:', new Set(emojiOccurrences.map(e => e.file)).size);
console.log('Total emoji lines in frontend:', emojiOccurrences.length);

const byFile = {};
emojiOccurrences.forEach(e => {
  if (!byFile[e.file]) byFile[e.file] = [];
  byFile[e.file].push(e);
});

for (const [file, items] of Object.entries(byFile)) {
  console.log(`\n📄 ${file} (${items.length} occurrences):`);
  items.slice(0, 5).forEach(i => console.log(`   L${i.line}: ${i.text}`));
  if (items.length > 5) console.log(`   ... +${items.length - 5} more`);
}

console.log('\n--- SCANNING BACKEND NOTIFICATION & ALERT MESSAGES FOR EMOJIS ---');
const backendEmojiOccurrences = [];
for (const f of backendFiles) {
  if (f.endsWith('package.json') || f.endsWith('package-lock.json') || f.includes('tests')) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      backendEmojiOccurrences.push({ file: f, line: idx + 1, text: line.trim() });
    }
  });
}
console.log('Total backend service/controller emoji lines:', backendEmojiOccurrences.length);
backendEmojiOccurrences.forEach(e => console.log(`   ${e.file}:L${e.line}: ${e.text}`));

