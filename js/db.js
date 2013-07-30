
/**
 * An object representing the local sqllite database, complete with various functions to interact with it. 
 */

var resultsDatabase = function() {
	this.db, this.complete = false, this.createAsync = 0, this.syncingTables = ['course','course_student','course_student_task_attempt','course_task','student','task','task_type'];
}

/**
 * Initialize the local database, and check if it is filled with data already (the actual checking takes place in another function). 
 * 
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
	
	this.query("CREATE TABLE IF NOT EXISTS `device`(`rem_id` varchar(255), `prop_name` varchar(255), `prop_value` varchar(255))", function(){}); 
	
	this.checkIfLoaded(false);
}
/**
 * Checks if the database is loaded by selecting a specific row. If it isn't loaded, this function will initiate the sync. 
 * @param {boolean} download - Whether to start a full download of the database if it doesn't exist. 
 */ 

resultsDatabase.prototype.checkIfLoaded = function(download){
	var ref = this; 
	console.log("Checking if database exists...");
	resultsDatabase.db.transaction(function(tx){
		tx.executeSql("SELECT `prop_value` FROM `device` WHERE `prop_name` = 'username' LIMIT 1",[],function(tx, res){
			if(res.rows && res.rows.length){ 
				tx.executeSql("SELECT * FROM `task_type` WHERE 1 LIMIT 1",[],function(tx, result){
					if(result.rows != undefined && result.rows.length > 0){
						ref.complete = true;
						$(document).trigger("databaseready"); 
					} else ref.downloadServer();
				});
			} else {
				console.log("does not exist.");
				if(download){
					ref.downloadServer(); 
					console.log("downloading now.");
				} else {
					console.log("not downloading."); $('#openLogin').click(); 
				}
			}
		});
	}, function(e){
		console.log("does not exist.");
		if(download)ref.downloadServer(); 
	});
}

/**
 * Downloads all the SQL data needed from the master mySql server. To be used only on the initial sync. 
 */

resultsDatabase.prototype.downloadServer = function(){
	console.log("downloading db...");
	var ref = this; 
	$('body').append($('<div id="clickBlocker"></div>'));
	$.mobile.loading( "show", {
		text: "Syncing database...",
		textVisible: true,
		theme: "c",
		html: ""
	});
	syncEverythingBecauseNathanIsAwesomeAndLikesLongFunctionNames(0, '[]', this.syncResponse); 
}

/**
 * The callback from downloading the server data. Builds the sqlite database from the response data. 
 * @param {object} response - JSON response from the master server with all needed server data. 
 */

resultsDatabase.prototype.syncResponse = function(response){
	var qz = new queryStack(this); 
	if(!response.error){
		for(var prop in response){
			if(response.hasOwnProperty(prop)){
				var tableArr = []; 
				for(var k=0; k<response[prop][0].length; k++){
					tableArr.push('`'+escapeSqlString(response[prop][0][k])+'` varchar(255)'); 
				}	
				qz.addQuery("CREATE TABLE IF NOT EXISTS `"+prop+"` ("+tableArr.join(', ')+")"); 
				for(var j=1; j<response[prop].length; j++){
					var valueArr = []; 
					for(var vProp in response[prop][j]){
						valueArr.push("'"+escapeSqlString(response[prop][j][vProp])+"'");
					}
					qz.addQuery("INSERT INTO `"+prop+"` VALUES ("+valueArr.join(', ')+")");
				}				
			}
		}
		var d = new Date(); 
		qz.addQuery("INSERT INTO `device` (`prop_name`,`prop_value`) VALUES ('last_sync', '"+buildTimeString()+"')",'none'); 
		qz.triggerStack(function(data){$.mobile.loading("hide"); $('body').remove($('#clickBlocker')); $(document).trigger("databaseready"); });
	}
}

