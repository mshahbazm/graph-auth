const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const MongoSchema = mongoose.Schema;

const schema = new MongoSchema({
  label: String, /*password-rest, email-verify, password-new*/
  email: String,
  user: {
    type: mongoose.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });


schema.plugin(uniqueValidator);
module.exports = mongoose.model('Temp', schema);
