const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('uncaughtException', function (err) {
  console.log('UNCAUGHT EXCEPTION');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(function () {
    console.log('DB connection succesful');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, function () {
  console.log('listening...');
});

process.on('unhandledRejection', function (err) {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!!!');

  server.close(function () {
    process.exit(1);
  });
});
