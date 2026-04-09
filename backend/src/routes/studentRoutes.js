const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, className, age } = req.body;

    if (!name || !className) {
      return res.status(400).json({ message: 'Name and class are required' });
    }

    const student = await Student.create({ name, className, age });
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const { name, className, age } = req.body;

    if (!name || !className) {
      return res.status(400).json({ message: 'Name and class are required' });
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { name, className, age },
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Task.deleteMany({ student: id });

    res.json({ message: 'Student deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
