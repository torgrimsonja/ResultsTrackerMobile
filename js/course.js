
if(!(courseToLoad.length > 0)){ $('#course-landing-content').append('<h1 style="text-align: center;">There\'s been a mistake. Please return from whence you came.</h1>')} 
else {createStudentView(false);}
	
var studentToLoad; 
	
function createStudentView(response){
	if(response){
		console.log(response);
		response = $.parseJSON(response);
		if(!response.error){
			var i=-1;
			while(response[++i] != undefined){
				$('#students').append($('<li class="students" data-studID="'+response[i].id+'"><h3>'+response[i].firstName+' '+response[i].lastName+'</h3></li>'));
			}
			
			$('.students').on("click", function(e){
				studentToLoad = $(e.delegateTarget).attr("data-studId");
				$.mobile.changePage("student.html");
			});
		}
	} else {
		genericAjax(createStudentView, 'requested=students&id='+courseToLoad, 'admin/mobileAjaxGate.php'); 
	}
}