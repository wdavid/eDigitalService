const express = require('express');
const router = express.Router();

const postController = require('../controllers/post.controller');

router.get('/', postController.findAll);
router.post('/', postController.create);
router.get('/:id', postController.findOneById);
router.delete('/:id', postController.deleteById);

router.get('/daily/:userId', postController.getDailyConsumption);
router.get('/weekly/:userId', postController.getWeeklyConsumption);
router.get('/monthly/:userId', postController.getMonthlyConsumption);


module.exports = router;

