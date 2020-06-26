const fs = require('fs');
module.exports = {
	username: process.env.DB_SSH_NAME,
	host: process.env.DB_HOST,
	privateKey: fs.readFileSync(process.cwd() + '/ssh_key.ppk'),
	port: "22",
	dstHost: "localhost",
	dstPort: "27017",
	localHost: "127.0.0.1",
	localPort: "27017",
	passphrase: process.env.DB_SSH_PASSPHRASE
};
