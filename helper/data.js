var mongoose = require('mongoose');
var dataSchema = new mongoose.Schema({
    firstname: {type : String},
    lastname: {type : String},
    email: {type : String},
    dob: {type : String},
    gender: {type : String},
    course: {type : String},
    year: {type : String},
    category: {type : String},
    quota: {type : String},
    tokennumber: {type : String},
    aadharnumber: {type : String},
    phonenumber: {type : String},
    alternativephonenumber: {type : String},
    fathersname: {type : String},
    fathersphonenumber: {type : String},
    mothersname: {type : String},
    mothersphonenumber: {type : String},
    permanentaddress:{type : String},
    currentaddress:{type : String}
})

module.exports = mongoose.model('data',dataSchema);