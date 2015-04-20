var timeZoneObjectModule= angular.module('TimeZoneObjectModule',[]);

timeZoneObjectModule.factory('TimeZoneObject', [function() {
	function TimeZoneObject(timeZoneName, title)
	{
		var _this = this;

		// Resets <code>this</code> time zone object to current time and starts the timers.
		this.resetMoment = function () {
			_this.moment = getCurrentMoment(timeZoneName);
			_this.timePart = getTimePart();
			_this.datePart = getDatePart();
			_this.invalidTime = false;
			_this.timerManager(true);
		};

		// Marks <code>this</code> time zone object as invalid and stops the timers.
		this.destroyMoment = function () {
			_this.moment = null;
			_this.timePart = null;
			_this.datePart = null;
			_this.invalidTime = true;
			_this.timerManager(false);

			delete _this;
		};

		this.getMomentInUTC = function() {
			var clone = moment(_this.moment);
			return clone.tz('UTC');
		}

		// Takes a UTC moment as input and sets <code>this</code> instance to represent
		// the same moment.
		// If <code>this</code> is an IST timeZone object and if the input is 3 AM UTC, the moment will
		// be set to whatever the time is in IST when it is 3 AM UTC.
		this.setMomentFromUTC = function (inputMoment) {
			// Corresponding moment in this timeZone
			var thisTimeZoneMoment = inputMoment.tz(_this.timeZoneName);

			clearInterval(timer);
			_this.moment = thisTimeZoneMoment;

			_this.timePart = getTimePart();
			_this.datePart = getDatePart();
        }

		this.markAsInvalid = function() {
			this.invalidTime = true;
		}

		this.markAsValid = function() {
			this.invalidTime = false;
		}

		this.setEditMode = function(editMode) {
			this.editMode = editMode;
		}

		function getTimePart() {
			var m = _this.moment;
			return new Date(m.year(), m.month(), m.date(),  m.hours(), m.minutes(), m.seconds());
		};

		this.timePartGetterSetter = function(value) {
			if(angular.isDefined(value)) {
				if(value == null) {
					// Empty value in the time part. Ignoring the value.
					return;
				}
				this.timePart = value;
				updateMoment();
			}
			else {
				return this.timePart;
			}
		}

		function getDatePart() {
			var m = _this.moment;
			return new Date(m.year(), m.month(), m.date(), 0, 0, 0);
		};

		this.datePartGetterSetter = function(value) {
			if(angular.isDefined(value)) {
				if(value == null) {
					throw "An empty date part should never happen because user can only pick from date picker";
				}
				this.datePart = value;
				updateMoment();
			}
			else {
				return this.datePart;
			}
		}

		// The title of the time zone to be displayed. This can be any value but usually used to hold
		// a user friendly name to identify a time zone like a city, country etc.
		this.title = title;
		this.timeZoneName = timeZoneName;
		if(!timeZoneName)
		{
			this.title = 'Local Time';
			this.timeZoneName = jstz.determine().name();
		}
		if(!this.title)
		{
			this.title = timeZoneName;
		}
		this.moment = getCurrentMoment(timeZoneName);
		// A time zone object can be marked invalid, when the user enters an invalid timestamp.
		this.invalidTime = false;

		this.timePart = getTimePart();
		this.datePart = getDatePart();
		this.editMode = false;

		var timer = null;
		// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
		this.timerManager = function (flag) {
			if(flag) {
				clearInterval(timer);
				timer =  setInterval(function() {
					_this.moment = getCurrentMoment(timeZoneName);
					_this.timePart = getTimePart();
					_this.datePart = getDatePart();
				}, 1000);
			}
			else {
				clearInterval(timer);
			}
		};
		this.timerManager(true);

		// Get the current moment in the given time zone.
		function getCurrentMoment(timeZone) {
			var time = moment();

			if(timeZone) {
				time.tz(timeZone);
			}
			
			return time;
		};

		// This method can be called whenever the time or date part changes to update the underlying
		// moment object accordingly.
		function updateMoment() {
			_this.moment.year(_this.datePart.getFullYear());
			_this.moment.month(_this.datePart.getMonth());
			_this.moment.date(_this.datePart.getDate());
			_this.moment.hours(_this.timePart.getHours());
			_this.moment.minutes(_this.timePart.getMinutes());
			_this.moment.seconds(_this.timePart.getSeconds());
			_this.moment.milliseconds(_this.timePart.getMilliseconds());
		}
	};
	TimeZoneObject.prototype.toString = function() {
		return "Moment: " + this.moment.toString() + ". TimeZone: " + this.timeZoneName + ". [DatePart: " + this.datePart.toDateString() + "] and [TimePart: " + this.timePart.toTimeString() + "].";
	}
	
    return TimeZoneObject;
}]);

