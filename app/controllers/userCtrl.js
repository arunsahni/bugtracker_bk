
var User = require('../models/users.js');
var Invitations = require('../models/invitations.js');
var Mail = require('../models/SendMail.js');
var SMS = require('../models/SendSms.js');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');
var _ = require('lodash');
var formidable = require("formidable");
var Constant = require('../../config/constants');
var messageHandler = require('../../config/messageHandler');
var HttpStatus = require('http-status-codes');
var GlobalMessages = require('../../config/constantMessages');
var crypto = require('crypto');
/*________________________________________________________________________
 * @Date:       20 May,2017
 * @Method :    logout
 * Modified On: -
 * @Purpose:    This function is for logout
 _________________________________________________________________________
 */

var logout = function (req, res) {
    delete  req.user;
    req.logout();
    res.status(200).json({msg: "logout successfully."});
};

/*________________________________________________________________________
 * @Date:       20 May,2017
 * @Method :    searchUser
 * Modified On: -
 * @Purpose:    This function is used when user forgots password.
 _________________________________________________________________________
 */

var searchUser = function (req, res) {

    var uid = req.user && req.user.uid;
    var username = req.query && req.query.username;

    if(!uid || !username){
        res.status(400).send({msg:"Please enter correct email/phone."});
    }else {
        try {
            User.find({$or: [{'profile.phone': username}, {'profile.email': username}]},
                {profile: 1, uid: 1}, function (err, receiver) {
                    if (err) {
                        res.status(400).send({msg: err});
                    } else {
                        if (receiver.length > 0) {

                            if (receiver[0].uid === uid) {
                                return res.status(201).send({
                                    msg: 'You are trying to search yourself',
                                    status:'self',
                                    data: receiver[0]
                                });
                            }

                            User.find({uid: uid}, {}, function (err, sender) {
                                if (err) {
                                    res.status(400).send({msg: err});
                                } else {
                                    if (sender.length > 0) {
                                        var isExists = _.filter(sender[0].friendList, function (friend) {
                                            return friend.uid === receiver[0].uid;
                                        });
                                        if (isExists.length > 0) {
                                            res.status(201).json({
                                                msg: 'Person is already in your Friend list.',
                                                data: receiver[0],
                                                status: 'isFriend'
                                            });
                                        } else {
                                            Invitations.find({$and: [{senderUid: uid}, {receiverUid: receiver[0].uid}, {statusCode: "not accepted"}, {isDeleted: false}]},
                                                {}, function (err, invitationData) {
                                                    if (err) {
                                                        res.status(400).send({msg: err});
                                                    } else {
                                                        if (invitationData.length > 0) {
                                                            res.status(201).send({
                                                                msg: "You have already sent an invitation to " + receiver[0].profile.name,
                                                                data: receiver[0],
                                                                status: 'sentRequest'
                                                            });
                                                        } else {
                                                            Invitations.find({$and: [{receiverUid: uid}, {senderUid: receiver[0].uid}, {statusCode: "not accepted"}, {isDeleted: false}]},
                                                                {}, function (err, invitedData) {
                                                                    if (err) {
                                                                        res.status(400).send({msg: err});
                                                                    } else {
                                                                        if (invitedData.length > 0) {
                                                                            res.status(201).send({
                                                                                msg: receiver[0].profile.name + " already sent you an invitation ",
                                                                                data: receiver[0],
                                                                                status: 'pendingRequest'
                                                                            });
                                                                        } else {
                                                                            res.status(200).json({data:receiver[0]});

                                                                        }
                                                                    }
                                                                });
                                                        }
                                                    }
                                                });
                                        }
                                    } else {
                                        res.status(400).send({msg: 'OOPS! Something went wrong.Please try again'})
                                    }
                                }
                            });

                        } else {
                            res.status(400).send({msg: 'No user found with the given details'})
                        }
                    }
                });
        }catch(e) {
            console.log(e,"error in search")
        }
    }
};



/*________________________________________________________________________
 * @Date:      	29 May,2017
 * @Method :   	CurrentProfile
 * Created By: 	Ved Prakash
 * Modified On:	-
 * @Purpose:   	This function is used to update User profile.
 _________________________________________________________________________
 */

