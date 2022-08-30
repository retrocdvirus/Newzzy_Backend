require('dotenv').config()

const jwt = require('jsonwebtoken');
const {userCollection} = require('../Mongoose_Schema')
const nodemailer = require('nodemailer');

function authenticateToken (req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
      return res.status(401).send("token cannot be found==============");
    }
    jwt.verify(token, process.env.SECRET_KEY_ACCESS, async (err, user) => {
      if (err){
        console.log(err)
        return res.sendStatus(403).status(403).send("there is an error:================== \n" + err);
      }

      var userInfo = await userCollection.findById(user.id);
      var setUser = {"id": user.id, "iat": user.iat, "role": userInfo.role}
      req.user = setUser;

      next()
    });
}
function authenticateRole(role) {
  
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(401).send('Not allowed, user do not have authorization============')
    }
    next()
  }
}

function sendingEmail (options){
  var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
  });

  var mailOptions = options;

      
  transporter.sendMail(mailOptions, function(error, info){
      if (error) {
          console.log(error);
      } else {
          console.log('Email sent: ' + info.response);
          return res.send("verification email has been sent to the user");
      }
  }); 
}
module.exports = {
  authenticateToken,
  authenticateRole,
  sendingEmail
}

