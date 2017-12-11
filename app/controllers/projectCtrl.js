var mongoose = require('mongoose');
var Promise = require("bluebird");
var jwt = require('jwt-simple');
var HttpStatus = require('http-status-codes');
var Project = require('../models/projects.js');
var Team = require('../models/teams.js');
var User = require('../models/users.js');
var Constant = require('../../config/constants');
var GlobalMessages = require('../../config/constantMessages');


/*________________________________________________________________________
 * @Date:       15 Nov,2017
 * @Method :    createprojects
 * Created By:  kunvar singh
 * Modified On: -
 * @Purpose:    This function is used to add new project.
 _________________________________________________________________________
 */

var createProject = function (req, res) {
    var fields = {};
    fields = req.body;
    if (!fields || !fields.projectName || !fields.projectStartDate|| !fields.projectEndDate || !fields.projectCreatedBy) {
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST})
    } else {
        User.findOne({_id : fields.projectCreatedBy},{},function (err, data) {
            if (err) {
                res.status(HttpStatus.BAD_REQUEST).send({msg: err.message, status: HttpStatus.BAD_REQUEST})
            } else {
                fields.projectCreatedByName = data.firstName+" "+data.lastName;
                 Project(fields).save(function (err, result) {
                    if (err) {
                        res.status(HttpStatus.BAD_REQUEST).send({msg: err.message, status: HttpStatus.BAD_REQUEST})
                    } else {
                        res.status(HttpStatus.OK).send({msg : GlobalMessages.CONST_MSG.addProjectSuccess, status: HttpStatus.OK , result:result});
                    }
                });
            }
        });

       
    }
};

/*________________________________________________________________________
 * @Date:       16 Nov,2017
 * @Method :    viewProjects
 * Created By:  kunvar singh
 * Modified On: -
 * @Purpose:    This function is used to list projects.
 _________________________________________________________________________
 */

var viewProjects = function (req, res, next) {
    var conditions = {
        isDeleted: false
    };
    var fields = {_id :1,projectName :1, projectCreatedBy:1, projectDetails:1, projectStartDate:1,projectEndDate: 1, isLeadAssigned:1,isManagerAssigned:1, isTeamAssigneed:1, status:1,projectCreatedByName:1};
    console.log('req',req.params.page)
    var skipVal = (Constant.pagination.itemPerPage * parseInt(req.params.page)) - Constant.pagination.itemPerPage;

    Project.find(conditions, fields).count().exec(function (err, data) {
        if (err) {
            res.status(HttpStatus.NOT_FOUND).send({err: err.message , status: HttpStatus.NOT_FOUND});
        } else {
            if(data) {
                Project.find(conditions,fields).sort({ createdAt: -1 })
                .skip(skipVal)
                .limit(Constant.pagination.itemPerPage)
                .populate('projectCreatedBy',{firstName:1,lastName:1})
                .exec(function(err, result){
                    if(err){
                        res.status(HttpStatus.BAD_REQUEST).send({msg: err.message, status: HttpStatus.BAD_REQUEST});
                    }else{
                        res.status(HttpStatus.OK).send({status: HttpStatus.OK, totalRecords: data, result: result}); 
                    }
                });
            }
            else{
                res.send(HttpStatus.NOT_FOUND, {msg: GlobalMessages.CONST_MSG.emptyData,status: HttpStatus.NOT_FOUND});
            }
        }
    });
};

/*________________________________________________________________________
 * @Date:       16 Nov,2017
 * @Method :    deleteProject
 * Created By:  kunvar singh
 * Modified On: -
 * @Purpose:    This function is used to delete project.
 _________________________________________________________________________
 */

var deleteProject = function (req, res) {

    if (!req.params || !req.params.projectId){
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
    } else{
        var conditions = {
            _id: req.params.projectId
        };
        var fields = {
            isDeleted: true
        };

        Project.update(conditions, {$set: fields}, function (err, result) {
            if (err) {
                res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
            } else {
                res.status(HttpStatus.OK).send({msg: GlobalMessages.CONST_MSG.deleteProjectSuccess, status: HttpStatus.OK});
            }
        });
   }
};

/*________________________________________________________________________
 * @Date:       16 Nov,2017
 * @Method :    getProjectById
 * Created By:  kunvar singh
 * Modified On: -
 * @Purpose:    This function is used to get a project.
 _________________________________________________________________________
 */

