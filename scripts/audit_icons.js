const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', '.expo', '.git', 'dist'].includes(file)) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const frontendFiles = walk('frontend');

const iconUsages = [];

// Regex to capture icon imports from @expo/vector-icons or react-native-paper or custom
const importRegex = /import\s+{[^}]*}\s+from\s+['"]@expo\/vector-icons['"]/g;
const iconTagRegex = /<([A-Z][a-zA-Z0-9]*)\s+[^>]*name=(?:{["']([^"']+)["']}|["']([^"']+)["'])[^>]*>/g;
const paperIconRegex = /icon=["']([^"']+)["']/g;

for (const file of frontendFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for @expo/vector-icons tags
    let match;
    const tagRe = /<(Ionicons|MaterialCommunityIcons|MaterialIcons|FontAwesome|Feather|AntDesign|Entypo)\s+[^>]*name=(?:{`([^`]+)`}|{['"]([^'"]+)['"]}|['"]([^'"]+)['"])/g;
    while ((match = tagRe.exec(line)) !== null) {
      const iconSet = match[1];
      const iconName = match[2] || match[3] || match[4];
      iconUsages.push({
        file,
        line: idx + 1,
        iconSet,
        iconName,
        raw: line.trim()
      });
    }

    // Check for question mark characters in JSX or string literals
    if (line.includes("'?'") || line.includes('"?"') || line.includes("icon='?'") || line.includes('icon="?"')) {
      console.log(`POTENTIAL ? FALLBACK in ${file}:L${idx + 1}: ${line.trim()}`);
    }
  });
}

console.log(`Found ${iconUsages.length} icon usages across frontend.`);

// Group by icon set
const bySet = {};
iconUsages.forEach(u => {
  if (!bySet[u.iconSet]) bySet[u.iconSet] = new Set();
  bySet[u.iconSet].add(u.iconName);
});

for (const [set, names] of Object.entries(bySet)) {
  console.log(`\nIcon Set: ${set} (${names.size} unique names):`);
  console.log(Array.from(names).join(', '));
}

