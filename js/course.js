
if(!(courseToLoad.length > 0)){ $('#course-landing-content').append('<h1 style="text-align: center;">There\'s been a mistake. Please return from whence you came.</h1>')} 
else {initializeTable(false); }
	
var studentToLoad; 
var taskCount = 0; 

/**
 * Builds the table in course.html. Providing 'false' triggers the ajax, the callback 
 * of which is recursive. On callback, the top table (task names) is built. 
 * @param {boolean/object} response - Call with 'false' to trigger the ajax. On callback, this is an object. 
 */ 
function initializeTable(response){
	console.log(response);
	if(response){
		if(!response.error){
			var i=-1;
			var tableHeadStr = '<table id="studentTable" data-role="table" data-mode="columntoggle" class="ui-responsive table-stroke"><thead><tr>';
				tableHeadStr += '<th class="bufferBox"></th>';
			for(var i=0; i<response.taskname.length; i++){
				tableHeadStr += '<th class="taskHeader" data-columnNum="'+i+'" data-priority="'+(i+1)+'">'+response.taskname[i].name+'</th>';
				taskCount++;
			}
			tableHeadStr += '</tr></thead>';
			
			$('#studentTable').append($(tableHeadStr));
			$('#students').append($(tableHeadStr+'</table')); 
			createStudentView(false);
		}
	} else genericAjax(initializeTable, "requested=tasknames", 'admin/mobileAjaxGate.php');
}

/**
 * Builds the bottom table (student data).
 * @param {boolean/object} response - call with false to trigger the ajax call. On callback, this is JSON. 
 * @param {string} type - to differentiate between responses from the master server and local database. 
 */

function createStudentView(response, type){
	if(type == 'internet') response = $.parseJSON(response);
	if(response){
		if(!response.error){ 
			var toAppend = ''; 
			for(var i=0; i<response.student.length; i++){
				if(response.student[i].firstName != undefined){
					toAppend += '<tr><th class="students" data-studId="'+response.student[i].rem_id+'">'+response.student[i].firstName+' '+response.student[i].lastName+'</th>';
					for(var j=0; j<taskCount; j++){
							toAppend += '<td class="emptyCell" data-columnNum="'+j+'"></td>'; 
						}
				}
				toAppend += '</tr>';
			}
			$('#studentTable').append($(toAppend));
			
			$('.students').on("click", function(e){
				studentToLoad = $(e.delegateTarget).attr("data-studId");
				$.mobile.changePage("student.html");
			});
			var columnOfInterest;  
			if(response.course_student_task_attempt != undefined){
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
						if($(this).attr("data-columnNum") == columnOfInterest && $(this).parent().children('th').attr("data-studId") == thisAttempt.course_student_id){
							$(this).append($('<p>'+thisAttempt.value+'</p>')).attr("class", "cell").css("background-color", getProperColor(isPassingReq(thisAttempt.value, thisTask.operator, thisTask.value)));
						}
					});
				} 
			}
			$('#students').trigger("create"); 
			$('#course-landing-content').append($('<input type="button" value="Start New Task" />').on("click", function(){ $.mobile.changePage('attempt.html'); }));
			$('#course-landing-content').trigger("create");
		}  
		
	} else {

		genericAjax(createStudentView, 'requested=students&id='+courseToLoad, 'admin/mobileAjaxGate.php'); 
	}
}

/**
 * Checks if the task attempt is passing the task requirement. 
 * @param {string} supplied - The supplied datum of the student's task attempt (i.e. 60, 5:30, etc.)
 * @param {string} operator - Is required (the next paramater) the minimum value accepted or the maximum? 
 * @param {string} required - The number or time of the task that are required to pass. 
 */
function isPassingReq(supplied, operator, required){
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

/**
 * Picks between the colors hardcoded for success and failure.
 * @param {boolean} isPassing - Is this student passing in this attempt? 
 */

function getProperColor(isPassing){
	if(isPassing) return '#4CEB46'; 
	else return '#EB464C';
}