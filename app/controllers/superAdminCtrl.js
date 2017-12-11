
var User = require('../models/users.js');
var Teams = require('../models/teams.js');
var User = require('../models/users.js');
var Err = require('../../config/errMessage');
var mongoose = require('mongoose');
var Promise = require("bluebird");
var jwt = require('jwt-simple');

var Constant = require('../../config/constants');
var GlobalMessages = require('../../config/constantMessages');
var HttpStatus = require('http-status-codes');


/*________________________________________________________________________
 * @Date:       15 Nov,2017
 * @Method :    createprojects
 * Created By:  Abhishek Verma
 * Modified On: -
 * @Purpose:    This function is used to add new project.
 _________________________________________________________________________
 */

var addUser = function (req, res) {
    var user = {};
    user = req.body;
    if(user){
        User(user).save(function (err, result) {
            if (err) {
                res.send(Err.errMessage(err));
            } else {
                res.status(HttpStatus.OK).send({msg : GlobalMessages.CONST_MSG.addUserSuccess,status :HttpStatus.OK});
                console.log('User added : '+user);
            }
        });
    }else {
        res.send({err:GlobalMessages.CONST_MSG.errorMessage ,status :HttpStatus.NOT_FOUND});
    }
};


/*________________________________________________________________________
 * @Date:       15 Nov,2017
 * @Method :    createprojects
 * Created By:  kunvar singh
 * Modified On: -
 * @Purpose:    This function is used to add new project.
 _________________________________________________________________________
 */

var createTeam = function (req, res) {
    var team = {};
    team = req.body;

    if(team.teamManagerId && team.teamTitle){
        User.findOne({accountType : 'Team Manager'},{},function(err, data){
            if(data){
                Teams(team).save(function (err, result) {
                    if (err) {
                        res.send({err:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.NOT_FOUND,msg:err.message});
                    } else {
                        res.status(HttpStatus.OK).send({msg : GlobalMessages.CONST_MSG.addTeamSuccess,status :HttpStatus.OK});
                    }
                });
            }
            else{
               res.send({err:GlobalMessages.CONST_MSG.errorMessage ,msg: "Manager Does Not Exists",status :HttpStatus.NOT_FOUND}); 
            }
        });
        
    }else {
        res.send({err:GlobalMessages.CONST_MSG.errorMessage ,msg: GlobalMessages.CONST_MSG.fillAllFields,status :HttpStatus.NOT_FOUND});
    }
   
};

