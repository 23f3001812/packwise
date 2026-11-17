const fs = require('fs');
const path = require('path');

const IoniconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'));
const MaterialCommunityIconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'));
const MaterialIconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialIcons.json'));
const FontAwesomeGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/FontAwesome.json'));
const FeatherGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Feather.json'));

const glyphMaps = {
  Ionicons: IoniconsGlyphs,
  MaterialCommunityIcons: MaterialCommunityIconsGlyphs,
  MaterialIcons: MaterialIconsGlyphs,
  FontAwesome: FontAwesomeGlyphs,
  Feather: FeatherGlyphs
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

const allJsFiles = walk('frontend');

// Find all string literals that match icon names or are passed to icon props
const brokenIcons = [];

allJsFiles.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');

  // Find which icon libraries are imported in this file
  const imports = {};
  for (const set of Object.keys(glyphMaps)) {
    if (code.includes(`import { ${set} }`) || code.includes(`import {${set}}`) || code.includes(`${set},`) || code.includes(`, ${set}`)) {
      imports[set] = true;
    }
  }

  // Check all <Ionicons name="..." /> or name={...}
  const tagRe = /<([A-Za-z]+)\s+[^>]*name=(?:["']([^"']+)["']|{["']([^"']+)["']})/g;
  let m;
  while ((m = tagRe.exec(code)) !== null) {
    const comp = m[1];
    const iconName = m[2] || m[3];
    if (glyphMaps[comp]) {
      if (!glyphMaps[comp][iconName]) {
        brokenIcons.push({ file, comp, iconName, reason: `Not found in ${comp} glyphmap` });
      }
    }
  }

  // Also check container visuals mapping
  if (file.includes('ContainerCard.js') || file.includes('storage')) {
    const iconMatches = code.match(/icon:\s*['"]([^'"]+)['"]/g) || [];
    iconMatches.forEach(im => {
      const name = im.split(/['"]/)[1];
      if (code.includes('MaterialCommunityIcons') && !MaterialCommunityIconsGlyphs[name]) {
        brokenIcons.push({ file, comp: 'MaterialCommunityIcons', iconName: name, reason: 'Invalid MaterialCommunityIcons name in object map' });
      }
    });
  }
});

console.log(`\n=== COMPREHENSIVE BROKEN ICONS FOUND: ${brokenIcons.length} ===`);
brokenIcons.forEach(b => {
  console.log(`❌ ${b.file}: <${b.comp} name="${b.iconName}" /> -> ${b.reason}`);
});

