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
		if(!timezoneName)
		{
			this.timezoneName = jstz.determine().name();
		}
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
	var clocksRunning = true;

	var allTimezones = [new TimezoneObject(), new TimezoneObject("UTC")];

	return {
		allTimezones: function() {
			return allTimezones;
		},
        addedTimezones: function() {
            return allTimezones.slice(1);
        },
		localTimezoneObject: function() {
            return allTimezones[0];
        },
		// Removes the timezone at the specified index.
		removeTimezone: function(index) {
			allTimezones.splice(index, 1);
		},
		// Adds a new timezone object for the given timezone. If an object for the given timezone already exists,
		// we just move the corresponding object to the top of the list.
		addTimezone: function(timeZoneToBeAdded) {
			var addedTimezones = this.addedTimezones();
			var localTimezoneObject = this.localTimezoneObject();
			console.log("We already have " + addedTimezones.length + " timezones and we are adding " + timeZoneToBeAdded);

			for (var i = 0; i < addedTimezones.length; i++) {
				if(addedTimezones[i].timezoneName === timeZoneToBeAdded) {
					console.log("Requested time zone already exists. Moving it to the top");
					var timezoneObjectsToBeBubbledUp = addedTimezones.splice(i, 1);
					addedTimezones = timezoneObjectsToBeBubbledUp.concat(addedTimezones);
					allTimezones = [allTimezones[0]].concat(addedTimezones);
					return;
				}
			}

			var timezoneObjectToBeAdded = new TimezoneObject(timeZoneToBeAdded);
			timezoneObjectToBeAdded.timerManager(clocksRunning);

			// If clocks are not running, new timezones being added shouldn't show the current time in that timezone.
			// We should instead pick any of the existing clocks (we pick the local clock), convert the time to the new timezone and show it.
			if(!clocksRunning) {
				if(addedTimezones.length > 0) {
					timezoneObjectToBeAdded.setMoment(localTimezoneObject.vanillaDate, localTimezoneObject.timezoneName);
				}
			}
			addedTimezones.push(timezoneObjectToBeAdded);
			allTimezones = [allTimezones[0]].concat(addedTimezones);
		},
		stopClocks: function() {
			clocksRunning = false;
			for (var i = 0; i < allTimezones.length; i++) {
				allTimezones[i].timerManager(clocksRunning);
			}
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
                // console.log("Time picker is ticking");
            });

			elem.on('change', function() {
				var allTimezones = TimeZoneClocksManager.allTimezones();
				console.log("A valid time was entered by the user: " + allTimezones[scope.index].vanillaDate + " at index: " + scope.index);

				var editedDate = allTimezones[scope.index].vanillaDate;
				var editedtimezone = allTimezones[scope.index].timezoneName;

				TimeZoneClocksManager.stopClocks();
				for (var i = 0; i < allTimezones.length; i++) {
					if(i != scope.index)
					{
						allTimezones[i].setMoment(editedDate, editedtimezone);
					}
				}
            });

			elem.on('timeFormatError', function() {
                console.log("Invalid timepicker value");
            });
		}
    };
});

app.directive('autoComplete', function(TimeZoneAutoCompleteService, TimeZoneClocksManager) {
    return {
        restrict: 'A',
        link: function(scope, elem, attr, ctrl) {
            elem.autocomplete({
				lookup: TimeZoneAutoCompleteService.getSource(),
				autoSelectFirst: true,
				onSelect: function (suggestion) {
					var timeZoneToBeAdded = suggestion.value;
					TimeZoneClocksManager.addTimezone(timeZoneToBeAdded);
				},
				onInvalidateSelection: function () {
					console.log("Invalid Value");
				}
            });
        }
    };
});

app.controller('ClockController', ['$scope', '$interval', 'TimeZoneClocksManager', function($scope, $interval, TimeZoneClocksManager) {
	var localTimezoneObject = TimeZoneClocksManager.localTimezoneObject();
	$scope.localTime = localTimezoneObject;

	$scope.allTimezones = TimeZoneClocksManager.allTimezones();

	// One of the timestamps was changed by the user.
	$scope.timestampChanged = function(index) {
        console.log("User edited one of the timestamps. Stopping all clocks.");
		TimeZoneClocksManager.stopClocks();
    };

	// A time zone is being removed.
	$scope.removeTimezone = function(index) {
        console.log("Attempting to remove added clock at index " + index);
		TimeZoneClocksManager.removeTimezone(index);
    };

	// Whenever the allTimezones list changes, update the UI.
	$scope.$watch(function () { return TimeZoneClocksManager.allTimezones() }, function (newVal, oldVal) {
		if (typeof newVal !== 'undefined') {
			$scope.localTime = TimeZoneClocksManager.localTimezoneObject();
			$scope.allTimezones = TimeZoneClocksManager.allTimezones();
		}
	});

	$interval(function(){
		$scope.localTime = localTimezoneObject;
	},1000);
}]);

})();

