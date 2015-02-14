(function ClockController() {
var app = angular.module('clock', ['ui.timepicker']);

angular.module('ui.timepicker').value('uiTimepickerConfig',{
  showOnFocus: false,
  timeFormat: 'h:i:s A'
});

app.factory('TimezoneObject', [function() {
	function TimezoneObject(timezoneName)
	{
		this.timezoneName=timezoneName;
		this.moment = getMoment(timezoneName);
		this.timestamp = getTimeStamp(timezoneName);
		
		var _this = this;

		var timer = null;
		// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
		this.timerManager = function (flag) {
			if(flag) {
				clearInterval(timer);
				timer =  setInterval(function() {
					_this.timestamp = getTimeStamp(timezoneName); 
					_this.moment = getMoment(timezoneName);
					_this.vanillaDate = getVanillaDate();
				}, 1000);
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

		this.vanillaDate = getVanillaDate();
		function getVanillaDate() {
			var m = _this.moment;
			return new Date(m.year(), m.month(), m.date(),  m.hours(), m.minutes(), m.seconds());
		};
		this.setVanillaDate = function ( date) {
			this.vanillaDate = date;
		}

		function getMoment(timezone) {
			var time = moment();

			if(timezone) {
				time.tz(timezone);
			}
			
			return time;
		};

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

app.factory('AllTimezones', ['TimezoneObject', function(TimezoneObject) {
	var localTimezoneObject = new TimezoneObject();
	var addedTimezones = [new TimezoneObject("UTC")];

	return {
        addedTimezones: function() {
            return addedTimezones;
        },
		localTimezoneObject: function() {
            return localTimezoneObject;
        }
    }
}]);
	
app.factory('TimeZoneAutoCompleteService', [function() {
    return {
        getSource: function() {
            return ['Asia/Kolkata', 'Africa/Cairo', 'America/Chicago', 'Australia/Darwin', 'Pacific/Guam'];
        }
    }
}]);

app.directive('uiTimepickerEvents', function(AllTimezones) {
    return {
        restrict: 'A',
        scope: {
            index: '=index'
        },
        link: function(scope, elem, attr) {
			elem.on('changeTime', function() {
                console.log("Time picker is ticking");
            });

			elem.on('change', function() {
                console.log("A valid time was entered by the user");
				var addedTimezones = AllTimezones.addedTimezones();
				var editedTimestamp = addedTimezones[scope.index].timestamp;
				for (var i = 0; i < addedTimezones.length; i++) {
					if(i != scope.index)
					{
						addedTimezones[i].setVanillaDate(new Date());
					}
					addedTimezones[i].timerManager(false);
				}					
            });

			elem.on('timeFormatError', function() {
                console.log("Invalid timepicker value");
            });
		}
    };
});

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

app.controller('ClockController', ['$scope', '$interval', 'AllTimezones', 'TimezoneObject', function($scope, $interval, AllTimezones, TimezoneObject) {
	var localTimezoneObject = AllTimezones.localTimezoneObject();
	$scope.addedTimezones = AllTimezones.addedTimezones();

	$scope.localTime = localTimezoneObject.toString();

	// One of the timestamps was changed by the user.
	$scope.timestampChanged = function(index) {
        console.log("User edited one of the timestamps. Stopping all clocks.");
		var editedTimestamp = $scope.addedTimezones[index].timestamp;
		for (var i = 0; i < $scope.addedTimezones.length; i++) {
			$scope.addedTimezones[i].timerManager(false);
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

