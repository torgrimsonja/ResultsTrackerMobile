
if(!(courseToLoad.length > 0)){ $('#course-landing-content').append('<h1 style="text-align: center;">There\'s been a mistake. Please return from whence you came.</h1>')} 
else {initializeTable(false); }
	
var studentToLoad; 
var taskCount = 0; 

function initializeTable(response){
	if(response){
		if(!response.error){
			var i=-1;
			var tableHeadStr = '<tr><th id="bufferBox">Name</th>';
			for(var i=0; i<response.taskname.length; i++){
				tableHeadStr += '<th class="taskHeader" data-columnNum="'+i+'">'+response.taskname[i].name+'</th>';
				taskCount++;
			}
			tableHeadStr += '</tr>';
			
			$('#sTable').append($('<tr><td><table>'+tableHeadStr+'</table></td></tr>'));
			
			createStudentView(false);
		}
	} else genericAjax(initializeTable, "requested=tasknames", 'admin/mobileAjaxGate.php');
}

function createStudentView(response, type){
	if(type == 'internet') response = $.parseJSON(response);
	if(response){
		if(!response.error){
			var tableStr = '<tr><td><div id="rowStyler"><table>';
			var i=-1;
			for(var i=0; i<response.student.length; i++){
				if(response.student[i].firstName != undefined){
					tableStr += '<tr class="students" data-studId="'+response.student[i].id+'"><th class="rowHeader">'+response.student[i].firstName+' '+response.student[i].lastName+'</th></tr>';
				} 
			} tableStr += '</table></div></td></tr>';
			$('#sTable').append($(tableStr));
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
			for(var i=0; i<response.course_student_task_attempt.length; i++){
				var thisAttempt = response.course_student_task_attempt[i]; 
				var thisTask = response.task[i]; 
				$('.taskHeader').each(function(){
					var name = $(this).text();
					if(thisTask.name == name){
						columnOfInterest = $(this).attr("data-columnNum");
					}
				});
				$('.emptyCell').each(function(){
					if($(this).attr("data-columnNum") == columnOfInterest && $($(this).parents().get(0)).attr("data-studid") == thisAttempt.course_student_id){
						$(this).append($('<p>'+thisAttempt.value+'</p>')).attr("class", "cell").css("background-color", getProperColor(isPassingReq(thisAttempt.value, thisTask.operator, thisTask.value)));
					}
				});
			}
			setTimeout(function(){
				var maxWidth = Number.NEGATIVE_INFINITY;
				$('.rowHeader').each(function(){
					maxWidth = Math.max(maxWidth, $(this).width());
					$('#bufferBox').width(maxWidth).css("min-width", maxWidth);
					$('.rowHeader').css("max-width", maxWidth).css("min-width", maxWidth).css("z-index", "1");
				}); 
				
				
				var clones = [];
				$('.rowHeader').each(function(){
					clones.push({element: $(this).clone(), position: $(this).position(), height: $(this).height()});
					$(this).attr("class", $(this).attr("class") + ' original');
				});
				for(var i=0; i<clones.length; i++){
					var clone = $(clones[i].element);
					clone.css("position", "absolute").css("left", clones[i].position.left).css("top", clones[i].position.top).css("min-height", clones[i].height).css("z-index", "0").css("visibility", "hidden").attr("class", clone.attr("class") + ' clone');
					$('#sTable').append(clone);
				}
				var toggled = false;
				$('#students').scroll(function(){
					if(!toggled){
						$('.original').css("visibility", "hidden"); 
						$('.clone').css("visibility", "visible"); 
						toggled = true; 
					}
				});
			}, 100);
		}
	} else {
		genericAjax(createStudentView, 'requested=students&id='+courseToLoad, 'admin/mobileAjaxGate.php'); 
	}
}

function isPassingReq(supplied, operator, required, format){
	switch(operator){
		case 'min':
			if(supplied.indexOf(':') > -1){
				var split = supplied.split(":");
				var adjustedSupp = (parseInt(split[0]) * 60) + parseInt(split[1]); 
				split = required.split(":");
				var adjustedReq = (parseInt(split[0]) * 60) + parseInt(split[1]); 
				if(adjustedSupp >= adjustedReq) return true; 
				else return false; 
			} else {
				if(parseFloat(supplied) >= parseFloat(required)) return true;
				else return false; 
			}
		break;
		
		case 'max':
			if(supplied.indexOf(':') > -1){
				var split = supplied.split(":");
				var adjustedSupp = (parseInt(split[0]) * 60) + parseInt(split[1]); 
				split = required.split(":");
				var adjustedReq = (parseInt(split[0]) * 60) + parseInt(split[1]); 
				if(adjustedSupp <= adjustedReq) return true; 
				else return false; 
			} else {
				if(parseFloat(supplied) <= parseFloat(required)) return true;
				else return false; 
			}
		break; 
	}
}

function getProperColor(isPassing){
	if(isPassing) return '#4CEB46'; 
	else return '#EB464C';
}