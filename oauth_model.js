

var model = module.exports;
var db = require('./db_model.js');
var http = require("http");
var C = require('./config.js');


exports.mongoose = db.mongoose;
exports.models = db;
/*
 * Required
 */

model.getAccessToken = function (bearerToken, callback) {
	C.debug('getAccessToken');
	db.OAuthAccessToken.find({'access_token':bearerToken},function (err, result) {
  		C.debug(result)
  		callback(err, result.length ? result[0] : false);
	});

};

model.getClient = function (clientId, clientSecret, callback) {
	
	db.OAuthClient.find({'client_id':clientId, 'client_secret':clientSecret},function (err, result) {
		C.debug('GetClient: '+clientId+' '+clientSecret);
  		C.debug(result)
  		callback(err, result.length ? result[0] : false);
	});
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
//var authorizedClientIds = ['abc1', 'def2'];
model.grantTypeAllowed = function (clientId, grantType, callback) {
	C.debug('GRANT TYPE: '+grantType);
	if (grantType === 'password' || grantType === C.CUSTOM_GRANT_TYPE) {
		//return callback(false, authorizedClientIds.indexOf(clientId.toLowerCase()) >= 0);
		db.OAuthClient.find({'client_id':clientId, 'grant_type':grantType},function (err, result) {
	  		C.debug(result)
	  		callback(false, result.length > 0);
		});
	}
	
	else
		callback(false, true);
	
	
};

model.saveAccessToken = function (accessToken, clientId, userId, expires, callback) {
	
	var oaToken = new db.OAuthAccessToken({ 'access_token': accessToken ,
								'client_id': clientId,
								'user_id': userId,
								'expires': expires});
	oaToken.save(function (err, token) {
		C.debug('saveAccessToken '+err);
		callback(err);
	});

};

model.saveRefreshToken = function (refreshToken, clientId, userId, expires, callback) {
	
	var orToken = new db.OAuthRefreshToken({ 'refresh_token': refreshToken ,
								'client_id': clientId,
								'user_id': userId,
								'expires': expires});
	orToken.save(function (err, token) {
		C.debug('saveRefreshToken '+err);
		callback(err);
	});
	
};

/*
 * Required to support password grant type
 */
 
model.getUser = function (username, password, callback) {
	
	C.debug('Get User');
	handleCSAuthorizationRequest(username, password, callback);
};



/*
 * Allow to grant custom types (e.g. using social networks)
 */
model.extendedGrant = function(req, callback){
	C.debug('Extended Grant!');
	C.debug(req.oauth.grantType);
	C.debug(req.body);
	if(!req.body.username){
		callback("Need social log-in" ,false, null);
		return;
	}

	
	if(req.oauth.grantType === C.CUSTOM_GRANT_TYPE){
		console.log('grant ype custom');
		var getOptions = {
			port:80,
			host: C.CS.ADMIN_TOKEN_HOST,
			path: C.CS.ADMIN_TOKEN_PATH,
			method: 'GET'
		};
		var adminTokenRequest = http.request(getOptions, function(res) {
  			if(res.statusCode !== 200){
  				 callback("Unexpected error calling Cloudspokes" ,false, null);
  				 return;
  			}
  			var output = '';
  			res.on('data', function (chunk) {
	            output += chunk;
	        });
	        res.on('end', function() {
	  			C.debug(output);
	  			var adminToken = JSON.parse(output).response.access_token;
				var options = {
				  host: C.CS.HOST,
				  path: C.CS.MEMBER_INFO_FROM_SERVICE_METHOD+'?service='+req.body.service+'&service_username='+req.body.username,
				  method: 'GET',
				  port: 80,
				  headers: {"oauth_token" : adminToken,
							"Authorization" : "Token token=\""+C.CS.API_KEY+"\""}
				};

				// Create the HTTP POST.
				var request = http.request(options, function (response) {
					C.debug('CS status code:'+response.statusCode);

				  	var str = '';

					  // Create the listener for data being returned.
					response.on('data', function (chunk) {
					    str += chunk;
					});

					response.on('end', function (){
						if(response.statusCode !== 200){
							callback("Unexpected error calling Cloudspokes" ,false, null);
							return;
						}

						var responseData = null;
						try{
							responseData = JSON.parse(str);
						}
						catch(err){
							callback("Error loading user info: "+err, false, null);
							return;
						}
						if(responseData)
						{
							if(responseData.response.success === "true")
							{
								//node-oauth2-server needs an "id" field
								C.debug(responseData);
								responseData.response.id = responseData.response.username;
								//req.session.user_authorized = responseData.response;
								//done(null, responseData.response);
								saveUserData(responseData.response, req.body.service,callback);
								//callback(null ,true, responseData.response);
							}
							else
								callback(responseData.response.message,false, null);
						}
						else
							callback('Something went wrong. Retry.', false, null);
					});
				});

				request.on('error', function(err) {
					C.debug(err);
					callback('Something went wrong: '+err, false, null);
				});

				// Close the HTTP connection.
				request.end();
			});
		
		});
		adminTokenRequest.on('error', function(e) {
		  callback(e.message,false,false);
		});
		adminTokenRequest.end();
	}
	else
		callback(null,false,false);
};

/*
	Handles CS Authorization Request
*/
function handleCSAuthorizationRequest(username, password, callback){
	var body = 'membername='+username+'&password='+password;
	var options = {
	  host: C.CS.HOST,
	  path: C.CS.AUTHENTICATE_METHOD,
	  method: 'POST',
	  port: 80,
	  headers: {"content-type": "application/x-www-form-urlencoded", 
	            "content-length": body.length,
	        	"Authorization" : "Token token=\""+C.CS.API_KEY+"\""}
	};

	// Create the HTTP POST.
	var request = http.request(options, function (response) {
		C.debug('CS status code:'+response.statusCode);

	  	var str = '';

		  // Create the listener for data being returned.
		response.on('data', function (chunk) {
		    str += chunk;
		});

		response.on('end', function (){
			handleCSAuthorizationResponse(username, request, response, str, callback);
		});
	});

	request.on('error', function(err) {
		C.debug(err);
		callback(err, false);
	});
	// Write the parameters to the HTTP POST.
	request.write(body);

	// Close the HTTP connection.
	request.end();
}

/*
	Handles CS Authorization Response
*/
function handleCSAuthorizationResponse(username, request, response, data, callback){
	C.debug('Response:'+data);

	if(response.statusCode !== 200){
		callback("Unexpected error "+data, false);
		return;
	}

	var responseData = null;
	try{
		responseData = JSON.parse(data);
	}
	catch(err){
		callback("Error reading CS response: "+err, false);
		return;
	}
	if(responseData)
	{
		if(responseData.response.success === "true")
			//callback(null, {id:'123456789'});
			handleCSUserInfoRequest(responseData.response.access_token, username, callback);
		else
			callback(responseData.response.message, false);
	}
	else
		callback('Something went wrong. Retry.', false);
}

/*
	Handles CS User info request
*/
function handleCSUserInfoRequest(access_token, username, callback){
	

	var options = {
	  host: C.CS.HOST,
	  path: C.CS.MEMBER_INFO_METHOD+'/'+username,
	  method: 'GET',
	  port: 80,
	  headers: {"oauth_token" : access_token,
				"Authorization" : "Token token=\""+C.CS.API_KEY+"\""}
	};

	// Create the HTTP POST.
	var request = http.request(options, function (response) {
		C.debug('CS status code:'+response.statusCode);

	  	var str = '';

		  // Create the listener for data being returned.
		response.on('data', function (chunk) {
		    str += chunk;
		});

		response.on('end', function (){
			handleCSUserInfoResponse(request, response, str, callback);
		});
	});

	request.on('error', function(err) {
		C.debug(err);
		callback(err, false);
	});

	// Close the HTTP connection.
	request.end();
}

/*
	Handles CS User Info Response
*/
function handleCSUserInfoResponse(request, response, data, callback){
	C.debug('Response:'+data);

	if(response.statusCode !== 200){
		callback("Unexpected error :"+data, false);
		return;
	}

	var responseData = null;
	try{
		responseData = JSON.parse(data);
	}
	catch(err){
		callback("Error loading user info: "+err, false);
		return;
	}
	if(responseData)
	{
		if(responseData.response.success === "true")
		{
			//node-oauth2-server needs an "id" field
			responseData.response.id = responseData.response.username;
			saveUserData(responseData.response, 'cloudspokes',callback);
			//callback(null, responseData.response);
		}
		else
			callback(responseData.response.message, false);
	}
	else
		callback('Something went wrong. Retry.', false);
}


/*
	Saves main info of current user on DB
*/
function saveUserData(user,service, callback){

	//finds a user: if any, updates it, else creates it
	db.SocialUser.find({username: user.username, service: service},function(err, result){
		if(err){
			callback(err,false);
			return;
		}
		var u = null;
		if(result.length > 0){
			C.debug('Found user:');
			C.debug(result);
			u = result[0];
			u.id = user.id;
			u.name = user.name;
		}else{
			C.debug('No user found');
			u = new db.SocialUser({ 'id': user.id ,
								'username': user.username,
								'name': user.displayName,
								'service': service});
		}

		u.save(function (err, user) {
			C.debug('save social user '+err);
			if(user.service === 'cloudspokes'){
				callback(err,user);	
			}else{
				callback(err,true, user);	
			}
			
			
		});
	});
}