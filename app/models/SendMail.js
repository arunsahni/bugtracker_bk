var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Q = require('q');
var uniqueValidator = require('mongoose-unique-validator');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var _jade = require('jade');
var fs = require('fs');

var Constant = require('../../config/constants');


var MailSchema = new Schema({
    to                  : { type : String },
    subject             : { type : String },
    body                : { type : String },
    title                : { type : String },
    status              : { type : Schema.Types.Mixed },
    updated_at          : { type : Date },
    deleted_at          : { type : Date, default: null },
    created_at          : { type : Date }
});


// smtp settings
var transporter = nodemailer.createTransport("SMTP",{
    service: 'gmail',
    host: 'smtp.gmail.com',
    secureConnection: false,
    port: 465,
    auth: {
        user: Constant.gmailSMTPCredentials.username,
        pass:Constant.gmailSMTPCredentials.password
    }
});

MailSchema.statics = {
    sendPasswordMail: function (req, password, cb) {
        var self = this;
        var obj = {};
        console.log("===========================");
        console.log('signup:',req);
        console.log("===========================");
        obj.msg = 'Hi  &nbsp;&nbsp;'+ req.firstName + ',<br><br>'+
            'You are receiving this because you have successfully registered for bug tracker.<br><br>' +
            'Your Login Credentials are Here:<br><br>'+'userName is:'+req.email+'<br><br>'+'Password is :'+ password+
            '<br><br><br><br>Bug tracker Team <br><br>';
        obj.subject = "Bug Tracker user Registration";
        obj.email = req.email;
        self.send(obj,cb);
    },
    registerMail: function (req, verifyurl, cb) {
        var self = this;
        var obj = {};
        console.log("===========================");
        console.log('signup:',req);
        console.log("===========================");
        obj.msg = 'Hi  &nbsp;&nbsp;'+ req.firstName + ',<br><br>'+
            'You are receiving this because you have successfully registered for bug tracker.<br><br>' +
            'Please click on the following link, or paste into your browser to complete the verification process:<br><br>' +
            '<a href="' + 'https://bugontrack.herokuapp.com/' + verifyurl + '" target="_blank" >' + 'https://bugontrack.herokuapp.com/' +  verifyurl + '</a><br><br>' +
            'If you did not request this, please ignore.<br><br>';
            'Thanks, <br><br>'
            'Bug tracker Team <br><br>';
        obj.subject = "Bug Tracker Registration";
        obj.email = req.email;
        self.send(obj,cb);
    },
    resetPwdMail: function (req, token, cb) {
        var self = this;
        var obj = {};
        console.log("===========================");
        console.log('signup:',req);
        console.log("===========================");
        obj.msg = 'You are receiving this because you (or someone else) has requested a reset of your account password.<br/>' +
            'Please click on the following link, or paste into your browser to complete the process:<br/>' +
            '<a href="' + 'https://bugontrack.herokuapp.com/reset-password/' + token + '" target="_blank" >' + 'https://bugontrack.herokuapp.com/reset-password/' + token + '</a><br><br>';

        obj.subject = "Reset Password";
        obj.email = req.email;
        self.send(obj,cb);
    },
    resetConfirmMail: function (req, cb) {
        var self = this;
        var obj = {};
        console.log("===========================");
        console.log('signup:',req);
        console.log("===========================");
        obj.msg = 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + req.email + ' has just been changed.\n';
        obj.subject = "Reset Password";
        obj.email = req.email;
        self.send(obj,cb);
    },
    sendWelcomeMail: function (data,cb) {
        var self = this;
        var template = process.cwd() + '/templates/welcome.jade';
        var obj = data;
        obj.msg = template;
        obj.subject = "Welcome to Bug Tracker";

        // get template from file system
        fs.readFile(template, 'utf8', function(err, file) {
            if (err) {
                //handle errors
                console.log('ERROR!',err);
                cb('error',err)
            }
            else {
                //compile jade template into function
                var compiledTmpl = _jade.compile(file, {filename: template});
                // set context to be used in template
                var context = {title: 'LuvCheck'};
                // get html back as a string with the context applied;
                var html = compiledTmpl(context);

                var data = {
                    from: Constant.gmailSMTPCredentials.username,
                    to: obj.email,
                    subject: (obj.subject || "No Subject"),
                    html: (html || "Empty Body")
                };

                // send mail with defined transport object
                transporter.sendMail(data, function (error, info) {
                    if (error) {
                        console.log(error,"error");
                        cb(error);
                    }else{
                        console.log('Message sent: ' + info.messageId);
                        cb('Message sent: ' + info.messageId)
                    }
                });

            }
        })
    },
    verifyAccountMail: function (req, cb) {
        var self = this;
        var obj = {};
        console.log("===========================");
        console.log('verify:',req);
        console.log("===========================");
        obj.msg = 'Hello,<br><br>' +
            'This is a confirmation that your account has been activated.<br><br>' +
            'Please click on the following link to login,<br><br>' +
            '<a href="' + 'https://bugontrack.herokuapp.com/' + '" target="_blank" >https://bugontrack.herokuapp.com/</a><br><br>';
        obj.subject = "Account Activation";
        obj.email = req.email;
        self.send(obj,cb);
    },
    send: function(obj,callback){
        var self = this;
        var data = {
            from: Constant.gmailSMTPCredentials.username,
            to: obj.email,
            title: (obj.title || "No Title"),
            subject: (obj.subject || "No Subject"),
            html: (obj.msg || "Empty Body")
        };

        // send mail with defined transport object
        transporter.sendMail(data, function (error, info) {
            if (error) {
                console.log(error,"error");
                return console.log(error);
            }else{
                console.log('Message sent: ' + info.messageId);
                callback('Message sent: ' + info.messageId)

            }
        });
        return true;
    }

};

var Mail = mongoose.model('Mail', MailSchema);

module.exports = Mail;