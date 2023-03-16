// server.js
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const useragent = require('useragent');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  }),
  databaseURL: 'https://firimu-20d8c-default-rtdb.firebaseio.com',
});

const allowedOrigins = [
  'https://vast-erin-sockeye-toga.cyclic.app',
  // Add any other origins you want to allow, if necessary
];

const database = admin.database();

const app = express();
app.use(bodyParser.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

const urlDatabase = new Map();

app.post('/api/generate', async (req, res) => { // <-- Add the 'async' keyword here
  const { websiteUrl, appleStoreUrl, androidStoreUrl } = req.body;
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const generatedUrl = `https://shy-tan-basket-clam-veil.cyclic.app/redirect/${uniqueId}`;

  urlDatabase.set(uniqueId, { websiteUrl, appleStoreUrl, androidStoreUrl });

  const linkData = {
    uniqueId,
    websiteUrl,
    appleStoreUrl,
    androidStoreUrl,
  };

  try {
    await database.ref(`links/${uniqueId}`).set(linkData); // <-- Now 'await' will work correctly
    res.status(201).json({ generatedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating URL. Please try again.' });
  }
});


app.get('/redirect/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const linkSnapshot = await database.ref(`links/${id}`).once('value');
    const linkData = linkSnapshot.val();

    if (!linkData) {
      return res.status(404).send('URL not found');
    }

    const agent = useragent.parse(req.headers['user-agent']);

    if (agent.isMobile) {
      if (agent.os.family === 'iOS') {
        return res.redirect(linkData.appleStoreUrl);
      } else if (agent.os.family === 'Android') {
        return res.redirect(linkData.androidStoreUrl);
      }
    }

    res.redirect(linkData.websiteUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing the request. Please try again.');
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
