//JavaScript Document

var REMOTE_PATH = 'http://killit.atsolinc.com/',
DATA_THEME = 'c',
c = 299792458, // m/s
user = {authed: false, username: null, passHash: null, verifiedId: false},
db, isPhoneGap = false; 

var start = {
	onLoad : function() {
		console.log("onload fired, binding...");
		
		$(document).one('databaseready', checkId);
		
		if (navHas('Android')) {
			//on Android platform with PhoneGap
			//TODO: include Android version of cordova.js & SQLitePlugin.js	
			/*
			 * Note: yeah, I did a little more research, and they are different!
			 * This is a pretty good solution to the problem, though.
			 * Plus, no more waiting 5 seconds for browsers!
			 *
			 */
			 this.phoneGapInit();
		} else if (navHas('iPhone') || navHas('iPod') || navHas('iPad')) {
			//on iOS platform with PhoneGap
			//TODO: include iOS version of cordova.js & SQLitePlugin.js	
			this.phoneGapInit();
		} else {
			setTimeout(this.onStartUp, 50);	
		}
		
		function navHas(string) {
			return (navigator.userAgent.indexOf(string) > -1) ? true : false;	
		}
	},
	fixjQuery : function() {
		$.mobile.loader.prototype.options.text = "Loading...";
		$.mobile.loader.prototype.options.textVisible = false;
		$.mobile.loader.prototype.options.theme = "a";
		$.mobile.loader.prototype.options.html = "";
		$.support.cors = true;
		$.mobile.allowCrossDomainPages = true; 
		$.mobile.defaultPageTransition = 'slide'; 		
	},
	phoneGapInit : function() {
		isPhoneGap = true; 
		$(document).one('deviceready', onStartUp);
	},
	onStartUp : function() {
		try {
			//Global initialization functions here
			start.fixjQuery();
			db = new resultsDatabase(); 
			db.initDb();
			if(!user.authed) 
				$('#openLogin').click(); 
		}
		 catch(e) {
			console.log(e.message); 
		}		
	}
};

/**
 * Detects the mobile device being used.
 */
function detectDevice(){
	if(isPhoneGap) return device.model + ' ' + device.platform + ' ' + device.version; //ex: 'iPhone5,1 iOS 5.1.1', 'NexusOne Android 4.2'
	else return navigator.userAgent;
}

/**
 * Filters chars that screw up a query.
 * @param {string} string - The string to be filtered.  
 */
	function escapeSqlString(string){
		if(string != null){
			if(string.length>0){

				var result = string.replace(/"/g,'');
				result = result.replace(/'/g,'	');
				result = result.replace("<", ""); 
				result = result.replace(">", ""); 
				return result;
				
			}else{
				return '';	
			}
		}else{
			return '';	
		}	
		
	}
/**
 * Queries the database based on a predefined keyword. 
 * @param {function} callback - To be called with the results. 
 * 
 */ 
function genericAjax(callback, data, path){
	if(db.complete){ 
		db.localQuery(data, callback); 
	} else { setTimeout(function(){ db.localQuery(data, callback); }, 500); }
}

function checkId(){ 
	db.localQuery("uniqueId", function(data){
		if (data.device_id != undefined && data.device_id[0].prop_value > 0 ) {
			console.log("calling react true");
			reactToId(true); 
		} else {
			console.log("calling react false");
			reactToId(false);
		}
	});
}

function reactToId(exists){
	if (exists) db.localQuery("auth", function(data){
		if(data.username != undefined && data.passHash != undefined){
			$.mobile.changePage('index.html');
			$('#courses').html('');
			user.authed = true;
			user.username = data.username[0].prop_value;
			user.passHash = data.passHash[0].prop_value;
			listCourses();
		}
	});
	else {
		deviceRegister(function(data){ console.log(data); }); 
	}
}

function deviceRegister(callback){
	$.post(REMOTE_PATH + 'mobile_app/device_registration.php', {'deviceType' : detectDevice(), 'timestamp' : new Date().getTime()}, function(data) {
		data = JSON.parse(data);
		db.query("INSERT INTO `device` (`prop_name`, `prop_value`) VALUES ('device_id', "+data.deviceID+")", function(){ checkId();}); 
	}).error(function() { console.log('Device registration failed.'); });
}

function syncEverythingBecauseNathanIsAwesomeAndLikesLongFunctionNames(last_sync, changes, callback) {
	console.log('user.username: ' + JSON.stringify(user.username));
	console.log('user.passHash: ' + JSON.stringify(user.passHash));
	$.post(REMOTE_PATH + 'mobile_app/sync.php', {
		'username' 	: user.username,
		'password'	: user.passHash,
		'last_sync'	: last_sync,
		'changes'	: changes, 
		'timestamp'	: new Date().getTime() 
	}, function(successData) {
		successData = JSON.parse(unescape(successData));
		if (successData.credentialsCorrect) {
			callback(successData.changes);
		} else {
			console.log(":p credentials were wrong!!!");	
		}
	}).error(function(error) {
		console.log(':(');
	});
}



