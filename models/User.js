const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    phone: String,
    company_name: String,
    title: String,
    role: String,
    group: String,
    customerQuoter: Boolean,
    salesQuoter: Boolean,
    social: [{name: String, link: String}],
    cardSettings: Object
}); 

module.exports = mongoose.model('Users', userSchema);