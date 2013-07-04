function submitForm(prevAuthed){
	if(!prevAuthed){
		$('#generalError').text(""); 
		auth($('#username').val(), $('#password').val());
	}
	else { 
		$('#generalError').text("Login credentials rejected. Please try again."); 
	}
}

function auth(uname, pword){
	$.ajax({
		url: REMOTE_PATH+'/mobile_app/check_credentials.php',
		success: function(data, status, jqXHR) {
			user.authed = $.parseJSON(jqXHR.responseText).authenticated ? true : false; 
			if(!user.authed) submitForm(true); 
			else { 
				user.passHash = pword; 
				user.username = uname; 
				$.mobile.changePage("index.html"); 
				listCourses(); 
			}
		},
		type: 'POST',
		data: 'username='+uname+'&password='+hex_sha1(pword)
	});
}

function deviceRegister(){
	$.ajax({
		url: REMOTE_PATH+'/mobile_app/device_register.php',
		success: function(data, status, jqXHR){
			return $.parseJSON(jqXHR.responseText); 
		},
		type: 'POST',
		data: 'deviceType=' //+ phonegap native thing 
	}); 
}