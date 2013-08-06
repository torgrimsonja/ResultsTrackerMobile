var temporaryCourse = { 
	name: null, 
	potentialStudents: [],
	confirmedStudents: [],
	requested: 'newCourse',
	reset: function(){
		this.name = null; 
		this.potentialStudents = [];
		this.confirmedStudents = [];
		this.requested = 'newCourse';
	},
	getFromCurrent: function(){
		this.name = currentCourse.name;
		this.potentialStudents = currentCourse.potentialStudents; 
		this.confirmedStudents = currentCourse.confirmedStudents;
		this.requested = currentCourse.requested;
	}
};

$('#studentManage-landing').on("pagebeforeshow", function(){
	getStudentList(); 
});

function getStudentList(){
	temporaryCourse.getFromCurrent();
	db.localQuery('requested=assocStudents&userId='+user.id+'&course='+courseToLoad, function(response){
		if(!response.error){
			if(response.hasOwnProperty("student_in")){
				for(var i=0; i<response.student_in.length; i++){
					var thisStudent = response.student_in[i], found = false; 
					for(var j=0; j<temporaryCourse.potentialStudents.length; j++) if(temporaryCourse.potentialStudents[j].id == thisStudent.id) found = true; 
					if(!found){ 
						temporaryCourse.potentialStudents.push(thisStudent); 
						$('#studentList').append($('<li data-index="'+(temporaryCourse.potentialStudents.length-1)+'">'+response.student_in[i].firstName+' '+response.student_in[i].lastName+
						'<span class="ui-icon ui-icon-check ui-icon-shadow" style="float: right;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></li>').on("click",function(){
							var index = $(this).attr("data-index");
							if($(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').length > 0){ 
								$(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').remove();
								var arrInd; 
								for(var k=0;k<temporaryCourse.confirmedStudents.length;k++) if(temporaryCourse.confirmedStudents[k].id == temporaryCourse.potentialStudents[index].id) arrInd = k; 
								temporaryCourse.confirmedStudents.remove(arrInd);
							}
							else{
								$(this).append($('<span class="ui-icon ui-icon-check ui-icon-shadow" style="float: right;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>')); 
								temporaryCourse.confirmedStudents.push(temporaryCourse.potentialStudents[index]); 
							}
						}));
						temporaryCourse.confirmedStudents.push(temporaryCourse.potentialStudents[temporaryCourse.potentialStudents.length-1]); 
					}
				}
			}
			
			if(response.hasOwnProperty("student_out")){
				for(var i=0; i<response.student_out.length; i++){
					var thisStudent = response.student_out[i], found = false; 
					for(var j=0; j<temporaryCourse.potentialStudents.length; j++) if(temporaryCourse.potentialStudents[j].id == thisStudent.id) found = true; 
					if(!found){ 
						temporaryCourse.potentialStudents.push(thisStudent); 
						$('#studentList').append($('<li data-index="'+(temporaryCourse.potentialStudents.length-1)+'">'+response.student_out[i].firstName+' '+response.student_out[i].lastName+'</li>').on("click",function(){
							var index = $(this).attr("data-index");
							if($(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').length > 0){ 
								$(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').remove();
								var arrInd; 
								for(var k=0;k<temporaryCourse.confirmedStudents.length;k++) if(temporaryCourse.confirmedStudents[k].id == temporaryCourse.potentialStudents[index].id) arrInd = k; 
								temporaryCourse.confirmedStudents.remove(arrInd);
							}
							else{
								$(this).append($('<span class="ui-icon ui-icon-check ui-icon-shadow" style="float: right;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>')); 
								temporaryCourse.confirmedStudents.push(temporaryCourse.potentialStudents[index]); 
							}
						}));
					}
				}
			}
						
			var listitems = $('#studentList').children('li').get();
			listitems.sort(function(a, b) {
			   return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase());
			})
			$.each(listitems, function(idx, itm) { $('#studentList').append(itm); });
			$('#studentList' ).listview('refresh');
		}
	});
}

function saveStudents(){
	currentCourse = temporaryCourse;
	if(courseToLoad == 'new'){
		$("#studentManage-landing").dialog('close');	
		temporaryCourse.reset(); 
	} else {
		currentCourse.requested = "editStudents";
		db.localQuery(currentCourse, function(data){
			$("#studentManage-landing").dialog('close');
			currentCourse.reset();
		});
	}
	
}

function cancel(){
	currentCourse.reset();
	$("#studentManage-landing").dialog('close');	
}

function saveNewStudent(){
	$('#errorBox').html('');
	$('#saveButton').parent().find('.ui-btn-inner').css("background-color","lightgreen").parent().find('.ui-btn-text').html('Saving...');
	var gender = 'Female';
	if($('#genderM').is(':checked')) gender = 'Male';
	db.localQuery("requested=insertNewStudent&fName="+$('#fName').val()+"&lName="+$('#lName').val()+"&gender="+gender+
	"&dob="+$('#dob').val(), function(response){
		if(!response.error){
			$('#addStudent-popup').popup('close'); 
			$('#studentList').html('');
			currentCourse.reset();
			getStudentList();
		} else {
			for(var i=0; i<response.errors.length; i++){
				switch(response.errors[i]){
					case "firstName":
						$('#errorBox').append('<span> Invalid first name. Alphanumeric characters, hyphens, spaces, and apostrophes only. </span><br>');
					break;
					case "lastName":
						$('#errorBox').append('<span> Invalid last name. Alphanumeric characters, hyphens, spaces, and apostrophes only. </span><br>');
					break;
					case "gender":
						$('#errorBox').append('<span> We didn\'t recieve a gender on our end. Please try again. </span><br>');
					break;
					case "date":
						$('#errorBox').append('<span> That date appears to be invalid. Please try again. </span><br>');
					break;
				}
			}
		}
		$('#saveButton').parent().find('.ui-btn-inner').css("background-color","").parent().find('.ui-btn-text').html('Save');
	});
}

function getDeleteStudentList(){
	var inList = []; 
	
	$('#deleteStudentList').html('');
	db.localQuery('requested=assocStudents&userId='+user.id+'&course='+courseToLoad, function(response){ console.log(response);
		if(response.hasOwnProperty("student_in")){
			for(var i=0; i<response.student_in.length; i++){
				var thisStudent = response.student_in[i], found = false; 
				if(inList.indexOf(thisStudent.code) < 0){
					inList.push(thisStudent.code); 
					$('#deleteStudentList').append($('<li data-index="'+inList.indexOf(thisStudent.code)+'" >'+response.student_in[i].firstName+' '+response.student_in[i].lastName+'</li>').one("click", function(){
						listDeleteClick($(this), inList);
						console.log(thisStudent.code);
					}));
				}
			}
		}
		
		if(response.hasOwnProperty("student_out")){
			for(var i=0; i<response.student_out.length; i++){
				var thisStudent = response.student_out[i], found = false; 
				if(inList.indexOf(thisStudent.code) < 0){
					inList.push(thisStudent.code); 
					$('#deleteStudentList').append($('<li data-index="'+inList.indexOf(thisStudent.code)+'">'+response.student_out[i].firstName+' '+response.student_out[i].lastName+'</li>').one("click", function(){
						listDeleteClick($(this), inList);
						console.log(thisStudent.code);
					}));
				}
			}
		}
					
		var listitems = $('#deleteStudentList').children('li').get();
		listitems.sort(function(a, b) {
		   return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase());
		})
		$.each(listitems, function(idx, itm) { $('#deleteStudentList').append(itm); });
		$('#deleteStudentList' ).listview('refresh');
	});
}
function listDeleteClick(el, inList){
	var origHtml = el.html();
	el.html('').append($('<p><em>Are you sure you wish to delete this student?</em></p>')).append($('<input type="button" value="Yes" />').one("click", function(){
		db.localQuery("requested=deleteStudent&studentCode="+inList[parseInt(el.attr("data-index"))], function(response){
			$('#deleteStudent-popup').popup('close');
			getStudentList();
		});
	}));
	el.append($('<input type="button" value="No" />').one("click", function(){
		getDeleteStudentList(); //I can't reset the html of this element from here for some reason, so this will have to do
	}));
	el.trigger('create');
}
