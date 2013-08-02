
$('#studentManage-landing').on("pagebeforeshow", function(){
	db.localQuery('requested=assocStudents&userId='+user.id+'&course='+courseToLoad, function(response){
		if(!response.error){
			if(response.hasOwnProperty("student_in")){
				for(var i=0; i<response.student_in.length; i++){
					var thisStudent = response.student_in[i], found = false; 
					for(var j=0; j<currentCourse.potentialStudents.length; j++) if(currentCourse.potentialStudents[j].id == thisStudent.id) found = true; 
					if(!found){ 
						currentCourse.potentialStudents.push(thisStudent); 
						$('#studentList').append($('<li data-index="'+(currentCourse.potentialStudents.length-1)+'">'+response.student_in[i].firstName+' '+response.student_in[i].lastName+
						'<span class="ui-icon ui-icon-check ui-icon-shadow" style="float: right;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></li>').on("click",function(){
							var index = $(this).attr("data-index");
							if($(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').length > 0){ 
								$(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').remove();
								var arrInd; 
								for(var k=0;k<currentCourse.confirmedStudents.length;k++) if(currentCourse.confirmedStudents[k].id == currentCourse.potentialStudents[index].id) arrInd = k; 
								currentCourse.confirmedStudents.remove(arrInd);
							}
							else{
								$(this).append($('<span class="ui-icon ui-icon-check ui-icon-shadow" style="float: right;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>')); 
								currentCourse.confirmedStudents.push(currentCourse.potentialStudents[index]); 
							}
						}));
						currentCourse.confirmedStudents.push(currentCourse.potentialStudents[currentCourse.potentialStudents.length-1]); 
					}
				}
			}
			
			if(response.hasOwnProperty("student_out")){
				for(var i=0; i<response.student_out.length; i++){
					var thisStudent = response.student_out[i], found = false; 
					for(var j=0; j<currentCourse.potentialStudents.length; j++) if(currentCourse.potentialStudents[j].id == thisStudent.id) found = true; 
					if(!found){ 
						currentCourse.potentialStudents.push(thisStudent); 
						$('#studentList').append($('<li data-index="'+(currentCourse.potentialStudents.length-1)+'">'+response.student_out[i].firstName+' '+response.student_out[i].lastName+'</li>').on("click",function(){
							var index = $(this).attr("data-index");
							if($(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').length > 0){ 
								$(this).children('.ui-icon.ui-icon-check.ui-icon-shadow').remove();
								var arrInd; 
								for(var k=0;k<currentCourse.confirmedStudents.length;k++) if(currentCourse.confirmedStudents[k].id == currentCourse.potentialStudents[index].id) arrInd = k; 
								currentCourse.confirmedStudents.remove(arrInd);
							}
							else{
								$(this).append($('<span class="ui-icon ui-icon-check ui-icon-shadow" style="float: right;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>')); 
								currentCourse.confirmedStudents.push(currentCourse.potentialStudents[index]); 
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
});

function saveStudents(){
	if(courseToLoad == 'new'){
		$("#studentManage-landing").dialog('close');
		currentCourse.reset();
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
	saveStudents();
}
