if(courseToLoad == undefined) $('#login-landing-content').html('<h1>An error occurred! Abandon all hope!</h1>'); 
else genericAjax(asyncUpdateAttempt, 'requested=tasknames', 'refactor this sometime I guess'); 

/**
 * After the tasknames are loaded from the local database, this function builds the new task selector page. 
 * @param {object} response - The response from the database containing the tasknames.
 */
 
function asyncUpdateAttempt(response){
	genericAjax(function(studentResponse){
		for(var i=0; i<response.taskname.length; i++){
			$('#taskPicker').append($('<div class="toCollapse" data-role="collapsible"><h3>'+response.taskname[i].name+'</h3></div>')
			.append(getTaskPage(response.taskname[i], studentResponse)));
		}
		$('#taskPicker').trigger('create');
	}, 'requested=students&id='+courseToLoad, '');
	
}

/**
 * Gets the proper input page based on whether the task is based on time or repetitions.
 * @param {object} taskdata - The database response with the task names
 * @param {object} students - The database response with the relevant student data
 * @return {jq object} The JQuery div object containing the proper input page
 */

function getTaskPage(taskdata, students){
	if(taskdata.type_id == 1) return getPage(taskdata.name, students, 'timed');
	else if(taskdata.type_id == 2) return getPage(taskdata.name, students, 'reps'); 
}

/**
 * Builds the JQuery div object with the proper inputs
 * @param {String} taskname - The name of the task to build the inputs for 
 * @param {object} students - The database response with the relevant student data
 * @param {string} type - Whether the task is timed or based on repetitions 
 * @return {jq object} The div built with the proper inputs
 */ 

function getPage(taskname, students, type){
	var toRet = $('<div class="attemptHeader"></div>')
	.append($('<h1>'+taskname+'<h1>'));
	for(var i=0; i<students.student.length; i++){
		toRet.append($('<div class="studentInput"><span class="studentName">'+students.student[i].firstName+' '+students.student[i].lastName+'</span>'+getInput(type)+'</div>'));
	} return toRet.append($('<input type="button" onclick="storeData($(this), \''+taskname+'\', \''+type+'\')" value="Save"/>')); 
}

/**
 * Gets the HTML input proper for a tiemd or repetition-based tas.
 * @param {String} type - 'timed' or 'reps' 
 * @return {String} - The raw HTML of the input. 
 */ 

function getInput(type){
	if(type == 'timed') return '<input type="number" pattern="[0-9][0-9]:[0-9[0-9]" placeholder="00:00" />';
	if(type == 'reps') return '<input type="number" pattern="[0-9]+" placeholder="0" />'; 
}

/** 
 * Triggered on a press of the "save" button at the bottom of each new task input page. Queries the database with the new task data and does some button styling. 
 * @param {jq object} el - The button source of the event.
 * @param {array} studentId - The ids of the students whose attempts are being logged 
 * @param {String} taskname - The name of the task being attempted. 
 */ 

function storeData(el, taskname, type){
	var values = []; 
	el.parents('.attemptHeader').find('input[type|="number"]').each(function(){
		var inputtedValue = $(this).val();
		if(inputtedValue.length > 0) values.push([inputtedValue, $(this).parent().parent().children('.studentName').html(), $(this)]);
	});
	
	var validated = validateInput(values, type); 
	
	if(values.length > 0 && validated){
		el.attr("value","Saving...").css("background-color","#CCFFCC");
		el.prev().children('span').html("Saving...");
		var countAttemptsLogged = 0; 
		for(var i=0; i<values.length; i++){
			db.localQuery("requested=insertNewAttempts&student_name="+values[i][1]+"&value="+values[i][0]+"&task="+taskname, function(){
				countAttemptsLogged++;
				if(countAttemptsLogged >= values.length){
					el.attr("value","Saved!").css("background-color","green");
					el.prev().children('span').html("Saved!");
					setTimeout(function(){
						el.attr("value","Save").css("background-color","");
						el.prev().children('span').html("Save");
					}, 2000); 
				}
			});
		}
	}
}

function validateInput(values, type){
	console.log(values);
	var allValid = true; 
	for(var i=0; i<values.length; i++){
		if(type == 'reps' && !(/^[0-9]+$/.test(values[i][0]))){
			console.log($(values[i][2]));
			$(values[i][2]).attr("value","").attr("placeholder","That input was invalid! Number only please.");
			allValid = false; 
		} else if(type == 'timed' && !(/^[0-9][0-9]:[0-9][0-9]/.test(values[i][0]))){
			console.log($(values[i][2]).val());
			$(values[i][2]).val("").attr("placeholder","That input was invalid! A time should look like: 10:15 (minute, second)").addClass("placeholderError");
			allValid = false; 
		}
	} return allValid; 
}