/*get all teams*/
var viewTeam = function (req, res) {
    var conditions = {
        isDeleted: false
    };
    var fields = {};
    console.log('req',req.params.page)
    var skipVal = (Constant.pagination.itemPerPage * parseInt(req.params.page)) - Constant.pagination.itemPerPage;

    if(req.headers['authorization']){
        Teams.find(conditions, fields).count().exec(function (err, data) {
        if (err) {
            res.status(HttpStatus.NOT_FOUND).send({err: err.message , status: HttpStatus.NOT_FOUND});
        } else {
            if(data) {
                Teams.find(conditions,fields).sort({ createdAt: -1 }).skip(skipVal)
                .limit(Constant.pagination.itemPerPage)
                .populate('teamManagerId',{firstName:1,lastName:1})
                .populate('teamMembersId',{firstName:1,lastName:1})
                .populate('teamLeadsId',{firstName:1,lastName:1})
                .exec(function(err, result){
                    if(err){
                        res.status(HttpStatus.BAD_REQUEST).send({msg: err.message, status: HttpStatus.BAD_REQUEST});
                    }else{
                        var managerData=[];
                        if(result.length >0){
                             // for(let res of result){
                             //    User.findOne({_id : res.teamManagerId},{}, function(err, teamManager){
                             //        // console.log('manager name:::'+teamManager.firstName);
                             //        managerData.push(teamManager);
                             //    });
                             // }
                             // result = result['managerName'] = managerData;
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
}

var deleteTeam = function (req, res) {
    if(req.headers['authorization']){
        if (!req.params || !req.params.TeamId){
            res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
        } else{
            var conditions = {
                _id: req.params.TeamId
            };
            var fields = {
                isDeleted: true
            };
            
            Teams.findOne({isDeleted : false} ,{}, function( err, data){
                if(data){
                    Teams.update(conditions, {$set: fields}, function (err, result) {
                        if (err) {
                            res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
                        } else {
                            res.status(HttpStatus.OK).send({msg: GlobalMessages.CONST_MSG.deleteTeamSuccess, status: HttpStatus.OK});
                        }
                    });
                } else {
                    res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
                }
            });
       }
    }
    else{
        res.send({err:GlobalMessages.CONST_MSG.tokenExpire,msg: GlobalMessages.CONST_MSG.fillAllFields,status :HttpStatus.NOT_FOUND});
    }    

}

/*Update team on the */
var updateTeam = function (req, res) {
    var bodyParams = req.body;
    if (!req.params || !req.params.TeamId){
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
    } else{
        var conditions = {
            _id: req.params.TeamId
        };
        var fields = {
            teamTitle : bodyParams.teamTitle,
            teamDetails : bodyParams.teamDetails,
            teamManagerId : bodyParams.teamManagerId,
            teamLeadsId : bodyParams.teamLeadsId
        };
        
        Teams.findOne(conditions ,{}, function( err, data){
            if(data){
                Teams.updateOne(conditions, {$set: fields}, function (err, result) {
                    if (err) {
                        res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
                    } else {
                        res.status(HttpStatus.OK).send({msg: GlobalMessages.CONST_MSG.updateTeamSuccess, status: HttpStatus.OK});
                    }
                });
            } else {
                res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
            }
        });
   }
}

/*Get team Details on the basis of ID*/
var getTeamById = function (req, res) {
     if(req.headers['authorization']){
        if (!req.params || !req.params.TeamId){
            res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
        } else{
            var conditions = {
                $and: [
                    {isDeleted: false},
                    {_id: req.params.TeamId}
                ]
            }
            var fields = {};

            Teams.findOne(conditions ,fields)
            .populate('teamManagerId',{firstName:1,lastName:1})
            .populate('teamMembersId',{firstName:1,lastName:1})
            .populate('teamLeadsId',{firstName:1,lastName:1})
            .exec(function( err, data){
                if (err) {
                    res.status(HttpStatus.NOT_FOUND).send({err: err.message, status: HttpStatus.NOT_FOUND});
                } else {
                    if(data){
                        res.status(HttpStatus.OK).send({result: data, status: HttpStatus.OK});
                    }
                    else{
                        res.status(HttpStatus.OK).send({result : [],msg: GlobalMessages.CONST_MSG.emptyData, status: HttpStatus.OK});
                    }
                }
            });
        }
    }
    else{
        res.send({err:GlobalMessages.CONST_MSG.tokenExpire,msg: GlobalMessages.CONST_MSG.fillAllFields,status :HttpStatus.NOT_FOUND});
    }     
}

var GetManagersAndLeadsListByTeamId = function(req, res){
    var bodyparams =  req.body;

    if(req.headers['authorization']){
        if (!req.params || !bodyparams.teamsId){
            res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
        } else{
            var conditions = {
                $and: [
                    {isDeleted: false}
                    ,
                    {_id:{"$in" : bodyparams.teamsId}}
                ]
            }
            var fields = {
                teamManagerId :1,
                teamLeadsId :1
            };

            Teams.find(conditions ,fields)
            .populate('teamManagerId',{firstName:1,lastName:1})
            .populate('teamLeadsId',{firstName:1,lastName:1})
            .exec(function( err, data){
                if (err) {
                    res.status(HttpStatus.NOT_FOUND).send({err: err.message, status: HttpStatus.NOT_FOUND});
                } else {
                    if(data){
                        res.status(HttpStatus.OK).send({result: data, status: HttpStatus.OK});
                    }
                    else{
                        res.status(HttpStatus.OK).send({result : [],msg: GlobalMessages.CONST_MSG.emptyData, status: HttpStatus.OK});
                    }
                }
            });
        }
    }
    else{
        res.send({err:GlobalMessages.CONST_MSG.tokenExpire,msg: GlobalMessages.CONST_MSG.fillAllFields,status :HttpStatus.NOT_FOUND});
    }     
}

var addTeamMembers = function(req, res){
    var bodyParams = req.body;
    if (!req.params || !req.params.TeamId){
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
    } else{
        var conditions = {
            _id: req.params.TeamId
        };
        var fields = {
            teamMembersId : bodyParams.teamMembersId
        };
        
        Teams.findOne(conditions ,{}, function( err, data){
            if(data){
                Teams.updateOne(conditions, {$set: fields}, function (err, result) {
                    if (err) {
                        res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
                    } else {
                        res.status(HttpStatus.OK).send({msg: 'Member Added Successfully', status: HttpStatus.OK});
                    }
                });
            } else {
                res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
            }
        });
   }
};

var viewAllTeam = function (req, res) {
    var conditions = {
        isDeleted: false
    };
    var fields = {_id:1,teamTitle:1};
    if(req.headers['authorization']){
        Teams.find(conditions,fields).sort({ createdAt: -1 }).exec(function(err, result){
                        if(err){
                            res.status(HttpStatus.BAD_REQUEST).send({msg: err.message, status: HttpStatus.BAD_REQUEST});
                        }else{
                            if(result.length >0){
                                res.status(HttpStatus.OK).send({status: HttpStatus.OK, result: result});     
                            }
                            else{
                                res.status(HttpStatus.OK).send({status: HttpStatus.OK, result: result,msg: GlobalMessages.CONST_MSG.emptyData});     
                            }
                            
                        }
        });
    }
    else{
        res.send({err:GlobalMessages.CONST_MSG.tokenExpire,msg: GlobalMessages.CONST_MSG.fillAllFields,status :HttpStatus.NOT_FOUND});
    } 
};    

/*get managers List*/
var GetManagersList = function (req, res) {
        User.find({accountType : 'Team Manager', isDeleted: false},{_id:1, firstName:1, lastName:1},function(err, data){
            if(data){
                    if (err) {
                        res.send({err:GlobalMessages.CONST_MSG.fillAllFields, result : data, status:HttpStatus.NOT_FOUND,msg:err.message});
                    } else {
                        res.status(HttpStatus.OK).send({result : data ,status :HttpStatus.OK});
                    }
            }
            else{
               res.send({err:GlobalMessages.CONST_MSG.errorMessage ,msg: "Manager Does Not Exists",status :HttpStatus.NOT_FOUND}); 
            }
        });
};

/*get Team Lead*/
var GetTeamLeadsList = function (req, res) {
        User.find({accountType : 'Team Lead', isDeleted: false},{_id:1, firstName:1, lastName:1},function(err, data){
            if(data){
                    if (err) {
                        res.send({err:GlobalMessages.CONST_MSG.fillAllFields, result : data, status:HttpStatus.NOT_FOUND,msg:err.message});
                    } else {
                        res.status(HttpStatus.OK).send({result : data ,status :HttpStatus.OK});
                    }
            }
            else{
               res.send({err:GlobalMessages.CONST_MSG.errorMessage ,msg: "Team Leads Not Exists",status :HttpStatus.NOT_FOUND}); 
            }
        });
};
//  functions
exports.addUser = addUser;
exports.createTeam = createTeam;
exports.viewTeam = viewTeam;
exports.deleteTeam = deleteTeam;
exports.updateTeam = updateTeam;
exports.getTeamById = getTeamById;
exports.viewAllTeam = viewAllTeam;
exports.GetManagersList = GetManagersList;
exports.GetTeamLeadsList = GetTeamLeadsList;
exports.GetManagersAndLeadsListByTeamId = GetManagersAndLeadsListByTeamId;
exports.addTeamMembers = addTeamMembers;
