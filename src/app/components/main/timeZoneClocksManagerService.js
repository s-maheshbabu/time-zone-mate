angular.module('TimeZoneMate').service('TimeZoneClocksManager', ['$interval', function($interval) {
	var clocksRunning = true;

	var allTimeZones= [new NameBasedTimeZoneObject($interval, undefined, undefined), new OffsetBasedTimeZoneObject($interval, 0, 'UTC')];

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
			var removedElements = allTimeZones.splice(index, 1);
			for(var i = 0; i < removedElements.length; i++)
			{
				removedElements[i].destroyMoment();
			}
		},
		// Resets each time zone object to current time and set the clocks to start running.
		resetAllClocks: function() {
			for (var i = 0; i < allTimeZones.length; i++) {
				allTimeZones[i].resetMoment();
				clocksRunning = true;
			}
		},
		// Set the clock at the given index in edit mode. Since only one clock can be edited at
		// a time, we set all other clocks to read only mode just to be safe.
		// We also stop all clocks when one of them enters edit mode.
		setInEditMode: function(index) {
			for (var i = 0; i < allTimeZones.length; i++) {
				if(i == index) {
					allTimeZones[i].setEditMode(true);
				}
				else {
					allTimeZones[i].setEditMode(false);
				}
			}
			this.stopClocks();
		},
		// Use the clock at the given index as the authoritative source and adjust all other clocks to
		// show the same moment as the clock at given index.
		adjustAllClocks: function(index) {
			var pivotClock = allTimeZones[index];

			console.log('Adjusting all clocks to match the clock - ' + pivotClock.toString() + ' at index ' + index);
			this.stopClocks();
			for (var i = 0; i < allTimeZones.length; i++) {
				allTimeZones[i].setMomentFromUTC(pivotClock.getMomentInUTC());
			}
			this.markAllClocksValid();
		},
		// Mark all of the timezone objects as valid.
		markAllClocksValid: function() {
			for (var i = 0; i < allTimeZones.length; i++) {
				allTimeZones[i].markAsValid();
			}
		},
		// Adds a new timeZone object for the given timeZone. If an object for the given timeZone already exists,
		// we just move the corresponding object to the top of the list.
		// The title can be any value but is usually used to contain a user friendly name to identify the time zone
		// like a city name, country name etc. If missing, the time zone name will be used as title.
		addTimeZone: function(timeZoneToBeAdded, titleOfTheTimeZone) {
			console.log("We already have " + this.addedTimeZones().length + " timeZones and we are adding " + timeZoneToBeAdded + " under the title " + titleOfTheTimeZone);

			var timeZoneObjectToBeAdded = new NameBasedTimeZoneObject($interval, timeZoneToBeAdded, titleOfTheTimeZone);

			this._addTimeZone(timeZoneObjectToBeAdded, titleOfTheTimeZone);
		},
		// Adds a new timeZone object that represents time at the given offset. If an object for the given
		// offset already exists, we just move the corresponding object to the top of the list.
		// The title can be any value but is usually used to contain a user friendly name to identify the time zone
		// like GMT+5:30, UTC-1 etc. If missing, the time zone name will be used as title.
		addOffsetBasedTimeZone: function(offsetInMinutes, titleOfTheTimeZone) {
			console.log("We already have " + this.addedTimeZones().length + " timeZones and we are adding time zone at offset " + offsetInMinutes + " under the title " + titleOfTheTimeZone);

			var timeZoneObjectToBeAdded = new OffsetBasedTimeZoneObject($interval, offsetInMinutes, titleOfTheTimeZone);

			this._addTimeZone(timeZoneObjectToBeAdded, titleOfTheTimeZone);
		},
		stopClocks: function() {
			clocksRunning = false;
			for (var i = 0; i < allTimeZones.length; i++) {
				allTimeZones[i].timerManager(clocksRunning);
			}
		},
		_addTimeZone: function(timeZoneObjectToBeAdded, titleOfTheTimeZone) {
			var addedTimeZones = this.addedTimeZones();

			for (var i = 0; i < addedTimeZones.length; i++) {
				if(addedTimeZones[i].title === titleOfTheTimeZone) {
					console.log("Requested time zone already exists. Moving it to the top");
					var timeZoneObjectsToBeBubbledUp = addedTimeZones.splice(i, 1);
					addedTimeZones = timeZoneObjectsToBeBubbledUp.concat(addedTimeZones);
					allTimeZones = [allTimeZones[0]].concat(addedTimeZones);
					return;
				}
			}

			timeZoneObjectToBeAdded.timerManager(clocksRunning);

			// If clocks are not running, new timeZones being added shouldn't show the current time in that timeZone.
			// We should instead pick any of the valid existing clocks, convert the time to the new timeZone and show it.
			// If all the clocks are invalid, we just set the new clock to its current time, in a stopped state.
			if(!clocksRunning) {
				if(allTimeZones.length > 0) {
					var aValidTimeZoneObject;
					for (var i = 0; i < allTimeZones.length; i++) {
						if(!allTimeZones[i].invalidTime) {
							aValidTimeZoneObject = allTimeZones[i];
							break;
						}
					}

					if(aValidTimeZoneObject) {
						timeZoneObjectToBeAdded.setMomentFromUTC(aValidTimeZoneObject.getMomentInUTC());
					}
				}
			}
			addedTimeZones.push(timeZoneObjectToBeAdded);
			allTimeZones = [allTimeZones[0]].concat(addedTimeZones);
		}
    }
}]);