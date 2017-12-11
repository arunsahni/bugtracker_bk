
var Task = require('../models/tasks.js');
var User = require('../models/users.js');
var mongoose = require('mongoose');
var Promise = require("bluebird");
var jwt = require('jwt-simple');

var Constant = require('../../config/constants');
var HttpStatus = require('http-status-codes');
var GlobalMessages = require('../../config/constantMessages');
/*________________________________________________________________________
 * @Date:       15 Nov,2017
 * @Method :    createprojects
 * Created By:  kunvar singh
 * Modified On: -16 Nov,2017
 * @Purpose:    This function is used to add new project.
 _________________________________________________________________________
 */
//Kunvar singh --16th,Nov,2017

var createTasks = function (req, res) {
    var task = {};
    task = req.body;
    
    if(!task){
        res.send({msg: GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.BAD_REQUEST});
    }else {
        Task(task).save(function (err, result) {
            if (err) {
                res.send({err:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.BAD_REQUEST});
            } else {
                res.status(HttpStatus.OK).send({status:HttpStatus.OK,msg:GlobalMessages.CONST_MSG.addTaskSuccess})
            }
        });
    }
};

//Kunvar singh --16th,Nov,2017

var viewTasks = function (req, res) {
    console.log('hellloooo');
    var conditions = {
        isDeleted: false
    };
    var fields = {};
    var skipVal = (Constant.pagination.itemPerPage * parseInt(req.params.page)) - Constant.pagination.itemPerPage;

    Task.find(conditions, fields).count().exec(function (err, data) {
        if (err) {
            res.status(HttpStatus.NOT_FOUND).send({err: err.message , status: HttpStatus.NOT_FOUND});
        } else {
            if(data) {
              // var tasksList = new Array();
              // var taskData =  Task.find(conditions,fields).sort({ createdAt: -1 }).skip(skipVal).limit(Constant.pagination.itemPerPage);
              //  taskData.forEach(function(org){
              //       var newDate = User.find({"_id" : {"$in" : org.assignTo}}, {}, function(err, user){
              //           return user.firstName + " " + user.lastName;
              //       });
              //         tasksList.push(newDate);
              //   });
               Task.find(conditions,fields).sort({ createdAt: -1 }).skip(skipVal)
               .limit(Constant.pagination.itemPerPage)
               .populate('assignBy',{firstName:1,lastName:1})
               .populate('assignTo',{firstName:1,lastName:1})
               .exec(function (err, result) {
                    if (err) {
                        res.send(HttpStatus.BAD_REQUEST, {err:err.message,status:HttpStatus.BAD_REQUEST});
                    } else {
                         for(var i=0; i<result.length;i++){
                            switch(result[i].taskStatus){
                                case "created" : 
                                case "rejected" :
                                result[i].taskStatus = 0
                                break;
                                case "in-progress" : result[i].taskStatus = 20
                                break;
                                case "code-review" : result[i].taskStatus = 40
                                break;
                                // case "created" : result[i].taskStatus = 60
                                // break;
                                // case "created" : result[i].taskStatus = 80
                                // break;
                                case "resolved" : result[i].taskStatus = 100
                                break;
                                deault  : result[i].taskStatus = 0
                                break;
                            }

                        }

                        res.status(HttpStatus.OK).send({result:result, status :HttpStatus.OK,totalRecords:result.length});
                    }
                });
               // res.status(HttpStatus.OK).send({status: HttpStatus.OK, totalRecords: data, result: data}); 
               }
            else{
                res.send(HttpStatus.NOT_FOUND, {msg: GlobalMessages.CONST_MSG.emptyData,status: HttpStatus.NOT_FOUND, result : [], totalRecords :0});
            }
        }
    });

    // Task.find({isTaskDeleted: false}, {}, function (err, result) {
    //     if (err) {
    //         res.send(HttpStatus.BAD_REQUEST, {err:err.message,status:HttpStatus.BAD_REQUEST});
    //     } else {
    //         res.status(HttpStatus.OK).send({result:result, status :HttpStatus.OK,totalRecords:result.length});
    //     }
    // });
};

function getUserNameByID (userid){
    User.findOne({_id : userid},{},function(err, userData){

        return userData.firstName + " " + userData.lastName;
    });
     
}
//Kunvar singh --16th,Nov,2017

var deleteTask = function (req, res) {
    var fields = {
        isDeleted: true
    };
    var conditions = {
        _id: req.params.taskId
    };

    if(req.params.taskId){
        Task.update(conditions, {$set: fields}, function (err, result) {
            if (err) {
                res.send(HttpStatus.BAD_REQUEST, {err: err.message,status:HttpStatus.BAD_REQUEST});
            } else {
                res.status(HttpStatus.OK).send({status:HttpStatus.OK, msg:GlobalMessages.CONST_MSG.deleteTaskSuccess});
            }
        });
    }
    else{
        res.send({err:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.BAD_REQUEST});
    }
};

//Kunvar singh --16th,Nov,2017

