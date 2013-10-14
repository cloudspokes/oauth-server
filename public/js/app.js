var clientId = 'ID1234567890';
var clientSecret = 'SECRET1234567890';

angular.module('cs2925', ['ui.bootstrap']);

function OAuthController($scope,$http) {

    $scope.access_token = null;
    $scope.refresh_token = null;
    $scope.errorMsg = null;
    $scope.loading = false;
    $scope.user = null;

    /*
	 * This is used to test if a user has just logged in a social site
     */
    $scope.init = function(){
    	console.log('init()');
    	$scope.loading = true;
    	$http.post('/loggingStatus',{},{headers: {}}).
		  success(function(loggingStatus, status, headers, config) {
		  	$scope.errorMsg = null;
		  	console.log('success '+status);
		    console.log(loggingStatus);
		    $scope.loading = false;
		    if(loggingStatus.processing === true && loggingStatus.user.id) 
		    	$scope.authorize('http://cloudspokes.social.grant',loggingStatus.user);
		    else if(loggingStatus.accessToken){
		    	//user is already logged
		    	$scope.access_token = loggingStatus.accessToken;
		    	$scope.refresh_token = loggingStatus.refreshToken;
		    	$scope.user = loggingStatus.user;
		    } 
		  }).
		  error(function(data, status, headers, config) {
		  	console.log('error '+status);
		    console.log(data);
		    $scope.access_token = null;
    		$scope.refresh_token = null;
    		$scope.loading = false;
    		$scope.errorMsg = data;
		  });
    }

    $scope.authorize = function(grantType,socialUser){
    	console.log('Authorizing against CS APIs...');
    	//base64 encoding
    	var authBasic = window.btoa(clientId+':'+clientSecret);
    	console.log('Basic '+authBasic);

    	var data = (!grantType || !socialUser)?'grant_type=password&username='+$scope.username+'&password='+$scope.password :
					'grant_type=http://cloudspokes.social.grant&username='+socialUser.username+'&service='+socialUser.service;

    	$scope.loading = true;
    	$http.post('/oauth/token',
    				data,
    				{headers: {'Content-Type': 'application/x-www-form-urlencoded',
    							'Authorization': 'Basic '+authBasic}}        		
    	).
		  success(function(data, status, headers, config) {
		  	$scope.errorMsg = null;
		  	console.log('success '+status);
		    console.log(data);
		    $scope.loading = false;
		    $scope.access_token = data.access_token;
		    $scope.refresh_token = data.refresh_token;
		    $scope.login();
		  }).
		  error(function(data, status, headers, config) {
		  	console.log('error '+status);
		    console.log(data);
		    $scope.loading = false;
		    $scope.access_token = null;
    		$scope.refresh_token = null;
    		$scope.errorMsg = data;
		  });


		
	}
	$scope.copyTestCredentials = function(){
		$scope.username = 'oauthtest1';
		$scope.password = '97NnvXTmij';
	}

	$scope.callAuthorized = function(){
		try
		{
			$http.get('/secret',
	    				{headers: { 'Authorization': 'Bearer '+$scope.access_token}}        		
	    	).
			  success(function(data, status, headers, config) {
			  	$scope.errorMsg = null;
			  	console.log('success '+status);
			  	$scope.infoMsg = data;
			    console.log(data);
			  }).
			  error(function(data, status, headers, config) {
			  	console.log('error '+status);
			    console.log(data);
			    console.log(headers);
			    console.log(config);
			    $scope.errorMsg = data || 'Authorization failed';
			  });
		}catch(exc){
			console.log(exc);
			$scope.loading = false;
		}
	}

	/*
	Logs user on the web site
	*/
	$scope.login = function(){
		$scope.loading = true;
		
		$http.post('/login',{refreshToken: $scope.refresh_token}, {headers: { 'Authorization': 'Bearer '+$scope.access_token}}        		
    	).
		  success(function(data, status, headers, config) {
		  	$scope.errorMsg = null;
		  	console.log('success '+status);
		  	$scope.loading = false;
		  	$scope.user = data;
		    console.log(data);
		  }).
		  error(function(data, status, headers, config) {
		  	console.log('error '+status);
		    console.log(data);
		    console.log(headers);
		    console.log(config);
		    $scope.loading = false;
		    $scope.errorMsg = data || 'Authorization failed';
		  });
		
	}

	/*
	Log out user
	*/
	$scope.logout = function(){
		
		$scope.loading = true;
		$http.post('/logout',{}, {headers: { 'Authorization': 'Bearer '+$scope.access_token}}        		
    	).
		  success(function(data, status, headers, config) {
		  	$scope.errorMsg = null;
		  	console.log('success '+status);
		  	$scope.loading = false;
		  	$scope.user = null;
			$scope.access_token = null;
			$scope.refresh_token = null;
		  }).
		  error(function(data, status, headers, config) {
		  	console.log('error '+status);
		    console.log(data);
		    console.log(headers);
		    console.log(config);
		    $scope.loading = false;
		    $scope.errorMsg = data;
		  });
	}

	//first callout to get if a user has credentials
	$scope.init();
}