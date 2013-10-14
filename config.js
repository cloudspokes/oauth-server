exports.PORT = process.env.PORT || 5000; // use heroku's dynamic port or 5000 if localhost
exports.HOST=process.env.HOST || 'localhost';
exports.DEBUG = true;
exports.ENVIRONMENT = (process.env.STATE==='production')?'production':'sandbox';
exports.CS = {
	API_KEY : process.env.CS_API_KEY,
	HOST : (exports.ENVIRONMENT==='sandbox')?'cs-api-kiddiepool.herokuapp.com':'cs-api-kiddiepool.herokuapp.com',
	AUTHENTICATE_METHOD : '/v1/accounts/authenticate',
	MEMBER_INFO_METHOD : '/v1/accounts',
	MEMBER_INFO_FROM_SERVICE_METHOD : '/v1/accounts/find_by_service',
	ADMIN_TOKEN_PATH : '/2/accounts/authenticate?membername=port2node&password=',
	ADMIN_TOKEN_HOST : 'kiddiepool-api-node.herokuapp.com',
	//ADMIN_TOKEN : '00DK000000AaVjP!AQYAQMj998xdxlzJqZhtGrgsb116aKy0OqRX7.2WVKNm.39ixpV85mOO21zKrTFDPZhAqeuE3qmYknMpWzK2.E3pf026OAv1',
}
//var currentHost = 'http://cs-2925.herokuapp.com';
var currentHost = 'http://localhost:5000';

exports.DB={
	url : ((process.env.STATE==='test') ? process.env.MONGODB_URL_TEST : process.env.MONGODB_URL_PROD),
}

exports.CUSTOM_GRANT_TYPE = 'http://cloudspokes.social.grant';

exports.PASSPORT = {
	Twitter : {
		ConsumerKey : "wntenQxc2a3ti9RaknuI6A",
		ConsumerSecret : "hzTH4aUlMaqAlX4Ueq7kz29ngAD60RBxXPZ92l5jHnw",
		CallbackUrl : currentHost+"/auth/twitter/callback"
	},
	Facebook : {
		ConsumerKey : "203045933210413",
		ConsumerSecret : "0da7bdc33b508e84d09c9d5eaeb188bd",
		CallbackUrl : currentHost+"/auth/facebook/callback"
	},
	Google :{
    	ClientSecret : "I44ZqOuSwTSwfnpZfEltTZ96",
    	ClientKey : "384716258992.apps.googleusercontent.com",
    	CallbackURL : currentHost+"/auth/google/callback"
	},
	GitHub :{
		ClientId : "c3dc12d550267991a10f",
		ClientSecret : "deb3e56cc22be591c3ad45deb4509062dc1b1351",
		CallbackURL : currentHost+"/auth/github/callback"
	}
}

exports.ConsoleDebug = false;
exports.debug = function(msg){
	if(exports.ConsoleDebug) console.log(msg);
}
