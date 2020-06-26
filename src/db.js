module.exports = () => {
	const mongoose = require('mongoose');
	const mongoOpts = require('./config/mongo')[(process.env.NODE_ENV).trim()];
	const mongoURI = (process.env.NODE_ENV).trim() === 'production' ? process.env.DB_URI : process.env.DB_URI_dev;
	mongoose.connect(mongoURI, mongoOpts);

	mongoose.connection.on('error', (err)=>{
		/*todo: email admin regarding connection error*/
		console.log('handle mongo errored connections: ' + err);
	});

};








