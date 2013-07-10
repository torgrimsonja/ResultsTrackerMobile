
/**
 * An object representing the local sqllite database, complete with various functions to interact with it. 
 */

var resultsDatabase = function() {
	this.db, this.complete = false, this.createAsync = 0; 
}

/**
 * Initialize the local database, and check if it is filled with data already (the actual checking takes place in another function). 
 * @param {int} size - Ignored if above 5MB, specifies database size 
 */ 

resultsDatabase.prototype.initDb = function(){
	console.log("Initializing local database");
	try {
		if(device) {
			resultsDatabase.db = window.sqlitePlugin.openDatabase("resultsTracker");
			console.log("Using SQLite plugin.");
		} 
	}
	catch(e){
		if(e.message == 'device is not defined'){ //phonegap not loaded
			try {
				resultsDatabase.db = openDatabase("resultsTracker","0.5","Results Tracker Local Database", 1000000);
				console.log("Using web SQL"); 
			} catch (e) {
				console.log(e.message); 
			}
		}
	}
	
	this.checkIfLoaded();
}
/**
 * Checks if the database is loaded by selecting a specific row. If it isn't loaded, this function will initiate the sync. 
 */ 

resultsDatabase.prototype.checkIfLoaded = function(){
	var ref = this; 
	console.log("Checking if database exists...");
	resultsDatabase.db.transaction(function(tx){
		tx.executeSql("SELECT * FROM `task_type` WHERE 1 LIMIT 1",[],function(tx, res){
			console.log("result: "+res);
			if(res.rows && res.rows.length){ 
				ref.complete = true;
				$(document).trigger("databaseready"); 
			}
		});
	}, function(e){
		console.log("does not exist.");
		ref.downloadServer(); 
	});
}

/**
 * Downloads all the SQL data needed from the master mySql server. 
 */

