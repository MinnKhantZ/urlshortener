require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const asyncHandler = require('express-async-handler');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://minkhant:zaw@cluster0.hbuus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(()=>{
  console.log("Database connected!");
})
.catch((err)=>{
  console.error(err);
});

const urlSchema = new mongoose.Schema(
  {
    original_url: String,
    short_url: Number
  }
)

urlSchema.plugin(AutoIncrement, {inc_field: 'short_url'});

const Url = mongoose.model('Url', urlSchema);

function isValidWebUrl(url) {
  const urlPattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i;
  return urlPattern.test(url);
}

const findUrl = asyncHandler(async (req, res, next) => {
  if (!isValidWebUrl(req.body.url)) {
    res.json({error: 'invalid url'});
  } else {
    const result = await Url.find({original_url: req.body.url}, "original_url short_url").exec();
    if (result.length == 0) {
      const newUrl = new Url({original_url: req.body.url});
      const savedUrl = await newUrl.save();
      res.json({
        original_url: savedUrl.original_url,
        short_url: savedUrl.short_url
      });
    } else {
      res.json({
        original_url: result[0].original_url,
        short_url: result[0].short_url
      });
    }
  }
});

const goUrl = asyncHandler(async (req, res) => {
  const result = await Url.find({short_url: req.params.short}).exec();
  if (result.length == 1) {
    res.redirect(result[0].original_url);
  }
});

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', findUrl);

app.get('/api/shorturl/:short', goUrl);

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
