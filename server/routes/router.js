const express = require('express');
const route = express.Router()
const controller = require('../controller/controller');

const jwt = require('jsonwebtoken');

// API
route.post('/api/users', authenticationToken, controller.create);
route.get('/api/users', authenticationToken, controller.find);
route.put('/api/users/:id', authenticationToken, controller.update);
route.delete('/api/users/:id', authenticationToken, controller.delete);
route.post('/api/users/login', login);

module.exports = route

function authenticationToken(req, res, next) {
    console.log(next);
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token==null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err)=>{
        if(err) return res.sendStatus(403)
        next()
    })
}

function login(req, res) {
    const username = req.body.username
    const user= { name: username } 
    if(username=='admin'){
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
        res.send({ accessToken: accessToken}); 
    }else{
        return res.status(400).send({ message : "Username Not Found"})
    }
}
