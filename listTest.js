//js 
$('.exStud').on('click', function(e){
			buildStudentPage(e.delegateTarget);
});

var uniqueId = 0;



function buildStudentPage(element){
				var pureDiv = document.createElement("div");
				var newDiv = $(pureDiv); 
				newDiv.attr("data-role","page"); 	
				newDiv.attr("id", "customPage"+(uniqueId++)); 
				
				var stylesheet = $(document.createElement('link'));
				stylesheet.attr("href", "customStudentPage.css");
				stylesheet.attr("rel", "stylesheet");
				stylesheet.attr("type", "text/css");
				
				var nameH2element = $(document.createElement('h2'));
				nameH2element.text(element.innerHTML);
				
				var goalDiv = $(document.createElement('div')); 
				goalDiv.attr("id","goalProgress");
				goalDiv.attr("class", "info");
				
				var fitDiv = $(document.createElement('div'));
				fitDiv.attr("id","fitnessStats"); 
				fitDiv.attr("class", "info");
				
				//Make call to database here
				//return goals, fitness information, etc. 
				
				newDiv.append(stylesheet);
				newDiv.append(nameH2element);
				newDiv.append(goalDiv);
				newDiv.append(fitDiv);
				$('body').append(newDiv); 
				$.mobile.changePage($("#"+newDiv.attr("id")));
}
