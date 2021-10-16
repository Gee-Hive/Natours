const nodemailer = require('nodemailer');

const sendEmail = async function (options) {
  //create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL.PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      password: process.env.EMAIL_PASSWORD,
    },
  });

  //define the email options

  const mailOptions = {
    from: 'Gbenga <rosedarry.io>',
    to: options.mail,
    subject: options.subject,
    text: options.text,
  };

  //send the email with nodemailer
  await transporter.sendEmail(mailOptions);
};

module.exports = sendEmail;
