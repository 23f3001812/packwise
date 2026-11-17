const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../frontend/.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const { admin } = require('../config/firebaseAdmin');

async function testEndpoint() {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const uid = 'test-ai-timer-uid';
  const customToken = await admin.auth().createCustomToken(uid);

  // Exchange custom token for real ID token via Google Identity Toolkit
  const idTokenUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
  const idTokenRes = await fetch(idTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const idTokenData = await idTokenRes.json();
  const idToken = idTokenData.idToken;
  console.log('Obtained Firebase ID token, length:', idToken?.length);

  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const payload = {
    destination: 'London, UK',
    eventType: 'City Exploration',
    startDate: start,
    endDate: end,
    activities: ['Museums', 'Walking'],
    travellers: 1,
    preferences: '',
    notes: '',
    existingItems: []
  };

  console.log('Sending POST http://localhost:5001/api/ai/generate-weather-aware-checklist...');
  const startTime = Date.now();
  const res = await fetch('http://localhost:5001/api/ai/generate-weather-aware-checklist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(payload)
  });
  const elapsedMs = Date.now() - startTime;
  console.log('HTTP Status:', res.status);
  console.log(`Elapsed Time: ${elapsedMs} ms (${(elapsedMs / 1000).toFixed(2)} seconds)`);
  const data = await res.json();
  console.log('Response Success:', data.success);
  console.log('Trip Summary:', data.data?.tripSummary);
  console.log('Recommendations Count:', data.data?.recommendations?.length);
  console.log('Weather Available:', data.data?.weather?.available);
  console.log('Weather Summary:', data.data?.weather?.summary);
}

testEndpoint().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
