const express = require('express');
const router = express.Router();
const {reportCollection} = require('../Mongoose_Schema')
const {authenticateToken, authenticateRole} = require('./Authen_Function');

// this is just a small error printing function so that i don't have to re-write the code for every route handler
function routeErrorHandler(err, docs, res, message){
    // if there is an error, send the error message
    if(err)
       return res.send(message + '\n' + err);
    else
    // if there's no error, send the response in the form of a json
       return res.json(docs);
}

// report route handler are still in progress
// i can't think of anything else for the reports
router.use(authenticateToken);
router.use(authenticateRole("Administrator"));

// get all reports from the Reports Collection
router.get('/', function (req, res){
    reportCollection.find( function (err, docs){
        routeErrorHandler(err, docs, req, "Cannot get documents from Reports Collection");
    });
});
// get a report with id matching the one on the url parameter 
router.get('/id/:reportId', function (req, res) {
    reportCollection.findById( req.params.reportId, function (err, docs) {
        routeErrorHandler(err, docs, req, "Cannot get documents from Reports Collection");
    });
});
// get all reports with status matching the one in the request body
router.get('/status/', function (req, res) {
    // the route can get "Not Reviewed", "Approved", "Rejected" reports as needed
    reportCollection.find( {reportStatus: req.body.status}, function (err, docs) {
        routeErrorHandler(err, docs, req, "Cannot get documents from Reports Collection");
    });
});
// get all reports that belongs to an article with the matching id to the one on the url parameter
router.get('/article/:articleId', function (req, res) {
    reportCollection.find( {articleId: req.params.articleId}, function (err, docs) {
        routeErrorHandler(err, docs, req, "Cannot get documents from Reports Collection");
    });
});
// get all reports made by the user with the matching id to the one on the url parameter
router.get('/user/:userId', function (req, res) {
    reportCollection.find( {userId: req.params.userId}, function (err, docs) {
        routeErrorHandler(err, docs, req, "Cannot get documents from Reports Collection");
    });
});
// update the report status of the one with the mathing id to the one on the url parameter
router.put('/id/:reportId/status', function (req, res) {
    reportCollection.findByIdAndUpdate(req.params.reportId, {reportStatus: req.body.reportStatus}, function (err, docs) {
       routeErrorHandler(err, docs, req, "Cannot update documents from Reports Collection");
    });
});
// delete a report with the matching id to the one on the url parameter
router.delete('/report_delete/report/:reportId', function (req, res){
    reportCollection.findByIdAndDelete(req.params.reportId, function (err, docs) {
       routeErrorHandler(err, docs, req, "Cannot delete documents from Reports Collection");
    });
});

 //export this router to use in our app.js
module.exports = router;