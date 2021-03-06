if(courseToLoad == undefined) $('#login-landing-content').html('<h1>An error occurred! Abandon all hope!</h1>'); 
else db.localQuery('requested=tasknames', asyncUpdateAttempt); 

/**
 * After the tasknames are loaded from the local database, this function builds the new task selector page. 
 * @param {object} response - The response from the database containing the tasknames.
 */
 
function asyncUpdateAttempt(response){
	db.localQuery( 'requested=students&id='+courseToLoad,
	function(studentResponse){
		for(var i=0; i<response.taskname.length; i++){
			$('#taskPicker').append($('<div class="toCollapse" data-role="collapsible"><h3>'+response.taskname[i].name+'</h3></div>')
			.append(getTaskPage(response.taskname[i], studentResponse)));
		}
		$('#taskPicker').trigger('create');
	});
	
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
		toRet.append($('<div class="studentInput"><span class="studentName">'+students.student[i].firstName+' '+students.student[i].lastName+'</span>'+getInput(type + ' ' + taskname)+'</div>'));
	} 
	//There's certainly a better way to do this, but...
	//Sorts first by last name, then first name
	/*
	var listitems = toRet.children('.studentInput').get();
	listitems.sort(function(a, b) {
		return  $(a).children('span.studentName').text().split(' ')[1].toUpperCase().localeCompare($(b).children('span.studentName').text().split(' ')[1].toUpperCase());
	});
	$.each(listitems, function(idx, itm) { toRet.append($(itm).attr("data-letter",$(itm).children('span.studentName').text().split(' ')[1][0])); });
	
	var sortedLetters = [];
	listitems = toRet.children('.studentInput').get();
	$.each(listitems, function(idx, itm){ if(sortedLetters.indexOf($(itm).attr("data-letter")) < 0){
			sortedLetters.push($(itm).attr("data-letter"));
			var toSort = [];
			$.each(listitems, function(idx2, itm2){ if($(itm).attr("data-letter") == $(itm2).attr("data-letter")) toSort.push(itm2); });
			toSort.sort(function(a, b) {
				return  $(a).children('span.studentName').text().split(' ')[0].toUpperCase().localeCompare($(b).children('span.studentName').text().split(' ')[0].toUpperCase());
			});
			$.each(toSort, function(idx, itm) { toRet.append(itm)});
		}
	}); */
	
	dualSort(toRet.children('.studentInput'), function(el){ return $(el).children('span.studentName').text(); }, toRet); 
	
	return toRet.append($('<input type="button" onclick="storeData($(this), \''+taskname+'\', \''+type+' '+taskname+'\')" value="Save"/>')); 
}

/**
 * Gets the HTML input proper for a tiemd or repetition-based tas.
 * @param {String} type - 'timed' or 'reps' 
 * @return {String} - The raw HTML of the input. 
 */ 

function getInput(type){
	if(type.search('timed') > -1){
		if(type.search('Shuttle Run') > -1) return '<input type="text" pattern="^[0-9]*((\.)[0-9])?$" placeholder="0.0 (seconds)" data-box="boxToSave" />';
		else return '<input type="text" pattern="[0-9][0-9]:[0-9[0-9]" placeholder="00:00" data-box="boxToSave" />';
	}
	if(type.search('reps') > -1) return '<input type="number" pattern="[0-9]+" placeholder="0" data-box="boxToSave" />'; 
}

/** 
 * Triggered on a press of the "save" button at the bottom of each new task input page. Queries the database with the new task data and does some button styling. 
 * @param {jq object} el - The button source of the event.
 * @param {array} studentId - The ids of the students whose attempts are being logged 
 * @param {String} taskname - The name of the task being attempted. 
 */ 

function storeData(el, taskname, type){
	var values = []; 
	el.parents('.attemptHeader').find('input[data-box|="boxToSave"]').each(function(){
		var inputtedValue = $(this).val();
		if(inputtedValue.length > 0) values.push([inputtedValue, $(this).parent().parent().children('.studentName').html(), $(this)]);
	});
	
	var validated = validateInput(values, type), args = [], funcs = [];
	
	if(values.length > 0 && validated){
		el.attr("value","Saving...").css("background-color","#CCFFCC");
		el.prev().children('span').html("Saving...");
		var countAttemptsLogged = 0; 
		for(var i=0; i<values.length; i++){
			args.push("requested=insertNewAttempts&student_name="+values[i][1]+"&value="+values[i][0]+"&task="+taskname+"&course="+courseToLoad);
			funcs.push(function(data){
				countAttemptsLogged++;
				if(data.error){
					el.attr("value","Saved!").css("background-color","red");
					el.prev().children('span').html("Error");
					setTimeout(function(){
						el.attr("value","Save").css("background-color","");
						el.prev().children('span').html("Save");
					}, 2000); 
					if(data.comments) alert(data.comments);
				} else if(countAttemptsLogged >= values.length){
					el.attr("value","Saved!").css("background-color","green");
					el.prev().children('span').html("Saved!");
					setTimeout(function(){
						el.attr("value","Save").css("background-color","");
						el.prev().children('span').html("Save");
					}, 2000); 
				}
			});
		} 
		executeFuncsSynchronously(funcs, args, 0); 
		setTimeout(sync(false),1000);
	}
}

function validateInput(values, type){
	var allValid = true; 
	for(var i=0; i<values.length; i++){
		if(type.search('reps') > -1 && !(/^[0-9]+$/.test(values[i][0]))){
			$(values[i][2]).attr("value","").attr("placeholder","That input was invalid! Number only please.");
			allValid = false; 
		} else if(type.search('timed') > -1 && type.search('Shuttle Run') < 0 && !(/^[0-9]?[0-9]:[0-9][0-9]$/.test(values[i][0]))){
			$(values[i][2]).val("").attr("placeholder","That input was invalid! A time should look like: 10:15 (minute, second)").addClass("placeholderError");
			allValid = false; 
		} else if(type.search('timed') && !(/^[0-9]*((\.)[0-9])?$/.test(values[i][0]))){
			$(values[i][2]).val("").attr("placeholder","That input was invalid! Seconds to one decimal point only.").addClass("placeholderError");
			allValid = false; 
		}
	} return allValid; 
}