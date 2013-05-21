var resultsDatabase = function() {
	this.db, this.complete = false; 
}

resultsDatabase.prototype.initDb = function(size){
	console.log("Initializing local database");
	try {
		resultsDatabase.db = openDatabase("resultsTracker","0.5","Results Tracker Local Database", size);
	} catch (e){
		console.log(e.message);
	}
	
	this.checkIfLoaded();
}

resultsDatabase.prototype.checkIfLoaded = function(){
	var ref = this; 
	console.log("Checking if database exists...");
	resultsDatabase.db.transaction(function (tx) {
		tx.executeSql("SELECT * FROM `task_type` LIMIT 1", [], function(tx, results){
			if(results.rows && results.rows.length){
				console.log("Does exist.");
				ref.complete = true;	
			} else {
				ref.syncWithServer();
			}
		});
	});
}

resultsDatabase.prototype.syncWithServer = function(){
	console.log("Downloading database from remote server...");
	var ref = this;
	$.ajax({
		url: 'http://killit.atsolinc.com/admin/mobileAjaxGate.php', 
		success: function(data, status, jqXHR){
			ref.syncResponse(jqXHR.responseText); 
		},
		type: 'POST',
		data: 'requested=replicateDb'
	});	
}

resultsDatabase.prototype.syncResponse = function(response){
	response = $.parseJSON(response);
	if(!response.error){ //TODO: pull table structure from server
		this.query("CREATE TABLE IF NOT EXISTS `course`(`id` , `user_id`, `name`, `active`, `timestamp`)", callback);
		for(var i=0; i<response.course.length; i++){
			this.query("INSERT INTO `course`(`id`,`name`,`active`,`timestamp`, `user_id`) VALUES ('"+response.course[i].id+"', '"+response.course[i].name+"', '"+response.course[i].active+"', '"+response.course[i].timestamp+"', '"+response.course[i].user_id+
			"')", callback);// WHERE NOT EXISTS (SELECT * FROM `course` WHERE `name` = '"+response.course[i].name+"')", callback);
		}
		
		this.query("CREATE TABLE IF NOT EXISTS `course_student` ( `id` , `student_id`, `course_id`, `timestamp`)", callback);
		for(var i=0; i<response.course_student.length; i++){
			this.query("INSERT INTO `course_student` (`id` , `student_id`, `course_id`, `timestamp`) VALUES ('"+response.course_student[i].id+"', '"+response.course_student[i].student_id+
			"', '"+response.course_student[i].course_id+"', '"+response.course_student[i].timestamp+
			"')", callback); //WHERE NOT EXISTS (SELECT * FROM `course_student` WHERE `id` = '"+response.course_student[i].id+"')", callback);
		}
		
		this.query("CREATE TABLE IF NOT EXISTS `student` (`id` , `firstName`, `lastName`, `gender`, `dateOfBirth`, `code`)", callback);
		for(var i=0; i<response.student.length; i++){
			this.query("INSERT INTO `student`( `id` , `firstName`, `lastName`, `gender`, `dateOfBirth`, `code`) VALUES ('"+response.student[i].id+"', '"+response.student[i].firstName+
			"', '"+response.student[i].lastName+"', '"+response.student[i].gender+"', '"+response.student[i].dateOfBirth+"', '"+response.student[i].code+
			"')", callback); //WHERE NOT EXISTS (SELECT * FROM `student` WHERE `id` = '"+response.student[i].id+"')", callback);
		}
		
		this.query("CREATE TABLE IF NOT EXISTS `task` (`id` , `type_id`, `operator`, `name`, `description`, `value`, `timestamp`, `age`, `gender`)", callback);
		for(var i=0; i<response.task.length; i++){
			this.query("INSERT INTO `task`(`id` , `type_id`, `operator`, `name`, `description`, `value`, `timestamp`, `age`, `gender`) VALUES ('"+response.task[i].id+"', '"+response.task[i].type_id+
			"', '"+response.task[i].operator+"', '"+response.task[i].name+"', '"+response.task[i].description+"', '"+response.task[i].value+"', '"+response.task[i].timestamp+"', '"+response.task[i].age+"', '"+response.task[i].gender+
			"')", callback); //WHERE NOT EXISTS (SELECT * FROM `task` WHERE `id` = '"+response.task[i].id+"')", callback);
		}
		
		console.log(response);
		this.query("CREATE TABLE IF NOT EXISTS `course_student_task_attempt` (`id`, `course_student_id`, `task_id`, `value`, `timestamp`)", callback);
		for(var i=0; i<response.course_student_task_attempt.length; i++){
			this.query("INSERT INTO `course_student_task_attempt`(`id`, `course_student_id`, `task_id`, `value`, `timestamp`) VALUES ('"+response.course_student_task_attempt[i].id+"', '"+response.course_student_task_attempt[i].course_student_id+
			"', '"+response.course_student_task_attempt[i].task_id+"', '"+response.course_student_task_attempt[i].value+"', '"+response.course_student_task_attempt[i].timestamp+
			"')", callback); //WHERE NOT EXISTS (SELECT * FROM `task` WHERE `id` = '"+response.task[i].id+"')", callback);
		}
		
		this.query("CREATE TABLE IF NOT EXISTS `task_type` (`id`, `name`, `timestamp`)", callback);
		for(var i=0; i<response.task_type.length; i++){
			this.query("INSERT INTO `task_type`(`id`, `name`, `timestamp`) VALUES ('"+response.task_type[i].id+"', '"+response.task_type[i].name+
			"', '"+response.task_type[i].timestamp+
			"')", callback); //WHERE NOT EXISTS (SELECT * FROM `task` WHERE `id` = '"+response.task[i].id+"')", callback);
		}
		
		this.dumpDbInConsole();
	}
}