resultsDatabase.prototype.downloadServer = function(){
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

/**
 * The callback from downloading the server data. Builds the sqlite database from the response data. 
 * @param {object} response - JSON response from the master server with all needed server data. 
 */

resultsDatabase.prototype.syncResponse = function(response){
	var qz = new queryStack(this); 
	
	response = $.parseJSON(response);
	var queriesToMake = 0; 
	if(!response.error){ //TODO: pull table structure from server
		qz.addQuery("CREATE TABLE IF NOT EXISTS `course`(`id` , `user_id`, `name`, `active`, `timestamp`)", asyncCounter); queriesToMake++; 
		for(var i=0; i<response.course.length; i++){
			qz.addQuery("INSERT INTO `course`(`id`,`name`,`active`,`timestamp`, `user_id`) VALUES ('"+response.course[i].id+"', '"+response.course[i].name+"', '"+response.course[i].active+"', '"+response.course[i].timestamp+"', '"+response.course[i].user_id+
			"')", asyncCounter);// WHERE NOT EXISTS (SELECT * FROM `course` WHERE `name` = '"+response.course[i].name+"')", callback);
			queriesToMake++; 
		}
		
		qz.addQuery("CREATE TABLE IF NOT EXISTS `course_student` ( `id` , `student_id`, `course_id`, `timestamp`)", asyncCounter); queriesToMake++; 
		for(var i=0; i<response.course_student.length; i++){
			qz.addQuery("INSERT INTO `course_student` (`id` , `student_id`, `course_id`, `timestamp`) VALUES ('"+response.course_student[i].id+"', '"+response.course_student[i].student_id+
			"', '"+response.course_student[i].course_id+"', '"+response.course_student[i].timestamp+
			"')", asyncCounter); //WHERE NOT EXISTS (SELECT * FROM `course_student` WHERE `id` = '"+response.course_student[i].id+"')", callback);
			queriesToMake++; 
		}
		
		qz.addQuery("CREATE TABLE IF NOT EXISTS `student` (`id` , `firstName`, `lastName`, `gender`, `dateOfBirth`, `code`)", asyncCounter); queriesToMake++; 
		for(var i=0; i<response.student.length; i++){
			qz.addQuery("INSERT INTO `student`( `id` , `firstName`, `lastName`, `gender`, `dateOfBirth`, `code`) VALUES ('"+response.student[i].id+"', '"+response.student[i].firstName+
			"', '"+response.student[i].lastName+"', '"+response.student[i].gender+"', '"+response.student[i].dateOfBirth+"', '"+response.student[i].code+
			"')", asyncCounter); //WHERE NOT EXISTS (SELECT * FROM `student` WHERE `id` = '"+response.student[i].id+"')", callback);
			queriesToMake++; 
		}
		
		qz.addQuery("CREATE TABLE IF NOT EXISTS `task` (`id` , `type_id`, `operator`, `name`, `description`, `value`, `timestamp`, `age`, `gender`)", asyncCounter); queriesToMake++; 
		for(var i=0; i<response.task.length; i++){
			qz.addQuery("INSERT INTO `task`(`id` , `type_id`, `operator`, `name`, `description`, `value`, `timestamp`, `age`, `gender`) VALUES ('"+response.task[i].id+"', '"+response.task[i].type_id+
			"', '"+response.task[i].operator+"', '"+response.task[i].name+"', '"+response.task[i].description+"', '"+response.task[i].value+"', '"+response.task[i].timestamp+"', '"+response.task[i].age+"', '"+response.task[i].gender+
			"')", asyncCounter); //WHERE NOT EXISTS (SELECT * FROM `task` WHERE `id` = '"+response.task[i].id+"')", callback);
			queriesToMake++; 
		}
		
		qz.addQuery("CREATE TABLE IF NOT EXISTS `course_student_task_attempt` (`id`, `course_student_id`, `task_id`, `value`, `timestamp`)", asyncCounter); queriesToMake++; 
		for(var i=0; i<response.course_student_task_attempt.length; i++){
			qz.addQuery("INSERT INTO `course_student_task_attempt`(`id`, `course_student_id`, `task_id`, `value`, `timestamp`) VALUES ('"+response.course_student_task_attempt[i].id+"', '"+response.course_student_task_attempt[i].course_student_id+
			"', '"+response.course_student_task_attempt[i].task_id+"', '"+response.course_student_task_attempt[i].value+"', '"+response.course_student_task_attempt[i].timestamp+
			"')", asyncCounter); //WHERE NOT EXISTS (SELECT * FROM `task` WHERE `id` = '"+response.task[i].id+"')", callback);
			queriesToMake++; 
		}
		
		qz.addQuery("CREATE TABLE IF NOT EXISTS `task_type` (`id`, `name`, `timestamp`)", asyncCounter); queriesToMake++; 
		for(var i=0; i<response.task_type.length; i++){
			qz.addQuery("INSERT INTO `task_type`(`id`, `name`, `timestamp`) VALUES ('"+response.task_type[i].id+"', '"+response.task_type[i].name+
			"', '"+response.task_type[i].timestamp+
			"')", asyncCounter); //WHERE NOT EXISTS (SELECT * FROM `task` WHERE `id` = '"+response.task[i].id+"')", callback);
			queriesToMake++; 
		}
		
		qz.addQuery("CREATE TABLE IF NOT EXISTS `device` (`id`, `prop_name`, `prop_value`)", asyncCounter); queriesToMake++; 
		
		qz.triggerStack(function(data){ console.log("here!"); $(document).trigger("databaseready"); });
		//this.dumpDbInConsole();
	}
}

function defaultCallback(data){}

function dumpCallback(data){
	if(data.rows && data.rows.length)
		for(var i=0; i<data.rows.length; i++)
			console.log(data.rows[i]); 
}

/**
 * Queries the local database, and calls the callback with the results. 
 * @param {string} q - The SQL query. 
 * @param {function} callback - To be called with the results of the query. 
 */ 

resultsDatabase.prototype.query = function(q, callback){
	resultsDatabase.db.transaction(function (tx) {
		tx.executeSql(q, [], function(tx, results){
			if(callback.callback != undefined) callback.callback(results, callback.context, callback.identifier, callback.onFinish); 
			else callback(results);
		});
	});
}

/**
 * For debugging, this function dumps the entire contents of the database (or at least all of the hardcoded tables) into the console. 
 */ 

resultsDatabase.prototype.dumpDbInConsole = function(){
	this.query("SELECT * FROM `course` ", dumpCallback);
	this.query("SELECT * FROM `student`", dumpCallback);
	this.query("SELECT * FROM `task`", dumpCallback);
	this.query("SELECT * FROM `task_type`", dumpCallback);
	this.query("SELECT * FROM `course_student_task_attempt`", dumpCallback);
}

/**
 * Runs a series of iterative queries based on a keyword. For example, providing 'requested=students' will go through all steps needed to get 
 * a list of students from the database and calls the callback with the results. ASYNC 
 * @param {string} data - Intended to mimic a POST/GET key->value pair, such that an identical query could be run on the master server proper. Should look like "requested=whatever".
 * @param {function} callback - Function to be called with the results. 
 */ 

resultsDatabase.prototype.localQuery = function(data, callback){
	var call = callback; //I use the name "callback" elsewhere
	var ref = this; //I keep this reference around to use prototype methods deeper in
	var qs = new queryStack(this);
	if(data == "requested=coursename"){ //This query is run on the index page. It simply gets the course names and ids
	var returned = false;
		qs.addQuery("SELECT DISTINCT `name`, `id` FROM `course` WHERE 1", "name");
		qs.triggerStack(function(data){
			if(!returned){ call(data, 'local'); returned = true; } 
		}); 
	}
	else if(data.search("requested=students") > -1){ //this string will probably look like "requested=students&id=1", so I can't just match it
		var returned = false,
		keyvalue = this.getArgs(data); 
		qs.addQuery("SELECT DISTINCT `student_id`, `id` FROM `course_student` WHERE `course_id` = '"+keyvalue[0].value+"'", "course_student");
		qs.triggerStack(function(data){
			if(data.course_student != undefined){
				for(var i=0; i<data.course_student.length; i++){
					qs.addQuery("SELECT DISTINCT `firstName`, `lastName`, `code`, `id` FROM `student` WHERE `id` = '"+data.course_student[i].student_id+"'", "student");
					qs.addQuery("SELECT `task_id`, `value`, `course_student_id` FROM `course_student_task_attempt` WHERE `course_student_id` = '"+data.course_student[i].id+"'", "course_student_task_attempt"); 
				}
			}
			qs.triggerStack(function(data){
				if(data.course_student_task_attempt != undefined){
					for(var i=0; i<data.course_student_task_attempt.length; i++){
						qs.addQuery("SELECT `name`, `operator`, `value` FROM `task` WHERE `id` = '"+data.course_student_task_attempt[i].task_id+"' LIMIT 1", "task"); 
					}
				} 
				qs.triggerStack(function(data){
					if(!returned){ call(data, 'local'); returned = true; }; 
				});
			});
		});
		
	} else if(data == "requested=tasknames"){
		qs.addQuery("SELECT DISTINCT `name` FROM `task`", "taskname");
		var returned = false; 
		qs.triggerStack(function(data) {
			if(!returned){ call(qs.data, 'local'); returned = true; }
		});
	}
	
	else if(data.search("requested=examineStudent") > -1){
		var keyvalue = this.getArgs(data),
		returned = false; 
		qs.addQuery("SELECT DISTINCT `course_id`, `id` FROM `course_student` WHERE `student_id` = '"+keyvalue[0].value+"'", "course_student");
		qs.triggerStack(function(data){
			for(var i=0; i<data.course_student.length; i++){
				qs.addQuery("SELECT `name` FROM `course` WHERE `id` ='"+data.course_student[i].course_id+"'", "course");
				qs.addQuery("SELECT `task_id`, `value` FROM `course_student_task_attempt` WHERE `course_student_id` ='"+qs.data.course_student[i].id+"'", "course_student_task_attempt");
			}
			
			qs.triggerStack(function(data){
				if(!returned){ call(data, 'local'); returned = true; }
			});
		});	
	} else if (data == "uniqueId"){
		var returned = false; 
		qs.addQuery("SELECT `prop_value` FROM `device` WHERE `prop_name` = 'device_id' LIMIT 1", "device_id");
		qs.triggerStack(function(data){ if(!returned){ call(data, 'local'); returned = true; }}); 
	}
	
	else if (data == "auth"){
		var returned = false; 
		qs.addQuery("SELECT `prop_value` FROM `device` WHERE `prop_name` = 'username' LIMIT 1", "username"); 
		qs.addQuery("SELECT `prop_value` FROM `device` WHERE `prop_name` = 'passHash' LIMIT 1", "passHash");
		qs.triggerStack(function(data){ if(!returned){ call(data, 'local'); returned = true; }});
	}
	
	else if (data == "logout"){
		console.log("database logging out");
		qs.addQuery("DELETE FROM `device` WHERE `prop_name` = 'username' OR `prop_name` = 'passHash'", "none");
		qs.triggerStack(function(data){ call(data, 'local');});
	}
}

/**
 * Parses a key->value pair. 
 * @param {string} data - The key->value pair string to be parsed. 
 */ 

resultsDatabase.prototype.getArgs = function(data){
	var pairs = data.split("&"); 
	var keyvalue = [];
	for(var i=1; i<pairs.length; i++){
		var splitValues = pairs[i].split("=");
		keyvalue.push({key: splitValues[0], value: splitValues[1]});
	}
	return keyvalue; 
}

/**
 * For debugging, drops all hardcoded tables and redownloads them. 
 */

resultsDatabase.prototype.destroyAndRebuild = function(){
	this.query("DROP TABLE IF EXISTS `course`", callback);
	this.query("DROP TABLE IF EXISTS `student`", callback);
	this.query("DROP TABLE IF EXISTS `task`", callback);
	this.query("DROP TABLE IF EXISTS `task_type`", callback);
	this.query("DROP TABLE IF EXISTS `course_student_task_attempt`", callback);
	this.query("");
	this.downloadServer();
}

/**
 * An object that represents a stack of queries to be executed asynchronously but in a certain order. 
 * Actually, this obejct basically turns async queries into sync queries. 
 * @param {resultsDatabase} db - The resultsDatabase object (i.e. the database). 
 */

var queryStack = function(db){
	this.stack = []; 
	this.db = db; 
	this.data = [];
	this.data["error"] = false; 
	this.reportingIn = 0; 
	this.lastResultCount = 0; 
}

/**
 * Translates a query and identifier into an object and adds it to the querystack. 
 * @param {string} query - the SQL query.
 * @param {string} identifier - after the query is run, the data is stored in an object with this provided identifier. 
 */ 

queryStack.prototype.addQuery = function(query, identifier){
	this.stack.push({q: query, identifier: identifier}); 
}

/**
 * Activates running all of the queries in the stack, in order. 
 * @param {function} onFinish - To be called when all queries have been run. 
 */

queryStack.prototype.triggerStack = function(onFinish){
	this.nextQuery(0, onFinish); 
}

/**
 * Gets the next query in the stack, runs it, and stores the results. Calls itself until there are not more queries, at which point it calls the callback. 
 * @param {int} index - The index of the querystack of the current query. 
 * @param {function} onFinish - The callback function. 
 */ 

queryStack.prototype.nextQuery = function(index, onFinish){
	if(this.stack[index] != undefined){
		this.db.query(this.stack[index].q, {callback: qCallback, context: this, identifier: this.stack[index].identifier, onFinish: onFinish});
		this.nextQuery(index+1, onFinish); 
	}
	try{ if(this.stack == undefined || !(this.stack.length>0)) onFinish(this.data); } catch(e){} //this is used when a querystack is triggered with no queries
}

/**
 * Checks if the last query returned rows. 
 */

queryStack.prototype.hasNewResults = function(){
	if(this.data.length > this.lastResultCount){
		this.lastResultCount = this.data.length; 
		return true; 
	} else return false; 
}

/**
 * The callback that actually stores the resultset in an object. Also, increments the "reporting in" integer that allows an observer to know if all of the async queries have executed or not. 
 * @param {object} response - The SQL resultset that is a result of a query. 
 * @param {object} context - The object the data is being stored in. 
 * @param {string} identifier - The name the new data is to be stored as in the object. 
 * @param {function} onFinish - The final callback function. Called when the number of queries "reporting in" equals the length of the querystack.
 */

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
