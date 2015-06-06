angular.module('TimeZoneMate').directive('uiTimepickerEvents', ['TimeZoneClocksManager', function(TimeZoneClocksManager) {
    return {
        restrict: 'A',
        scope: {
            index: '=index'
        },
        link: function(scope, elem, attr) {
			// Initialize the timepicker.
			elem.timepicker();

			elem.on('changeTime', function() {
                // This event is triggered only when a valid timestamp is entered by user. So set it as a valid time.
				attr.validtime = true;
            });

			elem.on('change', function() {
				if(attr.validtime === false) {
					console.log("Returning right away because we currently hold an invalid time " + elem.val());
					return;
				}

				console.log("A valid time was entered by the user: " + elem.val() + " at index: " + scope.index);
				TimeZoneClocksManager.adjustAllClocks(scope.index);
				scope.$apply();
            });

			elem.on('timeFormatError', function() {
				var invalidValueEnteredByUser = elem.val();
                console.log("Invalid timepicker value entered by user: " + invalidValueEnteredByUser);

				// This is a hack.
				// If a user changes the timestamp from 7PM to 7** to 7PM, the timepicker doesn't trigger a 'changeTime'
				// event. So we mark the clock as invalid when user enters 7** but never get a chance to mark it as valid
				// when user changes it back to 7PM. So, we artificially set the time to the following moment and then set
				// it back to whatever value the user entered.
				// This hack will break if the user actually was at the following moment before entering an invalid value
				// which is very unlikely.
				elem.timepicker('setTime', new Date(5555, 5, 5, 5, 5, 5, 5));
				elem.val(invalidValueEnteredByUser);

				// Mark current timestamp as invalid.
				attr.validtime = false;
				var allTimeZones = TimeZoneClocksManager.allTimeZones();
				allTimeZones[scope.index].markAsInvalid();
				scope.$apply();
            });

			elem.on('mouseup', function() {
				elem.select();
            });
		}
    };
}]);