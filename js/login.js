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

function reg(){
	var userValidated = /[A-z0-9_\-]{3,16}/.exec($('#regUsername').val());
	if(userValidated !== null && userValidated[0] === userValidated.input) console.log("username valid"); 
	else $('#regUsernameError').text("Invalid username. Allowed characters: A-z0-9_-");
	
	var regPass1Validated = /.{6,32}/.exec($('#regPass1').val()); 
	if(regPass1Validated !== null && regPass1Validated[0] === regPass1Validated.input){
		if(regPass1Validated[0] === $('#regPass2').val()) console.log("password valid and matching");
		else $('#regPasswordError').text("Passwords do not match."); 
	}
	else $('#regPasswordError').text("Invalid password. Passwords must be 6 to 32 characters long.");
}