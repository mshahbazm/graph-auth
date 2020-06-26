const production = {
	/*signed: true,*/
	domain: '.illustratious.com',
	maxAge: 7 * 24 * 60 * 60 * 1000
};

const development = {
	/*signed: true,*/
	maxAge: 7 * 24 * 60 * 60 * 1000
};

module.exports = {production, development};
