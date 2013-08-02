
if(!(studentToLoad.length > 0)){ $('#student-landing-content').append('<h1 style="text-align: center;">There\'s been a mistake. Please return from whence you came.</h1>')} 
else {examineStudent(false);}


function examineStudent(response){
	if(response){
		console.log(response);
	} else {
		db.localQuery("requested=examineStudent&studentId="+studentToLoad+"&courseId="+courseToLoad, examineStudent);
	}

}