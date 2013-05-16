var resultsDatabase = function() {
	this.db;
}

resultsDatabase.prototype.initDb = function(){
	console.log("Initializing local database");
	try {
		resultsDatabase.db = openDatabase("resultsTracker","0.5","Results Tracker Local Database", 200000);
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
				ref.dumpDbInConsole();
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
	console.log(response);
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
	//console.log("query: "+q);
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
}

function callback(response){
	if (response.rows && response.rows.length) {
		for(var i=0; i<response.rows.length; i++){
			console.log(response.rows.item(i));
		}
	}
}