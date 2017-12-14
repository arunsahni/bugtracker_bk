  require('dotenv').load();
  var express = require('express');
  var path = require('path');
  var favicon = require('serve-favicon');
  var logger = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var cors = require('cors');
  var jwt = require('jsonwebtoken');
  var cfg = require('./config/passport_config.js');
  var mongodb = require("mongodb");
  var mongoose = require('mongoose');
  var app = express();
  var router = express.Router();
  var debug = require('debug')('bugtracker-backend:server');
  var http = require('http');

  //Routes Here:
  var index = require('./routes/index');
  var users = require('./routes/users');
  var tasks = require('./routes/task');
  var projects = require('./routes/project');
  var api = require('./routes/publicApi');
  var superAdmins = require('./routes/superAdmins');
  

  var db;
  var device = require('express-device');
  app.use(device.capture());

  app.get('/hello',function(req,res) {
    res.send("Hi to "+req.device.type.toUpperCase()+" User");
  });



  // Get port from environment and store in Express.
  var port = normalizePort(process.env.PORT || '3002');
  app.set('port', port);

   // Create HTTP server.
  

 


  var io = require('socket.io')(server);

  app.use(bodyParser({limit: '50mb'}));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use(function(req, res, next) {
    req.io = io;
    next();
  });
  
  mongoose.connect(process.env.MONGODB_URI,function (err, database) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    // Save database object from the callback for reuse.=
    db = database;
    console.log("Database connection ready");
  });

  //Listen on provided port, on all network interfaces.
  router.use(function(req, res, next) {
    var token =  req.headers["authorization"];
    if (token) {
      try {
        // console.log('tokentokentokentoken:::'+token);
        token = token.split(' ')[1];
        
        var decoded = jwt.verify(token,cfg.secret,function (err,decoded){
          if(err){
            res.status(401).send({
              msg: 'Authorization token is not valid'
            });
          }else {
            console.log(decoded,"decoded token")
            req.user = decoded;
            next();
          }
        });
      } catch (e) {
        return res.status(401).send({
          msg: 'Authorization token is not valid'
        });
      }
    } else {
      console.log("No token");
      return res.status(401).send({
        msg: 'Authorization token missing in request.'
      });
    }
  });

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  // uncomment after placing your favicon in /public

  app.use(logger('dev'));
  app.use(bodyParser({limit: '50mb'}));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(cors());

  // app.use('/users', router);

  app.use('/', index);
  app.use('/api', api);
  app.use('/users', users);
  app.use('/tasks', tasks);
  app.use('/project', projects);
  app.use('/superAdmins' ,superAdmins);

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  // Normalize a port into a number, string, or false.
  function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  // Event listener for HTTP server "error" event.

  function onError(error) {
    console.log('Server',error);
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  // Event listener for HTTP server "listening" event.

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }

/* Server createion */

var server = http.createServer(app);
 server.listen(port);
 server.on('error', onError);
 server.on('listening', onListening);

  module.exports = app;