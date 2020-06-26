const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const UserSchema = new Schema({
  first_name: {
    type: String,
    maxlength: 90,
  },
  last_name: {
    type: String,
    maxlength: 90,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  verified: {
    type: Boolean,
    default: false,
    required: true
  },
  picture: String,
  phone: String,
  city: String,
  bio: String,
  country: String,
  permissions: [String],
  isSubscription: {
    type: Boolean,
    default: false,
    required: true
  },
  subscriptionStart: String,
  subscriptionEnd: String,
  subscriptionPlan: String,
  subscriptionId: String,
  cancelled_due_to_payment_failures: Boolean
}, { timestamps: true });

/*
* special permissions: admin, moderator*/

UserSchema.pre('save', function (next) {
  const user = this;
  if(!this.isModified('password')) next();
  bcrypt.hash(this.password, 10, function(err, hash) {
    user.password = hash;
    next();
  });
});

UserSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', UserSchema);
