const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save();
        res.status(201).send(task);
    } catch (err) {
        res.status(400).send(err);
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }
    if (req.query.sortBy) {
        const sortArgs = req.query.sortBy.split(':');
        sort[sortArgs[0]] = sortArgs[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user.execPopulate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        res.send(req.user.tasks);
    } catch (err) {
        res.status(500).send();
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        if(!task) res.status(404).send();
        else res.send(task);
    } catch (err) {
        res.status(500).send();
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const updatableParams = ['description', 'completed'];
    const isValidUpdate = updates.every(param => updatableParams.includes(param));
    if (!isValidUpdate) {
        return res.status(400).send({ error: 'Updating property doesn\'t exist!' });
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            res.status(404).send();
        } else {
            updates.forEach(param => task[param] = req.body[param]);
            await task.save();
            res.send(task);
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task) res.status(404).send();
        else res.send(task);
    } catch (err) {
        res.status(500).send();
    }
})

module.exports = router;