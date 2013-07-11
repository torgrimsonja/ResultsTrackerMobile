//JavaScript Document

var REMOTE_PATH = 'http://killit.atsolinc.com/',
DATA_THEME = 'c',
c = 299792458, // m/s
user = {authed: false, username: null, passHash: null, verifiedId: false},
db, isPhoneGap = false; 

function onLoad(){
	console.log("onload fired, binding...");
	$(document).one("deviceready", function(e){onStartUp();});
	$(document).one("databaseready", function(e){checkId();});
	setTimeout(function(){
		if(!isPhoneGap){
			fixJquery();
			db = new resultsDatabase();
			db.initDb();
		}
	}, 50); 
}


function fixJquery(){
	$.mobile.loader.prototype.options.text = "Loading...";
	$.mobile.loader.prototype.options.textVisible = false;
	$.mobile.loader.prototype.options.theme = "a";
	$.mobile.loader.prototype.options.html = "";
	$.support.cors = true;
	$.mobile.allowCrossDomainPages = true; 
	$.mobile.defaultPageTransition = 'slide'; 
}


function onStartUp(){
	isPhoneGap = true; 
	try {
		//Global initialization functions here
		fixJquery();
		db = new resultsDatabase(); 
		db.initDb();
	}
	 catch(e) {
		console.log(e.message); 
	}
}
/**
 * Detects the mobile device being used.
 */
function detectDevice(){
	if(isPhoneGap) return device.model + ' ' + device.platform + ' ' + device.version; //ex: 'iPhone5,1 iOS 5.1.1', 'NexusOne Android 4.2'
	else return 'browser or something'; 
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
			if($('#courses').html().length == 0) listCourses();
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


