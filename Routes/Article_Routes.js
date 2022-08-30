
const express = require('express');
const router = express.Router();
const {articleCollection} = require('../Mongoose_Schema')
const app = express();
const jwt = require('jsonwebtoken');

const {authenticateToken, authenticateRole} = require('./Authen_Function');

//router.use(authenticateToken);


// this is just a small error printing function so that i don't have to re-write the code for every route handler
function routeErrorHandler(err, docs, res, message){
    // if there is an error, send the error message
    if(err)
       return res.send(message + '\n' + err);
       
    // if there's no error, send the response in the form of a json
    return res.json(docs);
}

 // get all the article in the Articles Collection
router.get('/', authenticateToken, authenticateRole("Administrator"), function (req, res) {
    // get all articles from the Articles Collection and then use the author field that reference the User Collection to populate the article
    // which means that the author field which contains a user id will then contain a User object with Id that matches the one in the author field
    // in this case the user object that the author field contain will only have the firstName and lastName field of the full User object
    articleCollection.find().populate('author', ['firstName', 'lastName']).exec(function (err, docs){
       routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
});

 // get all the article that has been approved in the Articles Collection
 router.get('/Approved', function (req, res) {
    articleCollection.find({articleStatus: "Approved"}).populate('author', ['firstName', 'lastName']).exec(function (err, docs){
       routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
});

 // get all the articles with the status that matches the one on the url parameter
router.get('/status', authenticateToken, function (req, res) {
    // get all articles from the Articles Collection and then use the author field that reference the User Collection to populate the article
    // which means that the author field which contains a user id will then contain a User object with Id that matches the one in the author field
    // in this case the user object that the author field contain will only have the firstName and lastName field of the full User object
    if (req.user.role == "Administrator" || req.body.status == "Approved"){
        articleCollection.find({articleStatus: req.body.status}).populate('author', ['firstName', 'lastName']).exec(function (err, docs){
            routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
        });
    }
    
    if (req.user.role == "Content Creator"){
        articleCollection.find({articleStatus: req.body.status, author: req.user.id}).populate('author', ['firstName', 'lastName']).exec(function (err, docs){
            routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
        });
    }
    
    if (req.user.role != "Administrator" && req.body.status == "Not Reviewed"){
        return res.status(401).send("only Administrators and Author can access Un Reviewed articles")
    }
});

 // get all article with the color code matching the one on the url parameter
router.get('/color', function (req, res) {
    articleCollection.find( {articleColor: req.body.color}, function(err, docs){
        routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
});
// get all article that has not been categorized by the administrators
router.get('/color/unCategorized', authenticateToken, authenticateRole("Administrator"), function (req, res) {
    articleCollection.find( {articleColor: "Not Categorized"}, function(err, docs){
        routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
})
 // get all article with the color code and approval status matching the one on the url parameter
router.get('/status/color', function (req, res) {
    articleCollection.find( {articleColor: req.body.color, articleStatus: req.body.status}, function(err, docs){
       routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
});
 // get an article with the id that matches the one on the url parameter
router.get('/id/:articleId', function (req, res) {
    articleCollection.findById(req.params.articleId).populate('author', ['firstName', 'lastName']).exec(function (err, docs){
       routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
});

 //get articles with the matching title to the one in the request body (req.body)
router.get('/title/', function (req, res) {
    articleCollection.find( {title: req.body.title}, function(err, docs){
       routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
});
 // get all article that was written by the author with the matching id to the one on the url parameter
router.get('/author/:userId', function (req, res) {
    articleCollection.find( {author: req.params.userId}, function(err, docs){
       routeErrorHandler(err, docs, res, "Cannot Get the document from Articles Collection");
    });
});
 
 // update the color code of the article with the matching id to the one on the url parameter
router.put('id/:articleId/color', authenticateToken, authenticateRole("Administrator"), function(req, res){
    articleCollection.findByIdAndUpdate( req.params.articleId, {articleColor: req.body.color} , function(err, docs){
       routeErrorHandler(err, docs, res, "Cannot Update the document from Articles Collection");
    });
});
 // update the like of the article with the matching id to the one on the url parameter
 // by adding the id of the user who liked the article to the articleLikes array in the article document
 // if the id doesn't exist in the array, the id is added
 // if the id does exist in the array, the id is removed
 // this route handler combines liking and unliking the article
router.put('id/:articleId/likes', authenticateToken, function(req, res){
    articleCollection.findById( req.params.articleId, function(err, docs){
        if(err){
            return res.send(message + '\n' + err);
        }
        var index = docs.articleLikes.indexOf(req.user.id);
        if (index > -1) { // only splice array when item is found
        // removing user like
          docs.articleLikes.splice(index, 1); // 2nd parameter means remove one item only
        } else {
            // addming user like
            docs.articleLikes.push(req.user.id);
        }
        docs.save(function(err, article){
            // the code below is error handling
            routeErrorHandler(err, article, res, "Cannot Update the document from Articles Collection");
       });
    });
});
 //update the comment of the article with the mathcing id to the one on the url parameter
 // by adding a comment object to the comments array in the article document
router.put('/id/:articleId/comment', authenticateToken, function(req, res){
    // the comment object IS the req.body
    articleCollection.findByIdAndUpdate( req.params.articleId, {$push: {comments: req.body} }, function(err, docs){
       res.json(docs);
    });
});
 // update the status of the article with the matching id to the one on the url paramter
router.put('id/:articleId/status', authenticateToken, authenticateRole("Administrator"), function(req, res){
    //the new status IN the req.body
    articleCollection.findByIdAndUpdate( req.params.articleId, {articleStatus: req.body.status}, function(err, docs){
       res.json(docs);
    });
});
 // update the likes of the comment with the matching comment id that belongs to the article that also have the mathing id
 // by adding the id of the user that liked the comment in the commentLikes array in the comment object
 // if the id doesn't exist in the array, the id is added
 // if the id does exist in the array, the id is removed
 // this route handler combines liking and unliking the article
router.put('id/:articleId/comment/:commentId', authenticateToken, function(req, res){
    articleCollection.findById(req.params.articleId, function(err, docs){
        if(err){
            return res.send(message + '\n' + err);
        }
       //docs.comments is assigned to the commentList so that i don't have to type docs.comments everytime
        commentList = docs.comments;
       // loop through all the comment object in the article document
        for (var i = 0; i < commentList.length; i++ ){
            // check if the comment is the one being liked
            if (commentList[i]._id == req.params.commentId){
                // the id of the user liking the comment is added to the commentLikes array of the comment object
                var index = commentList[i].commentLikes.indexOf(req.user.id);
                if (index > -1) { // only splice array when item is found
                    commentList[i].commentLikes.splice(index, 1); // 2nd parameter means remove one item only
                } else {
                    commentList[i].commentLikes.push(req.user.id);
                break;
                }
            }
        }
        // save the updated article to the Articles Collection
        docs.save(function(err, article){
          // the code below is error handling
            if(err)
                // if there is an error in saving the article, send an error message to the front end
                res.send(`database error, could not add new article:\n ${err}`);
            else
                // if there are no error, send the update article to the front end
                res.json(article);
        });
    });
});
 // add a new article to the Articles Collection
router.post('/', authenticateToken, authenticateRole("Content Creator"), function(req, res){
    var articleInfo = req.body; //Get the parsed information
    if(!articleInfo.title || articleInfo.text < 100 || !articleInfo.articleCites){
        res.send("sorry, you did not fill all the required information")
    } else {
        var newArticle = new articleCollection({
            // below are mandatory field 
            title: articleInfo.title,
            author: req.user.id,
            text: articleInfo.text,
            articleCites: articleInfo.articleCites,
            // below are the default value for all new articles, and are not posted from the front
            articleColor: "Not Categorized",
            articleStatus: "Not Reviewed",
            comments: [],
            articleLikes: []

        });
        newArticle.save(function(err, article){
            if(err)
                res.send(`database error, could not add new article: ${err}`);
            else
                res.json(article);
        });
    }
});

 //export this router to use in our app.js
module.exports = router;