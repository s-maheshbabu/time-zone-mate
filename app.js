(function ClockController() {
var app = angular.module('clock', ['ui.timepicker']);

angular.module('ui.timepicker').value('uiTimepickerConfig',{
  showOnFocus: false,
  timeFormat: 'h:i:s A'
});

app.factory('TimeZoneObject', [function() {
	function TimeZoneObject(timeZoneName, title)
	{
		var _this = this;

		// The title of the time zone to be displayed. This can be any value but usually used to hold
		// a user friendly name to identify a time zone like a city, country etc.
		this.title = title;
		this.timeZoneName = timeZoneName;
		if(!timeZoneName)
		{
			this.title = 'Local Time';
			this.timeZoneName = jstz.determine().name();
		}
		if(!title)
		{
			this.title = timeZoneName;
		}
		this.moment = getMoment(timeZoneName);
		this.vanillaDate = getVanillaDate();
		// A time zone object can be marked invalid, when the user enters an invalid timestamp.
		this.invalidTime = false;

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

		this.markAsInvalid = function() {
			this.invalidTime = true;
		}

		this.markAsValid = function() {
			this.invalidTime = false;
		}

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
			_this.invalidTime = false;
			_this.timerManager(true);
		};

		// Marks <code>this</code> time zone object as invalid and stops the timers.
		this.destroyMoment = function () {
			_this.moment = null;
			_this.vanillaDate = null;
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

			_this.vanillaDate = getVanillaDate();
        }
	};
	TimeZoneObject.prototype.toString = function() {
		return "ToString on TimeZoneObject NotImplemented";
	}
	
    return TimeZoneObject;
}]);

app.service('TimeZoneClocksManager', ['TimeZoneObject', function(TimeZoneObject) {
	var clocksRunning = true;

	var allTimeZones = [new TimeZoneObject(), new TimeZoneObject('UTC')];

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

			var timeZoneObjectToBeAdded = new TimeZoneObject(timeZoneToBeAdded, titleOfTheTimeZone);
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
						timeZoneObjectToBeAdded.setMoment(aValidTimeZoneObject.vanillaDate, aValidTimeZoneObject.timeZoneName);
					}
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
	var timeZonesToTimeZones = [['Africa/Abidjan','Africa/Abidjan'],['Africa/Accra','Africa/Accra'],['Africa/Addis_Ababa','Africa/Addis_Ababa'],['Africa/Algiers','Africa/Algiers'],['Africa/Asmara','Africa/Asmara'],['Africa/Bamako','Africa/Bamako'],['Africa/Bangui','Africa/Bangui'],['Africa/Banjul','Africa/Banjul'],['Africa/Bissau','Africa/Bissau'],['Africa/Blantyre','Africa/Blantyre'],['Africa/Brazzaville','Africa/Brazzaville'],['Africa/Bujumbura','Africa/Bujumbura'],['Africa/Cairo','Africa/Cairo'],['Africa/Casablanca','Africa/Casablanca'],['Africa/Ceuta','Africa/Ceuta'],['Africa/Conakry','Africa/Conakry'],['Africa/Dakar','Africa/Dakar'],['Africa/Dar_es_Salaam','Africa/Dar_es_Salaam'],['Africa/Djibouti','Africa/Djibouti'],['Africa/Douala','Africa/Douala'],['Africa/El_Aaiun','Africa/El_Aaiun'],['Africa/Freetown','Africa/Freetown'],['Africa/Gaborone','Africa/Gaborone'],['Africa/Harare','Africa/Harare'],['Africa/Johannesburg','Africa/Johannesburg'],['Africa/Juba','Africa/Juba'],['Africa/Kampala','Africa/Kampala'],['Africa/Khartoum','Africa/Khartoum'],['Africa/Kigali','Africa/Kigali'],['Africa/Kinshasa','Africa/Kinshasa'],['Africa/Lagos','Africa/Lagos'],['Africa/Libreville','Africa/Libreville'],['Africa/Lome','Africa/Lome'],['Africa/Luanda','Africa/Luanda'],['Africa/Lubumbashi','Africa/Lubumbashi'],['Africa/Lusaka','Africa/Lusaka'],['Africa/Malabo','Africa/Malabo'],['Africa/Maputo','Africa/Maputo'],['Africa/Maseru','Africa/Maseru'],['Africa/Mbabane','Africa/Mbabane'],['Africa/Mogadishu','Africa/Mogadishu'],['Africa/Monrovia','Africa/Monrovia'],['Africa/Nairobi','Africa/Nairobi'],['Africa/Ndjamena','Africa/Ndjamena'],['Africa/Niamey','Africa/Niamey'],['Africa/Nouakchott','Africa/Nouakchott'],['Africa/Ouagadougou','Africa/Ouagadougou'],['Africa/Porto-Novo','Africa/Porto-Novo'],['Africa/Sao_Tome','Africa/Sao_Tome'],['Africa/Tripoli','Africa/Tripoli'],['Africa/Tunis','Africa/Tunis'],['Africa/Windhoek','Africa/Windhoek'],['America/Adak','America/Adak'],['America/Anchorage','America/Anchorage'],['America/Anguilla','America/Anguilla'],['America/Antigua','America/Antigua'],['America/Araguaina','America/Araguaina'],['America/Argentina/Buenos_Aires','America/Argentina/Buenos_Aires'],['America/Argentina/Catamarca','America/Argentina/Catamarca'],['America/Argentina/Cordoba','America/Argentina/Cordoba'],['America/Argentina/Jujuy','America/Argentina/Jujuy'],['America/Argentina/La_Rioja','America/Argentina/La_Rioja'],['America/Argentina/Mendoza','America/Argentina/Mendoza'],['America/Argentina/Rio_Gallegos','America/Argentina/Rio_Gallegos'],['America/Argentina/Salta','America/Argentina/Salta'],['America/Argentina/San_Juan','America/Argentina/San_Juan'],['America/Argentina/San_Luis','America/Argentina/San_Luis'],['America/Argentina/Tucuman','America/Argentina/Tucuman'],['America/Argentina/Ushuaia','America/Argentina/Ushuaia'],['America/Aruba','America/Aruba'],['America/Asuncion','America/Asuncion'],['America/Atikokan','America/Atikokan'],['America/Bahia','America/Bahia'],['America/Bahia_Banderas','America/Bahia_Banderas'],['America/Barbados','America/Barbados'],['America/Belem','America/Belem'],['America/Belize','America/Belize'],['America/Blanc-Sablon','America/Blanc-Sablon'],['America/Boa_Vista','America/Boa_Vista'],['America/Bogota','America/Bogota'],['America/Boise','America/Boise'],['America/Cambridge_Bay','America/Cambridge_Bay'],['America/Campo_Grande','America/Campo_Grande'],['America/Cancun','America/Cancun'],['America/Caracas','America/Caracas'],['America/Cayenne','America/Cayenne'],['America/Cayman','America/Cayman'],['America/Chicago','America/Chicago'],['America/Chihuahua','America/Chihuahua'],['America/Costa_Rica','America/Costa_Rica'],['America/Creston','America/Creston'],['America/Cuiaba','America/Cuiaba'],['America/Curacao','America/Curacao'],['America/Danmarkshavn','America/Danmarkshavn'],['America/Dawson','America/Dawson'],['America/Dawson_Creek','America/Dawson_Creek'],['America/Denver','America/Denver'],['America/Detroit','America/Detroit'],['America/Dominica','America/Dominica'],['America/Edmonton','America/Edmonton'],['America/Eirunepe','America/Eirunepe'],['America/El_Salvador','America/El_Salvador'],['America/Fortaleza','America/Fortaleza'],['America/Glace_Bay','America/Glace_Bay'],['America/Godthab','America/Godthab'],['America/Goose_Bay','America/Goose_Bay'],['America/Grand_Turk','America/Grand_Turk'],['America/Grenada','America/Grenada'],['America/Guadeloupe','America/Guadeloupe'],['America/Guatemala','America/Guatemala'],['America/Guayaquil','America/Guayaquil'],['America/Guyana','America/Guyana'],['America/Halifax','America/Halifax'],['America/Havana','America/Havana'],['America/Hermosillo','America/Hermosillo'],['America/Indiana/Indianapolis','America/Indiana/Indianapolis'],['America/Indiana/Knox','America/Indiana/Knox'],['America/Indiana/Marengo','America/Indiana/Marengo'],['America/Indiana/Petersburg','America/Indiana/Petersburg'],['America/Indiana/Tell_City','America/Indiana/Tell_City'],['America/Indiana/Vevay','America/Indiana/Vevay'],['America/Indiana/Vincennes','America/Indiana/Vincennes'],['America/Indiana/Winamac','America/Indiana/Winamac'],['America/Inuvik','America/Inuvik'],['America/Iqaluit','America/Iqaluit'],['America/Jamaica','America/Jamaica'],['America/Juneau','America/Juneau'],['America/Kentucky/Louisville','America/Kentucky/Louisville'],['America/Kentucky/Monticello','America/Kentucky/Monticello'],['America/Kralendijk','America/Kralendijk'],['America/La_Paz','America/La_Paz'],['America/Lima','America/Lima'],['America/Los_Angeles','America/Los_Angeles'],['America/Lower_Princes','America/Lower_Princes'],['America/Maceio','America/Maceio'],['America/Managua','America/Managua'],['America/Manaus','America/Manaus'],['America/Marigot','America/Marigot'],['America/Martinique','America/Martinique'],['America/Matamoros','America/Matamoros'],['America/Mazatlan','America/Mazatlan'],['America/Menominee','America/Menominee'],['America/Merida','America/Merida'],['America/Metlakatla','America/Metlakatla'],['America/Mexico_City','America/Mexico_City'],['America/Miquelon','America/Miquelon'],['America/Moncton','America/Moncton'],['America/Monterrey','America/Monterrey'],['America/Montevideo','America/Montevideo'],['America/Montserrat','America/Montserrat'],['America/Nassau','America/Nassau'],['America/New_York','America/New_York'],['America/Nipigon','America/Nipigon'],['America/Nome','America/Nome'],['America/Noronha','America/Noronha'],['America/North_Dakota/Beulah','America/North_Dakota/Beulah'],['America/North_Dakota/Center','America/North_Dakota/Center'],['America/North_Dakota/New_Salem','America/North_Dakota/New_Salem'],['America/Ojinaga','America/Ojinaga'],['America/Panama','America/Panama'],['America/Pangnirtung','America/Pangnirtung'],['America/Paramaribo','America/Paramaribo'],['America/Phoenix','America/Phoenix'],['America/Port-au-Prince','America/Port-au-Prince'],['America/Port_of_Spain','America/Port_of_Spain'],['America/Porto_Velho','America/Porto_Velho'],['America/Puerto_Rico','America/Puerto_Rico'],['America/Rainy_River','America/Rainy_River'],['America/Rankin_Inlet','America/Rankin_Inlet'],['America/Recife','America/Recife'],['America/Regina','America/Regina'],['America/Resolute','America/Resolute'],['America/Rio_Branco','America/Rio_Branco'],['America/Santa_Isabel','America/Santa_Isabel'],['America/Santarem','America/Santarem'],['America/Santiago','America/Santiago'],['America/Santo_Domingo','America/Santo_Domingo'],['America/Sao_Paulo','America/Sao_Paulo'],['America/Scoresbysund','America/Scoresbysund'],['America/Sitka','America/Sitka'],['America/St_Barthelemy','America/St_Barthelemy'],['America/St_Johns','America/St_Johns'],['America/St_Kitts','America/St_Kitts'],['America/St_Lucia','America/St_Lucia'],['America/St_Thomas','America/St_Thomas'],['America/St_Vincent','America/St_Vincent'],['America/Swift_Current','America/Swift_Current'],['America/Tegucigalpa','America/Tegucigalpa'],['America/Thule','America/Thule'],['America/Thunder_Bay','America/Thunder_Bay'],['America/Tijuana','America/Tijuana'],['America/Toronto','America/Toronto'],['America/Tortola','America/Tortola'],['America/Vancouver','America/Vancouver'],['America/Whitehorse','America/Whitehorse'],['America/Winnipeg','America/Winnipeg'],['America/Yakutat','America/Yakutat'],['America/Yellowknife','America/Yellowknife'],['Antarctica/Casey','Antarctica/Casey'],['Antarctica/Davis','Antarctica/Davis'],['Antarctica/DumontDUrville','Antarctica/DumontDUrville'],['Antarctica/Macquarie','Antarctica/Macquarie'],['Antarctica/Mawson','Antarctica/Mawson'],['Antarctica/McMurdo','Antarctica/McMurdo'],['Antarctica/Palmer','Antarctica/Palmer'],['Antarctica/Rothera','Antarctica/Rothera'],['Antarctica/Syowa','Antarctica/Syowa'],['Antarctica/Troll','Antarctica/Troll'],['Antarctica/Vostok','Antarctica/Vostok'],['Arctic/Longyearbyen','Arctic/Longyearbyen'],['Asia/Aden','Asia/Aden'],['Asia/Almaty','Asia/Almaty'],['Asia/Amman','Asia/Amman'],['Asia/Anadyr','Asia/Anadyr'],['Asia/Aqtau','Asia/Aqtau'],['Asia/Aqtobe','Asia/Aqtobe'],['Asia/Ashgabat','Asia/Ashgabat'],['Asia/Baghdad','Asia/Baghdad'],['Asia/Bahrain','Asia/Bahrain'],['Asia/Baku','Asia/Baku'],['Asia/Bangkok','Asia/Bangkok'],['Asia/Beirut','Asia/Beirut'],['Asia/Bishkek','Asia/Bishkek'],['Asia/Brunei','Asia/Brunei'],['Asia/Chita','Asia/Chita'],['Asia/Choibalsan','Asia/Choibalsan'],['Asia/Colombo','Asia/Colombo'],['Asia/Damascus','Asia/Damascus'],['Asia/Dhaka','Asia/Dhaka'],['Asia/Dili','Asia/Dili'],['Asia/Dubai','Asia/Dubai'],['Asia/Dushanbe','Asia/Dushanbe'],['Asia/Gaza','Asia/Gaza'],['Asia/Hebron','Asia/Hebron'],['Asia/Ho_Chi_Minh','Asia/Ho_Chi_Minh'],['Asia/Hong_Kong','Asia/Hong_Kong'],['Asia/Hovd','Asia/Hovd'],['Asia/Irkutsk','Asia/Irkutsk'],['Asia/Jakarta','Asia/Jakarta'],['Asia/Jayapura','Asia/Jayapura'],['Asia/Jerusalem','Asia/Jerusalem'],['Asia/Kabul','Asia/Kabul'],['Asia/Kamchatka','Asia/Kamchatka'],['Asia/Karachi','Asia/Karachi'],['Asia/Kathmandu','Asia/Kathmandu'],['Asia/Khandyga','Asia/Khandyga'],['Asia/Kolkata','Asia/Kolkata'],['Asia/Krasnoyarsk','Asia/Krasnoyarsk'],['Asia/Kuala_Lumpur','Asia/Kuala_Lumpur'],['Asia/Kuching','Asia/Kuching'],['Asia/Kuwait','Asia/Kuwait'],['Asia/Macau','Asia/Macau'],['Asia/Magadan','Asia/Magadan'],['Asia/Makassar','Asia/Makassar'],['Asia/Manila','Asia/Manila'],['Asia/Muscat','Asia/Muscat'],['Asia/Nicosia','Asia/Nicosia'],['Asia/Novokuznetsk','Asia/Novokuznetsk'],['Asia/Novosibirsk','Asia/Novosibirsk'],['Asia/Omsk','Asia/Omsk'],['Asia/Oral','Asia/Oral'],['Asia/Phnom_Penh','Asia/Phnom_Penh'],['Asia/Pontianak','Asia/Pontianak'],['Asia/Pyongyang','Asia/Pyongyang'],['Asia/Qatar','Asia/Qatar'],['Asia/Qyzylorda','Asia/Qyzylorda'],['Asia/Rangoon','Asia/Rangoon'],['Asia/Riyadh','Asia/Riyadh'],['Asia/Sakhalin','Asia/Sakhalin'],['Asia/Samarkand','Asia/Samarkand'],['Asia/Seoul','Asia/Seoul'],['Asia/Shanghai','Asia/Shanghai'],['Asia/Singapore','Asia/Singapore'],['Asia/Srednekolymsk','Asia/Srednekolymsk'],['Asia/Taipei','Asia/Taipei'],['Asia/Tashkent','Asia/Tashkent'],['Asia/Tbilisi','Asia/Tbilisi'],['Asia/Tehran','Asia/Tehran'],['Asia/Thimphu','Asia/Thimphu'],['Asia/Tokyo','Asia/Tokyo'],['Asia/Ulaanbaatar','Asia/Ulaanbaatar'],['Asia/Urumqi','Asia/Urumqi'],['Asia/Ust-Nera','Asia/Ust-Nera'],['Asia/Vientiane','Asia/Vientiane'],['Asia/Vladivostok','Asia/Vladivostok'],['Asia/Yakutsk','Asia/Yakutsk'],['Asia/Yekaterinburg','Asia/Yekaterinburg'],['Asia/Yerevan','Asia/Yerevan'],['Atlantic/Azores','Atlantic/Azores'],['Atlantic/Bermuda','Atlantic/Bermuda'],['Atlantic/Canary','Atlantic/Canary'],['Atlantic/Cape_Verde','Atlantic/Cape_Verde'],['Atlantic/Faroe','Atlantic/Faroe'],['Atlantic/Madeira','Atlantic/Madeira'],['Atlantic/Reykjavik','Atlantic/Reykjavik'],['Atlantic/South_Georgia','Atlantic/South_Georgia'],['Atlantic/St_Helena','Atlantic/St_Helena'],['Atlantic/Stanley','Atlantic/Stanley'],['Australia/Adelaide','Australia/Adelaide'],['Australia/Brisbane','Australia/Brisbane'],['Australia/Broken_Hill','Australia/Broken_Hill'],['Australia/Currie','Australia/Currie'],['Australia/Darwin','Australia/Darwin'],['Australia/Eucla','Australia/Eucla'],['Australia/Hobart','Australia/Hobart'],['Australia/Lindeman','Australia/Lindeman'],['Australia/Lord_Howe','Australia/Lord_Howe'],['Australia/Melbourne','Australia/Melbourne'],['Australia/Perth','Australia/Perth'],['Australia/Sydney','Australia/Sydney'],['Europe/Amsterdam','Europe/Amsterdam'],['Europe/Andorra','Europe/Andorra'],['Europe/Athens','Europe/Athens'],['Europe/Belgrade','Europe/Belgrade'],['Europe/Berlin','Europe/Berlin'],['Europe/Bratislava','Europe/Bratislava'],['Europe/Brussels','Europe/Brussels'],['Europe/Bucharest','Europe/Bucharest'],['Europe/Budapest','Europe/Budapest'],['Europe/Busingen','Europe/Busingen'],['Europe/Chisinau','Europe/Chisinau'],['Europe/Copenhagen','Europe/Copenhagen'],['Europe/Dublin','Europe/Dublin'],['Europe/Gibraltar','Europe/Gibraltar'],['Europe/Guernsey','Europe/Guernsey'],['Europe/Helsinki','Europe/Helsinki'],['Europe/Isle_of_Man','Europe/Isle_of_Man'],['Europe/Istanbul','Europe/Istanbul'],['Europe/Jersey','Europe/Jersey'],['Europe/Kaliningrad','Europe/Kaliningrad'],['Europe/Kiev','Europe/Kiev'],['Europe/Lisbon','Europe/Lisbon'],['Europe/Ljubljana','Europe/Ljubljana'],['Europe/London','Europe/London'],['Europe/Luxembourg','Europe/Luxembourg'],['Europe/Madrid','Europe/Madrid'],['Europe/Malta','Europe/Malta'],['Europe/Mariehamn','Europe/Mariehamn'],['Europe/Minsk','Europe/Minsk'],['Europe/Monaco','Europe/Monaco'],['Europe/Moscow','Europe/Moscow'],['Europe/Oslo','Europe/Oslo'],['Europe/Paris','Europe/Paris'],['Europe/Podgorica','Europe/Podgorica'],['Europe/Prague','Europe/Prague'],['Europe/Riga','Europe/Riga'],['Europe/Rome','Europe/Rome'],['Europe/Samara','Europe/Samara'],['Europe/San_Marino','Europe/San_Marino'],['Europe/Sarajevo','Europe/Sarajevo'],['Europe/Simferopol','Europe/Simferopol'],['Europe/Skopje','Europe/Skopje'],['Europe/Sofia','Europe/Sofia'],['Europe/Stockholm','Europe/Stockholm'],['Europe/Tallinn','Europe/Tallinn'],['Europe/Tirane','Europe/Tirane'],['Europe/Uzhgorod','Europe/Uzhgorod'],['Europe/Vaduz','Europe/Vaduz'],['Europe/Vatican','Europe/Vatican'],['Europe/Vienna','Europe/Vienna'],['Europe/Vilnius','Europe/Vilnius'],['Europe/Volgograd','Europe/Volgograd'],['Europe/Warsaw','Europe/Warsaw'],['Europe/Zagreb','Europe/Zagreb'],['Europe/Zaporozhye','Europe/Zaporozhye'],['Europe/Zurich','Europe/Zurich'],['Indian/Antananarivo','Indian/Antananarivo'],['Indian/Chagos','Indian/Chagos'],['Indian/Christmas','Indian/Christmas'],['Indian/Cocos','Indian/Cocos'],['Indian/Comoro','Indian/Comoro'],['Indian/Kerguelen','Indian/Kerguelen'],['Indian/Mahe','Indian/Mahe'],['Indian/Maldives','Indian/Maldives'],['Indian/Mauritius','Indian/Mauritius'],['Indian/Mayotte','Indian/Mayotte'],['Indian/Reunion','Indian/Reunion'],['Pacific/Apia','Pacific/Apia'],['Pacific/Auckland','Pacific/Auckland'],['Pacific/Bougainville','Pacific/Bougainville'],['Pacific/Chatham','Pacific/Chatham'],['Pacific/Chuuk','Pacific/Chuuk'],['Pacific/Easter','Pacific/Easter'],['Pacific/Efate','Pacific/Efate'],['Pacific/Enderbury','Pacific/Enderbury'],['Pacific/Fakaofo','Pacific/Fakaofo'],['Pacific/Fiji','Pacific/Fiji'],['Pacific/Funafuti','Pacific/Funafuti'],['Pacific/Galapagos','Pacific/Galapagos'],['Pacific/Gambier','Pacific/Gambier'],['Pacific/Guadalcanal','Pacific/Guadalcanal'],['Pacific/Guam','Pacific/Guam'],['Pacific/Honolulu','Pacific/Honolulu'],['Pacific/Johnston','Pacific/Johnston'],['Pacific/Kiritimati','Pacific/Kiritimati'],['Pacific/Kosrae','Pacific/Kosrae'],['Pacific/Kwajalein','Pacific/Kwajalein'],['Pacific/Majuro','Pacific/Majuro'],['Pacific/Marquesas','Pacific/Marquesas'],['Pacific/Midway','Pacific/Midway'],['Pacific/Nauru','Pacific/Nauru'],['Pacific/Niue','Pacific/Niue'],['Pacific/Norfolk','Pacific/Norfolk'],['Pacific/Noumea','Pacific/Noumea'],['Pacific/Pago_Pago','Pacific/Pago_Pago'],['Pacific/Palau','Pacific/Palau'],['Pacific/Pitcairn','Pacific/Pitcairn'],['Pacific/Pohnpei','Pacific/Pohnpei'],['Pacific/Port_Moresby','Pacific/Port_Moresby'],['Pacific/Rarotonga','Pacific/Rarotonga'],['Pacific/Saipan','Pacific/Saipan'],['Pacific/Tahiti','Pacific/Tahiti'],['Pacific/Tarawa','Pacific/Tarawa'],['Pacific/Tongatapu','Pacific/Tongatapu'],['Pacific/Wake','Pacific/Wake'],['Pacific/Wallis','Pacific/Wallis']];
	var offsetToTimeZones = [['GMT','GMT'],['UTC','UTC'],['GMT-11','Pacific/Midway'],['UTC-11','Pacific/Midway'],['GMT-10','Pacific/Honolulu'],['UTC-10','Pacific/Honolulu'],['GMT-9:30','Pacific/Marquesas'],['UTC-9:30','Pacific/Marquesas'],['GMT-9','America/Nome'],['UTC-9','America/Nome'],['GMT-8','America/Los_Angeles'],['UTC-8','America/Los_Angeles'],['GMT-7','America/Denver'],['UTC-7','America/Denver'],['GMT-6','America/Chicago'],['UTC-6','America/Chicago'],['GMT-5','America/Bogota'],['UTC-5','America/Bogota'],['GMT-4:30','America/Caracas'],['UTC-4:30','America/Caracas'],['GMT-4','America/Noronha'],['UTC-4','America/Noronha'],['GMT-3:30','America/St_Johns'],['UTC-3:30','America/St_Johns'],['GMT-3','America/Belem'],['UTC-3','America/Belem'],['GMT-2','America/Noronha'],['UTC-2','America/Noronha'],['GMT-1','America/Scoresbysund'],['UTC-1','America/Scoresbysund'],['GMT+1','Europe/Amsterdam'],['UTC+1','Europe/Amsterdam'],['GMT+2','Africa/Cairo'],['UTC+2','Africa/Cairo'],['GMT+3','Asia/Bahrain'],['UTC+3','Asia/Bahrain'],['GMT+3:30','Asia/Tehran'],['UTC+3:30','Asia/Tehran'],['GMT+4','Asia/Dubai'],['UTC+4','Asia/Dubai'],['GMT+4:30','Asia/Kabul'],['UTC+4:30','Asia/Kabul'],['GMT+5','Asia/Karachi'],['UTC+5','Asia/Karachi'],['GMT+5:30','Asia/Kolkata'],['UTC+5:30','Asia/Kolkata'],['GMT+5:45','Asia/Kathmandu'],['UTC+5:45','Asia/Kathmandu'],['GMT+6','Asia/Dhaka'],['UTC+6','Asia/Dhaka'],['GMT+6:30','Asia/Rangoon'],['UTC+6:30','Asia/Rangoon'],['GMT+7','Asia/Bangkok'],['UTC+7','Asia/Bangkok'],['GMT+8','Asia/Shanghai'],['UTC+8','Asia/Shanghai'],['GMT+8:45','Australia/Eucla'],['UTC+8:45','Australia/Eucla'],['GMT+9','Asia/Seoul'],['UTC+9','Asia/Seoul'],['GMT+9:30','Australia/Darwin'],['UTC+9:30','Australia/Darwin'],['GMT+10','Asia/Magadan'],['UTC+10','Asia/Magadan'],['GMT+10:30','Australia/Lord_Howe'],['UTC+10:30','Australia/Lord_Howe'],['GMT+11','Antarctica/Casey'],['UTC+11','Antarctica/Casey'],['GMT+11:30','Pacific/Norfolk'],['UTC+11:30','Pacific/Norfolk'],['GMT+12','Antarctica/McMurdo'],['UTC+12','Antarctica/McMurdo'],['GMT+12:45','Pacific/Chatham'],['UTC+12:45','Pacific/Chatham'],['GMT+13','Pacific/Enderbury'],['UTC+13','Pacific/Enderbury'],['GMT+14','Pacific/Kiritimati'],['UTC+14','Pacific/Kiritimati']];
	var locationsToTimeZones = timeZonesToTimeZones.concat(offsetToTimeZones);

    return {
        getLocations: function() {
			var locations = new Array();
			for(var i = 0; i < locationsToTimeZones.length; i++) {
				locations[i] = locationsToTimeZones[i][0];
			}
			return locations;
        },
        getTimeZone: function(timeZoneKey) {
			for(var i = 0; i < locationsToTimeZones.length; i++) {
				if(locationsToTimeZones[i][0] == timeZoneKey) {
					return locationsToTimeZones[i][1];
				}
			}
			throw "An unexpected error. Time zone for the requested location " + timeZoneKey + " is not known.";
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
			// Initialize the timepicker.
			elem.timepicker();

			elem.on('changeTime', function() {
                // This event is triggered only when a valid timestamp is entered by user. So set it as a valid time.
				attr.validtime = true;
            });

			elem.on('change', function() {
				if(attr.validtime == false) {
					console.log("Returning right away because we currently hold an invalid time " + elem.val());
					return;
				}

				var allTimeZones = TimeZoneClocksManager.allTimeZones();
				console.log("A valid time was entered by the user: " + allTimeZones[scope.index].vanillaDate + " at index: " + scope.index);

				var editedDate = allTimeZones[scope.index].vanillaDate;
				var editedtimeZone = allTimeZones[scope.index].timeZoneName;

				TimeZoneClocksManager.stopClocks();
				for (var i = 0; i < allTimeZones.length; i++) {
					allTimeZones[i].setMoment(editedDate, editedtimeZone);
				}
				TimeZoneClocksManager.markAllClocksValid();
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
            });
		}
    };
});

app.directive('autoComplete', function(TimeZoneAutoCompleteService, TimeZoneClocksManager) {
    return {
        restrict: 'A',
        link: function(scope, elem, attr, ctrl) {
            elem.autocomplete({
				lookupLimit: 10,
				triggerSelectOnValidInput: false,
				lookup: TimeZoneAutoCompleteService.getLocations(),
				autoSelectFirst: true,
				onSelect: function (suggestion) {
					var locationToBeAdded = suggestion.value;
					TimeZoneClocksManager.addTimeZone(TimeZoneAutoCompleteService.getTimeZone(locationToBeAdded), locationToBeAdded);
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

	// All clocks being reset.
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

