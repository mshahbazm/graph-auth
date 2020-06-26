
const {sign, verify} = require('jsonwebtoken');
const { AuthenticationError,ApolloError } = require('apollo-server-express');
const AWS = require('aws-sdk');

AWS.config.update({accessKeyId: process.env.AWS_ACCESS , secretAccessKey: process.env.AWS_SECRET, region: 'us-west-2'});


const create = async (args, Collection) => {
  return new Collection({ ...args }).save();
};

const update = async (args, Collection, record = null) => {
  if(!record){
    record = await Collection.findById(args._id);
  }
  for (const key in args) {
    if (args.hasOwnProperty(key)) {
      record[key] = args[key];
    }
  }
  return await record.save();
};

const deleteRecord = async ({ _id }, { req }, Collection, requiredPermission) => {
  if (req.userId && req.userPermissions && req.userPermissions.includes(requiredPermission)) {
    const hasRecord = await Collection.count({ _id: _id });
    if (hasRecord > 0) {
      const deleteRes = await Collection.deleteOne({ _id: _id });
      if (deleteRes.deletedCount > 0) {
        return {
          success: true,
          message: 'Record deleted successfully.'
        };
      }
    }
  }
  throw new AuthenticationError('Unauthorized request');
};

const getAll = async ({ req }, Collection, requiredPermission = '') => {
  const hasPermission = requiredPermission.length > 0 ? req.userId && req.userPermissions && req.userPermissions.includes(requiredPermission) : true;
  if (hasPermission) {
    return Collection.find({});
  }
  throw new AuthenticationError('Unauthorized request');
};

const generateToken = async (user, res) => {
  const token = sign({
    userId: user._id,
    userPermissions: user.permissions
  }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '7d'
  });
  const tokenMid = Math.ceil(token.length / 2);

  const to = token.slice(0, tokenMid);
  const ken = token.slice(tokenMid);

  const cookiesOptions = require('./config/cookies')[(process.env.NODE_ENV).trim()];
  cookiesOptions.httpOnly = false;
  res.cookie('sid', ken, cookiesOptions);
  cookiesOptions.httpOnly = true;
  res.cookie('aid', to, cookiesOptions);
  return {
    token: token
  };
};

const createContext = ({ req, res }) => {
  if (req.cookies['aid'] && req.cookies['sid']) {
    try {
      const token = req.cookies['aid'] + req.cookies['sid'];
      if(token.length > 0) {
        const decryptedToken = verify(token, process.env.ACCESS_TOKEN_SECRET);
        if(decryptedToken && decryptedToken.userId) {
          req.userId = decryptedToken.userId;
          req.userPermissions = decryptedToken.userPermissions;
        }
      }
    } catch (e) {}
  }
  return {
    req,
    res,
  };
};

const streamToBuffer = async (fileStream ) => {
  return new Promise(async (resolve,reject) => {
    let chunks = [], fileBuffer;
    fileStream()
      .on('data', function (chunk) {
        chunks.push(chunk)
      })
      .on('end', function () {
        fileBuffer = Buffer.concat(chunks);
      })
      .on('error', function () {
        reject('unexpected error.')
      })
      .on("close", function () {
        resolve(fileBuffer);
      })
  });
};

const sendEmail = ({to = [], from = "Shahbaz from illustratious <shahbaz@illustratious.com>", replyTo = "Shahbaz from illustratious <shahbaz@illustratious.com>", subject="Email from Illustratious", html = undefined, text}) => {
  return new Promise(async (resolve, reject) => {
    const params = {
      Destination: { /* required */
        ToAddresses: to
      },
      Message: { /* required */
        Body: { /* required */
          Html: {
            Charset: "UTF-8",
            Data: html ? html : text
          },
          Text: {
            Charset: "UTF-8",
            Data: text
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: from, /* required */
      ReplyToAddresses: [replyTo],
    };
    const sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();
    sendPromise.then((data) => {
      resolve(data.MessageId);
    }).catch((err) => { reject(err)});
  });
};

const sendEmailConfirmation = async ({isNew = false, sendTo, resending=false, tempToken}) => {
  let emailBodyText = `Welcome to illustratious, <br/><br/>To verify your account please confirm your email by clicking the following link: <br/> <a href="${process.env.FRONTEND_URL}/verify?token=${tempToken}">Verify Me</a>`;
  let message = `To complete registration instructions has been sent at ${sendTo}, please check your inbox.`;
  if(!isNew){
    message = `To change email address, instructions has been sent at ${sendTo}, please check your inbox.`;
    emailBodyText = `To change your sign-in email for illustratious, please confirm your email by clicking the following link: <br/> <a href="${process.env.FRONTEND_URL}/verify?token=${tempToken}">Verify Me</a>`;
  }
  if(resending) {
    emailBodyText = `Please confirm your email address by clicking the following link: <br/> <a href="${process.env.FRONTEND_URL}/verify?token=${tempToken}">Verify Email Address</a>`;
  }
  try{
    await sendEmail({
      to: [sendTo],
      replyTo: "illustratious.com <no-reply@illustratious.com>",
      from: "illustratious.com <support@illustratious.com>",
      subject: "Confirm your new email address - illustratious",
      text: emailBodyText
    });
    return {
      success: true,
      message: message
    };
  } catch (e) {
    /*todo: notify admin about email failure*/
    throw new ApolloError(e);
  }
};


module.exports = {
  getAll,
  create,
  update,
  generateToken,
  createContext,
  deleteRecord,
  streamToBuffer,
  sendEmail,
  sendEmailConfirmation
};
