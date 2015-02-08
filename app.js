(function ClockController() {
var app = angular.module('clock', []);

app.factory('TimezoneObject', [function() {
	function TimezoneObject(timezoneName)
	{
		this.timezoneName=timezoneName;
		this.timestamp = getTimeStamp(timezoneName);
		
		var _this = this;

		var timer = null;
		// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
		this.timerManager = function (flag) {
			if(flag) {
				clearInterval(timer);
				timer =  setInterval(function() { _this.timestamp = getTimeStamp(timezoneName); }, 1000);
			}
			else {
				clearInterval(timer);
			}
		};
		this.timerManager(true);

		// Stops the timers and sets the timestamp to the given value.
		this.setTimestamp = function (timestamp)
		{
			clearInterval(timer);
			this.timestamp = timestamp;
		}

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
	
	// One of the timestamps was changed by the user.
	$scope.timestampChanged = function(index) {
        console.log("User edited one of the timestamps. Stopping all clocks.");
		var editedTimestamp = $scope.addedTimezones[index].timestamp;
		for (var i = 0; i < $scope.addedTimezones.length; i++) {
			$scope.addedTimezones[i].timerManager(false);
			if(i != index)
			{
				$scope.addedTimezones[i].setTimestamp(editedTimestamp);
			}
		}
    };

	$scope.addTimezone = function() {
		console.log("Add button clicked");
	};
	
	$interval(function(){
		$scope.localTime=localTimezoneObject.toString();
	},1000);
			
}]);

})();

