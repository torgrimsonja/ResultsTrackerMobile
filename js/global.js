//JavaScript Document

// set to TRUE to show debugging code site wide and FALSE to hide
var DEBUG = true;
var GLOBAL_CUSTOMER_ID = null;
var GLOBAL_TOAST = null;
var GLOBAL_BID_ID = null;
var GLOBAL_HTTP_REFERER = null;

//Populated every page call
var GLOBAL_LABOR = null;
var GLOBAL_FIXED_LABOR = null;
var GLOBAL_SALES_TAX = null;

//Global initialization functions here
$(document).bind("mobileinit", function(){
	$.mobile.loader.prototype.options.text = "Loading...";
	$.mobile.loader.prototype.options.textVisible = false;
	$.mobile.loader.prototype.options.theme = "a";
	$.mobile.loader.prototype.options.html = "";
	$.support.cors = true;
    $.mobile.allowCrossDomainPages = true; 
	/*
		Starts the loading animation
		$.mobile.loading( 'show', {
			text: 'Loading message...',
			textVisible: true,
			theme: 'z',
			html: ""
		});
		
		Stops the loading animation
		$.mobile.loading('hide');

	*/
	//$.mobile.ajaxEnabled = false;
	$.mobile.defaultPageTransition = 'slide'; 
	$.mobile.pushStateEnabled = false;
});
		
function detectDevice(){
	console.log("In detect device function...")
	
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
	
	//Calling individual page decive ready function
	console.log("IN ON DECTECT DEVICE, CALLING ON DEVICE READY");
	onDeviceReady();
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

function populateGlobals(){
		var db = window.openDatabase("quoteProMobile", "1.0", "QuotePro Mobile", 1000000);
    	db.transaction(function(tx){
			tx.executeSql('SELECT * FROM qp_cust_soldTo', [], function(tx, results){
				GLOBAL_LABOR = results.rows.item(0).labor_rate;
				GLOBAL_FIXED_LABOR = results.rows.item(0).fixed_rate;
				GLOBAL_SALES_TAX = results.rows.item(0).tax;
			});
		}, errorCB);

}
	


$(document).on('pageinit', function() {	
	//Wait for PhoneGap to load
	console.log("In global js ready function...Calling Detect Device");
	document.addEventListener("deviceready", detectDevice(), false);
});





