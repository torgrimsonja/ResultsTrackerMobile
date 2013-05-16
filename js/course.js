$(function() {
	if(!(courseToLoad.length > 0)){ $('#course-landing-content').append('<h1 style="text-align: center;">There\'s been a mistake. Please return from whence you came.</h1>')} 
	else { createGoalView(false); }
});

function createGoalView(response){
	response = $.parseJSON(response);
	if(response){
		if(!response.error){
			$('#goals').append($('<div data-role="collapsible-set" data-theme="'+DATA_THEME+'" data-content-theme="d" id="goalAccordion" class="ui-collapsible-set ui-corner-all"></div>'));
			
			var i=-1;
			while(response[++i] != undefined){
				var classStr;
				switch(i){
					case 0: 
						classStr = 'class="ui-collapsible ui-collapsible-inset ui-collapsible-themed-content ui-collapsible-collapsed ui-first-child';
					break;
					
					default:
						classStr = 'class="ui-collapsible ui-collapsible-inset ui-collapsible-themed-content ui-collapsible-collapsed';
					break; 
				}
				$('#goalAccordion').append($('<div data-role="collapsible" '+classStr+'><h3>'+response[i].name+'</h3><p>'+response[i].description+'</p></div>'));
			}
		}
	} else {
		genericAjax(createGoalView, 'requested=coursegoals&id='+courseToLoad, 'admin/mobileAjaxGate.php'); 
	}
}