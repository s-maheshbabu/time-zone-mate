var timeZoneObjectModule= angular.module('TimeZoneObjectModule',[]);

timeZoneObjectModule.factory('TimeZoneObject', [function() {
	function TimeZoneObject(timeZoneName, title)
	{
		var _this = this;

		// Resets <code>this</code> time zone object to current time and starts the timers.
		this.resetMoment = function () {
			_this.moment = getMoment(timeZoneName);
			_this.timePart = _this.getTimePart();
			_this.datePart = _this.getDatePart();
			_this.invalidTime = false;
			_this.timerManager(true);
		};

		// Marks <code>this</code> time zone object as invalid and stops the timers.
		this.destroyMoment = function () {
			_this.moment = null;
			_this.timePart = null;
			_this.invalidTime = true;
			_this.timerManager(false);

			delete _this;
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

			_this.timePart = _this.getTimePart();
			_this.datePart = _this.getDatePart();
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

		this.getTimePart = function () {
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
			}
			else {
				return this.timePart;
			}
		}

		this.getDatePart = function () {
			var m = _this.moment;
			return new Date(m.year(), m.month(), m.date(), 0, 0, 0);
		};

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
		this.moment = getMoment(timeZoneName);
		// A time zone object can be marked invalid, when the user enters an invalid timestamp.
		this.invalidTime = false;

		this.timePart = this.getTimePart();
		this.datePart = this.getDatePart();
		this.editMode = false;

		var timer = null;
		// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
		this.timerManager = function (flag) {
			if(flag) {
				clearInterval(timer);
				timer =  setInterval(function() {
					_this.moment = getMoment(timeZoneName);
					_this.timePart = _this.getTimePart();
					_this.datePart = _this.getDatePart();
				}, 1000);
			}
			else {
				clearInterval(timer);
			}
		};
		this.timerManager(true);

		function getMoment(timeZone) {
			var time = moment();

			if(timeZone) {
				time.tz(timeZone);
			}
			
			return time;
		};
	};
	TimeZoneObject.prototype.toString = function() {
		return "Moment: " + this.moment.toString() + ". TimeZone: " + this.timeZoneName + ". [DatePart: " + this.datePart.toDateString() + "] and [TimePart: " + this.timePart.toTimeString() + "].";
	}
	
    return TimeZoneObject;
}]);