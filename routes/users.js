	var express = require('express');
	var user = require('../app/controllers/userCtrl.js');
	var project = require('../app/controllers/projectCtrl.js');
	var task = require('../app/controllers/taskCtrl.js');
	var router = express.Router();

	/* GET users listing. */
	router.get('/', function(req, res, next) {
	  res.send('Users Api resource');
	});

	/* To Delete User. */
	router.post('/delete', user.deleteUser);

	/* To updateProfile of User. */
	router.post('/updateProfile', user.updateProfile);

	/* To change password. */
	router.post('/changePassword', user.changePassword);

	/* To search user. */
	router.get('/search', user.searchUser);

	/* To List User. */
	router.get('/getFriends', user.friendList);

	/* To Get User. */
	router.get('/userProfile', user.userProfile);

	/* To Update User Profile. */
	router.post('/updateAvatar', user.updateAvatar);


	/* To delete friend */
	router.post('/deleteFriend', user.deleteFriend);

	/* user deleted*/
	router.delete('/deleteUser', user.deleteUser);

	/* To get user info. */
	router.get('/getUserInfo', user.getUserInfo);
	router.post('/getAllUsers/:page', user.getAllUsers);
	router.get('/getUserRoles', user.getUserRoles);

	
	router.post('/addUser', user.addUser);
	router.put('/updateUserById/:userId', user.updateUserById);
	router.delete('/deleteUserById/:userId', user.deleteUserById);
	router.post('/getUserById/:userId', user.getUserById);

	router.get('/getUsers', user.getUsers);
	router.get('/getUsersByAccountType/:type/:page', user.getUsersByAccountType);
	router.get('/filterEmailByUserEmail/:email', user.filterEmailByUserEmail);

	/*Routes for Task  CRUD*/
	
	// router.get('/viewTasks/:page', task.viewTasks);
	// router.post('/createTasks', task.createTasks);
	// router.delete('/deleteTask', task.deleteTask);
	// router.post('/GetTaskById', task.GetTaskById);
	// router.put('/updateTask', task.updateTask);

	/*End Section */

	router.post('/assignProjectToTeam' , project.assignProjectToTeam);
	router.post('/assignProjectToDevelopers', project.assignProjectToDevelopers);

	module.exports = router;

