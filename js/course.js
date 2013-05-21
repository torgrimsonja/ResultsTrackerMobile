
if(!(courseToLoad.length > 0)){ $('#course-landing-content').append('<h1 style="text-align: center;">There\'s been a mistake. Please return from whence you came.</h1>')} 
else {initializeTable(false); }
	
var studentToLoad; 
var taskCount = 0; 

function initializeTable(response){
	if(response){
		if(!response.error){
			var i=-1;
			var tableHeadStr = '<tr><th></th>';
			while(response[++i] != undefined){
				tableHeadStr += '<th class="taskHeader" data-columnNum="'+i+'">'+response[i].name+'</th>';
				taskCount++;
			}
			tableHeadStr += '</tr>';
			
			$('#sTable').append($(tableHeadStr));
			
			createStudentView(false);
		}
	} else genericAjax(initializeTable, "requested=tasknames", 'admin/mobileAjaxGate.php');
}

function createStudentView(response, type){
	if(type == 'internet') response = $.parseJSON(response);
	if(response){
		if(!response.error){
			console.log(response);
			var tasksToAssign = [];
			var i=-1;
			while(response[++i] != undefined){
				if(response[i].firstName != undefined){
					$('#sTable').append($('<tr class="students" data-studId="'+response[i].id+'"><th>'+response[i].firstName+' '+response[i].lastName+'</th></tr>'));
				} else {
					 tasksToAssign.push(response[i]);
				}
			}
			
			var emptyCells = '';
			for(var i=0; i<taskCount; i++){
				emptyCells += '<td class="emptyCell" data-columnNum="'+i+'"></td>';
			}
			
			$('.students').append($(emptyCells));
			
			$('.students').on("click", function(e){
				studentToLoad = $(e.delegateTarget).attr("data-studId");
				$.mobile.changePage("student.html");
			});
			
			var columnOfInterest;
			for(var i=0; i<tasksToAssign.length; i++){
				$('.taskHeader').each(function(){
					var name = $(this).text();
					if(tasksToAssign[i].task_name == name){
						columnOfInterest = $(this).attr("data-columnNum");
					}
				});
				
				$('.emptyCell').each(function(){
					if($(this).attr("data-columnNum") == columnOfInterest && $($(this).parents().get(0)).attr("data-studId") == tasksToAssign[i].student_id){
						$(this).append($('<p>'+tasksToAssign[i].value+'</p>'));
						$(this).attr("class", "cell");
					}
				});
			}
			
			var maxHeight = Number.NEGATIVE_INFINITY; 
			var maxWidth = Number.NEGATIVE_INFINITY;
			$('th, td').each(function(){
				maxHeight = Math.max(maxHeight, $(this).height());
				maxWidth = Math.max(maxWidth, $(this).width());
			}).each(function(){
				$(this).css("height", maxHeight).css("width", maxWidth);
			});
			
		}
	} else {
		genericAjax(createStudentView, 'requested=students&id='+courseToLoad, 'admin/mobileAjaxGate.php'); 
	}
}