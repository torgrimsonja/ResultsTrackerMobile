$(function(){
	$('#index-landing').bind("pageshow", function(){
		if(!user.authed) $.mobile.changePage('login.html');
		if($('#index-header p').length == 0) $('#index-header').append($('<p>Logged in as '+user.username+'</p>'));
	});
	if(!user.authed) $.mobile.changePage('login.html');
});

var courseToLoad; 

/**
 * Triggers the ajax call to return the course data. 
 */
function listCourses(){
	genericAjax(asyncListCourses, 'requested=coursename', 'admin/mobileAjaxGate.php'); 
}

/**
 * The callback from listCourses which actually fills index.html with the course data from the server. 
 * @param {object} response - The ajax response from listCourses. If all goes well, this is JSON. 
 * @param {string} type - A legacy parameter to differ between data from the master server and data from the local database. 
 */ 
function asyncListCourses(response, type){
	if(type == 'internet') response = $.parseJSON(response);
	if(!response.error){ 
		var i=-1;
		for(var i=0; i<response["name"].length; i++){
			var id=response.name[i].id;
			var name = response.name[i].name; 
			//The fancy classes are to trick jquery mobile css into giving it the smooth button treatment
			//Normally these classes are auto-applied, but when generated post-pageload one has to do it all himself
			//The end result is just a button 
			$('#courses').append($('<div data-dbId="'+id+'" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="'+DATA_THEME+'" data-disabled="false"' +
			' class="ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c" aria-disabled="false"><span class="ui-btn-inner">'+
			'<span class="ui-btn-text">'+name+'</span></span><button class="ui-btn-hidden course-button" data-disabled="false">'+name+'</button></div>')
			.on("click", function(e){
				courseToLoad = $(e.delegateTarget).attr("data-dbId"); //This variable is referenced in course.js meaning one always has to visit this page first
				$.mobile.changePage('course.html'); 
			}));	
		}
	}
}
