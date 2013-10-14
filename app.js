var express = require('express');
var oauthserver = require('node-oauth2-server');
var C = require('./config.js');
var oauth_model = require('./oauth_model.js');
var MongoStore = require('connect-mongo')(express);

//passport strategies
var passportHandler = require('./passport');
exports.models = oauth_model.models;
exports.mongoose = oauth_model.mongoose;

var app = express();

app.configure(function() {
    app.use('/public',express.static(__dirname + '/public'));
    app.engine('html', require('ejs').renderFile);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'html');
    app.use(express.cookieParser());
    
    app.use(express.session({
      secret: 'cs 2925 secret',
      maxAge: new Date(Date.now() + 3600000),
      store: new MongoStore({ url: C.DB.url })
    }));
    app.use(passportHandler.passport.initialize());
    app.use(passportHandler.passport.session());

    var oauth = oauthserver({
        model: oauth_model, // See below for specification
        grants: ['password','refresh_token',C.CUSTOM_GRANT_TYPE],   //grants types (password or refresh_token)
        allow: ['/','/public',
                '/auth/twitter','/auth/twitter/callback',
                '/auth/facebook','/auth/facebook/callback',
                '/auth/google','/auth/google/callback',
                '/auth/github','/auth/github/callback',
                '/loggingStatus',
                '/logout'],   //allow some paths
        debug: true,
        passthroughErrors:true
    });
    app.use(express.bodyParser()); // REQUIRED
    app.use(oauth.handler());
    //app.use(oauth.errorHandler());

    app.use(express.logger());
    
});

app.get('/', function (req, res) {
        res.render('index.html',{});
    });
app.get('/secret', function (req, res) {
        res.send('You found the treasure!')
    });

//Twitter Passport
app.get('/auth/twitter', passportHandler.twitterAuthRequest);
app.get('/auth/twitter/callback', passportHandler.twitterAuthCallback);

//Facebook Passport
app.get('/auth/facebook', passportHandler.facebookAuthRequest);
app.get('/auth/facebook/callback', passportHandler.facebookAuthCallback);

//Goole Passport
app.get('/auth/google', passportHandler.googleAuthRequest);
app.get('/auth/google/callback', passportHandler.googleAuthCallback);

//Github Passport
app.get('/auth/github', passportHandler.githubAuthRequest);
app.get('/auth/github/callback', passportHandler.githubAuthCallback);

//tests if the user has just logged in a social site (to continue authentication automatically)
app.post('/loggingStatus', function (req,res){
        var result = {};
        //console.log(req.session);
        if(req.session && req.session.accessToken){
            //checkes if the accessToken is not expired

            oauth_model.models.OAuthAccessToken.find({access_token: req.session.accessToken}, function(err,tokens){
                
                if(err || tokens.length === 0) res.send({});
                else if(tokens[0].expires < new Date()) res.send({});
                else{
                    result = {
                        accessToken : req.session.accessToken, 
                        refreshToken : req.session.refreshToken,
                        user: req.session.user
                    };
                    console.log('test');
                    res.send(result);
                }
            });
        }
        else if(req.session && req.session.passport && req.session.passport.user){
            result = {processing:true,user:JSON.parse(req.session.passport.user)};
            //removes session temporary user info (only for social login)
            delete req.session.passport.user ;
            res.send(result);
        }
        else
            res.send({});
        //C.debug(req.session);
        
    });

/*
logins to the site (usign access token)
*/
app.post('/login', function (req,res){
    

    var user_id = req.oauth.token.user_id || '';
    
    oauth_model.models.SocialUser.find({username : user_id}, function(err,result){
        if(err){
            res.statusCode = 500;
            return res.send({error: "Unexpected error:"+err});
        }
        if(result.length === 0){
            res.statusCode = 500;
            return res.send({error: "User not found"});
        }
        //set acess token in session to make it reusable in subsequent web requests
        req.session.accessToken = req.oauth.token.access_token;
        req.session.refreshToken = req.body.refreshToken;
        req.session.user = result[0];
        //C.debug(req.session);
        res.send(result[0]);
    });
});

/*
logout the current user in the site 
*/
app.post('/logout', function (req,res){
    if(req.session)
    {
        delete req.session.accessToken;
        delete req.session.refreshToken;
        delete req.session.user;
    }
    res.send({result: "logged out"});
});



exports.server = app.listen(C.PORT, function() {
    C.debug("Listening on " + C.PORT);
    C.debug(process.env.STATE);
    //C.debug(config);
});


