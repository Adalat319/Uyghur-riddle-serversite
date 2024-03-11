const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: "smtp.forwardemail.net",
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, // Access EMAIL_USER from environment variables
        pass: process.env.EMAIL_PASS, // Access EMAIL_PASS from environment variables
    },
});

module.exports = transporter