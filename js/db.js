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
			if(callback.callback != undefined) callback.callback(results, callback.context, callback.identifier, callback.onFinish); 
			else callback(results);
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
	var qs = new queryStack(this);
	if(data == "requested=coursename"){ //This query is run on the index page. It simply gets the course names and ids
		qs.addQuery("SELECT DISTINCT `name`, `id` FROM `course` WHERE 1", "name");
		qs.triggerStack(function(data){
			call(data, 'local'); 
		}); 
	}
	else if(data.search("requested=students") > -1){ //this string will probably look like "requested=students&id=1", so I can't just match it
		var keyvalue = this.getArgs(data); 
		qs.addQuery("SELECT DISTINCT `student_id`, `id` FROM `course_student` WHERE `course_id` = '"+keyvalue[0].value+"'", "course_student");
		qs.triggerStack(function(data){
			for(var i=0; i<data.course_student.length; i++){
				qs.addQuery("SELECT DISTINCT `firstName`, `lastName`, `code`, `id` FROM `student` WHERE `id` = '"+data.course_student[i].student_id+"'", "student");
				qs.addQuery("SELECT `task_id`, `value`, `course_student_id` FROM `course_student_task_attempt` WHERE `course_student_id` = '"+data.course_student[i].id+"'", "course_student_task_attempt"); 
			}
			qs.triggerStack(function(data){
				for(var i=0; i<data.course_student_task_attempt.length; i++){
					qs.addQuery("SELECT `name`, `operator`, `value` FROM `task` WHERE `id` = '"+data.course_student_task_attempt[i].task_id+"'", "task"); 
				}
				qs.triggerStack(function(data){
					call(data, 'local'); 
				});
			});
		});
		
	} else if(data == "requested=tasknames"){
		qs.addQuery("SELECT DISTINCT `name` FROM `task`", "taskname");
		qs.triggerStack(function(data) {
			call(qs.data, 'local');
		});
	}
	
	else if(data.search("requested=examineStudent") > -1){
		/* var keyvalue = this.getArgs(data);
		var toReturn = new persistantVariable();
		this.query("SELECT DISTINCT `course_id` FROM `course_student` WHERE `student_id` = '"+keyvalue[0].value+"'", function(response, callback){
			if (response.rows && response.rows.length) {
				for(var i=0; i<response.rows.length; i++){
					toReturn.pushValue(response.rows.item(i));
				} 
			} else toReturn.error = true; 
		});
		
		var course_ids = toReturn.getValue();
		for(var i=0; i<course_ids.length; i++){
			this.query("SELECT `name` FROM `course` WHERE `id` ='"+course_ids[i].course_id+"'", function(response, callback){
				if (response.rows && response.rows.length) {
					for(var j=0; j<response.rows.length; j++){
						toReturn.pushValue(response.rows.item(i));
					} 
				} else toReturn.error = true; 
			});
		} */
		
	}
}

resultsDatabase.prototype.getArgs = function(data){
	var pairs = data.split("&"); 
	var keyvalue = [];
	for(var i=1; i<pairs.length; i++){
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
	this.error = false; 
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

var queryStack = function(db){
	this.stack = []; 
	this.db = db; 
	this.data = [];
	this.data["error"] = false; 
	this.reportingIn = 0; 
	this.lastResultCount = 0; 
}

queryStack.prototype.addQuery = function(query, identifier){
	this.stack.push({q: query, identifier: identifier}); 
}

queryStack.prototype.triggerStack = function(onFinish){
	this.nextQuery(0, onFinish); 
}

queryStack.prototype.nextQuery = function(index, onFinish){
	if(this.stack[index] != undefined){
		this.db.query(this.stack[index].q, {callback: qCallback, context: this, identifier: this.stack[index].identifier, onFinish: onFinish});
		this.nextQuery(index+1, onFinish); 
	} 
}

queryStack.prototype.hasNewResults = function(){
	if(this.data.length > this.lastResultCount){
		this.lastResultCount = this.data.length; 
		return true; 
	} else return false; 
}

function qCallback(response, context, identifier, onFinish){
	if (response.rows && response.rows.length) {
		if(context.data[identifier] == undefined) context.data[identifier] = []; 
		for(var i=0; i<response.rows.length; i++){
			context.data[identifier].push(response.rows.item(i));
		}
	}
	
	context.reportingIn++; 
	if(context.reportingIn == context.stack.length){ context.stack = []; onFinish(context.data); context.reportingIn = 0;}
}
