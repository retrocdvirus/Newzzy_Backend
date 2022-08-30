const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
//var mongoose = require('mongoose');
const upload = multer();
const app = express();
const userRoutes = require('./Routes/User_Routes');
const articleRoutes = require('./Routes/Article_Routes');
const reportRoutes = require('./Routes/Report_Routes');
const authenRoutes = require('./Routes/Authen_Routes');

// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 
//form-urlencoded

// for parsing multipart/form-data
app.use(upload.array()); 

app.use(express.static('public'));


app.use('/users', userRoutes);
app.use('/articles', articleRoutes);
app.use('/reports', reportRoutes);
app.use('/authens', authenRoutes);


app.listen(3000);