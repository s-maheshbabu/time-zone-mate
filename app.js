(function ClockController() {
var app = angular.module('clock', ['ui.timepicker']);

angular.module('ui.timepicker').value('uiTimepickerConfig',{
  showOnFocus: false,
  timeFormat: 'h:i:s A'
});

app.factory('TimezoneObject', [function() {
	function TimezoneObject(timezoneName)
	{
		var _this = this;

		this.timezoneName=timezoneName;
		this.moment = getMoment(timezoneName);
		this.vanillaDate = getVanillaDate();

		var timer = null;
		// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
		this.timerManager = function (flag) {
			if(flag) {
				clearInterval(timer);
				timer =  setInterval(function() {
					_this.moment = getMoment(timezoneName);
					_this.vanillaDate = getVanillaDate();
				}, 1000);
			}
			else {
				clearInterval(timer);
			}
		};
		this.timerManager(true);

		function getVanillaDate() {
			var m = _this.moment;
			return new Date(m.year(), m.month(), m.date(),  m.hours(), m.minutes(), m.seconds());
		};

		this.setVanillaDate = function (date) {
			clearInterval(timer);
			this.vanillaDate = date;
		}

		function getMoment(timezone) {
			var time = moment();

			if(timezone) {
				time.tz(timezone);
			}
			
			return time;
		};

		// Given a date and timezone, sets the moment to the corresponding moment in this timezone.
		// If <code>this</code> is a PST timezone object and if the input is 2 AM IST, the moment will
		// be set to whatever the time is in PST when it is 2 AM IST.
		this.setMoment = function (date, timezoneName) {
			var inputMoment = moment.tz(moment(date).format('YYYY-M-D hh:mm:ss A'), "YYYY-M-D hh:mm:ss A", timezoneName);

			// Corresponding moment in this timezone
			var thisTimezoneMoment = inputMoment.tz(_this.timezoneName);

			clearInterval(timer);
			_this.moment = thisTimezoneMoment;

			_this.vanillaDate = getVanillaDate();
		}
	};
	TimezoneObject.prototype.toString = function() {
		return "NotImplemented";
	}
	
    return TimezoneObject;
}]);

app.service('TimeZoneClocksManager', ['TimezoneObject', function(TimezoneObject) {
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

app.directive('uiTimepickerEvents', function(TimeZoneClocksManager) {
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
				var addedTimezones = TimeZoneClocksManager.addedTimezones();
				console.log("A valid time was entered by the user: " + addedTimezones[scope.index].vanillaDate);

				var editedDate = addedTimezones[scope.index].vanillaDate;
				var editedtimezone = addedTimezones[scope.index].timezoneName;
				for (var i = 0; i < addedTimezones.length; i++) {
					if(i != scope.index)
					{
						addedTimezones[i].setMoment(editedDate, editedtimezone);
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

app.controller('ClockController', ['$scope', '$interval', 'TimeZoneClocksManager', 'TimezoneObject', function($scope, $interval, TimeZoneClocksManager, TimezoneObject) {
	var localTimezoneObject = TimeZoneClocksManager.localTimezoneObject();
	$scope.localTime = localTimezoneObject;

	$scope.addedTimezones = TimeZoneClocksManager.addedTimezones();

	// One of the timestamps was changed by the user.
	$scope.timestampChanged = function(index) {
        console.log("User edited one of the timestamps. Stopping all clocks.");
		for (var i = 0; i < $scope.addedTimezones.length; i++) {
			$scope.addedTimezones[i].timerManager(false);
		}
    };

	$scope.addTimezone = function() {
		console.log("Add button clicked");
	};
	
	$interval(function(){
		$scope.localTime = localTimezoneObject;
	},1000);
}]);

})();