var userProfile = function (req,res) {
    // console.log(req.user,'req');
    var uid = req.user && req.user.uid;

    if(!uid){
        res.send({msg:"OOPS! Something went wrong. Please try again"});

    } else {
        User.findOne({uid:uid},{friendList:0,authyId:0},function (err,data) {
            if(err) {
                res.status(400).send({msg:err})
            }else {
                if(data){
                    data.active = true;
                    data.lastSeen = new Date().getTime();
                    data.save(function (err,success) {
                        if(err){
                            console.log(err,"saveing error");
                        }else {
                            res.status(200).json(data);
                        }
                    });
                }else{
                    res.status(200).json({msg:"No user found"})
                }

            }
        })
    }
};


/*________________________________________________________________________
 * @Date:      	29 May,2017
 * @Method :   	Profile
 * Created By: 	Ved Prakash
 * Modified On:	-
 * @Purpose:   	This function is used to update User profile.
 _________________________________________________________________________
 */


var getNotifications = function (req,res) {
    var uid = req.body.uid;

    if(!uid){
        res.send(400,'Something Went wrong');
    }

    User.find({uid:uid},function (err,data){
        if(err){
            res.send(400,err)
        }else {
            res.status(200).json("Profile Updated Successfully");
        }
    });

    console.log(headers,"headers");

};


/*________________________________________________________________________
 * @Date:      	29 May,2017
 * @Method :   	updateProfile
 * Created By: 	Ved Prakash
 * Modified On:	- 18 June,2017
 * @Purpose:   	This function is used to update User profile.
 _________________________________________________________________________
 */


var updateProfile = function (req,res) {
    var user = req.body;
    var uid = req.user.uid;

    if(!uid){
        res.status(400).send({msg:'OOPS! Something went wrong. Please try again'});
    } else{
        User.update({uid : uid},
            {$set: {
                'profile.name': user.name}
            }, function (err, data) {
            if (err) {
                res.status(400).send({msg:err});
            } else {
                res.status(200).json({msg:"Profile Updated Successfully"});
            }
        })
    }
};



/*________________________________________________________________________
 * @Date:      	18 June,2017
 * @Method :   	freindsList
 * Created By:
 * Modified On:	-Ved
 * @Purpose:   	This function is used to upload pic.
 _________________________________________________________________________
 */

var friendList = function (req, res) {
    var uid = req.user && req.user.uid;
    if(!uid){
        res.status(400).send({msg:'OOPS! Something went wrong. Please try again'});
    }else {
        User.findOne({uid: uid},{friendList: 1}, function (err, result) {
            if (err) {
                res.status(400).send(err);
            } else {
                var friends = [];
                console.log("User:",result);
                try{
                    if(result && result.friendList.length > 0){
                        friends = result.friendList.map(function (user){
                            return user.uid;
                        });
                        User.find({'uid': {'$in': friends}},
                            {friendList: 0,authyId:0}, function (err, data) {
                                if (err) {
                                    res.status(400).send({msg:err});
                                } else {
                                    res.status(201).json(data);
                                }
                            });
                    } else{
                        res.status(200).json({msg:"You don't have any contacts"});
                    }
                }catch(e){
                    console.log(e)
                }
            }
        })
    }
};


// private functions

var deleteUser = function (req, res) {
    var body  = req.body;
    var uid = req.user.uid;
    if(!body || !body.authyId || !uid){
        res.status(400).send('Please send the complete details')
    }else {
        authy.delete_user(body.authyId, function (err, response) {
            if(err) {
                res.status(400).send({msg:err});
            }else {
                User.findOne({uid:uid}, function (err, user) {
                    if (err) {
                        res.status(400).send({msg:err});
                    } else {
                        if(user){
                            user.isDeleted = true;
                            user.active = false;
                            user.lastSeen = new Date().getTime();
                            user.save(function (err,success){
                                if(!err){
                                    res.status(201).json({ msg: 'User deleted successfully.'});
                                }
                            })
                        }else {
                            res.status(200).json({msg:"No user found"});
                        }

                    }
                });
            }
        });
    }
};



/*________________________________________________________________________
 * @Date:       19 June,2017
 * @Method :    deleteFriend
 *
 * Modified On: - 20 June,2017 , Ved
 * @Purpose:    This function is used to delete friend.
 _________________________________________________________________________
 */

