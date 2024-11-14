const express = require('express');
const router = express.Router();

const postRouter = require('./post.router');
const authRouter = require('./auth.router');

router.use('/post', postRouter);
router.use('/auth', authRouter);

module.exports = router;
