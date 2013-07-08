//JavaScript Document

var DB_SIZE = 1000000,
REMOTE_PATH = 'http://killit.atsolinc.com/',
DATA_THEME = 'c',
c = 299792458, // m/s
user = {authed: false, username: null, passHash: null}; 

var db = new resultsDatabase(); 
db.initDb(DB_SIZE);

//Global initialization functions here
$(document).bind("mobileinit", function(){
	$.mobile.loader.prototype.options.text = "Loading...";
	$.mobile.loader.prototype.options.textVisible = false;
	$.mobile.loader.prototype.options.theme = "a";
	$.mobile.loader.prototype.options.html = "";
	$.support.cors = true;
	$.mobile.allowCrossDomainPages = true; 
	$.mobile.defaultPageTransition = 'slide'; 
	$.mobile.pushStateEnabled = false;
});

/**
 * Detects the mobile device being used.
 */
function detectDevice(){
	return device.model + ' ' + device.platform + ' ' + device.version; //ex: 'iPhone5,1 iOS 5.1.1', 'NexusOne Android 4.2';
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

$(document).on('pageinit', function() {	
	//Wait for PhoneGap to load
	//document.addEventListener("deviceready", detectDevice(), false);
});

/**
 * Queries the database based on a predefined keyword. 
 * @param {function} callback - To be called with the results. 
 * 
 */ 
function genericAjax(callback, data, path){
	if(db.complete){ 
		db.localQuery(data, callback); 
	} else { setTimeout(function(){ db.localQuery(data, callback); }, 500); }
		/* $.ajax({
			url: REMOTE_PATH+path, 
			success: function(data, status, jqXHR){
				callback(jqXHR.responseText, 'internet');  
			},
			type: 'POST',
			data: data
		});	 */
}





