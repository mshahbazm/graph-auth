const bcrypt = require('bcryptjs');
const { AuthenticationError, ApolloError } = require('apollo-server-express');

const User = require('./models/User');
const Temp = require('./models/Temp');


const { create, update, generateToken, getAll, sendEmail, sendEmailConfirmation } = require('./controller');

module.exports = {

  Query: {
    me: async (_, __, { req }) => {
      if (req.userId) {
        return await User.findById(req.userId);
      }
      throw new AuthenticationError('Unauthorized request');
    },
    user: async (_, args, { req }) => {
      return await User.findById(args._id);
    },
    temp: async (_, args, {req}) => {
      console.log(args._id);
      const temp = await Temp.findById(args._id);
      console.log(temp);
      return temp;
    },
    users: async (_, args, ctx) => {
      return await getAll(ctx, User, 'view_users');
    }
  },

  Mutation: {
    adminOnBoarding: async (_, args, ctx) => {
      const userCount = await User.countDocuments({});
      if(userCount <= 0){
        args.permissions = ["add_users", "delete_users", "add_items", "delete_items", "moderator"];
        const theAdmin = await create(args, User);
        const tempToken = await new Temp({
          email: theAdmin.email,
          user: theAdmin._id,
          label: 'email-verify'
        }).save();
        sendEmailConfirmation({isNew: true, sendTo: theAdmin.email, tempToken: tempToken._id});
        return theAdmin;
      }
      throw new AuthenticationError('Unauthorized request');
    },
    user: async (_, args, {req}) => {
      if(args._id && (req.userId === args._id || req.userPermissions.includes('add_users'))) {
        return await update(args, User);
      }
      throw new AuthenticationError('Unauthorized request');
    },
    register: async (_, args, {req,res}) => {
      const user = await create(args, User);
      const tempToken = await new Temp({
        email: user.email,
        user: req.userId,
        label: 'email-verify'
      }).save();
      await sendEmailConfirmation({isNew: true, sendTo: user.email, tempToken: tempToken._id});
      return await generateToken(user, res);
    },
    login: async (_, { email, password }, { res }) => {
      /*todo: check if user's subscription has expired; update user if needed*/
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('Invalid username or password.');
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new AuthenticationError('Invalid username or password.');
      }
      return await generateToken(user, res);
    },
    updatePassword: async (_, { password, new_password }, { req, res }) => {
      if(req.userId) {
        const user = await User.findById(req.userId);
        if (!user) throw new AuthenticationError('Unauthorized request');
        if(!!user.password) {
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            throw new AuthenticationError('Invalid password.');
          }
        }
        await update({password: new_password}, User, user);
        return {
          success: true,
          message: "Password updated successfully"
        }
      }
      throw new AuthenticationError('Unauthorized request');
    },
    setPassword: async (_, { password, token }, { req, res }) => {
      if(token) {
        const tempToken = await Temp.findById(token);
        if (!tempToken) throw new AuthenticationError('Unauthorized request');
        const user = await User.findOne({ email: tempToken.email });
        if(user && tempToken.label === 'password-new'){
          await update({password: password}, User, user);
          return await generateToken(user, res);
        }
      }
      throw new AuthenticationError('Unauthorized request');
    },
    updateEmail: async (_, { password=null, email=null, token=null }, { req, res }) => {
      if(req.userId && !token) {
        const user = await User.findById(req.userId);
        if (!user) throw new AuthenticationError('Unauthorized request');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          throw new AuthenticationError('Invalid password.');
        }
        const count = await User.countDocuments({email: email});
        if(!count && email !== user.email) {
          const tempToken = await new Temp({
            email: email,
            user: req.userId,
            label: 'email-new'
          }).save();
          return await sendEmailConfirmation({user: user, sendTo: email, tempToken: tempToken._id});
        } else{
          let message = `${email} is already set as your email.`;
          if(count) {
            message = `${email} is already associated with another account.`
          }
          return {
            success: false,
            message: message
          };
        }
      }
      else if(token){
        const tempToken = await Temp.findById(token);
        if(tempToken && tempToken.email && (tempToken.label === 'email-new' || tempToken.label === 'email-verify')) {
          const newEmail = tempToken['email'];
          const user = await User.findById(tempToken.user);
          if(user.email !== newEmail || !user.verify){
            if (!user) throw new AuthenticationError('Unauthorized request');
            try{
              const newUser = await update({email: newEmail, verified:true}, User, user);
              let mailMessage = `Your email address has been changed to ${newUser.email}`
              if(tempToken === 'email-verify'){
                mailMessage = `Your email "${newUser.email}" has been verified.`
              }
              Temp.deleteOne({ _id: tempToken._id });
              return {
                success: true,
                message: mailMessage
              };
            } catch (e) {
              throw new ApolloError(e);
            }
          } else {
            return {
              success: false,
              message: `Your email address has already been updated and verified.`
            };
          }
        } else{
          return {
            success: false,
            message: `Invalid/expired verification link.`
          };
        }
      }
      throw new AuthenticationError('Unauthorized request');
    },
    verifyEmail: async (_, __, { req, res }) => {
      if(req.userId) {
        const user = await User.findById(req.userId);
        if (!user) throw new AuthenticationError('Unauthorized request');
        if(!user.verified) {
          const tempToken = await new Temp({
            email: user.email,
            user: req.userId,
            label: 'email-verify'
          }).save();
          return await sendEmailConfirmation({tempToken: tempToken._id, sendTo: user.email, resending: true});
        } else{
          return {
            success: false,
            message: `Your email ${user.email} has already been verified.`
          };
        }
      }
      throw new AuthenticationError('Unauthorized request');
    }
  }
};
