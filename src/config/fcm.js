const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const serviceAccountPath = path.join(__dirname, '../src/notification/hr-smile-firebase-adminsdk-josms-77f906f003.json');

let auth = null;
let projectId = null;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    projectId = serviceAccount.project_id;
    auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });
  } catch (err) {
    console.error('Error initializing Firebase credentials:', err.message);
  }
}

async function sendFCMMessage(token, { title, body, image, data = {} }) {
  if (!auth || !projectId) {
    throw new Error('FCM is not configured or service account JSON is missing.');
  }

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken = accessTokenResponse.token;

  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const payload = {
    message: {
      token,
      notification: {
        title,
        body,
        ...(image ? { image } : {})
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
      )
    }
  };

  const response = await axios.post(fcmUrl, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

module.exports = {
  sendFCMMessage
};
