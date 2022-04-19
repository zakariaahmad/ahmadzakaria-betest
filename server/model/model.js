const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    userName : {
        type : String,
        required: true,
        unique: true
    },
    accountNumber : Number,
    emailAddress : String,
    identityNumber : Number
})

const Userdb = mongoose.model('userdb', schema);

module.exports = Userdb;