const fs = require('fs');
const path = require('path');

const IoniconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json'));
const MaterialCommunityIconsGlyphs = require(path.resolve(__dirname, '../frontend/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json'));

console.log('=== CHECKING DYNAMIC ICON VALUES ===');

// 1. Check profile.js
const profileContent = fs.readFileSync('frontend/app/(tabs)/profile.js', 'utf8');
console.log('\n--- In profile.js ---');
const profileIcons = profileContent.match(/icon:\s*['"]([^'"]+)['"]/g) || [];
profileIcons.forEach(i => {
  const name = i.split(/['"]/)[1];
  console.log(`Ionicons: "${name}" -> valid:`, !!IoniconsGlyphs[name]);
});

// 2. Check notifications/index.js
const notifContent = fs.readFileSync('frontend/app/notifications/index.js', 'utf8');
console.log('\n--- In notifications/index.js ---');
const notifIcons = notifContent.match(/name:\s*['"]([^'"]+)['"]/g) || [];
notifIcons.forEach(i => {
  const name = i.split(/['"]/)[1];
  console.log(`Ionicons: "${name}" -> valid:`, !!IoniconsGlyphs[name]);
});

// 3. Check AIProcessingIndicator.js
const aiContent = fs.readFileSync('frontend/components/ai/AIProcessingIndicator.js', 'utf8');
console.log('\n--- In AIProcessingIndicator.js ---');
const aiIcons = aiContent.match(/icon:\s*['"]([^'"]+)['"]/g) || [];
aiIcons.forEach(i => {
  const name = i.split(/['"]/)[1];
  console.log(`Ionicons: "${name}" -> valid:`, !!IoniconsGlyphs[name]);
});

// 4. Check QuickActionCard usages across frontend
console.log('\n--- QuickActionCard usages ---');
const frontendFiles = fs.readdirSync('frontend/app', { recursive: true });
for (const f of frontendFiles) {
  if (typeof f === 'string' && f.endsWith('.js')) {
    const full = path.join('frontend/app', f);
    const c = fs.readFileSync(full, 'utf8');
    const matches = c.match(/iconName=['"]([^'"]+)['"]/g) || [];
    matches.forEach(m => {
      const name = m.split(/['"]/)[1];
      console.log(`${f} iconName: "${name}" -> Ionicons valid:`, !!IoniconsGlyphs[name]);
    });
  }
}

// 5. Check ContainerCard container type visuals
const containerCardContent = fs.readFileSync('frontend/components/storage/ContainerCard.js', 'utf8');
console.log('\n--- ContainerCard visuals ---');
const containerIcons = containerCardContent.match(/icon:\s*['"]([^'"]+)['"]/g) || [];
containerIcons.forEach(i => {
  const name = i.split(/['"]/)[1];
  console.log(`MaterialCommunityIcons: "${name}" -> valid:`, !!MaterialCommunityIconsGlyphs[name]);
});

// 6. Check lists/[id].js category and item icons if any
const listDetailContent = fs.readFileSync('frontend/app/lists/[id].js', 'utf8');
console.log('\n--- In lists/[id].js ---');
const listIcons = listDetailContent.match(/name=['"]([^'"]+)['"]/g) || [];
listIcons.forEach(i => {
  const name = i.split(/['"]/)[1];
  if (!name.includes('{')) {
    console.log(`lists/[id].js: "${name}" -> Ionicons valid:`, !!IoniconsGlyphs[name]);
  }
});

// 7. Check PackingItemCard
const itemCardContent = fs.readFileSync('frontend/components/packing/PackingItemCard.js', 'utf8');
console.log('\n--- In PackingItemCard.js ---');
const itemIcons = itemCardContent.match(/name=['"]([^'"]+)['"]/g) || [];
itemIcons.forEach(i => {
  const name = i.split(/['"]/)[1];
  console.log(`PackingItemCard: "${name}" -> Ionicons valid:`, !!IoniconsGlyphs[name]);
});

