//JavaScript Document

var REMOTE_PATH = 'http://killit.atsolinc.com/',
DATA_THEME = 'c',
c = 299792458, // m/s
user = {authed: false, username: null, passHash: null, verifiedId: false, id: null},
db, isPhoneGap = false, loggedOutRecently = false, courseToLoad;

var start = {
	
	/**
	 * Binds the listener for database initialization, checks the OS and loads the proper SQLite plugins
	 * and calls the next startup function (either phoneGapInit for mobile or onStartUp for web)
	 */ 
	onLoad : function() {
		$(document).one('databaseready', checkId);
		$(document).on('resume',listCourses);
		 document.addEventListener("deviceready", function(){
			 start.onStartUp();
		 },true);
		$('#index-landing').on("pageshow", resetCourse);
		if (navHas('Android')) {
			console.log('isAndroid');
			$('#sqlPlugin').attr("src","js/external/SQLitePluginAndroid.js");
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
			$('#sqlPlugin').attr("src","js/external/SQLitePluginiOS.js");
			//on iOS platform with PhoneGap
			//TODO: include iOS version of cordova.js & SQLitePlugin.js	
			this.phoneGapInit();
		} else {
			setTimeout(this.onStartUp, 50);	
		}
		
		/**
		 * Checks the mobile OS as supplied by cordova
		 * @param {String} string - The OS name to search for
		 * @return {boolean} - true if the OS name is found, false otherwise
		 */
		
		
	},
	
	/**
	 * Applies global preferences to JQMobile.
	 */
	 
	fixjQuery : function() {
		$.mobile.loader.prototype.options.text = "Loading...";
		$.mobile.loader.prototype.options.textVisible = false;
		$.mobile.loader.prototype.options.theme = "a";
		$.mobile.loader.prototype.options.html = "";
		$.support.cors = true;
		$.mobile.allowCrossDomainPages = true; 
		$.mobile.defaultPageTransition = 'slide'; 		
	},
	
	/**
	 * Binds the deviceready event to the startup function.
	 */
	 
	phoneGapInit : function() {
		console.log('initing phonegap');
		isPhoneGap = true; 
	
	},
	
	/**
	 * Called when the proper device is loaded up and ready to roll. Calls the method
	 * setting JQMobile preferences and intializes the database. 
	 */ 
	 
	onStartUp : function() {
		console.log("device is ready");
		//Global initialization functions here
		start.fixjQuery();
		db = new resultsDatabase(); 
		db.initDb();	
	}
};

var reader = new FileReader();

reader.onloadend = function(evt) {
	if(evt.target.result == null) {
		console.log("file does not exist");
	} else {
		console.log("file does exist!");
	}
};

/**
 * Detects the mobile device being used.
 * @return {String} - On mobile, this will look like iPhone5,1 iOS 5.1.1, otherwise like Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.71 Safari/537.36 etc.
 */
 
function detectDevice(){
	return navigator.userAgent;
}

/**
 * Filters chars that screw up a query.
 * @param {String} string - The string to be filtered.  
 * @return {String} - The filtered string.
 */
 
