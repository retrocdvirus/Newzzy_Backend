require('dotenv').config()

const express = require('express');
const router = express.Router();
const {userCollection, tokenCollection} = require('../Mongoose_Schema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const {authenticateToken, authenticateRole, sendingEmail} = require('./Authen_Function');


// this is just a small error printing function so that i don't have to re-write the code for every route handler
function routeErrorHandler(err, docs, res, message){
    // if there is an error, send the error message
    if(err)
    return res.send(message + '\n' + err);
    else
    // if there's no error, send the response in the form of a json
       return res.json(docs);
}
function checkUserIdVersusLogin(user, login){
    if (user.id == login._id){
        routeErrorHandler(err, docs, res, "Cannot Update the document from Users Collection");
    } else {
        return res.status(401).send("Users can only update their own information")
    }
}
 // get all the Documents int the User Collection and send them to the front end as a json file
router.get('/', authenticateToken, authenticateRole("Administrator"), function (req, res) {
    userCollection.find( function(err, docs){
        routeErrorHandler(err, docs, res, "Cannot Get the document from User Collection");
    });
});
 //get the users with first and last name that matches the one in the url parameter
router.get('/name/:firstName-:lastName', function (req, res) {
    userCollection.find( {firstName: req.params.firstName, lastName: req.params.lastName}, function(err, docs){
        routeErrorHandler(err, docs, res, "Cannot Get the document from Users Collection");
    });
});
 // get the users with the first OR last name that matches the one in the url parameter
router.get('/name/:name', function (req, res) {
    userCollection.find( { $or: [ {firstName: req.params.name}, {lastName: req.params.name} ] }, function(err, docs){
        routeErrorHandler(err, docs, res, "Cannot Get the document from Users Collection");
    });
});
 // get the users with email that matches the one in the url parameter
router.get('/email/:email', function (req, res) {
    userCollection.find( {emailAddress: req.params.email}, function(err, docs){
        routeErrorHandler(err, docs, res, "Cannot Get the document from Users Collection");
    });
});
 // get the user with the mongodb _id that matches the one in the url parameter
router.get('/id/:userId', function (req, res) {
    userCollection.findById(req.params.userId, function(err, docs){
        routeErrorHandler(err, docs, res, "Cannot Get the document from Users Collection");
    });
});
 // update the email of the user with the matching first and last name
router.put('/name/:firstName-:lastName/email', authenticateToken, function(req, res){
    userCollection.updateOne( {firstName: req.params.firstName, lastName: req.params.lastName}, {emailAddress: req.body.email}, function(err, docs){
        checkUserIdVersusLogin(req.user, docs)
    });
});
 // update the phone number of the user with the matching first and last name
router.put('/name/:firstName-:lastName/phone', authenticateToken, function(req, res){
    userCollection.updateOne( {firstName: req.params.firstName, lastName: req.params.lastName}, {phoneNumber: req.body.number}, function(err, docs){
        checkUserIdVersusLogin(req.user, docs)
    });
});
 // update the role of the user with the matching first and last name
router.put('/name/:firstName-:lastName/role', authenticateToken, function(req, res){
    userCollection.updateOne( {firstName: req.params.firstName, lastName: req.params.lastName}, {role: req.body.role}, function(err, docs){
        checkUserIdVersusLogin(req.user, docs)
    });
});
 // disable a user account as a soft delete solution instead of complete delete
router.put('/id/:userId/disable', authenticateToken, authenticateRole("Administrator"), function(req, res){
    userCollection.findByIdAndUpdate(req.params.userId, {userStatus: "Active"}, function(err, docs){
       routeErrorHandler(err, docs, res, "Cannot Update the document from Users Collection");
    });
});
 // re-enable a user account that has been disabled (almost identical to the disable route handler)
router.put('/id/:userId/enable', authenticateToken, authenticateRole("Administrator"), function(req, res){
    userCollection.findByIdAndUpdate(req.params.userId, {userStatus: "Inactive"}, function(err, docs){
       routeErrorHandler(err, docs, res, "Cannot Update the document from Users Collection");
    });
});
 // delete the user with the matching id to the one on the url parameter
router.delete('/id/:userId', authenticateToken, authenticateRole("Administrator"), function(req, res){
    userCollection.findByIdAndRemove(req.params.userId, function(err, docs){
       routeErrorHandler(err, docs, res, "Cannot Delete the document from Users Collection");
    });
});
 
 // add a new user to the collection
router.post('/', async function (req, res){
    // assign the req.body to userInfo so that i don't have to write req.body everytime i need it
    var userInfo = req.body;
    // check if all the neccessary info is empty or not
    if(!userInfo.firstName || !userInfo.lastName 
        || !userInfo.emailAddress || !userInfo.phoneNumber 
        || !userInfo.username || !userInfo.password){
       //if any of the neccessary info is empty
       res.send("sorry, you did not fill all the required information")
    } else {
        
        var takenEmail = await userCollection.findOne( {emailAddress: userInfo.emailAddress} );
        if (takenEmail){
            return res.json({message: "email has been taken"})
        }
        var takenUsername = await userCollection.findOne( {username: userInfo.username} );
        if (takenUsername){
            return res.json({message: "username has been taken"})
        }
        
        // if all the neccessary info is filled in
        // create a new userCollection document with posted user info
        var newUser = await new userCollection({
            // below are mandatory fields
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            phoneNumber: userInfo.phoneNumber,
            emailAddress: userInfo.emailAddress,
            username: userInfo.username,
            password: bcrypt.hashSync(userInfo.password, 10),
            // the default role of new users is just "User"
            role: "User",
            userStatus: "active",
            emailVerification: false
        }).save();

        console.log("the new user is:===============");
        console.log(newUser);
        var personalKey = process.env.SECRET_KEY_EMAIL + newUser.password;
        var verifyToken = jwt.sign({ id: newUser._id }, personalKey)

        console.log("the new verification token is:===============");
        console.log(verifyToken)

        verifyLink = `http://localhost:3000/authens/user/${newUser._id}/verify/${verifyToken}`
        
        var mailOptions = {
            from: process.env.GMAIL_USER,
            to: newUser.emailAddress,
            subject: 'Sending Email using Node.js to verify email',
            html: `Please click this link to verify your email: <a href="${verifyLink}">${verifyLink}</a>`,
          };
        
        sendingEmail(mailOptions);

    }
});


module.exports = router;