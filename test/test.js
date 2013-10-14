var expect = require('expect.js');
var fork = require("child_process").fork;
var http = require('http');
var request = require('request');
var models = null;

var child,
	HOST = 'http://localhost'
	PORT = 12345;
//this is a valid Cloudspokes user (on sandbox)
var CSUser = {
	username : "oauthtest1",
	password : "97NnvXTmij"
};

var SOCIAL_GRANT = 'http://cloudspokes.social.grant';

describe('Server Testing', function(){


	  before( function (done) {
	  	process.env.STATE = 'test';
	  	process.env.PORT = PORT;
	  	models = require('../db_model');
	  	this.timeout(5000);
	    child = fork('app.js', null, {});
	    //console.log('Child PID: '+child.pid);
	    
	    process.on("exit", function () {
		  child.kill("SIGKILL");
		});
		
		setTimeout(done,3000);
	  });

	  after( function () {
	  	child.kill();
	    //models.mongoose.connection.db.dropDatabase();
	  });
    
    it('get root', function (done) {
    	var url = HOST+':' + PORT;
    	console.log('URL: '+url);
	    request.get(url, function(error, res, body) {
	      	expect(res.statusCode).to.equal(200);
	      	done();
	    });
	});

	it('get loggingStatus no logging in progress', function (done) {
		var url = HOST+':' + PORT+'/loggingStatus';
		console.log('URL: '+url);

		request.post(url,{},
		    function (error, response, body) {
		        expect(response.statusCode).to.equal(200);
	      		expect(response.body).to.equal('{}');
	      		done();
		    }
		);
		
	});



	describe('/secret endpoint...', function(){
		//creates an access token
		before(function(done){
		  	var obj = new models.OAuthAccessToken({
		    				access_token: 'xxx',
					    	client_id: 'xxx',
					    	expires: new Date('2100-12-12'),
					    	user_id: 'xxx'
		    			});
		   	obj.save(function(err,result){
		   		console.log('access token created '+result);
		   		done();
		   	});
		});

		//remove the created access token
			after(function(done){
				models.OAuthAccessToken.remove({access_token:'xxx'},function(){done();});
			});

		it('gets error when accessing protected resource', function (done) {
			var url = HOST+':' + PORT+'/secret';
			console.log('URL: '+url);

			request.post(url,
			    function (error, response, body) {
			        expect(response.statusCode).to.equal(500);
		      		done();
			    }
			);
			
		});

		it('gets 200 OK when accessing protected resource', function (done) {
			var url = HOST+':' + PORT+'/secret';
			console.log('URL: '+url);

			request.get({url:url,headers: { 'Authorization': 'Bearer xxx'}},
			    function (error, response, body) {
			        expect(response.statusCode).to.equal(200);
		      		done();
			    }
			);
			
		});
	});

	describe('/oauth/token endpoint with grant password...', function(){
		//creates an access token
		before(function(done){
		  	var obj1 = new models.OAuthClient({
		    				client_id : 'xxx',
							client_secret : 'xxx',
							grant_type: ["password"]
		    			});
		   	
		   	var obj2 = new models.OAuthClient({
		    				client_id : 'yyy',
							client_secret : 'yyy',
							grant_type: [SOCIAL_GRANT]
		    			});
		   	var obj3 = new models.OAuthAccessToken({
    				access_token: 'ACCESSTOKEN',
			    	client_id: 'xxx',
			    	expires: new Date('2100-12-12'),
			    	user_id: 'username_unique'
    			});
		   	var obj4 = new models.SocialUser({
    				id : 'username_unique',
					username : 'username_unique',
					service : 'cloudspokes',
					name: 'name'
    			});

		   	obj1.save(function(err,result){
		   		obj2.save(function(err,result){
		   			obj3.save(function(err,result){
			   			obj4.save(function(err,result){
			   				done();
			   			});
			   		});
			   	});
		   	});

		   
		});

		//remove the created entities
			after(function(done){
				models.OAuthAccessToken.remove({},function(){
					models.OAuthClient.remove({},function(){
						models.OAuthRefreshToken.remove({},function(){
							models.SocialUser.remove({},done);
						});
					});
				});
			});

		it('users has no grant access "password"', function (done) {
			this.timeout(20000);
			var url = HOST+':' + PORT+'/oauth/token';
			console.log('URL: '+url);
			var authBasic = new Buffer('yyy:yyy').toString('base64');
			request.post({url:url,headers: { 'Authorization': 'Basic '+authBasic},
							form: {'grant_type':'password','username':CSUser.username,'password':CSUser.username}},
			    function (error, response, body) {
			    	//password type not 
			        expect(response.statusCode).to.equal(500);
		      		done();
			    }
			);
			
		});

		it('users has grant access "password"', function (done) {
			this.timeout(20000);
			var url = HOST+':' + PORT+'/oauth/token';
			console.log('URL: '+url);
			var authBasic = new Buffer('xxx:xxx').toString('base64');
			request.post({url:url,headers: { 'Authorization': 'Basic '+authBasic},
							form: {'grant_type':'password','username':CSUser.username,'password':CSUser.password}},
			    function (error, response, body) {
			    	//password type not 
			        expect(response.statusCode).to.equal(200);
			        
			        models.SocialUser.find({username: CSUser.username},function(err,result){
			        	if(err) expect().fail(err);
			        	expect(result.length).to.above(0);

			        	done();
			        });
			    }
			);
			
		});

		it('transmits accesstoken to web session using the /login method', function (done) {
			this.timeout(20000);
			var url = HOST+':' + PORT+'/login';
			console.log('URL: '+url);
			request.post({url:url,jar: true, headers: { 'Authorization': 'Bearer ACCESSTOKEN'}},
			    function (error, response, body) {
			    	if(error) expect().fail(error);
			    	//password type not 
			        expect(response.statusCode).to.equal(200);
			        //console.log(body);
			        url = HOST+':' + PORT+'/loggingStatus';
					console.log('URL: '+url);

					request.post({url: url, jar:true},
					    function (error, response, body) {
					    	if(error) expect().fail(error);
					        expect(response.statusCode).to.equal(200);
				      		expect(response.body).not.to.equal('{}');
				      		done();
				    	}
				    );
					
			    }
			);
			
		});

	});
	
});

