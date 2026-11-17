const fs = require('fs');
const path = require('path');

const IoniconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'));
const MaterialCommunityIconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'));

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

const allJsFiles = walk('frontend');
const iconProps = [];

allJsFiles.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    // Check iconName="..." or icon="..." or leftIcon="..." or rightIcon="..."
    const regexes = [
      /iconName=['"]([^'"]+)['"]/g,
      /rightIconName=['"]([^'"]+)['"]/g,
      /leftIcon=['"]([^'"]+)['"]/g,
      /rightIcon=['"]([^'"]+)['"]/g,
      /\bicon:\s*['"]([^'"]+)['"]/g
    ];

    regexes.forEach(re => {
      let m;
      while ((m = re.exec(line)) !== null) {
        iconProps.push({ file, line: idx + 1, name: m[1], raw: line.trim() });
      }
    });
  });
});

console.log(`Found ${iconProps.length} icon prop usages.`);
const missing = [];
iconProps.forEach(ip => {
  // Check if valid in Ionicons or MaterialCommunityIcons
  const inIonicons = !!IoniconsGlyphs[ip.name];
  const inMCI = !!MaterialCommunityIconsGlyphs[ip.name];

  if (!inIonicons && !inMCI) {
    missing.push({ ...ip, inIonicons, inMCI });
  }
});

console.log(`\n=== INVALID ICON PROPS: ${missing.length} ===`);
missing.forEach(m => {
  console.log(`❌ ${m.file}:L${m.line} -> "${m.name}" (${m.raw})`);
});

