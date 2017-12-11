var express = require('express');
var superAdmin = require('../app/controllers/superAdminCtrl.js');
var router = express.Router();

/* GET listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

/* To get list of admins. */
// router.get('/viewTeams',superAdmin.viewTeams);

/* To create admin. */
router.post('/addUser', superAdmin.addUser);
router.post('/createTeam', superAdmin.createTeam);
router.get('/viewTeam/:page', superAdmin.viewTeam);
router.put('/updateTeam/:TeamId', superAdmin.updateTeam);
router.delete('/deleteTeam/:TeamId', superAdmin.deleteTeam);
router.post('/getTeamById/:TeamId', superAdmin.getTeamById);
router.get('/viewAllTeam', superAdmin.viewAllTeam);
router.get('/GetManagersList', superAdmin.GetManagersList);
router.get('/GetTeamLeadsList', superAdmin.GetTeamLeadsList);
router.post('/GetManagersAndLeadsListByTeamId', superAdmin.GetManagersAndLeadsListByTeamId);
router.put('/addTeamMembers/:TeamId', superAdmin.addTeamMembers);
/* To delete admin . */
// router.post('/deleteTeam', superAdmin.deleteTeam);

module.exports = router;
