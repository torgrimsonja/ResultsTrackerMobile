$(function(){
	listCourses();
});

var courseToLoad;

function listCourses(){
	genericAjax(asyncListCourses, 'requested=coursename', 'admin/mobileAjaxGate.php'); 
}


function asyncListCourses(response){
	response = $.parseJSON(response);
	if(!response.error){
		var i=-1;
		while(response[++i] != undefined){
			var id=response[i].id;
			$('#courses').append($('<div data-dbId="'+response[i].id+'" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="'+DATA_THEME+'" data-disabled="false"' +
			' class="ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c" aria-disabled="false"><span class="ui-btn-inner">'+
			'<span class="ui-btn-text">'+response[i].name+'</span></span><button class="ui-btn-hidden course-button" data-disabled="false">'+response[i].name+'</button></div>')
			.on("click", function(e){
				courseToLoad = $(e.delegateTarget).attr("data-dbId");
				$.mobile.changePage('course.html'); 
			}));	
		}
	}
}