var deleteFriend = function (req, res) {
    var uid = req.user && req.user.uid;
    var friendId = req.body.friendId;
    if(!uid || !friendId){
        res.status(400).send({msg:"Please provide us the complete details"});
    }else {
        console.log(uid,'uid');
        console.log(req.body.friendId,'friendId');

           User.update({uid : uid},
            { $pull: { friendList: friendId } }
            , function (err, data) {
            if (err) {
                res.status(400).send({msg:err});
            } else {
                if(data.nModified === 1){
                    SocketActions.notifyDeletedContact(req.io,friendId,uid);
                    res.status(201).json({msg:"Contact removed form your directory successfully"});
                }else {
                    res.status(200).json({msg:"Contact not found"});
                }


            }
        })
    }
};


/*________________________________________________________________________
 * @Date:       25 June,2017
 * @Method :    Change Password
 * Created By:  Ved Prakash
 * Modified On: -
 * @Purpose:    This function is used to change Password
 _________________________________________________________________________
 */

function changePassword(req, res){
    console.log(req.body,"req.body");
    var uid = req.user && req.user.uid;
    var body = req.body;
    var password = body.password;
    var confirm_password = body.confirm_password;
    var current_password = body.current_password;
    
    if(!uid ||!password ||!confirm_password || !current_password){
        res.status(400).send({msg:"Please provide the complete details"})
    } else if(password !== confirm_password) {
        res.status(400).send({msg:"Password and confirm password do not match"})
    } else {
        User.findOne({uid:uid},'+password', function (err,data) {
            if(err){
                res.status(400).send({msg:err});
            }else if(data){
                bcrypt.compare(current_password, data.password, function (err, result) {
                    if(err) {
                        res.status(400).send({msg:err});
                    }else if(result === true){
                        User.hashPassword(password).then(function(hashed){
                            password = hashed;
                            User.findOneAndUpdate({uid:uid},{$set:{password:password}},function (err,success) {
                                if(err) {
                                    res.status(400).send({msg:err});
                                }else {
                                    res.status(201).json({msg:"Your Password Has Been Updated Successfully"});
                                }
                            })
                        });
                    }else {
                        res.status(400).send({msg:"Current password do not match"});
                    }
                })
            }else {
                res.status(400).send({msg:"OOPS! Something went wrong.Please try again."});
            }
        })
    }
}



/*________________________________________________________________________
 * @Date:       20 June,2017
 * @Method :    AVATAR
 * Created By:  Ved Prakash
 * Modified On: -
 * @Purpose:    This function is used to update Avatar
 _________________________________________________________________________
 */

function updateAvatar(req, res){
    var uid = req.user && req.user.uid;

    if(req.body.myCroppedImage){
        User.findOneAndUpdate({"uid": uid}, {'profile.avatar': req.body.myCroppedImage}, function (err, user) {
            if (err){
                res.status(400).send(err);
            } else {
                res.status(200).json({avatar: req.body.myCroppedImage});
            }
        });
    }
    else
    {
        User.findOneAndUpdate({"uid":uid}, {'profile.avatar': ""}, function (err, user) {
            if(err) {
                res.status(400).send(err);
            }else {
                res.status(200).json({avatar: ""});
            }
        });
    }
}


/*________________________________________________________________________
 * @Date:       06 July,2017
 * @Method :    getUserInfo
 * Created By:
 * Modified On: -
 * @Purpose:    This function is used to get user information.
 _________________________________________________________________________
 */

function getUserInfo(req, res){
    console.log(req.user,"req.user");
    var uid = req.query && req.query.uid;

    if(!uid){
        res.status(400).send({msg:"OOPS! Something went wrong. Please try again."});
    } else {
        User.findOne({uid:uid},{friendList:0,authyId:0}, function (err,data) {
            if(err){
                res.status(400).send({msg:err})
            } else {
                if(data){
                    res.status(201).json(data);
                }else {
                    res.status(200).json({msg:"No User Found"});
                }

            }
        })
    }
}

