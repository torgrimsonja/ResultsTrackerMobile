//JavaScript Document

var DB_SIZE = 1000000;
var REMOTE_PATH = 'http://killit.atsolinc.com/'; 
var DATA_THEME = 'c';
var c = 299792458; // m/s

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
		
function detectDevice(){
	var deviceIphone = "iphone";
	var deviceIpod = "ipod";
	var deviceIpad = "ipad";
	var deviceAndroid = "android";

	//Initialize our user agent string to lower case.
	var uagent = navigator.userAgent.toLowerCase();
	// Detects if the which os the current device is.
	
	// Detects if the current device is an iPhone or an iPod touch
	if ((uagent.search(deviceIpod) > -1) || (uagent.search(deviceIphone) > -1)){
	   // Just replacing the value of the 'content' attribute will not work.
		console.log('Device is iPhone...');
		$("#deviceSpecificCSS").attr("href","css/iosPageDesign.css");
	}
	else // Detects if the current device is an iPad
	if (uagent.search(deviceIpad) > -1){
	   // Just replacing the value of the 'content' attribute will not work.
		console.log('Device is iPad');
		$("#deviceSpecificCSS").attr("href","css/iPadDesign.css");
	}
	// Detects if the current device is Android.
	else if (uagent.search(deviceAndroid) > -1){
	   //Code Here
	   console.log('Device is Andriod');
	   $("#deviceSpecificCSS").attr("href","css/androidPageDesign.css");
	}    
	else{
	   //Code Here
	}
}

//Escapes all chars that screw up the query
	function escapeSqlString(string){
		console.log('In escapeSqlString');
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
	document.addEventListener("deviceready", detectDevice(), false);
});

function generateHeader(){
	
}




