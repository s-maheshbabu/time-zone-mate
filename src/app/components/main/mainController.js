angular.module('TimeZoneMate').controller('ClockController', ['$scope', '$interval', 'TimeZoneClocksManager', function($scope, $interval, TimeZoneClocksManager) {
	var localTimeZoneObject = TimeZoneClocksManager.localTimeZoneObject();
	$scope.localTime = localTimeZoneObject;

	$scope.allTimeZones = TimeZoneClocksManager.allTimeZones();
	// Since we want to display user added time zones in two columns, split the
	// data into an array of arrays where each sub array holds two time zones.
	$scope.addedTimeZoneChunks = chunk(TimeZoneClocksManager.addedTimeZones(), 2);

	// Determines the state of the time zone entry being made by the user.
	$scope.timeZoneBeingAddedIsValid = true;

	// One of the timestamps was changed by the user.
	$scope.timestampChanged = function(index) {
        console.log("User edited one of the timestamps. Stopping all clocks.");
		$scope.togglePauseReset = false;
		TimeZoneClocksManager.stopClocks();
    };

	// A time zone is being removed.
	$scope.removeTimeZone = function(index) {
        console.log("Attempting to remove added clock at index " + index);
		TimeZoneClocksManager.removeTimeZone(index);

		$scope.addedTimeZoneChunks = chunk(TimeZoneClocksManager.addedTimeZones(), 2);
    };

	// When <code>true</code>, the button acts as 'Pause' and when <code>false</code> functions
	// as a 'Reset' button.
	$scope.togglePauseReset = true;
    $scope.$watch('togglePauseReset', function(){
        $scope.togglePauseResetText = $scope.togglePauseReset ? 'Pause' : 'Reset';
    });
	$scope.pauseOrResetClocks = function() {
		if($scope.togglePauseReset)
		{
			console.log("All clocks are being stopped on user request.");
			TimeZoneClocksManager.stopClocks();
		}
		else
		{
			console.log("All clocks are being reset to the current time on user request.");
			TimeZoneClocksManager.resetAllClocks();
		}
		$scope.togglePauseReset = !$scope.togglePauseReset;
    };

	$scope.isCollapsed = true;
	$scope.toggleClockAdder = function() {
		$scope.isCollapsed = !$scope.isCollapsed;
	}

	// Whenever the allTimeZones list changes, update the UI.
	$scope.$watch(function () { return TimeZoneClocksManager.allTimeZones() }, function (newVal, oldVal) {
		if (typeof newVal !== 'undefined') {
			$scope.addedTimeZoneChunks = chunk(TimeZoneClocksManager.addedTimeZones(), 2);
			$scope.localTime = TimeZoneClocksManager.localTimeZoneObject();
			$scope.allTimeZones = TimeZoneClocksManager.allTimeZones();
		}
	});

	$scope.open = function($event, index) {
		console.log("Datepicker button clicked at index: " + index + ". Setting it in edit mode and stopping all clocks.");
		$event.preventDefault();
		$event.stopPropagation();

		$scope.togglePauseReset = false;
		TimeZoneClocksManager.setInEditMode(index);
	};

	$scope.dateChanged = function(index) {
		console.log("User changed the data on clock at index: " + index + ". Adjust time across all clocks.");
		$scope.togglePauseReset = false;
		TimeZoneClocksManager.adjustAllClocks(index);
	};

	function chunk(array, size) {
	  var arrayOfChunks = [];
	  for (var i = 0; i < array.length; i += size) {
		arrayOfChunks.push(array.slice(i, i + size));
	  }
	  return arrayOfChunks;
	};
}]);