timeZoneObjectModule.factory('OffsetBasedTimeZoneObject', [function() {
	function TimeZoneObject(offsetInMinutes, title)
	{
		var _this = this;

		// Resets <code>this</code> time zone object to current time and starts the timers.
		this.resetMoment = function () {
			_this.moment = getCurrentMoment(offsetInMinutes);
			_this.timePart = getTimePart();
			_this.datePart = getDatePart();
			_this.invalidTime = false;
			_this.timerManager(true);
		};

		// Marks <code>this</code> time zone object as invalid and stops the timers.
		this.destroyMoment = function () {
			_this.moment = null;
			_this.timePart = null;
			_this.datePart = null;
			_this.invalidTime = true;
			_this.timerManager(false);

			delete _this;
		};

		this.getMomentInUTC = function() {
			var clone = moment(_this.moment);
			return clone.utcOffset(0);
		}

		// Takes a UTC moment as input and sets <code>this</code> instance to represent
		// the same moment.
		// If <code>this</code> is a UTC+5:30 object and if the input is 3 AM UTC, the moment will
		// be set to whatever the time is in UTC+5:30 when it is 3 AM UTC.
		this.setMomentFromUTC = function (inputMoment) {
			// Corresponding moment in this timeZone
			var thisTimeZoneMoment = inputMoment.utcOffset(_this.offsetInMinutes);

			clearInterval(timer);
			_this.moment = thisTimeZoneMoment;

			_this.timePart = getTimePart();
			_this.datePart = getDatePart();
        }

		this.markAsInvalid = function() {
			this.invalidTime = true;
		}

		this.markAsValid = function() {
			this.invalidTime = false;
		}

		this.setEditMode = function(editMode) {
			this.editMode = editMode;
		}

		function getTimePart() {
			var m = _this.moment;
			return new Date(m.year(), m.month(), m.date(),  m.hours(), m.minutes(), m.seconds());
		};

		this.timePartGetterSetter = function(value) {
			if(angular.isDefined(value)) {
				if(value == null) {
					// Empty value in the time part. Ignoring the value.
					return;
				}
				this.timePart = value;
				updateMoment();
			}
			else {
				return this.timePart;
			}
		}

		function getDatePart() {
			var m = _this.moment;
			return new Date(m.year(), m.month(), m.date(), 0, 0, 0);
		};

		this.datePartGetterSetter = function(value) {
			if(angular.isDefined(value)) {
				if(value == null) {
					throw "An empty date part should never happen because user can only pick from date picker";
				}
				this.datePart = value;
				updateMoment();
			}
			else {
				return this.datePart;
			}
		}

		// The title of the time zone to be displayed. This can be any value but usually used to hold
		// a user friendly name to identify a time zone like GMT+5:30, UTC-1 etc.
		this.title = title;
		this.offsetInMinutes = offsetInMinutes;
		if(offsetInMinutes == undefined)
		{
			this.title = 'UTC+0';
			this.offsetInMinutes = 0;
		}
		if(!this.title)
		{
			this.title = 'UTC+0';
		}
		this.moment = getCurrentMoment(offsetInMinutes);
		// A time zone object can be marked invalid, when the user enters an invalid timestamp.
		this.invalidTime = false;

		this.timePart = getTimePart();
		this.datePart = getDatePart();
		this.editMode = false;

		var timer = null;
		// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
		this.timerManager = function (flag) {
			if(flag) {
				clearInterval(timer);
				timer =  setInterval(function() {
					_this.moment = getCurrentMoment(offsetInMinutes);
					_this.timePart = getTimePart();
					_this.datePart = getDatePart();
				}, 1000);
			}
			else {
				clearInterval(timer);
			}
		};
		this.timerManager(true);

		// Get the current moment at the given offset.
		function getCurrentMoment(offsetInMinutes) {
			var time = moment().utc();
			time.utcOffset(offsetInMinutes);

			return time;
		};

		// This method can be called whenever the time or date part changes to update the underlying
		// moment object accordingly.
		function updateMoment() {
			_this.moment.year(_this.datePart.getFullYear());
			_this.moment.month(_this.datePart.getMonth());
			_this.moment.date(_this.datePart.getDate());
			_this.moment.hours(_this.timePart.getHours());
			_this.moment.minutes(_this.timePart.getMinutes());
			_this.moment.seconds(_this.timePart.getSeconds());
			_this.moment.milliseconds(_this.timePart.getMilliseconds());
		}
	};
	TimeZoneObject.prototype.toString = function() {
		return "Moment: " + this.moment.toString() + ". Offset: " + this.offsetInMinutes + ". [DatePart: " + this.datePart.toDateString() + "] and [TimePart: " + this.timePart.toTimeString() + "].";
	}

    return TimeZoneObject;
}]);