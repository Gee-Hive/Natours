const express = require('express');

const router = express.Router();

const viewsController = require('./../controllers/viewsController');

//routes
//in here all the req to be used is get method unlike other routes that have posts, patch etc

router.get('/', viewsController.getOverview);

router.get('/tours/:slug', viewsController.getTour);

module.exports = router;