function getAllUsers(req, res){
    var conditions = {
        isDeleted: false
    };
    var fields = {_id:1,email:1,firstName:1,lastName:1,accountType:1,address:1,lastSeen:1};
    console.log('req',req.params.page)
    var skipVal = (Constant.pagination.itemPerPage * parseInt(req.params.page)) - Constant.pagination.itemPerPage;

    if(req.headers['authorization']){
        User.find(conditions, fields).count().exec(function (err, data) {
        if (err) {
            res.status(HttpStatus.NOT_FOUND).send({err: err.message , status: HttpStatus.NOT_FOUND});
        } else {
            if(data) {
                User.find(conditions,fields).sort({ createdAt: -1 })
                .skip(skipVal)
                .limit(Constant.pagination.itemPerPage)
                .exec(function(err, result){
                    if(err){
                        res.status(HttpStatus.BAD_REQUEST).send({msg: err.message, status: HttpStatus.BAD_REQUEST});
                    }else{
                        if(result.length >0){
                            res.status(HttpStatus.OK).send({status: HttpStatus.OK, totalRecords: data, result: result});     
                        }
                        else{
                            res.status(HttpStatus.OK).send({status: HttpStatus.OK, totalRecords: data, result: result,msg: GlobalMessages.CONST_MSG.emptyData});     
                        }
                        
                    }
                });
            }
            else{
                res.send(HttpStatus.NOT_FOUND, {msg: GlobalMessages.CONST_MSG.emptyData,status: HttpStatus.NOT_FOUND});
            }
        }
    });
    }
    else{
        res.send({err:GlobalMessages.CONST_MSG.tokenExpire,msg: GlobalMessages.CONST_MSG.fillAllFields,status :HttpStatus.NOT_FOUND});
    }
    
    // if(req.headers['authorization']){
    //    User.find({isDeleted: false}, {_id:1,email:1,firstName:1,lastName:1,accountType:1,address:1,lastSeen:1}, function (err, result) {
    //         if (err) {
    //             res.send(HttpStatus.BAD_REQUEST, {err:err.message,status:HttpStatus.BAD_REQUEST});
    //         } else {
    //             res.status(HttpStatus.OK).send({result:result, status :HttpStatus.OK,totalRecords:result.length});
    //         }
    //     });
    // }
    // else{
    //     res.send({err:GlobalMessages.CONST_MSG.tokenExpire,msg: GlobalMessages.CONST_MSG.fillAllFields,status :HttpStatus.NOT_FOUND});
    // }
}


function getUserRoles (req, res) {
    res.status(HttpStatus.OK).send({result : Constant.userRole.roles , status : HttpStatus.OK , totalRecords : Constant.userRole.roles.length });
}
//  functions
var deleteUserById = function (req, res) {

    if (!req.params || !req.params.userId){
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
    } else{
        var conditions = {
            _id: req.params.userId
        };
        var fields = {
            isDeleted: true
        };
        
        User.findOne({isDeleted : false} ,{}, function( err, data){
            if(data){
                User.update(conditions, {$set: fields}, function (err, result) {
                    if (err) {
                        res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
                    } else {
                        res.status(HttpStatus.OK).send({msg: GlobalMessages.CONST_MSG.deleteUserSuccess, status: HttpStatus.OK});
                    }
                });
            } else {
                res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
            }
        });

        
   }
};

var updateUserById = function (req, res) {
    var bodyParams = req.body;
    if (!req.params || !req.params.userId){
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
    } else{
        var conditions = {
            _id: req.params.userId
        };
        var fields = {
            firstName: bodyParams.firstName,
            lastName: bodyParams.lastName,
            gender: bodyParams.gender,
            address: bodyParams.address ? bodyParams.address :'',
            accountType: bodyParams.accountType
        }
        User.findOne({isDeleted : false} ,{}, function( err, data){
            if(data){
                User.update(conditions, {$set: fields}, function (err, result) {
                    if (err) {
                        res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
                    } else {
                        res.status(HttpStatus.OK).send({msg: GlobalMessages.CONST_MSG.updateUserSuccess, status: HttpStatus.OK});
                    }
                });
            } else {
                res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
            }
        });

        
   }
};

var addUser = function (req, res) {
    var user = {};
    user = req.body;
    console.log(req.body, 'user');
    var token;
    if(!user || !user.email && user.accountType != 'admin') {
        res.status(HttpStatus.NOT_FOUND).send({msg:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.NOT_FOUND})
    } else {
        User.findOne({email: user.email, isDeleted :false},{}, function (err,data) {
            if (err) {
                res.status(HttpStatus.NOT_FOUND).send({msg:err,status:HttpStatus.NOT_FOUND});
            }
            else if(data){
                res.status(HttpStatus.UNAUTHORIZED).send({msg:"USER ALREADY EXIST WITH GIVEN EMAIL",status:HttpStatus.NOT_FOUND});
            } else {

                crypto.randomBytes(4, function (err, buf) {
                    password = buf.toString('hex');
                    user.password = password;
                    user.verifyEmail = {
                        email: req.body.email.toLowerCase(),
                        verificationStatus: true
                    };

                    console.log("user.passworduser.passworduser.password:"+user.password);
                    var errorMessage = "";
                    User(user).save(function (err, data) {
                        if (err) {
                             res.send(messageHandler.errMessage(err));
                            
                        } else {
                            Mail.sendPasswordMail(user,user.password, function(msg) {
                                console.log('Mail sent successfully.')
                            });
                            res.status(HttpStatus.OK).send({msg: "user Added successfully.",status:HttpStatus.OK});
                        }
                    });
                });
            }
        });
    }
}

