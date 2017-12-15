var mongoose = require('mongoose');
var Schema =  mongoose.Schema;
var Q = require('q');
var uniqueValidator = require('mongoose-unique-validator');
var Constant = require('../../config/constants');

var teamSchema = new Schema({

	teamTitle	  : { type: String , unique: true, required : true },
	teamDetails   : { type: String},
	teamManagerId :{type:mongoose.Schema.Types.ObjectId, ref: 'users'},
	teamLeadsId   : [{type:mongoose.Schema.Types.ObjectId, ref: 'users'}],
	teamMembersId :[{type:mongoose.Schema.Types.ObjectId, ref: 'users'}],
	isDeleted     : { type: Boolean ,default : false},
	createdAt     : { type: Date ,default : Date.now},
	updatedAt     : { type:Date, default: Date.now,select: false},
    projectIds  : [{type :mongoose.Schema.Types.ObjectId, ref: 'projects'}]
})

teamSchema.plugin(uniqueValidator);
teamSchema.plugin(uniqueValidator, {message: "team already exists"});
var teams = mongoose.model('teams', teamSchema);

module.exports = teams;
