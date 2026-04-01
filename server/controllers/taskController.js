const Task = require('../models/Task');
const StudyLog = require('../models/StudyLog');

// Helper: update study log for a user on a given date
const updateStudyLog = async (userId, dateStr, hoursChange, taskCountChange) => {
  await StudyLog.findOneAndUpdate(
    { userId, date: dateStr },
    {
      $inc: {
        totalHours: hoursChange,
        taskCount: taskCountChange
      }
    },
    { upsert: true, new: true }
  );
};

const getDateStr = (date) => new Date(date).toISOString().split('T')[0];

// GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { priority, completed, search, sort } = req.query;
    const query = { userId: req.user.id };

    if (priority && priority !== 'all') query.priority = priority;
    if (completed !== undefined) query.completed = completed === 'true';
    if (search) query.title = { $regex: search, $options: 'i' };

    let sortOption = { createdAt: -1 };
    if (sort === 'deadline') sortOption = { deadline: 1 };
    if (sort === 'priority') sortOption = { priority: -1 };
    if (sort === 'hours') sortOption = { studyHours: -1 };

    const tasks = await Task.find(query).sort(sortOption);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, subject, description, priority, deadline, studyHours, date } = req.body;

    if (!title || !subject || !deadline || !studyHours) {
      return res.status(400).json({ message: 'Title, subject, deadline, and study hours are required.' });
    }

    const taskDate = date ? new Date(date) : new Date();
    const task = await Task.create({
      userId: req.user.id,
      title,
      subject,
      description,
      priority: priority || 'medium',
      deadline: new Date(deadline),
      studyHours: parseFloat(studyHours),
      date: taskDate
    });

    // Update study log
    await updateStudyLog(req.user.id, getDateStr(taskDate), parseFloat(studyHours), 1);

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task.' });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const oldHours = task.studyHours;
    const oldDate = getDateStr(task.date);
    const { title, subject, description, priority, deadline, studyHours, date, completed } = req.body;

    // Update task fields
    if (title !== undefined) task.title = title;
    if (subject !== undefined) task.subject = subject;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = new Date(deadline);
    if (studyHours !== undefined) task.studyHours = parseFloat(studyHours);
    if (date !== undefined) task.date = new Date(date);
    if (completed !== undefined) task.completed = completed;

    await task.save();

    // Update study log: remove old hours, add new hours
    const newHours = task.studyHours;
    const newDate = getDateStr(task.date);

    if (oldDate === newDate) {
      await updateStudyLog(req.user.id, oldDate, newHours - oldHours, 0);
    } else {
      await updateStudyLog(req.user.id, oldDate, -oldHours, -1);
      await updateStudyLog(req.user.id, newDate, newHours, 1);
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task.' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const dateStr = getDateStr(task.date);
    await Task.deleteOne({ _id: task._id });

    // Update study log
    await updateStudyLog(req.user.id, dateStr, -task.studyHours, -1);

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
};

// GET /api/tasks/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [totalTasks, completedTasks, todayLog, allTasks] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, completed: true }),
      StudyLog.findOne({ userId, date: today }),
      Task.find({ userId }).select('studyHours deadline priority completed date').lean()
    ]);

    // Upcoming deadlines (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingCount = allTasks.filter(t => !t.completed && new Date(t.deadline) <= nextWeek).length;

    // 7-day study log
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7.push(d.toISOString().split('T')[0]);
    }
    const weekLogs = await StudyLog.find({ userId, date: { $in: last7 } }).lean();
    const logMap = {};
    weekLogs.forEach(l => { logMap[l.date] = l; });
    const weeklyData = last7.map(date => ({
      date,
      hours: logMap[date]?.totalHours || 0,
      tasks: logMap[date]?.taskCount || 0
    }));

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      todayHours: todayLog?.totalHours || 0,
      todayTasks: todayLog?.taskCount || 0,
      upcomingDeadlines: upcomingCount,
      weeklyData
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
};

// POST /api/tasks/auto-reduce
const autoReduceTasks = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await Task.find({ userId: req.user.id, completed: false });

    let tasksUpdated = 0;
    for (const t of tasks) {
      const oldHours = t.studyHours;
      // Reduce by 20%, round to nearest 0.5, minimum 0.5
      let newHours = Math.max(0.5, Math.floor(oldHours * 0.8 * 2) / 2);
      
      if (newHours < oldHours) {
        const change = newHours - oldHours;
        t.studyHours = newHours;
        await t.save();
        
        const dateStr = t.date ? t.date.toISOString().split('T')[0] : today;
        await updateStudyLog(req.user.id, dateStr, change, 0);
        tasksUpdated++;
      }
    }

    res.json({ message: `Reduced workload for ${tasksUpdated} pending tasks.` });
  } catch (error) {
    console.error('Auto-reduce error:', error);
    res.status(500).json({ message: 'Failed to auto-reduce workload.' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getStats, autoReduceTasks };
