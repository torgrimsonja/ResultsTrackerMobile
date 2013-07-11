if(courseToLoad == undefined) $('#login-landing-content').html('<h1>An error occurred! Abandon all hope!</h1>'); 
else genericAjax(asyncUpdateAttempt, 'requested=tasknames', 'refactor this sometime I guess'); 

function asyncUpdateAttempt(response){
	genericAjax(function(studentResponse){
		for(var i=0; i<response.taskname.length; i++){
			$('#taskPicker').append($('<div class="toCollapse" data-role="collapsible"><h3>'+response.taskname[i].name+'</h3></div>')
			.append(getTaskPage(response.taskname[i], studentResponse)));
		}
		$('#taskPicker').trigger('create');
	}, 'requested=students&id='+courseToLoad, '');
	
}

function getTaskPage(taskdata, students){
	if(taskdata.type_id == 1) return getPage(taskdata.name, students, 'timed');
	else if(taskdata.type_id == 2) return getPage(taskdata.name, students, 'reps'); 
}

function getPage(taskname, students, type){
	console.log(students);
	var toRet = $('<div class="attemptHeader"></div>')
	.append($('<h1>'+taskname+'<h1>'));
	for(var i=0; i<students.student.length; i++){
		toRet.append($('<div class="studentInput"><span class="studentName">'+students.student[i].firstName+' '+students.student[i].lastName+'</span>'+getInput(type)+'</div>'));
	} return toRet.append($('<input type="button" onclick="storeData($(this), '+students.student.rem_id+', '+taskname+')" value="Save"/>')); 
}

function getInput(type){
	if(type == 'timed') return '<input type="number" pattern="[0-9][0-9]:[0-9[0-9]" placeholder="00:00" />';
	if(type == 'reps') return '<input type="number" pattern="[0-9]+" placeholder="0" />'; 
}

function storeData(el, studentId, taskname){
	el.parents('.attemptHeader').find('input[type|="number"]').each(
		function(){
			var inputtedValue = $(this).val(), taskName = el;
			el.attr("value","Saving...").css("background-color","#CCFFCC");
			el.prev().children('span').html("Saving...");
			db.localQuery("requested=insertNewAttempt&student_id="+studentId+"&value="+inputtedValue+"&task="+taskname, function(){
				el.attr("value","Saved!").css("background-color","green");
				el.prev().children('span').html("Saved!");
				setTimeout(function(){
					el.attr("value","Save").css("background-color","");
					el.prev().children('span').html("Save");
				}, 2000); 
			});
		});
}