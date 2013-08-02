$('#addCourse-landing').on("pagebeforeshow", function(){
	if(currentCourse.name != null) $('#courseNameField').val(currentCourse.name); 
});

function saveCourse(){
	currentCourse.name = escapeSqlString($('#courseNameField').val());
	if(currentCourse.name.length > 0){
		db.localQuery(currentCourse, function(x){
			console.log("saved");
			sync(false);
			$('#addCourse-landing').dialog('close');
			listCourses();
			currentCourse.reset();
		}); 
	} else currentCourse.reset(); 
}

function cancelCourse(){

}

function manageStudents(){
	courseToLoad = 'new';
	currentCourse.name = $('#courseNameField').val();
	$('#studentManageLink').click();
}

