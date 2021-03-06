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
		crossDomain: true,
		beforeSend : function() {$.mobile.loading('show')},
		complete   : function() {},
		success: function(data, status, jqXHR) {
			user.authed = $.parseJSON(jqXHR.responseText).authenticated ? true : false; 
			if(!user.authed) submitForm(true); 
			else { 
				user.passHash = hex_sha1(pword); 
				user.username = uname; 
				user.id = $.parseJSON(jqXHR.responseText).id;
				db.checkIfLoaded(true); 
				//$.mobile.pushStateEnabled = true;
				//if(loggedOutRecently) $.mobile.changePage('index.html');
				
															//insert magic algorithm
				db.query("INSERT INTO `device` (`prop_name`, `prop_value`) VALUES ('passHash', '"+user.passHash+"')", defaultCallback);
				db.query("INSERT INTO `device` (`prop_name`, `prop_value`) VALUES ('username', '"+user.username+"')", defaultCallback);
				db.query("INSERT INTO `device` (`prop_name`, `prop_value`) VALUES ('userId', '"+$.parseJSON(jqXHR.responseText).id+"')", defaultCallback);
			}
		},
		error: function(jqXHR){ console.log("Error in authentication function."); },
		type: 'POST',
		data: {username: uname, password: hex_sha1(pword) }
	});
}


function reg(){
	var valid = true,
	userValidated = /^[A-z0-9_\-]{3,200}$/.exec($('#regUsername').val());
	if( !(userValidated !== null && userValidated[0] === userValidated.input) ){
		$('#regUsernameError').text("Invalid username. Allowed characters: A-z0-9_-"); 
		valid = false; 
	}
	
	var regPass1Validated = /^(.{6,3000})|(.)$/.exec($('#regPass1').val()); 
	if(regPass1Validated !== null && regPass1Validated[0] === regPass1Validated.input){
		if( !(regPass1Validated[0] === $('#regPass2').val()) ){
			$('#regPasswordError').text("Passwords do not match."); 
			valid = false; 
		}
	}
	else { $('#regPasswordError').text("Invalid password. Passwords must be 6 to 32 characters long."); valid = false; }
	
	var emailValidated = /^[A-z0-9._%+-]+@[A-z0-9.-]+\.[A-z]{2,4}$/.exec($('#regEmail').val()); 
	if(!(emailValidated !== null && emailValidated[0] === emailValidated.input)){
		$('#regEmailError').text("Please use a valid email address."); 
		valid = false; 
	}
	
	var firstNameValidated = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/.exec($('#regFirstName').val()); 
	if(!(firstNameValidated !== null && firstNameValidated[0] === firstNameValidated.input)){
		$('#regFirstNameError').text("That first name was not what we were expecting."); 
		valid = false; 
	}
	
	var lastNameValidated = /^([ \u00c0-\u01ffa-zA-Z'\-])+$/.exec($('#regLastName').val()); 
	if(!(lastNameValidated !== null && lastNameValidated[0] === lastNameValidated.input)){ 
		$('#regLastNameError').text("That last name was not what we were expecting."); 
		valid = false; 
	}
	
	if(valid){
		$('#regButton').parent().find('.ui-btn-inner').css("background-color","lightgreen").find('.ui-btn-text').html('Submitting...'); 
		db.localQuery("requested=deviceId", function(response){
			if(!response.error){
				console.log(response);
				$.ajax({
					url: REMOTE_PATH+'mobile_app/account_registration.php',
					success: function(data, status, jqXHR) {
						registrationResponse($.parseJSON(jqXHR.responseText)); 
					},
					type: 'POST',
					data: 'username='+userValidated[0]+'&password='+hex_sha1(regPass1Validated[0])+'&email='+emailValidated[0]+'&firstName='+firstNameValidated[0]+'&lastName='+lastNameValidated[0]+'&timestamp='+(new Date().getTime())+
						'&deviceID='+response.deviceId
				});
			}
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
		$('#regButton').parent().find('.ui-btn-inner').css("background-color","").find('.ui-btn-text').html('submit'); 
	}, 2000);
}

function logOut(){
	if(user.authed) db.localQuery("logout", function(data){
		user = {authed: false, username: null, passHash: null, verifiedId: false, id: null}; 
		$('body').append($('<a data-rel="dialog" style="display: none" href="login.html" id="openLogin"></a>'));
		$('#openLogin').click();
		loggedOutRecently = true;
	});
}
