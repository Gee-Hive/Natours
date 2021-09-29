const crypto = require('crypto');

const mongoose = require('mongoose');

const validator = require('validator');

const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A name is required'],
  },
  email: {
    type: String,
    required: [true, 'An email must be required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please input a valid Email '],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // to indicate the list of options for this schema type
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A password is required'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A password confirmation is required'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  changedPasswordAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
// to has or encrypt password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

//to check if the passed in password is the same with the database password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bycrypt.compare(candidatePassword, userPassword);
};

//to save password to database after it has been changed
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.changedPasswordAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// to check if password was changed after token was given. line of code didnt work <<changedPasswordAfter is not a function>>
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.changedPasswordAt) {
    const changedTimeStamp = parseInt(
      this.changedPasswordAt.getTime() / 1000,
      10
    );

    console.log(this.changedPasswordAt, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }

  return false;
};

//to send random password reset token to client
//check on stringify apiFeatures
//install built in crypto to perform this function to send random token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(12).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // to convert to milleseconds

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
