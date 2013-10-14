var mongoose = require('mongoose');
var C = require('./config.js');

mongoose.connect(C.DB.url);
exports.mongoose = mongoose;

var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function callback () {
	  console.log('Mongoose connected!');
	});

var oauthAccessTokenSchema = mongoose.Schema({
    	access_token: String,
    	client_id: String,
    	expires: Date,
    	user_id: String
	},
	{ collection : 'OAuthAccessToken' });
exports.OAuthAccessToken = mongoose.model('OAuthAccessToken', oauthAccessTokenSchema);

var oauthRefreshTokenSchema = mongoose.Schema({
    	refresh_token: String,
    	client_id: String,
    	expires: Date,
    	user_id: String
	},
	{ collection : 'OAuthRefreshToken' });
exports.OAuthRefreshToken = mongoose.model('OAuthRefreshToken', oauthRefreshTokenSchema);

var oauthClientSchema = mongoose.Schema({
		client_id : String,
		client_secret : String,
		redirect_uri : String,
		grant_type: []
	},
	{ collection : 'OAuthClient' });
exports.OAuthClient = mongoose.model('OAuthClient', oauthClientSchema);


var userSchema = mongoose.Schema({
		id : String,
		username : String,
		service : String,
		name: String
	},
	{ collection : 'SocialUser' });
exports.SocialUser = mongoose.model('SocialUser', userSchema);

