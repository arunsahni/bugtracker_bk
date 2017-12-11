var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');//FOR PASSWORD
var Q = require('q');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');//FOR PASSWORD
var Constant = require('../../config/constants');

SALT_WORK_FACTOR = 5;//FOR PASSWORD

var userSchema = new Schema({
    email               : { type : String, unique: true , required :true },
    firstName           : { type : String, required: true},
    lastName            : { type : String, /*required: true*/},
    phone               : { type : String, /*unique: true , required : true */},
    gender              : { type : String, enum : ['Male', 'Female', 'Others'], default :'Others'},
    address             : { type:String, default :''},
    avatar              : { type : String, default: ''},
    countryCode         : { type : String, /*required: true*/ },
    country             : { type : String},
    password            : { type : String},
    accountType         : { type: String,
                            enum: ['Project Manager','Team Manager', 'Team Lead', 'Tester', 'Developer','Admin','Super Admin'],
                            default:'Developer'
                          },
    isAssignToTeam : {type :Boolean , default : false},
    // accountType          : { type : String, enum : Constant.userRole.roles , default : 'Developer'},
    companyDetails      : {
                            companyId : { type: String }, 
                            name : { type:String},
                            address : { type:String},
                          },
    empId               : { type: String },                   
    teamId              : { teamId : {type:mongoose.Schema.Types.ObjectId, ref: 'teams'}},
    verifyEmail         : {
                            verificationStatus: {type: Boolean, default :false},
                            email: {type:String}
                          },
    verificationToken   : { type: String},
    resetPasswordToken  : { type: String},
    resetPasswordExpires: { type: Date},
	devices             : [{select: false}],
	active              : {default:false,type:Boolean},
	lastSeen            : { type:Number},
    verified            : { type: Boolean, default: false},
    isTrial             : { type:Boolean, default: true},
    accountExpiresOn    : { type : Date,default:+new Date() + 30*24*60*60*1000},
    isDeleted           : { type: Boolean, default: false},
    createdAt           : { type:Date, default: Date.now,select: false},
    updatedAt           : { type:Date, default: Date.now,select: false}
});

userSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(user.password, salt, null, function (err, hash) {
            user.password = hash;
            next();
        });
    });
});
userSchema.plugin(uniqueValidator);
userSchema.plugin(uniqueValidator, {message: "Email already exists"});
var users = mongoose.model('users', userSchema);

module.exports = users;