function escapeSqlString(string){
	if(string != null){
		if(string.length>0){
			var result = string.replace(/"/g,'');
			result = result.replace(/'/g,'	');
			result = result.replace("<", ""); 
			result = result.replace(">", ""); 
			return result;
		} else return '';	
	} else return '';
}

/**
 * Checks if a unique device id is stored in the local database, and calls reactToId asynchronously with the result. 
 */

function checkId(){ 
	db.localQuery("uniqueId", function(data){
		if (data.device_id != undefined && data.device_id[0].prop_value > 0 ) {
			console.log("device verified");
			reactToId(true); 
		} else {
			console.log("device unverified");
			reactToId(false);
		}
	});
}

/**
 * Called by checkId, either checks if a username and passhash are stored in the local DB or calls deviceRegister to get a unique device ID from the master server and stores the result
 * @param {boolean} exists - true if a unique device id exists, false if one needs to be registered
 */

function reactToId(exists){
	if(exists) db.localQuery("auth", function(data){
		if(data.username != undefined && data.passHash != undefined){
			$.mobile.changePage('index.html');
			$('#courses').html('');
			user.authed = true;
			user.username = data.username[0].prop_value;
			user.passHash = data.passHash[0].prop_value;
			user.id = data.userId[0].prop_value; 
			listCourses();
			setInterval(function(){ sync(false); }, 300000); 
			if(new Date(buildTimeString()).getTime() -  new Date(data.last_sync[0].prop_value).getTime() > 300000) sync(true);
		} else {
			//$('#openLogin').click(); 
		}
	});
	else {
		deviceRegister(); 
	}
}

/**
 * Makes a post request to the master server with the useragent string and stores the unique device id returned.
 * Calls checkId if a device ID is successfully stored. 
 */ 

function deviceRegister(){
	$.post(REMOTE_PATH + 'mobile_app/device_registration.php', {'deviceType' : detectDevice(), 'timestamp' : new Date().getTime()}, function(data) {
		data = JSON.parse(data);
		db.query("INSERT INTO `device` (`prop_name`, `prop_value`) VALUES ('device_id', "+data.deviceID+")", function(){ checkId();}); 
	}).error(function() { console.log('Device registration failed.'); });
}

function deviceRegisterSync(callback){
	$.post(REMOTE_PATH + 'mobile_app/device_registration.php', {'deviceType' : detectDevice(), 'timestamp' : new Date().getTime()}, function(data) {
		data = JSON.parse(data);
		db.query("INSERT INTO `device` (`prop_name`, `prop_value`) VALUES ('device_id', "+data.deviceID+")", function(){ callback(true, data.deviceID); }); 
	}).error(function() { callback(false, null); });
}

/**
 * Gets all the changes in the database since the last sync. 
 * @author Nathan Eliason
 * @param {int} last_sync - The last time the local database was synced with the master server, in Unix time
 * @param {3-d array} changes - The changes in the local database since last_sync. The tablename of the change is an associative
 * key in the base array. Each change is an array inside of that associative array with associative keys with the column name and values with the value.
 * Example:
 *	array(
 *		['course_student_task_attempt'] =>  array (
 *												['id'] => 4,
 *												['course_student_id'] => 7,
 *												['task_id'] => 65,
 *												['value'] => 50,
 *												['timestamp'] => 1373664400548
 *											)
 *	)
 * @param {function} callback - The function to call when the server responds with the JSON of new data to update/add to the local DB
 */ 
 
function syncEverythingBecauseNathanIsAwesomeAndLikesLongFunctionNames(last_sync, changes, callback) {
	$.post(REMOTE_PATH + 'mobile_app/sync.php', {
		'username' 	: user.username,
		'password'	: user.passHash,
		'last_sync'	: last_sync,
		'changes'	: changes, 
		'timestamp'	: new Date().getTime() 
	}, function(successData) {
		successData = JSON.parse(unescape(successData));
		console.log(successData);
		if (successData.credentialsCorrect) {
			callback(successData.changes);
		} else {
			console.log(":p credentials were wrong!!!");	
		}
	}).error(function(error) {
		console.log(':(');
	});
}

function pad(str, max) {
  return ((str+'').length < max) ? pad("0" + str, max) : str;
}

function sync(show){ 
	if(show)	
		$.mobile.loading( "show", {
			text: "Syncing database...",
			textVisible: true,
			theme: "c",
			html: ""
		}); 
	
	db.sync(); 
}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function resetCourse(){	currentCourse.reset();	}

var currentCourse = {
	name: null, 
	potentialStudents: [],
	confirmedStudents: [],
	requested: 'newCourse',
	reset: function(){
		this.name = null; 
		this.potentialStudents = [];
		this.confirmedStudents = [];
		this.requested = 'newCourse';
	}
}

/**
 * Sorts by first name, then last name assuming that a name is formatted like "Joseph Higgins" with a space in between first and last name and no funny stuff.
 * Makes use of a ton of jQuery/DOM stuff, including storing some data in data-attribute that is stripped at the end. 
 * @param {jq object} list - The actual list of elements to be sorted. Examples: $('ul.sortMe'), $('table').find('tbody tr')
 * @param {function} getTextFromItem - A function that, given one list item, returns the name being sorted as a string. Example: function(el){ return $(el).children('.students').text(); }
 * @param {jq object} container - The base DOM element that the list will be appended to after being sorted. 
 */

function dualSort(list, getTextFromItem, container){
	listitems = list.get();
	listitems.sort(function(a, b) {
		return  getTextFromItem(a).split(' ')[1].toUpperCase().localeCompare(getTextFromItem(b).split(' ')[1].toUpperCase());
	});
	$.each(listitems, function(idx, itm) { container.append($(itm).attr("data-letter",getTextFromItem(itm).split(' ')[1][0])); });
	var sortedLetters = [];
	listitems = list.get();
	$.each(listitems, function(idx, itm){ if(sortedLetters.indexOf($(itm).attr("data-letter")) < 0){
			sortedLetters.push($(itm).attr("data-letter"));
			var toSort = [];
			$.each(listitems, function(idx2, itm2){ if($(itm).attr("data-letter") == $(itm2).attr("data-letter")) toSort.push(itm2); });
			toSort.sort(function(a, b) {
				return  getTextFromItem(a).split(' ')[0].toUpperCase().localeCompare(getTextFromItem(b).split(' ')[0].toUpperCase());
			});
			$.each(toSort, function(idx, itm) { container.append($(itm).removeAttr("data-letter")); });
		}
	});
}

function navHas(string) {
	return (navigator.userAgent.indexOf(string) > -1) ? true : false;	
}
 

