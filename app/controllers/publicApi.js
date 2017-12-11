
var User = require('../models/users.js');
var Mail = require('../models/SendMail.js');
var SMS = require('../models/SendSms.js');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var config = require('../../config/passport_config.js');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var formidable = require("formidable");
var crypto = require('crypto');
var HttpStatus = require('http-status-codes');
var GlobalMessages = require('../../config/constantMessages');
var messageHandler = require('../../config/messageHandler');
var multer  =   require('multer');
const fileUpload = require('express-fileupload');
/*________________________________________________________________________
 * @Date:      	10 Nov,2017
 * @Method :   	Register
 * Modified On:	-
 * @Purpose:   	This function is used for sign up user.
 _________________________________________________________________________
 */
var check = function (req,res){
    res.send({name:req.body.name});
}

var register = function (req, res) {
    var user = {};
    user = req.body;
    console.log(req.body, 'user');
    var token;
    if(!user || !user.email || !user.password && user.accountType != 'admin') {
        res.status(HttpStatus.NOT_FOUND).send({msg:"Please provide all the details",status:HttpStatus.NOT_FOUND})
    } else {
        User.findOne({email: user.email},{}, function (err,data) {
            if (err) {
                res.status(HttpStatus.NOT_FOUND).send({msg:err,status:HttpStatus.NOT_FOUND});
            }
            else if(data){
                res.status(HttpStatus.UNAUTHORIZED).send({msg:"USER ALREADY EXIST WITH GIVEN EMAIL",status:HttpStatus.NOT_FOUND});
            } else {
                crypto.randomBytes(10, function (err, buf) {
                    token = buf.toString('hex');
                    user.verificationToken = token;
                    user.verifyEmail = {
                        email: req.body.email.toLowerCase(),
                        verificationStatus: false
                    };
                    var errorMessage = "";
                    User(user).save(function (err, data) {
                        if (err) {
                             res.send(messageHandler.errMessage(err));
                            // console.log("aaaa", err);
                            // switch (err.name) {
                            //     case 'ValidationError':
                            //         for (field in err.errors) {
                            //             console.log(err.errors);
                            //             if (err.errors[field].path === 'email') {
                            //                 errorMessage = 'This email id is already in use. Please select another email id.';
                            //             } else if (err.errors[field].path === 'password') {
                            //                 errorMessage = 'Please enter the password.';
                            //             }
                            //         }//for
                            //     case 'MongoError':
                            //         errorMessage = 'This email id is already in use. Please select another email id.';
                            //         break;
                            // }//switch
                            // res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: errorMessage,status:HttpStatus.NON_AUTHORITATIVE_INFORMATION});
                        } else {
                            var verifyurl = 'verifyemail/' + user.verificationToken;
                            Mail.registerMail(user,verifyurl, function(msg) {
                                console.log('Mail sent successfully.')
                            });
                            res.status(HttpStatus.OK).send({msg: "user registered successfully.",status:HttpStatus.OK});
                        }
                    });
                });
            }
        });
    }
}

/*________________________________________________________________________
 * @Date:       10 Nov,2017
 * @Method :    verifyEmail
 * Modified On: -
 * @Purpose:    This function is used to verify user.
 _________________________________________________________________________
 */

var verifyEmail = function (req, res) {
    User.findOne({verificationToken: req.params.token}, function (err, data) {
        if (err) {
            res.status(203).send({msg: "Something went wrong."});
        } else {
            if (!data) {
                res.status(203).send({msg: "Token is expired."});
            } else {
                var verificationStatus = data.verifyEmail.verificationStatus;
                var user_id = data._id;
                if (verificationStatus === true) { // already verified
                    console.log("account verified");
                    res.status(200).send({msg: "Account Already verified."});
                } else { // to be verified
                    data.email = data.verifyEmail.email;
                    data.verifyEmail = {
                        email: data.verifyEmail.email,
                        verificationStatus: true
                    };
                    data.save(function (err, data) {
                        if (err) {
                            res.status(203).send({msg: "Something went wrong."});
                        } else {
                            Mail.verifyAccountMail(data.email, function (msg) {
                                console.log('Mail sent successfully.')
                            });
                            res.status(200).send({msg: "Account Activated successfully."});
                        }
                    });
                }
            }
        }
    });
};
/*________________________________________________________________________
 * @Date:       10 Nov,2017
 * @Method :    login
 * Modified On: -
 * @Purpose:    This function is used to authenticate user.
 _________________________________________________________________________
 */

