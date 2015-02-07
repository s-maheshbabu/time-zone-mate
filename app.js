(function ClockController() {
var app = angular.module('clock', []);

app.factory('TimezoneObject', [function() {
	function TimezoneObject(timezoneName)
	{
		this.timezoneName=timezoneName;
		this.timestamp = getTimeStamp(timezoneName);
		
		var _this = this;
		setInterval(function() { _this.timestamp = getTimeStamp(timezoneName); }, 1000);
	
		function getTimeStamp(timezone) {
			var time = moment();

			if(timezone) {
				time.tz(timezone);
			}
			
			return time.format('hh:mm:ss A');
		};
	};
	TimezoneObject.prototype.toString = function() {
		return this.timestamp;
	}
	
    return TimezoneObject;
}]);
	
app.factory('TimeZoneAutoCompleteService', [function() {
    return {
        getSource: function() {
            return ['Asia/Kolkata', 'Africa/Cairo', 'America/Chicago', 'Australia/Darwin', 'Pacific/Guam'];
        }
    }
}]);

app.directive('autoComplete', function(TimeZoneAutoCompleteService, TimezoneObject) {
    return {
        restrict: 'A',
        link: function(scope, elem, attr, ctrl) {
            elem.autocomplete({
				lookup: TimeZoneAutoCompleteService.getSource(),
				autoSelectFirst: true,
				onSelect: function (suggestion) {

					var timeZoneToBeAdded = suggestion.value;				
					console.log("Array size is " + scope.addedTimezones.length + " and we are adding " + timeZoneToBeAdded);

					for (var i = 0; i < scope.addedTimezones.length; i++) {
						if(scope.addedTimezones[i].timezoneName === timeZoneToBeAdded)
						{
							console.log("Requested time zone already exists. Moving it to the top");
							var timezoneObjectsToBeBubbledUp = scope.addedTimezones.splice(i, 1);
							scope.addedTimezones = timezoneObjectsToBeBubbledUp.concat(scope.addedTimezones);
							return;
						}
					}

					scope.addedTimezones.push(new TimezoneObject(timeZoneToBeAdded));
				},
				onInvalidateSelection: function () {
					console.log("Invalid Value");
				}
            });
        }
    };
});

app.controller('ClockController', ['$scope', '$interval', 'TimezoneObject', function($scope, $interval, TimezoneObject) {
	var localTimezoneObject = new TimezoneObject();
	$scope.addedTimezones = [new TimezoneObject("UTC")];

	$scope.localTime = localTimezoneObject.toString();
	
	$scope.addTimezone = function() {
		console.log("Add button clicked");
	};
	
	$interval(function(){
		$scope.localTime=localTimezoneObject.toString();
	},1000);
			
}]);

})();

