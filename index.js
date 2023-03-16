// server.js
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const useragent = require('useragent');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Add CORS middleware

const urlDatabase = new Map();

app.post('/api/generate', (req, res) => {
  const { websiteUrl, appleStoreUrl, androidStoreUrl } = req.body;
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const generatedUrl = `https://yourdomain.com/redirect/${uniqueId}`;

  urlDatabase.set(uniqueId, { websiteUrl, appleStoreUrl, androidStoreUrl });

  res.json({ generatedUrl });
});

app.get('/redirect/:id', (req, res) => {
  const { id } = req.params;
  const urls = urlDatabase.get(id);

  if (!urls) {
    res.status(404).send('URL not found');
    return;
  }

  const userAgent = useragent.parse(req.headers['user-agent']);
  const isMobile = userAgent.device && userAgent.device.type === 'mobile';
  const isIos = isMobile && userAgent.os.family === 'iOS';
  const isAndroid = isMobile && userAgent.os.family === 'Android';

  if (isIos) {
    res.redirect(urls.appleStoreUrl);
  } else if (isAndroid) {
    res.redirect(urls.androidStoreUrl);
  } else {
    res.redirect(urls.websiteUrl);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