resultsDatabase.prototype.updateResponse = function(response){
	var qz = new queryStack(this); 
	if(!response.error){ 
		for(var prop in response){
			if(response.hasOwnProperty(prop)){
				for(var j=1; j<response[prop].length; j++){
					var valueArr = [], keyArr = []; 
					for(var vProp in response[prop][j]){
						valueArr.push("'"+escapeSqlString(response[prop][j][vProp])+"'");
						keyArr.push(vProp); 
					}
					if(response[prop][j].hasOwnProperty('id')){
						var rowId = response[prop][j].id, tableName = prop;
						qz.addQuery("SELECT * FROM `"+prop+"` WHERE `id` = '"+response[prop][j].id+"'","idCheck");
						qz.triggerStack(function(data){
							if(data.hasOwnProperty("idCheck")){
								delete data.idCheck;
								var qStr = 'UPDATE `'+tableName+'` SET '; 
								for(var i=0; i<keyArr.length; i++){
									qStr += "`"+keyArr[i]+"` = "+valueArr[i]+", ";
								} qStr = qStr.substring(0, qStr.length - 2) + ' WHERE `id` = '+rowId;
								qz.addQuery(qStr,'lol');
								qz.triggerStack(function(data){delete data.idCheck;}); 
							} else {
								qz.addQuery("INSERT INTO `"+tableName+"` VALUES ("+valueArr.join(', ')+")",'lol');
								qz.triggerStack(function(data){});
							}
						});
					} 
				}				
			}
		}
		qz.addQuery("UPDATE `device` SET `prop_value` = '"+buildTimeString()+"' WHERE `prop_name` = 'last_sync'",'lol');
		qz.triggerStack(function(data){$.mobile.loading("hide"); $('#clickBlocker').css("display","none"); console.log("db updated");});
	}
}

