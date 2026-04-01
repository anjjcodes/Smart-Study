const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, getStats, autoReduceTasks } = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', getStats);
router.get('/', getTasks);
router.post('/', createTask);
router.post('/auto-reduce', autoReduceTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