var login = function (req, res) {
    var user = req.body;
    if (!user || !user.email) {
        res.status(HttpStatus.NOT_FOUND).send({msg: "Please provide valid email and password",status:HttpStatus.NOT_FOUND});
    } else {
        User.findOne({email: user.email},
            {}, function (err, data) {
                if (err) {
                    res.status(HttpStatus.NOT_FOUND).send({msg: err,status:HttpStatus.NOT_FOUND});
                } else {
                    if(data){
                    if(data.verifyEmail.verificationStatus == false) {
                        res.status(HttpStatus.NOT_FOUND).send({msg: "Your email is not verified.",status:HttpStatus.NOT_FOUND});
                    }else {
                        if (data) {
                            bcrypt.compare(user.password, data.password, function (err, result) {
                                if (err) {
                                    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: err,status:HttpStatus.NON_AUTHORITATIVE_INFORMATION});
                                } else {
                                    if (result === true) {
                                        data.active = true;
                                        data.lastSeen = new Date().getTime();
                                        data.save(function (err, success) {
                                            if (!err) {
                                                var token = jwt.sign({_id: data._id}, config.secret);
                                                // to remove password from response.
                                                data = data.toObject();
                                                delete data.password;
                                                res.status(HttpStatus.OK).json({token: token, data: data,status:HttpStatus.OK});
                                            }
                                        });
                                    } else {
                                        res.status(HttpStatus.NOT_FOUND).send({msg: 'Authentication failed due to wrong details.',status:HttpStatus.NOT_FOUND});
                                    }
                                }
                            });
                        } else {
                            res.status(HttpStatus.NOT_FOUND).send({msg: 'No account found with given email.',status:HttpStatus.NOT_FOUND});
                        }
                    }
                }
                else{
                   res.status(HttpStatus.NOT_FOUND).send({msg: "Your email is not register with us. Please signup first",status:HttpStatus.NOT_FOUND}); 
                }
                }
            });
    }
};


/*________________________________________________________________________
 * @Date:       10 Nov,2017
 * @Method :    forgot_password
 * Modified On: -
 * @Purpose:    This function is used when user forgots password.
 _________________________________________________________________________
 */
var forgotPassword = function (req, res) {
    crypto.randomBytes(10, function (err, buf) {
        var token = buf.toString('hex');
        User.findOne({email: req.body.email}, function (err, data) {
            if (err) {
                res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: 'Please enter a valid email.',status:HttpStatus.NON_AUTHORITATIVE_INFORMATION});
            } else if (!data) {
                res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: 'Email does not exist.',status:HttpStatus.NON_AUTHORITATIVE_INFORMATION});
            } else {
                if (data) {
                    data.resetPasswordToken = token,
                    data.resetPasswordExpires = Date.now() + 3600000;

                    data.save(function (err, data) {
                        if (err) {
                            res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: 'Something went wrong.',status:HttpStatus.NON_AUTHORITATIVE_INFORMATION});
                        } else {
                            Mail.resetPwdMail(req.body, token, function (msg) {
                                console.log('Reset password mail sent successfully.')
                            });
                        }
                        res.status(HttpStatus.OK).send({msg: 'Email sent successfully.',status:HttpStatus.OK});
                    });
                }
            }
        });

    });
};


/*________________________________________________________________________
 * @Date:       10 Nov,2017
 * @Method :    resetPassword
 * Modified On: -
 * @Purpose:    This function is used when user reset password.
 _________________________________________________________________________
 */


var resetPassword = function (req, res) {
    if (req.body.newPassword && req.body.token) {
        User.findOne({resetPasswordToken: req.body.token}, function (err, data) {
            if (err) {
                res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: 'No record found.',status:HttpStatus.NON_AUTHORITATIVE_INFORMATION});
            } else {
                if (!data) {
                    res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: 'Reset Password token has been expired.',status:HttpStatus.NON_AUTHORITATIVE_INFORMATION});
                } else {

                    data.password = req.body.newPassword;
                    data.resetPasswordToken = undefined;
                    data.resetPasswordExpires = undefined;

                    data.save(function (err, data) {
                        if (err) {
                            res.status(HttpStatus.NON_AUTHORITATIVE_INFORMATION).send({msg: 'No record found.',status:NON_AUTHORITATIVE_INFORMATION});
                        } else {
                            Mail.resetConfirmMail(data, function (msg) {
                                console.log('Reset Confirmation mail sent successfully.')
                            });
                            res.status(HttpStatus.OK).send({msg: 'Password has been successfully updated.',status:HttpStatus.OK});
                        }
                    });
                }
            }
        });
    }
    else{
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.BAD_REQUEST});
    }
};

/*________________________________________________________________________
 * @Date:       16 Nov,2017
 * @Method :    imageUpload
 * Modified On: -
 * @Purpose:    This function is used when user reset password.
 _________________________________________________________________________
 */
var storage =   multer.diskStorage({
      destination: function (req, file, callback) {
        callback(null, './uploads');
      },
      filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now());
      }
    });
    var upload = multer({ storage : storage},{limits: {
          fieldNameSize: 100,
          files: 2,
          fields: 5
    }}).single('userPhoto');
  
 var imageUpload = function (req, res) {
    // if(req.body.userId){
         upload(req,res,function(err,data) {
            if(err) {
                return res.send({msg:GlobalMessages.CONST_MSG.fileUploadError,err:err.message});
            }
            res.send({msg:GlobalMessages.CONST_MSG.fileUploadSuccess, data:data, status:HttpStatus.OK});
        });
    // }
    // else{
    //     res.send({msg : 'Please Give UserId', data:[], status:HttpStatus.OK});
    // }

 }



//  functions
exports.register = register;
exports.verifyEmail = verifyEmail;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.imageUpload = imageUpload;
exports.check = check;