resultsDatabase.prototype.sync = function(){
	//$('body').append($('<div id="clickBlocker"></div>'));
	$.mobile.loading( "show", {
		text: "Syncing database...",
		textVisible: true,
		theme: "c",
		html: ""
	});
	db.getChanges(function(data){syncEverythingBecauseNathanIsAwesomeAndLikesLongFunctionNames(data.syncData[0].prop_value, stringifyEveryTable(data), function(x){db.updateResponse(x);});}); 
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
		qs.addQuery("SELECT DISTINCT `name`, `id` FROM `course` WHERE 1", "name");
		qs.triggerStack(function(data){
			call(data, 'local');
		}); 
	}
	else if(data.search("requested=students") > -1){ //this string will probably look like "requested=students&id=1", so I can't just match it
		var keyvalue = this.getArgs(data); 
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
						qs.addQuery("SELECT `name`, `operator`, `value`, `id` FROM `task` WHERE `id` = '"+data.course_student_task_attempt[i].task_id+"' LIMIT 1", "task"); 
					}
				} 
				qs.triggerStack(function(data){
					call(data, 'local');
				});
			});
		});
		
	} else if(data == "requested=tasknames"){
		qs.addQuery("SELECT DISTINCT `name`, `type_id` FROM `task`", "taskname");
		qs.triggerStack(function(data) {
			call(data, 'local');
		});
	}
	
	else if(data.search("requested=examineStudent") > -1){
		var keyvalue = this.getArgs(data),
		returned = false; 
		qs.addQuery("SELECT DISTINCT `course_id`, `rem_id` FROM `course_student` WHERE `student_id` = '"+keyvalue[0].value+"'", "course_student");
		qs.triggerStack(function(data){
			for(var i=0; i<data.course_student.length; i++){
				qs.addQuery("SELECT `name` FROM `course` WHERE `rem_id` ='"+data.course_student[i].course_id+"'", "course");
				qs.addQuery("SELECT `task_id`, `value` FROM `course_student_task_attempt` WHERE `course_student_id` ='"+qs.data.course_student[i].rem_id+"'", "course_student_task_attempt");
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
	
	else if (data.search("requested=insertNewAttempt") > -1){
		var keyvalue = this.getArgs(data),
		studentName = keyvalue[0].value.split(' '),
		value = keyvalue[1].value,
		taskName = keyvalue[2].value,
		courseId = keyvalue[3].value; 
		qs.addQuery("SELECT `gender`, `dateOfBirth`, `id` FROM `student` WHERE `firstName` = '"+studentName[0]+"' AND `lastName` = '"+studentName[1]+"'", "studentData"); 
		qs.triggerStack(function(data){
			qs.addQuery("SELECT `id` FROM `course_student` WHERE `student_id` = '"+data.studentData[0].id+"' AND `course_id` = '"+courseId+"' LIMIT 1", "course_student_id");
			qs.triggerStack(function(data){
				qs.addQuery("SELECT cast(((SELECT julianday('now') - julianday('"+data.studentData[0].dateOfBirth+"'))/365) as int) AS yearsOld", "dateData");
				qs.triggerStack(function(data){
					qs.addQuery("SELECT `id`, `operator`, `value`  FROM `task` WHERE `name` = '"+taskName+"' AND `age` = '"+data.dateData[0].yearsOld+"' AND `gender` = '"+data.studentData[0].gender.toLowerCase()+"' LIMIT 1", "taskData");	
					qs.triggerStack(function(data){
						if(data.taskData != undefined){
							var d = new Date(); 
							qs.addQuery("INSERT INTO `course_student_task_attempt` (`id`,`course_student_id`,`task_id`,`value`,`timestamp`) VALUES "+
								"((SELECT cast((SELECT MAX((`id`+0)) FROM `course_student_task_attempt`) as int) + 1), '"+data.course_student_id[0].id+"', "+ //implicit cast to int in the select max
								"'"+data.taskData[0].id+"', '"+value+"', '"+buildTimeString()+"')",'none'); 
							qs.triggerStack(function(data){call(data);}); 
						} else call({error: true, comments: 'The task "'+taskName+'" is not allowed for the student '+studentName[0]+' '+studentName[1]+'. Please check the Presidential Fitness standards.'});
					});
				});
			});
		});
	}
}

resultsDatabase.prototype.getChanges = function(call){
	var qz = new queryStack(this); 
	qz.addQuery("SELECT `prop_value` FROM `device` WHERE `prop_name` = 'last_sync' LIMIT 1", "syncData"); 
	qz.triggerStack(function(data){
		for(var i=0; i<db.syncingTables.length; i++) qz.addQuery("SELECT * FROM `"+db.syncingTables[i]+"` WHERE `timestamp` > '"+data.syncData[0].prop_value+"'",db.syncingTables[i]); 
		qz.triggerStack(function(data){call(data);}); 
	}); 
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
		db.query(this.stack[index].q, {callback: qCallback, context: this, identifier: this.stack[index].identifier, onFinish: onFinish});
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

function executeFuncsSynchronously(funcs, args, index){
	if(funcs.length == args.length){
		if(funcs[index+1] != undefined){
			db.localQuery(args[index], function(data){ funcs[index](data); executeFuncsSynchronously(funcs, args, index + 1); });
		} else db.localQuery(args[index], function(data){ funcs[index](data); });
	}
}

function stringifyEveryTable(obj){
	var stringified = '['; 
	if(obj.course != undefined)
		for(var i=0; i<obj.course_student.length; i++) stringified+=JSON.stringify(obj.course[i]).substring(0,JSON.stringify(obj.course[i]).length - 1)+", \"name\": \"course\"}, "; 
	if(obj.course_student != undefined)
		for(var i=0; i<obj.course_student.length; i++) stringified+=JSON.stringify(obj.course_student[i]).substring(0,JSON.stringify(obj.course_student[i]).length - 1)+", \"name\": \"course_student\"}, ";		
	if(obj.course_student_task_attempt != undefined) 
		for(var i=0; i<obj.course_student_task_attempt.length; i++) stringified+=JSON.stringify(obj.course_student_task_attempt[i]).substring(0,JSON.stringify(obj.course_student_task_attempt[i]).length - 1)+", \"name\": \"course_student_task_attempt\"}, ";
	if(obj.course_task != undefined) 
		for(var i=0; i<obj.course_task.length; i++) stringified+=JSON.stringify(obj.course_task[i]).substring(0,JSON.stringify(obj.course_task[i]).length - 1)+", \"name\": \"course_task\"}, ";
	if(obj.student != undefined)
		for(var i=0; i<obj.student.length; i++) stringified+=JSON.stringify(obj.student[i]).substring(0,JSON.stringify(obj.student[i]).length - 1)+", \"name\": \"student\"}, "; 	
	if(obj.task != undefined)
		for(var i=0; i<obj.task.length; i++) stringified+=JSON.stringify(obj.task[i]).substring(0,JSON.stringify(obj.task[i]).length - 1)+", \"name\": \"task\"}, ";
	if(obj.task_type != undefined) 
		for(var i=0; i<obj.task_type.length; i++) stringified+=JSON.stringify(obj.task_type[i]).substring(0,JSON.stringify(obj.task_type[i]).length - 1)+", \"name\": \"task_type\"}, ";	
	if(stringified !='[') return stringified.substring(0,stringified.length - 2)+']'; 
	else return false; 
}

/**
 * Builds a string with the current time/date formatted like a SQL timestamp, adjusting for the server running on EST.
 */ 

function buildTimeString(){
	var d = new Date(), 
	d2 = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours()-4, d.getUTCMinutes(), d.getUTCSeconds()));
	return d2.getUTCFullYear()+'-'+pad((d2.getUTCMonth()+1),2)+'-'+pad(d2.getUTCDate(),2)+' '+d2.toUTCString().substring(17,25)
}