var GetTaskById = function (req, res) {
    var fields = {
      $and: [
        {isDeleted: false},
        {_id: req.params.taskId}
      ]
    }
    if(req.params.taskId){
        Task.findOne(fields, {})
        .populate('assignBy',{firstName:1,lastName:1})
        .populate('assignTo',{firstName:1,lastName:1})
        .exec(function (err, result) {
            if (err) {
                res.send({status:HttpStatus.BAD_REQUEST, err:err.message,msg:GlobalMessages.CONST_MSG.fillAllFields});
            } else {
                if(result){
                            switch(result.taskStatus){
                                case "created" : 
                                case "rejected" :
                                result.taskStatus = 0
                                break;
                                case "in-progress" : result.taskStatus = 20
                                break;
                                case "code-review" : result.taskStatus = 40
                                break;
                                // case "created" : result[i].taskStatus = 60
                                // break;
                                // case "created" : result[i].taskStatus = 80
                                // break;
                                case "resolved" : result.taskStatus = 100
                                break;
                                deault  : result.taskStatus = 0
                                break;
                            }
                  res.status(HttpStatus.OK).send({result:result, status:HttpStatus.OK});    
                }
                else{
                    res.status(HttpStatus.OK).send({result:[], status:HttpStatus.OK,msg:GlobalMessages.CONST_MSG.emptyData});
                }
            }
        });
    }
    else{
        res.send({err:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.BAD_REQUEST});
    }
};

//Kunvar singh --16th,Nov,2017

var updateTask = function (req,res) {
    var task = req.body;
    var uid = req.params.taskId;
    console.log(uid);
    var fields = {
        $set: { 
                'taskTitle': task.taskTitle,
                'assignBy': task.assignBy,
                'assignTo': task.assignTo,
                'taskDetails': task.taskDetails,
                'taskGroup': task.taskGroup,
                'taskComment': task.taskComment,
                'taskImage': task.taskImage ? task.taskImage :Constant.imagePaths.defaultUserImage,
                'taskStatus': task.taskStatus,
            }
    }
    if(!uid || !task.taskTitle){
        res.status(HttpStatus.NOT_FOUND).send({message:GlobalMessages.CONST_MSG.fillAllFields,status:HttpStatus.NOT_FOUND});
    } else{
        Task.update({ _id : uid}, fields , function (err, result) {
            if (err) {
                res.send({msg:err.message,status:HttpStatus.NOT_FOUND});
            } else {
                res.status(HttpStatus.OK).send({msg:GlobalMessages.CONST_MSG.updateTaskSuccess, status:HttpStatus.OK,result:result});
            }
        })
    }
};

var getTasksByStatus = function (req, res){
    var tasksData = req.params;
    // var conditions = {
    //     isDeleted: false,
    //     accountType : { userData.type, '$options' : 'i'}
    // };
    var skipVal = (Constant.pagination.itemPerPage * parseInt(req.params.page)) - Constant.pagination.itemPerPage;
    if(tasksData.status){
         Task.find({isDeleted: false, taskStatus : {'$regex' : tasksData.status, '$options' : 'i'}}, {})
         .skip(skipVal)
         .limit(Constant.pagination.itemPerPage)
         .populate('assignBy',{firstName:1,lastName:1})
        .populate('assignTo',{firstName:1,lastName:1})
         .exec(function (err, result) {
            if (err) {
                res.send(HttpStatus.BAD_REQUEST, {err:err.message,status:HttpStatus.BAD_REQUEST});
            } else {
                res.status(HttpStatus.OK).send({result:result, status :HttpStatus.OK,totalRecords:result.length});
            }
        });
    }
    else{
        res.send(HttpStatus.NOT_FOUND, {msg:'Please Select Status',status:HttpStatus.NOT_FOUND});
    }
}

var getAllTaskStatus = function(req, res){
    var status = [
    {id : 1, taskStatus :'Created'},
    {id : 2, taskStatus :'In-progress'},
    {id : 3, taskStatus :'Code-review'},
    {id : 4, taskStatus :'Closed'},
    {id : 5, taskStatus :'Rejected'},
    {id : 6, taskStatus :'Resolved'},
    {id : 7, taskStatus :'Re-opened'}
    ];
    res.send(HttpStatus.OK, {msg:'Please Select Status',taskStatus : status, status:HttpStatus.OK, totalRecords :status.length});
}

var customeResponse = function(req, res){
    Task.find({ isDeleted   :false},{},function(err, doc){
       doc.forEach(function(doc1) {
       doc1.taskDetails = doc1.taskDetails.substr(0,50);
    })
    res.send(HttpStatus.OK, {result : doc, status:HttpStatus.OK});
})
}

//  functions
exports.createTasks = createTasks;
exports.viewTasks = viewTasks;
exports.deleteTask = deleteTask;
exports.GetTaskById = GetTaskById;
exports.updateTask = updateTask;
exports.getTasksByStatus = getTasksByStatus;
exports.getAllTaskStatus = getAllTaskStatus;
exports .customeResponse = customeResponse;