resultsDatabase.prototype.query = function(q, callback){
	resultsDatabase.db.transaction(function (tx) {
		tx.executeSql(q, [], function(tx, results){
			callback(results); 
		});
	
	});
}

resultsDatabase.prototype.dumpDbInConsole = function(){
	this.query("SELECT * FROM `course` ", callback);
	this.query("SELECT * FROM `student`", callback);
	this.query("SELECT * FROM `task`", callback);
	this.query("SELECT * FROM `task_type`", callback);
	this.query("SELECT * FROM `course_student_task_attempt`", callback);
}

resultsDatabase.prototype.localQuery = function(data, callback){
	//There are a ton of variable scope issues in calling asychronous queries, so hang tight
	var call = callback; //I use the name "callback" elsewhere
	var ref = this; //I keep this reference around to use prototype methods deeper in
	if(data == "requested=coursename"){ //This query is run on the index page. It simply gets the course names and ids
		this.query("SELECT DISTINCT `name`, `id` FROM `course` WHERE 1", function(response, callback){
			var toReturn = [];
			if (response.rows && response.rows.length) {
				toReturn['error'] = false;
				for(var i=0; i<response.rows.length; i++){
					toReturn.push(response.rows.item(i));
				} 
			} else toReturn['error'] = true; 
			call(toReturn, 'local'); //'local' being legacy code ensuring the callback function that this result comes from the local db
		});
	}
		
	else if(data.search("requested=students") > -1){ //this string will probably look like "requested=students&id=1", so I can't just match it
		//persistantVariables are simple javascript objects that can be referenced asychronously, for storing data inside of db calls 
		var persist = new persistantVariable();  var responseRow = new persistantVariable(); var student_id = new persistantVariable();
		var keyvalue = this.getArgs(data); //returns an array of key => value pairs in the data string, not counting requested=*
		this.query("SELECT DISTINCT `student_id`, `id` FROM `course_student` WHERE `course_id` = '"+keyvalue[1].value+"'", function(response, callback){ //first we'll need the student_ids and course_student_ids from each student in the course
			var studentIds = [];
			if (response.rows && response.rows.length) {
				for(var i=0; i<response.rows.length; i++){
					studentIds.push(response.rows.item(i));
				} 
			}
			var toReturn = [];
			for(var i=0; i<studentIds.length; i++){ //Now, for every student in a particular course:
				student_id.pushValue({id: studentIds[i].student_id, used: false}); //save the id to be called on asychronously 
				ref.query("SELECT DISTINCT `firstName`, `lastName`, `code`, `id` FROM `student` WHERE `id` = '"+studentIds[i].student_id+"'", function(response, callback){ //BEGIN ASYNC 
					if (response.rows && response.rows.length) { //Here we return the names and ids of each student in a particular course 
						toReturn['error'] = false;
						for(var j=0; j<response.rows.length; j++){
							toReturn.push(response.rows.item(j));
						} 
					} else toReturn['error'] = true; 
					
					persist.setValue(toReturn); //save the result of the call 
				});
				ref.query("SELECT `task_id`, `value` FROM `course_student_task_attempt` WHERE `course_student_id` = '"+studentIds[i].id+"'", function(response, callback){ // Now we'll want the task_id and value of each student's task attempts
					var toReturn = persist.getValue(); //We'll be using the names and ids filled above, but we have to get them from a persistant variable because scope is weird 
					if (response.rows && response.rows.length) {
						for(var j=0; j<response.rows.length; j++){
							var taskName = new persistantVariable();
							responseRow.pushValue({value: response.rows.item(j), used: false}); //You'll see why I use the "used: false" later on. Suffice it to say more variable scope issues
							ref.query("SELECT `name` FROM `task` WHERE `id` = '"+response.rows.item(j).task_id+"'", function(response, callback){  
								if (response.rows && response.rows.length) {
									var tempArray = [];
									for(var k=0; k<response.rows.length; k++){
										tempArray.push(response.rows.item(k));
									}
									taskName.setValue(tempArray);
								}
								
							});
							setTimeout(function(){ // Give all these async queries time to complete 
								var task_name = taskName.getValue(); //pull in all this persistant data
								var rows = responseRow.getValue();
								var student_id_persist = student_id.getValue();
								var thisId, thisRow, thisTaskId;
								var index = 0;
								while(true){ // loop through the persistant data, as an extension of a for loop far above this scope level whose index variable cannot be referenced due to scope problems 
									if(student_id_persist[index].used == false){
										student_id_persist[index].used = true;
										thisId = student_id_persist[index].id;
										break;
									} else index++;
								} 
								index = 0;
								while(true){ // do it again
									if(rows[index].used == false){
										rows[index].used = true;
										thisRow = rows[index].value.value; // <-- the mark of a pro, descriptive index names
										thisTaskId = rows[index].value.task_id;
										break;
									} else index++;
								} // format the data like the webpage is expecting
								toReturn.push({task_id: thisTaskId, value: thisRow, student_id: thisId, task_name: task_name[0].name});
							}, 50);
						} 
					} 
					persist.setValue(toReturn); //save all the data for the next iteration of the loop
				});
			}
			setTimeout(function(){ //lots of async functions, so we'll wait a bit
				var toReturn = persist.getValue();
				call(toReturn, 'local');
			}, 250);
		});
	} else if(data == "requested=tasknames"){
		this.query("SELECT DISTINCT `name` FROM `task`", function(response, callback){
			var toReturn = [];
			if (response.rows && response.rows.length) {
				toReturn['error'] = false;
				for(var i=0; i<response.rows.length; i++){
					toReturn.push(response.rows.item(i));
				} 
			} else toReturn['error'] = true; 
			call(toReturn, 'local');
		});
	}
	
}

resultsDatabase.prototype.getArgs = function(data){
	var pairs = data.split("&"); 
	var keyvalue = [];
	for(var i=0; i<pairs.length; i++){
		var splitValues = pairs[i].split("=");
		keyvalue.push({key: splitValues[0], value: splitValues[1]});
	}
	return keyvalue; 
}

resultsDatabase.prototype.destroyAndRebuild = function(){
	this.query("DROP TABLE IF EXISTS `course`", callback);
	this.query("DROP TABLE IF EXISTS `student`", callback);
	this.query("DROP TABLE IF EXISTS `task`", callback);
	this.query("DROP TABLE IF EXISTS `task_type`", callback);
	this.query("DROP TABLE IF EXISTS `course_student_task_attempt`", callback);
	this.syncWithServer();
}

function callback(response){
	if (response.rows && response.rows.length) {
		for(var i=0; i<response.rows.length; i++){
			console.log(response.rows.item(i));
		}
	}
}

var persistantVariable = function(){
	this.value = [];
}

persistantVariable.prototype.setValue = function(newVal){
	this.value = newVal;
}

persistantVariable.prototype.getValue = function(){
	return this.value; 
}

persistantVariable.prototype.pushValue = function(toPush){
	this.value.push(toPush);
}
