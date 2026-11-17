const fs = require('fs');
const path = require('path');

const glyphMaps = {
  Ionicons: require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json')),
  MaterialCommunityIcons: require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json')),
  MaterialIcons: require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json')),
  FontAwesome: require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome.json')),
  Feather: require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json')),
};

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
const invalidIcons = [];
const dynamicIcons = [];
const validIcons = [];

for (const file of frontendFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Match icon components
    const tagRe = /<(Ionicons|MaterialCommunityIcons|MaterialIcons|FontAwesome|Feather)\s+[^>]*name=(?:{`([^`]+)`}|{([^}]+)}|['"]([^'"]+)['"])/g;
    let match;
    while ((match = tagRe.exec(line)) !== null) {
      const set = match[1];
      const rawExpr = match[2] || match[3] || match[4];
      if (!rawExpr) continue;

      const trimmed = rawExpr.trim();

      // Check if it's dynamic (ternary or variable)
      if (trimmed.includes('?') || trimmed.includes(':') || trimmed.includes('${') || trimmed.startsWith('get')) {
        dynamicIcons.push({ file, line: idx + 1, set, expr: trimmed, raw: line.trim() });
        continue;
      }

      // Literal name
      const name = trimmed.replace(/['"]/g, '');
      const glyphMap = glyphMaps[set];
      if (!glyphMap || glyphMap[name] === undefined) {
        invalidIcons.push({ file, line: idx + 1, set, name, raw: line.trim() });
      } else {
        validIcons.push({ file, line: idx + 1, set, name });
      }
    }
  });
}

console.log(`\n=== INVALID ICON AUDIT: ${invalidIcons.length} INVALID ICONS FOUND ===`);
invalidIcons.forEach(i => {
  console.log(`❌ ${i.file}:L${i.line} -> <${i.set} name="${i.name}" />`);
});

console.log(`\n=== DYNAMIC ICONS AUDIT: ${dynamicIcons.length} EXPRESSIONS FOUND ===`);
dynamicIcons.forEach(i => {
  console.log(`🔍 ${i.file}:L${i.line} -> <${i.set} name={${i.expr}} />`);
});