var getProjectById = function (req, res) {
    if (!req.params || !req.params.projectId){
        res.status(HttpStatus.NOT_FOUND).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.NOT_FOUND});
    } else{
        var conditions = {
            $and: [
                {isDeleted: false},
                {_id: req.params.projectId}
            ]
        }
        var fields = {};
    
        Project.findOne(conditions,fields)
        .populate('projectCreatedBy',{firstName:1,lastName:1})
        .exec(function (err, result) {
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
};


/*________________________________________________________________________
 * @Date:       16 Nov,2017
 * @Method :    updateProject
 * Created By:  kunvar singh
 * Modified On: -
 * @Purpose:    This function is used to update a project.
 _________________________________________________________________________
 */

var updateProject = function (req,res) {
    var projectdata = req.body;
    var uid = req.params.projectId;

    if(!uid || !projectdata.projectName || !projectdata.projectStartDate || !projectdata.projectEndDate){
        res.status(HttpStatus.BAD_REQUEST).send({msg: GlobalMessages.CONST_MSG.fillAllFields, status: HttpStatus.BAD_REQUEST});
    } else{
        var conditions = {
            _id : uid
        } 
        var fields = {
            projectName: projectdata.projectName,
            projectDetails: projectdata.projectDetails,
            projectStartDate: projectdata.projectStartDate,
            projectEndDate: projectdata.projectEndDate,
            projectCreatedBy: projectdata.projectCreatedBy
            // ,
            // projectCreatedByName :  projectdata.projectCreatedByName
        }

        Project.update(conditions,{$set: fields}, function (err, result) {
            if (err) {
                res.status(HttpStatus.NOT_FOUND).send({msg: err.message, status: HttpStatus.NOT_FOUND});
            } else {
                res.status(HttpStatus.OK).send({msg: GlobalMessages.CONST_MSG.updateProjectSuccess, status: HttpStatus.OK, result: result});
            }
        });
    }
};

var assignProjectToTeam = function (req, res) {
    
    var projectdata = req.body;
    var uid = projectdata.uid;
    

    if(!uid || !projectdata.teamId){
        res.status(HttpStatus.BAD_REQUEST).send({msg:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.BAD_REQUEST});
    } else{

        Team.findOne({_id : projectdata.teamId} , {}, function (error, data){
            
            if (error) {
                res.status(HttpStatus.NOT_FOUND).send({msg:'Team Does not Exists',status:HttpStatus.NOT_FOUND});
            } else {
                
                var fields = {
                  $set: {
                            'isManagerAssigned': true,
                            'assigneeManager': [{
                                'managerName' : data.teamManager,
                                'managerId' : data.teamManagerId 
                            }],

                            'isTeamAssigneed' : true,
                            'assigneeTeam' : [{
                                'teamName' : data.teamName,
                                'teamId' : data.teamId
                            }],
                            
                        }
                };
                console.log('fields'+fields.$set);

                Project.update({ _id : uid},fields, function (err, result) {
                    if (err) {
                        res.status(HttpStatus.NOT_FOUND).send({msg:err.message,status:HttpStatus.NOT_FOUND});
                    } else {
                        res.status(HttpStatus.OK).json({msg:GlobalMessages.CONST_MSG.projectAssigedToTeamManager,status:HttpStatus.OK,result:result});
                    }
                });

            }

        });

    }
};

var projectsSearchByDate = function( req, res){
    var projectdata = req.body;
    if(projectdata.startDate || projectdata.endDate){
    var conditions = {
        $and: [
                {isDeleted: false},
                { $or : [
                            {projectStartDate : {"$gte":projectdata.startDate}},
                            {projectEndDate :{"$lte" :projectdata.endDate}}
                        ]
                }
            ]   
    };

    var skipVal = (Constant.pagination.itemPerPage * parseInt(req.params.page)) - Constant.pagination.itemPerPage;

    var fields = {};
        Project.find(conditions,fields)
        .skip(skipVal)
        .limit(Constant.pagination.itemPerPage)
        .populate('projectCreatedBy',{firstName:1,lastName:1})
        .exec(function (err, result) {
            if (err) {
                res.status(HttpStatus.NOT_FOUND).send({err: err.message, status: HttpStatus.NOT_FOUND});
            } else {
                if(result){
                    res.status(HttpStatus.OK).send({result: result, status: HttpStatus.OK,totalRecords :result.length });
                }
                else{
                    res.status(HttpStatus.OK).send({result : [],msg: GlobalMessages.CONST_MSG.emptyData, status: HttpStatus.OK});
                }
            }
        });
    }
    else{
        res.status(HttpStatus.NOT_FOUND).send({msg: 'Sorry opp', status: HttpStatus.NOT_FOUND});
    }
}

var assignProjectToDevelopers = function (req, res) {
    
    var developerdata = req.body;
    var projectid = developerdata.projectid;
    

    if(!projectid || !developerdata.userid){
        res.status(HttpStatus.BAD_REQUEST).send({msg:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.BAD_REQUEST});
    } else{

        User.findOne({_id : developerdata.userid} , {}, function (error, data){
            
            if (error) {
                res.status(HttpStatus.NOT_FOUND).send({msg:'Team Does not Exists',status:HttpStatus.NOT_FOUND});
            } else {
                
                var fields = {
                  $set: {
                            'isDveloperAssign': true,
                            'assignDeveloper': [{
                                'developerName' : data.firstName + " "+data.lastName,
                                'developerId' : data._id 
                            }],
                            
                        }
                };
                console.log('fields'+fields.$set);

                Project.update({ _id : projectid},fields, function (err, result) {
                    if (err) {
                        res.status(HttpStatus.NOT_FOUND).send({msg:err.message,status:HttpStatus.NOT_FOUND});
                    } else {
                        res.status(HttpStatus.OK).json({msg:GlobalMessages.CONST_MSG.projectAssigedToDevelopers,status:HttpStatus.OK,result:result});
                    }
                });

            }

        });

    }
};

//  functions
exports.createProject = createProject;
exports.viewProjects = viewProjects;
exports.deleteProject = deleteProject;
exports.getProjectById = getProjectById;
exports.updateProject = updateProject;


exports.assignProjectToTeam = assignProjectToTeam;
exports.assignProjectToDevelopers = assignProjectToDevelopers;
exports.projectsSearchByDate = projectsSearchByDate;