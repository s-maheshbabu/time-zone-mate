var TimeZoneObject = (function() {
	function TimeZoneObject($interval)
	{
		this.interval = $interval;
		// A time zone object can be marked invalid, when the user enters an invalid timestamp.
		this.invalidTime = false;

		this.editMode = false;

		var timer = null;
		this._getTimer = function() {
			return timer;
		};
		this._setTimer = function(t) {
			timer = t;
		};
		this.timerManager(true);
	};

	// This method can be called whenever the time or date part changes to update the underlying
	// moment object accordingly.
	TimeZoneObject.prototype._updateMoment = function (timePart, datePart) {
			if(datePart != null) {
				this.moment.year(datePart.getFullYear());
				this.moment.month(datePart.getMonth());
				this.moment.date(datePart.getDate());
			}
			if(timePart != null) {
				this.moment.hours(timePart.getHours());
				this.moment.minutes(timePart.getMinutes());
				this.moment.seconds(timePart.getSeconds());
				this.moment.milliseconds(timePart.getMilliseconds());
			}

			// We maintain these fields instead of just calling _getTimePart() in
			// timePartGetterSetter because angular doesn't like GetterSetters that
			// return a new instance every time. It will do a reference equality, think
			// something changed and keep looping forever.
			this._timePart = this._getTimePart();
			this._datePart = this._getDatePart();
	};
	TimeZoneObject.prototype._getTimePart = function() {
			var m = this.moment;
			return new Date(m.year(), m.month(), m.date(),  m.hours(), m.minutes(), m.seconds());
	};
	TimeZoneObject.prototype._getDatePart = function() {
			var m = this.moment;
			return new Date(m.year(), m.month(), m.date(), 0, 0, 0);
	};
	TimeZoneObject.prototype.timePartGetterSetter = function(value) {
		if(angular.isDefined(value)) {
			if(value == null) {
				// Empty value in the time part. Ignoring the value.
				return;
			}
			this._updateMoment(value, null);
		}
		else {
			return this._timePart;
		}
	};
	TimeZoneObject.prototype.datePartGetterSetter = function(value) {
		if(angular.isDefined(value)) {
			if(value == null) {
				throw "An empty date part should never happen because user can only pick from date picker";
			}
			this._updateMoment(null, value);
		}
		else {
			return this._datePart;
		}
	};
	// Control the timer. If set to true, timers will be triggered. If set to false, any existing timers will be stopped.
	TimeZoneObject.prototype.timerManager = function(flag) {
		var _this = this;
		if(flag) {
			this.interval.cancel(this._getTimer());
			this._setTimer(this.interval(function() {
				_this.moment = _this._getCurrentMoment();

				_this._timePart = _this._getTimePart();
				_this._datePart = _this._getDatePart();
			}, 1000));
		}
		else {
			this.interval.cancel(this._getTimer());
		}
	};
	// Resets <code>this</code> time zone object to current time and starts the timers.
	TimeZoneObject.prototype.resetMoment = function () {
			this.moment = this._getCurrentMoment();
			this.invalidTime = false;
			this.timerManager(true);
	};
	// Marks <code>this</code> time zone object as invalid and stops the timers.
	TimeZoneObject.prototype.destroyMoment = function () {
			this.moment = null;
			this.invalidTime = true;
			this.timerManager(false);

			delete this;
		};
	TimeZoneObject.prototype.markAsInvalid = function() {
			this.invalidTime = true;
	};
	TimeZoneObject.prototype.markAsValid = function() {
			this.invalidTime = false;
	};
	TimeZoneObject.prototype.setEditMode = function(editMode) {
			this.editMode = editMode;
	};

	return TimeZoneObject;
})();

var NameBasedTimeZoneObject = function ($interval, timeZoneName, title)
{
	TimeZoneObject.call(this, $interval);

	this.getMomentInUTC = function() {
		this._updateMoment(this._timePart, this._datePart);
		var clone = moment(this.moment);
		return clone.tz('UTC');
	};

	// Takes a UTC moment as input and sets <code>this</code> instance to represent
	// the same moment.
	// If <code>this</code> is an IST timeZone object and if the input is 3 AM UTC, the moment will
	// be set to whatever the time is in IST when it is 3 AM UTC.
	this.setMomentFromUTC = function (inputMoment) {
		// Corresponding moment in this timeZone
		var thisTimeZoneMoment = inputMoment.tz(this.timeZoneName);

		this.interval.cancel(this._getTimer());
		this.moment = thisTimeZoneMoment;

		this._timePart = this._getTimePart();
		this._datePart = this._getDatePart();
	};

	// Get the current moment in the time zone of 'this' object.
	this._getCurrentMoment = function() {
		var time = moment();

		if(this.timeZoneName) {
			time.tz(this.timeZoneName);
		}

		return time;
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
	this._getTimeZoneName = function() {
		return timeZoneName;
	};
	this.moment = this._getCurrentMoment();
	this._timePart = this._getTimePart();
	this._datePart = this._getDatePart();

	// A time zone object can be marked invalid, when the user enters an invalid timestamp.
	this.invalidTime = false;

	this.editMode = false;

	this.toString = function() {
		return "Moment: " + this.moment.toString() + ". Name: " + this.timeZoneName + ". [DatePart: " + this._datePart.toDateString() + "] and [TimePart: " + this._timePart.toTimeString() + "].";
	};
};

NameBasedTimeZoneObject.prototype = Object.create(TimeZoneObject.prototype);
NameBasedTimeZoneObject.prototype.constructor = NameBasedTimeZoneObject;

var OffsetBasedTimeZoneObject = function ($interval, offsetInMinutes, title)
{
	TimeZoneObject.call(this, $interval);

	this.getMomentInUTC = function() {
		this._updateMoment(this._timePart, this._datePart);
		var clone = moment(this.moment);
		return clone.utcOffset(0);
	};

	// Takes a UTC moment as input and sets <code>this</code> instance to represent
	// the same moment.
	// If <code>this</code> is a UTC+5:30 object and if the input is 3 AM UTC, the moment will
	// be set to whatever the time is in UTC+5:30 when it is 3 AM UTC.
	this.setMomentFromUTC = function (inputMoment) {
		// Corresponding moment in this timeZone
		var thisTimeZoneMoment = inputMoment.utcOffset(this.offsetInMinutes);

		this.interval.cancel(this._getTimer());
		this.moment = thisTimeZoneMoment;

		this._timePart = this._getTimePart();
		this._datePart = this._getDatePart();
	};

	// Get the current moment at the offset of 'this' object.
	this._getCurrentMoment = function() {
		var time = moment().utc();
		time.utcOffset(this.offsetInMinutes);

		return time;
	};

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
	this._getTimeZoneName = function() {
		return timeZoneName;
	};
	this.moment = this._getCurrentMoment(offsetInMinutes);
	this._timePart = this._getTimePart();
	this._datePart = this._getDatePart();

	// A time zone object can be marked invalid, when the user enters an invalid timestamp.
	this.invalidTime = false;

	this.editMode = false;

	this.toString = function() {
		return "Moment: " + this.moment.toString() + ". Offset: " + this.offsetInMinutes + ". [DatePart: " + this._datePart.toDateString() + "] and [TimePart: " + this._timePart.toTimeString() + "].";
	};
};

OffsetBasedTimeZoneObject.prototype = Object.create(TimeZoneObject.prototype);
OffsetBasedTimeZoneObject.prototype.constructor = OffsetBasedTimeZoneObject;
