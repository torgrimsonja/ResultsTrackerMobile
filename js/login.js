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
		url: REMOTE_PATH+'mobile_app/check_credentials.php',
		success: function(data, status, jqXHR) {
			user.authed = $.parseJSON(jqXHR.responseText).authenticated ? true : false; 
			if(!user.authed) submitForm(true); 
			else { 
				user.passHash = pword; 
				user.username = uname; 
				//$.cookie(
				//TODO: magic
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
		url: REMOTE_PATH+'mobile_app/device_register.php',
		success: function(data, status, jqXHR){
			return $.parseJSON(jqXHR.responseText); 
		},
		type: 'POST',
		data: 'deviceType=' //+ phonegap native thing 
	}); 
}

function reg(){
	var valid = true,
	
	userValidated = /[A-z0-9_\-]{3,16}/.exec($('#regUsername').val());
	if(userValidated !== null && userValidated[0] === userValidated.input) console.log("username valid"); 
	else { $('#regUsernameError').text("Invalid username. Allowed characters: A-z0-9_-"); valid = false; } 
	
	var regPass1Validated = /.{6,32}/.exec($('#regPass1').val()); 
	if(regPass1Validated !== null && regPass1Validated[0] === regPass1Validated.input){
		if(regPass1Validated[0] === $('#regPass2').val()) console.log("password valid and matching");
		else { $('#regPasswordError').text("Passwords do not match."); valid = false; }
	}
	else { $('#regPasswordError').text("Invalid password. Passwords must be 6 to 32 characters long."); valid = false; }
	
	var emailValidated = /[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,4}/.exec($('#regEmail').val()); 
	if(emailValidated !== null && emailValidated[0] === emailValidated.input) console.log("email valid"); 
	else { $('#regEmailError').text("Please use a valid email address."); valid = false; }
	
	var firstNameValidated = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/.exec($('#regFirstName').val()); 
	if(firstNameValidated !== null && firstNameValidated[0] === firstNameValidated.input) console.log("first name valid"); 
	else { $('#regFirstNameError').text("That first name was not what we were expecting."); valid = false; }
	
	var lastNameValidated = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/.exec($('#regLastName').val()); 
	if(lastNameValidated !== null && lastNameValidated[0] === lastNameValidated.input) console.log("last name valid"); 
	else { $('#regLastNameError').text("That last name was not what we were expecting."); valid = false; }
	
	if(valid){
		$.ajax({
			url: REMOTE_PATH+'mobile_app/account_registration.php',
			success: function(data, status, jqXHR) {
				registrationResponse($.parseJSON(jqXHR.responseText)); 
			},
			type: 'POST',
			data: 'username='+userValidated[0]+'&password='+hex_sha1(regPass1Validated[0])+'&email='+emailValidated[0]+'&firstName='+firstNameValidated[0]+'&lastName='+lastNameValidated[0]+'&timestamp='+(new Date().getTime())
		});
	}
}

function registrationResponse(resp){
	if(!resp.dbError){
		if(resp.usernameOpen){
			if(resp.emailOpen){
				registrationSuccess(); 
			} else $('#regGeneralError').text("Email already in use."); 
		} else $('#regGeneralError').text("Username already in use.");
	} else $('#regGeneralError').text("An error occurred. Please try again later."); 
}

function registrationSuccess(){
	$('#register').children('div[role|="dialog"]').html("<div data-role=\"content\"><h1 style=\"color: white;\"> Success! </h1></div>"); 
	setTimeout(function(){
		$('#register').dialog('close');
	}, 2000);
}