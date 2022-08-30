require('dotenv').config()

const express = require('express');
const router = express.Router();
const {tokenCollection, userCollection} = require('../Mongoose_Schema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')


router.post('/login', function (req, res) {
    userCollection.findOne({ username: req.body.username }, function (err, docs) {
        if (err) {
            return res.send(err)
        }
        if (docs) {
            if (!bcrypt.compareSync(req.body.password, docs.password)) {
                return res.send({ message: "Wrong password. Please try again!" })
            } else {                
                    //let accessToken = jwt.sign({ id: docs._id }, process.env.SECRET_KEY_ACCESS, {expiresIn: '40s'})
                    let accessToken = jwt.sign({ id: docs._id }, process.env.SECRET_KEY_ACCESS)

                    let refreshToken = jwt.sign({ id: docs._id }, process.env.SECRET_KEY_REFRESH)

                    var newToken = new tokenCollection({
                        userId: docs._id,
                        token: refreshToken
                    });

                    newToken.save(function (err, doc){
                        if(err)
                            return res.send(`database error, could not add refresh token to collection: ${err}`);
                        else
                            return res.json({ accessToken: accessToken, refreshToken: doc.token });
                    });
            }
        } else {
            return res.send({ message: "Wrong username. Please try again!" })
        }
    });
});

router.post('/token/refresh', (req, res) => {
    if (req.body.refreshToken == null) return res.sendStatus(401)
    tokenCollection.findOne({token: req.body.refreshToken}, function (err, docs){
        if (docs){
            console.log("verifying token=============");
            jwt.verify(docs.token, process.env.SECRET_KEY_REFRESH, (err, user) => {
                
                console.log("the user param in callback ==================");

                console.log(user);
                if (err) return res.sendStatus(403)
                //const newAccessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY_ACCESS, { expiresIn: '40s' })
                const newAccessToken = jwt.sign({ id: docs._id }, process.env.SECRET_KEY_ACCESS)
                return res.json({ accessToken: newAccessToken })
              })
        } else {
            return res.sendStatus(403)
        }
    });
  });
router.delete('/token/logout', (req, res) => {
    tokenCollection.findOneAndRemove( {token: req.body.refreshToken}, function (err, docs) {
        res.json(docs);
    });
});

router.get('/user/:userId/verify/:verifyToken', async function (req, res) {
    console.log("the token in the request parameter is: =============")
    console.log(req.params.verifyToken)
    var user = await userCollection.findById(req.params.userId);
    var personalKey = process.env.SECRET_KEY_EMAIL + user.password
    if (!user){
        return res.status(400).send("Invalid link: cannot find user in collection");
    }
    console.log("user found==================")
    jwt.verify(req.params.verifyToken, personalKey, function (err, token) {
        if (err){
            return res.status(403).send("there is an error:================== \n" + err);
        }
        console.log("token verified====================")
        user.emailVerification = true
        console.log("after email verification===================")
        console.log(user)
        user.save();
        return res.send({ message: "Email verified sucessfully" });
    });
   
});

router.get('/password/forget', function (req, res) {
    res.send("this is the password forget form sending an email back to the server")
});

router.post('/password/forget', async function (req, res) {  
    var user = await userCollection.find({emailAddress: req.body.email});
    if (!user){
        return res.status(400).send("email does not exist in collection");
    }
    var personalKey = process.env.SECRET_KEY_ACCESS + user.password
    let confirmToken = jwt.sign({ id: docs._id }, personalKey)

    confirmLink = `http://localhost:3000/authens/password/reset/user/${user._id}/confirm/${confirmToken}`

    var mailOptions = {
        from: process.env.GMAIL_USER,
        to: newUser.emailAddress,
        subject: 'Sending Email using Node.js to confirm email',
        html: `Please click this email to confirm your email: <a href="${confirmLink}">${confirmLink}</a>`,
    };

    sendingEmail(mailOptions);
 
});

router.get('/password/reset/user/:userId/confirm/:confirmToken', async function (req, res) {
    console.log("the token in the request parameter is: =============")
    console.log(req.params.confirmToken)
    var personalKey = process.env.SECRET_KEY_ACCESS + user.password
    var user = await userCollection.findById(req.params.userId);
    if (!user){
        return res.status(400).send("Invalid link: cannot find user in collection");
    }

    jwt.verify(req.params.confirmToken, personalKey, function (err, user) {
        if (err){
            return res.sendStatus(403).status(403).send("there is an error:================== \n" + err);
        }
       
        return res.send({ message: "reset link has been confirm, now redirecting to new password form" });
    });
    

    
});

router.post('/password/reset/user/:userId', function (req, res) {
    userCollection.findByIdAndUpdate(req.params.userId, {password: bcrypt.hashSync(req.body.password, 10)}, function (err, docs){
        res.json(docs);
    })
});
module.exports = router;
//module.exports = router;