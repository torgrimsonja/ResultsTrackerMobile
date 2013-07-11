if(courseToLoad == undefined) $('#login-landing-content').html('<h1>An error occurred! Abandon all hope!</h1>'); 
else genericAjax(asyncUpdateAttempt, 'requested=tasknames', 'refactor this sometime I guess'); 

function asyncUpdateAttempt(response){
	for(var i=0; i<response.taskname.length; i++){
		$('#taskPicker').append($('<div data-role="collapsible"><h3>'+response.taskname[i].name+'</h3></div>').on("click", function(e){ specificAttempt($(e.delegateTarget).html()); }));
	}
	$('#taskPicker').trigger("create");
}

function specificAttempt(attemptName){
	console.log(attemptName);
}