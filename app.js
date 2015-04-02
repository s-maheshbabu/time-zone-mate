(function ClockController() {
var app = angular.module('clock', ['ui.timepicker']);

angular.module('ui.timepicker').value('uiTimepickerConfig',{
  showOnFocus: false,
  timeFormat: 'h:i:s A'
});

app.factory('TimeZoneObject', [function() {
	function TimeZoneObject(timeZoneName)
	{
		var _this = this;

		this.timeZoneName=timeZoneName;
		if(!timeZoneName)
		{
			this.timeZoneName = jstz.determine().name();
		}
		this.moment = getMoment(timeZoneName);
		this.vanillaDate = getVanillaDate();

		var timer = null;
		// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
		this.timerManager = function (flag) {
			if(flag) {
				clearInterval(timer);
				timer =  setInterval(function() {
					_this.moment = getMoment(timeZoneName);
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

		function getMoment(timeZone) {
			var time = moment();

			if(timeZone) {
				time.tz(timeZone);
			}
			
			return time;
		};

		// Resets <code>this</code> time zone object to current time and starts the timers.
		this.resetMoment = function () {
			_this.moment = getMoment(timeZoneName);
			_this.vanillaDate = getVanillaDate();
			_this.timerManager(true);
		};

		// Given a date and timeZone, sets the moment to the corresponding moment in this timeZone.
		// If <code>this</code> is a PST timeZone object and if the input is 2 AM IST, the moment will
		// be set to whatever the time is in PST when it is 2 AM IST.
		this.setMoment = function (date, timeZoneName) {
			var inputMoment = moment.tz(moment(date).format('YYYY-M-D hh:mm:ss A'), "YYYY-M-D hh:mm:ss A", timeZoneName);

			// Corresponding moment in this timeZone
			var thisTimeZoneMoment = inputMoment.tz(_this.timeZoneName);

			clearInterval(timer);
			_this.moment = thisTimeZoneMoment;

			_this.vanillaDate = getVanillaDate();
        }
	};
	TimeZoneObject.prototype.toString = function() {
		return "NotImplemented";
	}
	
    return TimeZoneObject;
}]);

app.service('TimeZoneClocksManager', ['TimeZoneObject', function(TimeZoneObject) {
	var clocksRunning = true;

	var allTimeZones = [new TimeZoneObject(), new TimeZoneObject("UTC")];

	return {
		allTimeZones: function() {
			return allTimeZones;
		},
        addedTimeZones: function() {
            return allTimeZones.slice(1);
        },
		localTimeZoneObject: function() {
            return allTimeZones[0];
        },
		// Removes the timeZone at the specified index.
		removeTimeZone: function(index) {
			allTimeZones.splice(index, 1);
		},
		// Resets each time zone object to current time and set the clocks to start running.
		resetAllClocks: function(index) {
			for (var i = 0; i < allTimeZones.length; i++) {
				allTimeZones[i].resetMoment();
				clocksRunning = true;
			}
		},
		// Adds a new timeZone object for the given timeZone. If an object for the given timeZone already exists,
		// we just move the corresponding object to the top of the list.
		addTimeZone: function(timeZoneToBeAdded) {
			var addedTimeZones = this.addedTimeZones();
			var localTimeZoneObject = this.localTimeZoneObject();
			console.log("We already have " + addedTimeZones.length + " timeZones and we are adding " + timeZoneToBeAdded);

			for (var i = 0; i < addedTimeZones.length; i++) {
				if(addedTimeZones[i].timeZoneName === timeZoneToBeAdded) {
					console.log("Requested time zone already exists. Moving it to the top");
					var timeZoneObjectsToBeBubbledUp = addedTimeZones.splice(i, 1);
					addedTimeZones = timeZoneObjectsToBeBubbledUp.concat(addedTimeZones);
					allTimeZones = [allTimeZones[0]].concat(addedTimeZones);
					return;
				}
			}

			var timeZoneObjectToBeAdded = new TimeZoneObject(timeZoneToBeAdded);
			timeZoneObjectToBeAdded.timerManager(clocksRunning);

			// If clocks are not running, new timeZones being added shouldn't show the current time in that timeZone.
			// We should instead pick any of the existing clocks (we pick the local clock), convert the time to the new timeZone and show it.
			if(!clocksRunning) {
				if(addedTimeZones.length > 0) {
					timeZoneObjectToBeAdded.setMoment(localTimeZoneObject.vanillaDate, localTimeZoneObject.timeZoneName);
				}
			}
			addedTimeZones.push(timeZoneObjectToBeAdded);
			allTimeZones = [allTimeZones[0]].concat(addedTimeZones);
		},
		stopClocks: function() {
			clocksRunning = false;
			for (var i = 0; i < allTimeZones.length; i++) {
				allTimeZones[i].timerManager(clocksRunning);
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
				var allTimeZones = TimeZoneClocksManager.allTimeZones();
				console.log("A valid time was entered by the user: " + allTimeZones[scope.index].vanillaDate + " at index: " + scope.index);

				var editedDate = allTimeZones[scope.index].vanillaDate;
				var editedtimeZone = allTimeZones[scope.index].timeZoneName;

				TimeZoneClocksManager.stopClocks();
				for (var i = 0; i < allTimeZones.length; i++) {
					allTimeZones[i].setMoment(editedDate, editedtimeZone);
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
					TimeZoneClocksManager.addTimeZone(timeZoneToBeAdded);
				},
				onInvalidateSelection: function () {
					console.log("Invalid Value");
				}
            });
        }
    };
});

app.controller('ClockController', ['$scope', '$interval', 'TimeZoneClocksManager', function($scope, $interval, TimeZoneClocksManager) {
	var localTimeZoneObject = TimeZoneClocksManager.localTimeZoneObject();
	$scope.localTime = localTimeZoneObject;

	$scope.allTimeZones = TimeZoneClocksManager.allTimeZones();

	// One of the timestamps was changed by the user.
	$scope.timestampChanged = function(index) {
        console.log("User edited one of the timestamps. Stopping all clocks.");
		TimeZoneClocksManager.stopClocks();
    };

	// A time zone is being removed.
	$scope.removeTimeZone = function(index) {
        console.log("Attempting to remove added clock at index " + index);
		TimeZoneClocksManager.removeTimeZone(index);
    };

	// A time zone is being removed.
	$scope.resetAllClocks = function() {
        console.log("All clocks are being reset to the current time");
		TimeZoneClocksManager.resetAllClocks();
    };

	// Whenever the allTimeZones list changes, update the UI.
	$scope.$watch(function () { return TimeZoneClocksManager.allTimeZones() }, function (newVal, oldVal) {
		if (typeof newVal !== 'undefined') {
			$scope.localTime = TimeZoneClocksManager.localTimeZoneObject();
			$scope.allTimeZones = TimeZoneClocksManager.allTimeZones();
		}
	});

	$interval(function(){
		$scope.localTime = localTimeZoneObject;
	},1000);
}]);

})();

