const fs = require('fs');
const path = require('path');

const IoniconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'));
const MaterialCommunityIconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'));
const MaterialIconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json'));
const FontAwesomeGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome.json'));

const maps = {
  Ionicons: IoniconsGlyphs,
  MaterialCommunityIcons: MaterialCommunityIconsGlyphs,
  MaterialIcons: MaterialIconsGlyphs,
  FontAwesome: FontAwesomeGlyphs,
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

const files = walk('frontend');
const errors = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    for (const [setName, glyphMap] of Object.entries(maps)) {
      // Find <SetName ... name="icon-name" ... />
      const re = new RegExp(`<${setName}\\s+[^>]*name=(?:["']([^"']+)["']|{["']([^"']+)["']})`, 'g');
      let m;
      while ((m = re.exec(line)) !== null) {
        const iconName = m[1] || m[2];
        if (!glyphMap[iconName]) {
          errors.push({ file, line: idx + 1, setName, iconName, raw: line.trim() });
        }
      }
    }
  });
});

console.log(`\n=== ALL STRICT MISMATCHES (ICON SET VS ICON NAME): ${errors.length} ===`);
errors.forEach(e => {
  console.log(`❌ ${e.file}:L${e.line} -> <${e.setName} name="${e.iconName}" />`);
});

