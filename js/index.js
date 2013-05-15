$(function(){
	listCourses();
});

function listCourses(){
	genericAjax(asyncListCourses, 'requested=coursename', 'admin/dbGetCourses.php'); 
}

function asyncListCourses(response){
	if(!response.error){
		for(var i=0; i<response.length; i++){
			$('#index-landing-content').append($('<div data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="'+DATA_THEME+'" data-disabled="false"' +
			' class="ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c" aria-disabled="false"><span class="ui-btn-inner">'+
			'<span class="ui-btn-text">'+response[i]+'</span></span><button class="ui-btn-hidden" data-disabled="false">'+response[i]+'</button></div>'));
		}
	}
}

function genericAjax(callback, data, path){
	$.ajax({
		url: REMOTE_PATH+path, 
		success: function(data, status, jqXHR){
			callback($.parseJSON(jqXHR.responseText)); 
		},
		type: 'POST',
		data: data
	});	
}