const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');
const router = new express.Router();


router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (err) {
        res.status(400).send(err);
    }

    // user.save().then(() => {
    //     res.status(201).send(user);
    // }).catch(err => {
    //     res.status(400).send(err);
    // });
})

router.post('/users/login', async (req, res) => {
    try {
        console.log(req.body);
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (err) {
        res.status(400).send();
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token;
        })
        await req.user.save();
        res.send();
    } catch (err) {
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (err) {
        res.status(500).send();
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const updatableParams = ['name', 'email', 'password', 'age'];
    const isValidUpdate = updates.every(param => updatableParams.includes(param));
    if (!isValidUpdate) {
        return res.status(400).send({ error: 'Updating property doesn\'t exist!' });
    }

    try {
        updates.forEach(param => req.user[param] = req.body[param]);
        await req.user.save();
        res.send(req.user);
    } catch (err) {
        res.status(400).send(err);
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (err) {
        res.status(500).send();
    }
})

// Upload avatar images
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        /\.(jpg|jpeg|png)$/.test(file.originalname) ? cb(null, true) : cb(new Error('Please upload JPG, JPEG or PNG image'));
    }
});

router.post('/users/me/avatar', auth, upload.single('avatars'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(404).send({ error: error.message });
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        } else {
            res.set('Content-Type', 'image/png');
            res.send(user.avatar);
        }
    } catch (err) {
        res.status(404).send();
    }
})

module.exports = router;