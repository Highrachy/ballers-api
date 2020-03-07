import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const port = 3000;
const welcome = require('./routes/welcome');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use('/api/v1/welcome', welcome);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(process.env.PORT || port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server running on port ${port}`);
  }
});
