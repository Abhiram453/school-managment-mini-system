const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Student = require('../models/Student');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find()
      .populate('student', 'name className')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, studentId, dueDate } = req.body;

    if (!title || !studentId) {
      return res.status(400).json({ message: 'Title and student are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const task = await Task.create({
      title,
      description,
      student: studentId,
      dueDate,
    });

    const hydratedTask = await task.populate('student', 'name className');
    res.status(201).json(hydratedTask);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const completed = typeof req.body.completed === 'boolean' ? req.body.completed : true;

    const task = await Task.findByIdAndUpdate(
      id,
      { completed },
      { new: true, runValidators: true },
    ).populate('student', 'name className');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
