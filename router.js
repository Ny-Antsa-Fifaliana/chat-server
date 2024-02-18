const express = require('express');
const router = express.Router();

// middleware
router.get('/',(req, res)=>{
    res.send('server running')
});

module.exports = router;
