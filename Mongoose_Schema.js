var mongoose = require('mongoose');


// the name of the mongo database is Newzzy
mongoose.connect('mongodb://localhost/Newzzy')
// the schema is the structure of the documents that will be save in the Users Collection
var userSchema = mongoose.Schema({
   firstName: String,
   lastName: String,
   username: String,
   password: String,
   phoneNumber: Number,
   emailAddress: String,
   role: String,
   // the user status field indiates whether a user is active or inactive (when user deletes account, admin disable user)
   userStatus: String,
   emailVerification: Boolean
   
});
// the schema is the structure of the documents that will be save in the Articles Collection
var bigArticleSchema = mongoose.Schema({
   title: String,
   author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
   text: String,

   // article color has been discussed in meetings before
   articleColor: String,
   // articleStatus shows whether the admin has approved the article or not and has 3 value: Not Reviewed, Rejected, Approved
   articleStatus: String,
   // articleLikes is an array that contains the id of users that liked the article
   articleLikes: [String],
   articleCites: [String],
   comments: [{
      userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
      commentText: String,
      // commentLikes is an array that contains the id of users that liked the comment
      commentLikes:[String]   
   }],
});
// the schema is the structure of the documents that will be save in the Reports Collection
var reportSchema = mongoose.Schema({
   articleId: {type: mongoose.Schema.Types.ObjectId, ref: 'Articles'},
   userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
   reportText: String,
   reportCites: String,
   // report status shows whether the admin has approve the report or not and has 3 value: not Reviewed, Rejected, Approved
   reportStatus: String
});

var tokenSchema = new mongoose.Schema({
   userId: {type: mongoose.Schema.Types.ObjectId, ref:"users" },
   token: {type: String}
})

exports.tokenCollection = mongoose.model("Token", tokenSchema);
exports.userCollection = mongoose.model("User", userSchema);
exports.articleCollection = mongoose.model("Article", bigArticleSchema);
exports.reportCollection = mongoose.model("Report", reportSchema);

