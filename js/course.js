
if(!(courseToLoad.length > 0)){ $('#course-landing-content').append('<h1 style="text-align: center;">There\'s been a mistake. Please return from whence you came.</h1>')} 
else { createGoalView(false); createStudentView(false); }


function createGoalView(response){
	if(response){
		response = $.parseJSON(response);
		if(!response.error){
			var i=-1;
			while(response[++i] != undefined){
				$('#goals').append($('<li class="goal"><h3>'+response[i].name+'</h3></li>'));
			}
		}
	} else {
		genericAjax(createGoalView, 'requested=coursegoals&id='+courseToLoad, 'admin/mobileAjaxGate.php'); 
	}
}
	
function createStudentView(response){
	if(response){
		response = $.parseJSON(response);
		if(!response.error){
			var i=-1;
			while(response[++i] != undefined){
				$('#students').append($('<li class="students"><h3>'+response[i].firstName+' '+response[i].lastName+'</h3></li>'));
			}
		}
	} else {
		genericAjax(createStudentView, 'requested=students&id='+courseToLoad, 'admin/mobileAjaxGate.php'); 
	}
}