function getUserById(req, res){
    console.log(req.params.userId);
   if (!req.params || !req.params.userId){
        res.status(HttpStatus.NOT_FOUND).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.NOT_FOUND});
    } else{
        var conditions = {
            $and: [
                {isDeleted: false},
                {_id: req.params.userId}
            ]
        }
        var fields = {};
    
        User.findOne(conditions,fields, function (err, result) {
            if (err) {
                res.status(HttpStatus.NOT_FOUND).send({err: err.message, status: HttpStatus.NOT_FOUND});
            } else {
                if(result){
                    res.status(HttpStatus.OK).send({result: result, status: HttpStatus.OK});
                }
                else{
                    res.status(HttpStatus.OK).send({result : [],msg: GlobalMessages.CONST_MSG.emptyData, status: HttpStatus.OK});
                }
            }
        });
    }
}


function generaePassword (){
    var password='';
     crypto.randomBytes(5, function (err, buf) {
        password = buf.toString('hex');
        return password;
     });
    
};

function getUsers(req, res){
    
       User.find({isDeleted: false, accountType :{ $nin: ['Team Manager', 'Admin','Team Lead']} }, {_id:1,email:1,firstName:1,lastName:1,accountType:1,address:1,lastSeen:1}, function (err, result) {
            if (err) {
                res.send(HttpStatus.BAD_REQUEST, {err:err.message,status:HttpStatus.BAD_REQUEST});
            } else {
                res.status(HttpStatus.OK).send({result:result, status :HttpStatus.OK,totalRecords:result.length});
            }
        });
   
}

var getUsersByAccountType = function (req, res){
    var userData = req.params;
    // var conditions = {
    //     isDeleted: false,
    //     accountType : { userData.type, '$options' : 'i'}
    // };
    User.find({isDeleted: false, accountType :{'$regex' : userData.type, '$options' : 'i'}}).count().exec(function (err, data) {
        if (err) {
            res.status(HttpStatus.NOT_FOUND).send({err: err.message , status: HttpStatus.NOT_FOUND});
        } else {
                var skipVal = (Constant.pagination.itemPerPage * parseInt(req.params.page)) - Constant.pagination.itemPerPage;
                if(userData.type){
                     User.find({isDeleted: false, accountType :{'$regex' : userData.type, '$options' : 'i'}}, {_id:1,email:1,firstName:1,lastName:1,accountType:1,address:1,lastSeen:1})
                     .skip(skipVal)
                     .limit(Constant.pagination.itemPerPage)
                     .exec(function (err, result) {
                        if (err) {
                            res.send(HttpStatus.BAD_REQUEST, {err:err.message,status:HttpStatus.BAD_REQUEST});
                        } else {
                            res.status(HttpStatus.OK).send({result:result, status :HttpStatus.OK,totalRecords:data});
                        }
                    });
                }
                else{
                    res.send(HttpStatus.NOT_FOUND, {msg:'Please Select Designation',status:HttpStatus.NOT_FOUND});
                }
        }
    });
}

exports.changePassword = changePassword;
exports.deleteUser = deleteUser;
exports.searchUser = searchUser;
exports.userProfile = userProfile;
exports.updateProfile = updateProfile;
exports.friendList = friendList;
exports.deleteFriend = deleteFriend;
exports.getUserInfo = getUserInfo;
exports.updateAvatar = updateAvatar;

exports.getAllUsers = getAllUsers;
exports.getUserRoles = getUserRoles;
exports.addUser = addUser;
exports.deleteUserById = deleteUserById;
exports.updateUserById = updateUserById;
exports.getUserById = getUserById;

exports.getUsers = getUsers;
exports.getUsersByAccountType = getUsersByAccountType;