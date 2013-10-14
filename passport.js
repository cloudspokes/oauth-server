//passport strategies
var passport = require('passport');
var C = require('./config.js');
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GithubStrategy = require('passport-github').Strategy;
var Url = require('url');

exports.passport = passport;

passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function(serializedUser, done) {
  try{
  	done(null, JSON.parse(serializedUser));
  }catch(e){
    done(e, null);
  };
});


passport.use(new TwitterStrategy({
    consumerKey: C.PASSPORT.Twitter.ConsumerKey,
    consumerSecret: C.PASSPORT.Twitter.ConsumerSecret,
    callbackURL: C.PASSPORT.Twitter.CallbackUrl
  },
  function(token, tokenSecret, profile, done) {
  	C.debug('>>> SEARCHING FOR TWITTER USER ON CLOUDSPOKES');
		C.debug('Twitter profile');
		C.debug(profile);
		done(null, {id: profile.id, 
					username: profile.username,
					service: 'twitter',
					displayName: profile.displayName});
		
}));

passport.use(new FacebookStrategy({
    clientID: C.PASSPORT.Facebook.ConsumerKey,
    clientSecret: C.PASSPORT.Facebook.ConsumerSecret,
    callbackURL: C.PASSPORT.Facebook.CallbackUrl
  },
  function(token, tokenSecret, profile, done) {
  	C.debug('>>> SEARCHING FOR FACEBOOK USER ON CLOUDSPOKES');
		C.debug('Facebook profile');
		C.debug(profile);
		done(null, {id: profile.id, 
					username: profile.username,
					service: 'facebook',
					displayName: profile.displayName});
		
}));

passport.use(new GoogleStrategy({
    clientID: C.PASSPORT.Google.ClientKey,
  	clientSecret: C.PASSPORT.Google.ClientSecret,
  	callbackURL: C.PASSPORT.Google.CallbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    	C.debug('>>> SEARCHING FOR GOOGLE USER ON CLOUDSPOKES');
		C.debug('Google profile');
		C.debug(profile);
		done(null, {id: profile.id, 
					username: profile.id,
					service: 'google_oauth2',
					displayName: profile.displayName});
  }
  ));

passport.use(new GithubStrategy({
    clientID: C.PASSPORT.GitHub.ClientId,
  	clientSecret: C.PASSPORT.GitHub.ClientSecret,
  	callbackURL: C.PASSPORT.GitHub.CallbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    	C.debug('>>> SEARCHING FOR GITHUB USER ON CLOUDSPOKES');
		C.debug('GitHub profile');
		C.debug(profile);
		done(null, {id: profile.id, 
					username: profile.username,
					service: 'github',
					displayName: profile.displayName});
  }
  ));


exports.twitterAuthRequest = function(req,res){
								passport.authenticate('twitter')(req,res);
							};

exports.twitterAuthCallback = function(req,res){
									passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/' })(req,res);
								};

exports.facebookAuthRequest = function(req,res){
								passport.authenticate('facebook')(req,res);
							};

exports.facebookAuthCallback = function(req,res){
									passport.authenticate('facebook', { successRedirect: '/',
                                     failureRedirect: '/' })(req,res);
								};

exports.googleAuthRequest = function(req,res){
								passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile'] })(req,res);
							};

exports.googleAuthCallback = function(req,res){
									passport.authenticate('google', { successRedirect: '/',
                                     failureRedirect: '/' })(req,res);
								};

exports.githubAuthRequest = function(req,res){
								passport.authenticate('github')(req,res);
							};

exports.githubAuthCallback = function(req,res){
									passport.authenticate('github', { successRedirect: '/',
                                     failureRedirect: '/' })(req,res);
								};