(function ClockController() {
var app = angular.module('clock', ['ui.timepicker', 'ui.bootstrap', 'TimeZoneObjectModule']);

angular.module('ui.timepicker').value('uiTimepickerConfig',{
  showOnFocus: false,
  timeFormat: 'h:i:s A'
});

app.service('TimeZoneClocksManager', ['NameBasedTimeZoneObject', 'OffsetBasedTimeZoneObject', '$injector', function(NameBasedTimeZoneObject, OffsetBasedTimeZoneObject, $injector) {
	var clocksRunning = true;

	var allTimeZones= [$injector.instantiate(NameBasedTimeZoneObject, {timeZoneName:undefined,title:undefined}), $injector.instantiate(OffsetBasedTimeZoneObject, {offsetInMinutes:0, title:'UTC'})];

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

			var timeZoneObjectToBeAdded = $injector.instantiate(NameBasedTimeZoneObject, {timeZoneName:timeZoneToBeAdded,title:titleOfTheTimeZone});
			this._addTimeZone(timeZoneObjectToBeAdded, titleOfTheTimeZone);
		},
		// Adds a new timeZone object that represents time at the given offset. If an object for the given
		// offset already exists, we just move the corresponding object to the top of the list.
		// The title can be any value but is usually used to contain a user friendly name to identify the time zone
		// like GMT+5:30, UTC-1 etc. If missing, the time zone name will be used as title.
		addOffsetBasedTimeZone: function(offsetInMinutes, titleOfTheTimeZone) {
			console.log("We already have " + this.addedTimeZones().length + " timeZones and we are adding time zone at offset " + offsetInMinutes + " under the title " + titleOfTheTimeZone);

			var timeZoneObjectToBeAdded = $injector.instantiate(OffsetBasedTimeZoneObject, {offsetInMinutes:offsetInMinutes, title:titleOfTheTimeZone});
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
	
app.factory('TimeZoneAutoCompleteService', [function() {
	var timeZonesToTimeZones = [['Africa/Abidjan','Africa/Abidjan'],['Africa/Accra','Africa/Accra'],['Africa/Addis_Ababa','Africa/Addis_Ababa'],['Africa/Algiers','Africa/Algiers'],['Africa/Asmara','Africa/Asmara'],['Africa/Bamako','Africa/Bamako'],['Africa/Bangui','Africa/Bangui'],['Africa/Banjul','Africa/Banjul'],['Africa/Bissau','Africa/Bissau'],['Africa/Blantyre','Africa/Blantyre'],['Africa/Brazzaville','Africa/Brazzaville'],['Africa/Bujumbura','Africa/Bujumbura'],['Africa/Cairo','Africa/Cairo'],['Africa/Casablanca','Africa/Casablanca'],['Africa/Ceuta','Africa/Ceuta'],['Africa/Conakry','Africa/Conakry'],['Africa/Dakar','Africa/Dakar'],['Africa/Dar_es_Salaam','Africa/Dar_es_Salaam'],['Africa/Djibouti','Africa/Djibouti'],['Africa/Douala','Africa/Douala'],['Africa/El_Aaiun','Africa/El_Aaiun'],['Africa/Freetown','Africa/Freetown'],['Africa/Gaborone','Africa/Gaborone'],['Africa/Harare','Africa/Harare'],['Africa/Johannesburg','Africa/Johannesburg'],['Africa/Juba','Africa/Juba'],['Africa/Kampala','Africa/Kampala'],['Africa/Khartoum','Africa/Khartoum'],['Africa/Kigali','Africa/Kigali'],['Africa/Kinshasa','Africa/Kinshasa'],['Africa/Lagos','Africa/Lagos'],['Africa/Libreville','Africa/Libreville'],['Africa/Lome','Africa/Lome'],['Africa/Luanda','Africa/Luanda'],['Africa/Lubumbashi','Africa/Lubumbashi'],['Africa/Lusaka','Africa/Lusaka'],['Africa/Malabo','Africa/Malabo'],['Africa/Maputo','Africa/Maputo'],['Africa/Maseru','Africa/Maseru'],['Africa/Mbabane','Africa/Mbabane'],['Africa/Mogadishu','Africa/Mogadishu'],['Africa/Monrovia','Africa/Monrovia'],['Africa/Nairobi','Africa/Nairobi'],['Africa/Ndjamena','Africa/Ndjamena'],['Africa/Niamey','Africa/Niamey'],['Africa/Nouakchott','Africa/Nouakchott'],['Africa/Ouagadougou','Africa/Ouagadougou'],['Africa/Porto-Novo','Africa/Porto-Novo'],['Africa/Sao_Tome','Africa/Sao_Tome'],['Africa/Tripoli','Africa/Tripoli'],['Africa/Tunis','Africa/Tunis'],['Africa/Windhoek','Africa/Windhoek'],['America/Adak','America/Adak'],['America/Anchorage','America/Anchorage'],['America/Anguilla','America/Anguilla'],['America/Antigua','America/Antigua'],['America/Araguaina','America/Araguaina'],['America/Argentina/Buenos_Aires','America/Argentina/Buenos_Aires'],['America/Argentina/Catamarca','America/Argentina/Catamarca'],['America/Argentina/Cordoba','America/Argentina/Cordoba'],['America/Argentina/Jujuy','America/Argentina/Jujuy'],['America/Argentina/La_Rioja','America/Argentina/La_Rioja'],['America/Argentina/Mendoza','America/Argentina/Mendoza'],['America/Argentina/Rio_Gallegos','America/Argentina/Rio_Gallegos'],['America/Argentina/Salta','America/Argentina/Salta'],['America/Argentina/San_Juan','America/Argentina/San_Juan'],['America/Argentina/San_Luis','America/Argentina/San_Luis'],['America/Argentina/Tucuman','America/Argentina/Tucuman'],['America/Argentina/Ushuaia','America/Argentina/Ushuaia'],['America/Aruba','America/Aruba'],['America/Asuncion','America/Asuncion'],['America/Atikokan','America/Atikokan'],['America/Bahia','America/Bahia'],['America/Bahia_Banderas','America/Bahia_Banderas'],['America/Barbados','America/Barbados'],['America/Belem','America/Belem'],['America/Belize','America/Belize'],['America/Blanc-Sablon','America/Blanc-Sablon'],['America/Boa_Vista','America/Boa_Vista'],['America/Bogota','America/Bogota'],['America/Boise','America/Boise'],['America/Cambridge_Bay','America/Cambridge_Bay'],['America/Campo_Grande','America/Campo_Grande'],['America/Cancun','America/Cancun'],['America/Caracas','America/Caracas'],['America/Cayenne','America/Cayenne'],['America/Cayman','America/Cayman'],['America/Chicago','America/Chicago'],['America/Chihuahua','America/Chihuahua'],['America/Costa_Rica','America/Costa_Rica'],['America/Creston','America/Creston'],['America/Cuiaba','America/Cuiaba'],['America/Curacao','America/Curacao'],['America/Danmarkshavn','America/Danmarkshavn'],['America/Dawson','America/Dawson'],['America/Dawson_Creek','America/Dawson_Creek'],['America/Denver','America/Denver'],['America/Detroit','America/Detroit'],['America/Dominica','America/Dominica'],['America/Edmonton','America/Edmonton'],['America/Eirunepe','America/Eirunepe'],['America/El_Salvador','America/El_Salvador'],['America/Fortaleza','America/Fortaleza'],['America/Glace_Bay','America/Glace_Bay'],['America/Godthab','America/Godthab'],['America/Goose_Bay','America/Goose_Bay'],['America/Grand_Turk','America/Grand_Turk'],['America/Grenada','America/Grenada'],['America/Guadeloupe','America/Guadeloupe'],['America/Guatemala','America/Guatemala'],['America/Guayaquil','America/Guayaquil'],['America/Guyana','America/Guyana'],['America/Halifax','America/Halifax'],['America/Havana','America/Havana'],['America/Hermosillo','America/Hermosillo'],['America/Indiana/Indianapolis','America/Indiana/Indianapolis'],['America/Indiana/Knox','America/Indiana/Knox'],['America/Indiana/Marengo','America/Indiana/Marengo'],['America/Indiana/Petersburg','America/Indiana/Petersburg'],['America/Indiana/Tell_City','America/Indiana/Tell_City'],['America/Indiana/Vevay','America/Indiana/Vevay'],['America/Indiana/Vincennes','America/Indiana/Vincennes'],['America/Indiana/Winamac','America/Indiana/Winamac'],['America/Inuvik','America/Inuvik'],['America/Iqaluit','America/Iqaluit'],['America/Jamaica','America/Jamaica'],['America/Juneau','America/Juneau'],['America/Kentucky/Louisville','America/Kentucky/Louisville'],['America/Kentucky/Monticello','America/Kentucky/Monticello'],['America/Kralendijk','America/Kralendijk'],['America/La_Paz','America/La_Paz'],['America/Lima','America/Lima'],['America/Los_Angeles','America/Los_Angeles'],['America/Lower_Princes','America/Lower_Princes'],['America/Maceio','America/Maceio'],['America/Managua','America/Managua'],['America/Manaus','America/Manaus'],['America/Marigot','America/Marigot'],['America/Martinique','America/Martinique'],['America/Matamoros','America/Matamoros'],['America/Mazatlan','America/Mazatlan'],['America/Menominee','America/Menominee'],['America/Merida','America/Merida'],['America/Metlakatla','America/Metlakatla'],['America/Mexico_City','America/Mexico_City'],['America/Miquelon','America/Miquelon'],['America/Moncton','America/Moncton'],['America/Monterrey','America/Monterrey'],['America/Montevideo','America/Montevideo'],['America/Montserrat','America/Montserrat'],['America/Nassau','America/Nassau'],['America/New_York','America/New_York'],['America/Nipigon','America/Nipigon'],['America/Nome','America/Nome'],['America/Noronha','America/Noronha'],['America/North_Dakota/Beulah','America/North_Dakota/Beulah'],['America/North_Dakota/Center','America/North_Dakota/Center'],['America/North_Dakota/New_Salem','America/North_Dakota/New_Salem'],['America/Ojinaga','America/Ojinaga'],['America/Panama','America/Panama'],['America/Pangnirtung','America/Pangnirtung'],['America/Paramaribo','America/Paramaribo'],['America/Phoenix','America/Phoenix'],['America/Port-au-Prince','America/Port-au-Prince'],['America/Port_of_Spain','America/Port_of_Spain'],['America/Porto_Velho','America/Porto_Velho'],['America/Puerto_Rico','America/Puerto_Rico'],['America/Rainy_River','America/Rainy_River'],['America/Rankin_Inlet','America/Rankin_Inlet'],['America/Recife','America/Recife'],['America/Regina','America/Regina'],['America/Resolute','America/Resolute'],['America/Rio_Branco','America/Rio_Branco'],['America/Santa_Isabel','America/Santa_Isabel'],['America/Santarem','America/Santarem'],['America/Santiago','America/Santiago'],['America/Santo_Domingo','America/Santo_Domingo'],['America/Sao_Paulo','America/Sao_Paulo'],['America/Scoresbysund','America/Scoresbysund'],['America/Sitka','America/Sitka'],['America/St_Barthelemy','America/St_Barthelemy'],['America/St_Johns','America/St_Johns'],['America/St_Kitts','America/St_Kitts'],['America/St_Lucia','America/St_Lucia'],['America/St_Thomas','America/St_Thomas'],['America/St_Vincent','America/St_Vincent'],['America/Swift_Current','America/Swift_Current'],['America/Tegucigalpa','America/Tegucigalpa'],['America/Thule','America/Thule'],['America/Thunder_Bay','America/Thunder_Bay'],['America/Tijuana','America/Tijuana'],['America/Toronto','America/Toronto'],['America/Tortola','America/Tortola'],['America/Vancouver','America/Vancouver'],['America/Whitehorse','America/Whitehorse'],['America/Winnipeg','America/Winnipeg'],['America/Yakutat','America/Yakutat'],['America/Yellowknife','America/Yellowknife'],['Antarctica/Casey','Antarctica/Casey'],['Antarctica/Davis','Antarctica/Davis'],['Antarctica/DumontDUrville','Antarctica/DumontDUrville'],['Antarctica/Macquarie','Antarctica/Macquarie'],['Antarctica/Mawson','Antarctica/Mawson'],['Antarctica/McMurdo','Antarctica/McMurdo'],['Antarctica/Palmer','Antarctica/Palmer'],['Antarctica/Rothera','Antarctica/Rothera'],['Antarctica/Syowa','Antarctica/Syowa'],['Antarctica/Troll','Antarctica/Troll'],['Antarctica/Vostok','Antarctica/Vostok'],['Arctic/Longyearbyen','Arctic/Longyearbyen'],['Asia/Aden','Asia/Aden'],['Asia/Almaty','Asia/Almaty'],['Asia/Amman','Asia/Amman'],['Asia/Anadyr','Asia/Anadyr'],['Asia/Aqtau','Asia/Aqtau'],['Asia/Aqtobe','Asia/Aqtobe'],['Asia/Ashgabat','Asia/Ashgabat'],['Asia/Baghdad','Asia/Baghdad'],['Asia/Bahrain','Asia/Bahrain'],['Asia/Baku','Asia/Baku'],['Asia/Bangkok','Asia/Bangkok'],['Asia/Beirut','Asia/Beirut'],['Asia/Bishkek','Asia/Bishkek'],['Asia/Brunei','Asia/Brunei'],['Asia/Chita','Asia/Chita'],['Asia/Choibalsan','Asia/Choibalsan'],['Asia/Colombo','Asia/Colombo'],['Asia/Damascus','Asia/Damascus'],['Asia/Dhaka','Asia/Dhaka'],['Asia/Dili','Asia/Dili'],['Asia/Dubai','Asia/Dubai'],['Asia/Dushanbe','Asia/Dushanbe'],['Asia/Gaza','Asia/Gaza'],['Asia/Hebron','Asia/Hebron'],['Asia/Ho_Chi_Minh','Asia/Ho_Chi_Minh'],['Asia/Hong_Kong','Asia/Hong_Kong'],['Asia/Hovd','Asia/Hovd'],['Asia/Irkutsk','Asia/Irkutsk'],['Asia/Jakarta','Asia/Jakarta'],['Asia/Jayapura','Asia/Jayapura'],['Asia/Jerusalem','Asia/Jerusalem'],['Asia/Kabul','Asia/Kabul'],['Asia/Kamchatka','Asia/Kamchatka'],['Asia/Karachi','Asia/Karachi'],['Asia/Kathmandu','Asia/Kathmandu'],['Asia/Khandyga','Asia/Khandyga'],['Asia/Kolkata','Asia/Kolkata'],['Asia/Krasnoyarsk','Asia/Krasnoyarsk'],['Asia/Kuala_Lumpur','Asia/Kuala_Lumpur'],['Asia/Kuching','Asia/Kuching'],['Asia/Kuwait','Asia/Kuwait'],['Asia/Macau','Asia/Macau'],['Asia/Magadan','Asia/Magadan'],['Asia/Makassar','Asia/Makassar'],['Asia/Manila','Asia/Manila'],['Asia/Muscat','Asia/Muscat'],['Asia/Nicosia','Asia/Nicosia'],['Asia/Novokuznetsk','Asia/Novokuznetsk'],['Asia/Novosibirsk','Asia/Novosibirsk'],['Asia/Omsk','Asia/Omsk'],['Asia/Oral','Asia/Oral'],['Asia/Phnom_Penh','Asia/Phnom_Penh'],['Asia/Pontianak','Asia/Pontianak'],['Asia/Pyongyang','Asia/Pyongyang'],['Asia/Qatar','Asia/Qatar'],['Asia/Qyzylorda','Asia/Qyzylorda'],['Asia/Rangoon','Asia/Rangoon'],['Asia/Riyadh','Asia/Riyadh'],['Asia/Sakhalin','Asia/Sakhalin'],['Asia/Samarkand','Asia/Samarkand'],['Asia/Seoul','Asia/Seoul'],['Asia/Shanghai','Asia/Shanghai'],['Asia/Singapore','Asia/Singapore'],['Asia/Srednekolymsk','Asia/Srednekolymsk'],['Asia/Taipei','Asia/Taipei'],['Asia/Tashkent','Asia/Tashkent'],['Asia/Tbilisi','Asia/Tbilisi'],['Asia/Tehran','Asia/Tehran'],['Asia/Thimphu','Asia/Thimphu'],['Asia/Tokyo','Asia/Tokyo'],['Asia/Ulaanbaatar','Asia/Ulaanbaatar'],['Asia/Urumqi','Asia/Urumqi'],['Asia/Ust-Nera','Asia/Ust-Nera'],['Asia/Vientiane','Asia/Vientiane'],['Asia/Vladivostok','Asia/Vladivostok'],['Asia/Yakutsk','Asia/Yakutsk'],['Asia/Yekaterinburg','Asia/Yekaterinburg'],['Asia/Yerevan','Asia/Yerevan'],['Atlantic/Azores','Atlantic/Azores'],['Atlantic/Bermuda','Atlantic/Bermuda'],['Atlantic/Canary','Atlantic/Canary'],['Atlantic/Cape_Verde','Atlantic/Cape_Verde'],['Atlantic/Faroe','Atlantic/Faroe'],['Atlantic/Madeira','Atlantic/Madeira'],['Atlantic/Reykjavik','Atlantic/Reykjavik'],['Atlantic/South_Georgia','Atlantic/South_Georgia'],['Atlantic/St_Helena','Atlantic/St_Helena'],['Atlantic/Stanley','Atlantic/Stanley'],['Australia/Adelaide','Australia/Adelaide'],['Australia/Brisbane','Australia/Brisbane'],['Australia/Broken_Hill','Australia/Broken_Hill'],['Australia/Currie','Australia/Currie'],['Australia/Darwin','Australia/Darwin'],['Australia/Eucla','Australia/Eucla'],['Australia/Hobart','Australia/Hobart'],['Australia/Lindeman','Australia/Lindeman'],['Australia/Lord_Howe','Australia/Lord_Howe'],['Australia/Melbourne','Australia/Melbourne'],['Australia/Perth','Australia/Perth'],['Australia/Sydney','Australia/Sydney'],['Europe/Amsterdam','Europe/Amsterdam'],['Europe/Andorra','Europe/Andorra'],['Europe/Athens','Europe/Athens'],['Europe/Belgrade','Europe/Belgrade'],['Europe/Berlin','Europe/Berlin'],['Europe/Bratislava','Europe/Bratislava'],['Europe/Brussels','Europe/Brussels'],['Europe/Bucharest','Europe/Bucharest'],['Europe/Budapest','Europe/Budapest'],['Europe/Busingen','Europe/Busingen'],['Europe/Chisinau','Europe/Chisinau'],['Europe/Copenhagen','Europe/Copenhagen'],['Europe/Dublin','Europe/Dublin'],['Europe/Gibraltar','Europe/Gibraltar'],['Europe/Guernsey','Europe/Guernsey'],['Europe/Helsinki','Europe/Helsinki'],['Europe/Isle_of_Man','Europe/Isle_of_Man'],['Europe/Istanbul','Europe/Istanbul'],['Europe/Jersey','Europe/Jersey'],['Europe/Kaliningrad','Europe/Kaliningrad'],['Europe/Kiev','Europe/Kiev'],['Europe/Lisbon','Europe/Lisbon'],['Europe/Ljubljana','Europe/Ljubljana'],['Europe/London','Europe/London'],['Europe/Luxembourg','Europe/Luxembourg'],['Europe/Madrid','Europe/Madrid'],['Europe/Malta','Europe/Malta'],['Europe/Mariehamn','Europe/Mariehamn'],['Europe/Minsk','Europe/Minsk'],['Europe/Monaco','Europe/Monaco'],['Europe/Moscow','Europe/Moscow'],['Europe/Oslo','Europe/Oslo'],['Europe/Paris','Europe/Paris'],['Europe/Podgorica','Europe/Podgorica'],['Europe/Prague','Europe/Prague'],['Europe/Riga','Europe/Riga'],['Europe/Rome','Europe/Rome'],['Europe/Samara','Europe/Samara'],['Europe/San_Marino','Europe/San_Marino'],['Europe/Sarajevo','Europe/Sarajevo'],['Europe/Simferopol','Europe/Simferopol'],['Europe/Skopje','Europe/Skopje'],['Europe/Sofia','Europe/Sofia'],['Europe/Stockholm','Europe/Stockholm'],['Europe/Tallinn','Europe/Tallinn'],['Europe/Tirane','Europe/Tirane'],['Europe/Uzhgorod','Europe/Uzhgorod'],['Europe/Vaduz','Europe/Vaduz'],['Europe/Vatican','Europe/Vatican'],['Europe/Vienna','Europe/Vienna'],['Europe/Vilnius','Europe/Vilnius'],['Europe/Volgograd','Europe/Volgograd'],['Europe/Warsaw','Europe/Warsaw'],['Europe/Zagreb','Europe/Zagreb'],['Europe/Zaporozhye','Europe/Zaporozhye'],['Europe/Zurich','Europe/Zurich'],['Indian/Antananarivo','Indian/Antananarivo'],['Indian/Chagos','Indian/Chagos'],['Indian/Christmas','Indian/Christmas'],['Indian/Cocos','Indian/Cocos'],['Indian/Comoro','Indian/Comoro'],['Indian/Kerguelen','Indian/Kerguelen'],['Indian/Mahe','Indian/Mahe'],['Indian/Maldives','Indian/Maldives'],['Indian/Mauritius','Indian/Mauritius'],['Indian/Mayotte','Indian/Mayotte'],['Indian/Reunion','Indian/Reunion'],['Pacific/Apia','Pacific/Apia'],['Pacific/Auckland','Pacific/Auckland'],['Pacific/Bougainville','Pacific/Bougainville'],['Pacific/Chatham','Pacific/Chatham'],['Pacific/Chuuk','Pacific/Chuuk'],['Pacific/Easter','Pacific/Easter'],['Pacific/Efate','Pacific/Efate'],['Pacific/Enderbury','Pacific/Enderbury'],['Pacific/Fakaofo','Pacific/Fakaofo'],['Pacific/Fiji','Pacific/Fiji'],['Pacific/Funafuti','Pacific/Funafuti'],['Pacific/Galapagos','Pacific/Galapagos'],['Pacific/Gambier','Pacific/Gambier'],['Pacific/Guadalcanal','Pacific/Guadalcanal'],['Pacific/Guam','Pacific/Guam'],['Pacific/Honolulu','Pacific/Honolulu'],['Pacific/Johnston','Pacific/Johnston'],['Pacific/Kiritimati','Pacific/Kiritimati'],['Pacific/Kosrae','Pacific/Kosrae'],['Pacific/Kwajalein','Pacific/Kwajalein'],['Pacific/Majuro','Pacific/Majuro'],['Pacific/Marquesas','Pacific/Marquesas'],['Pacific/Midway','Pacific/Midway'],['Pacific/Nauru','Pacific/Nauru'],['Pacific/Niue','Pacific/Niue'],['Pacific/Norfolk','Pacific/Norfolk'],['Pacific/Noumea','Pacific/Noumea'],['Pacific/Pago_Pago','Pacific/Pago_Pago'],['Pacific/Palau','Pacific/Palau'],['Pacific/Pitcairn','Pacific/Pitcairn'],['Pacific/Pohnpei','Pacific/Pohnpei'],['Pacific/Port_Moresby','Pacific/Port_Moresby'],['Pacific/Rarotonga','Pacific/Rarotonga'],['Pacific/Saipan','Pacific/Saipan'],['Pacific/Tahiti','Pacific/Tahiti'],['Pacific/Tarawa','Pacific/Tarawa'],['Pacific/Tongatapu','Pacific/Tongatapu'],['Pacific/Wake','Pacific/Wake'],['Pacific/Wallis','Pacific/Wallis']];
	var abbreviationToTimeZones = [['ACDT',630],['ACST',570],['ACWT',525],['ADT',180],['ACT',-300],['AEDT',660],['AEST',600],['AFT',270],['AKDT',-480],['AKST',-540],['ALMT',360],['AMT',-240],['AMST',300],['ANAT',720],['ANAST',720],['AQTT',300],['ART',-180],['AST',180],['AWDT',540],['AWST',480],['AZOT',-60],['AZOST',0],['AZT',240],['AZST',300],['BNT',480],['BDT',360],['BOT',-240],['BRT',-180],['BRST',-120],['BST',360],['BTT',360],['CAST',480],['CAT',120],['CCT',390],['CDT',-300],['CEDT',120],['CEST',120],['CET',60],['CHADT',825],['CHAST',765],['CHOT',480],['CHOST',540],['CHsT',600],['CHUT',600],['CIT',480],['CKT',-600],['CLST',-180],['CLT',-240],['COT',-300],['CST',480],['CVT',-60],['CWST',525],['CXT',420],['DAVT',420],['DDUT',600],['EASST',-300],['EAST',-360],['EAT',180],['ECT',-300],['EDT',-240],['EEDT',180],['EEST',180],['EET',120],['EGT',-60],['EGST',0],['EST',-300],['EIT',540],['FET',180],['FJT',720],['FJST',780],['FKST',-180],['FKT',-240],['FNT',-120],['GALT',-360],['GAMT',-540],['GET',240],['GFT',-180],['GILT',720],['GMT',0],['GST',-120],['GYT',-240],['HADT',-540],['HAST',-600],['HKT',480],['HOVT',420],['HOVST',480],['HST',-600],['ICT',420],['IDT',180],['IOT',360],['IRDT',270],['IRKT',480],['IRKST',540],['IRST',210],['IST',60],['JST',540],['KGT',360],['KOST',660],['KRAT',420],['KRAST',480],['KST',540],['KUYT',240],['LHDT',660],['LHST',630],['LINT',840],['MAGT',600],['MAGST',720],['MART',-570],['MAWT',300],['MDT',-360],['MeST',-480],['MHT',720],['MIST',660],['MMT',390],['MSD',240],['MSK',180],['MST',-420],['MUT',240],['MVT',300],['MYT',480],['NCT',660],['NDT',-150],['NFT',690],['NOVT',360],['NOVST',420],['NPT',345],['NRT',720],['NST',-210],['NT',-210],['NUT',-660],['NZDT',780],['NZST',720],['OMST',360],['OMSST',420],['ORAT',300],['PDT',-420],['PET',-300],['PETT',720],['PETST',720],['PGT',600],['PHT',480],['PHOT',780],['PKT',300],['PMDT',-120],['PMST',-180],['PONT',660],['PST',-480],['PWT',540],['PYT',-240],['PYST',-180],['QYZT',360],['RET',240],['ROTT',-180],['SAKT',600],['SAKST',720],['SAMT',240],['SAST',120],['SBT',660],['SCT',240],['SGT',480],['SRT',-180],['SLT',330],['SLST',330],['SRET',660],['SST',-660],['SYOT',180],['TAHT',-600],['TFT',300],['TJT',300],['TKT',780],['TLT',540],['TMT',300],['TOT',780],['TRUT',600],['TVT',720],['ULAT',480],['ULAST',540],['UYST',-120],['UYT',-180],['UZT',300],['VET',-270],['VLAT',600],['VLAST',660],['VOLT',240],['VUT',660],['WAKT',720],['WAT',60],['WART',-240],['WAST',120],['WDT',540],['WEDT',60],['WEST',60],['WET',0],['WFT',720],['WGT',-180],['WGST',-120],['WIB',420],['WIT',540],['WITA',480],['WST',840],['WT',0],['YAKT',540],['YAKST',600],['YAP',600],['YEKT',300],['YEKST',360]];
	var locationsToTimeZones = timeZonesToTimeZones;

	var offsetsToOffsets = [['GMT',0],['UTC',0],['GMT-11',-660],['UTC-11',-660],['GMT-10',-600],['UTC-10',-600],['GMT-9:30',-570],['UTC-9:30',-570],['GMT-9',-540],['UTC-9',-540],['GMT-8',-480],['UTC-8',-480],['GMT-7',-420],['UTC-7',-420],['GMT-6',-360],['UTC-6',-360],['GMT-5',-300],['UTC-5',-300],['GMT-4:30',-270],['UTC-4:30',-270],['GMT-4',-240],['UTC-4',-240],['GMT-3:30',-210],['UTC-3:30',-210],['GMT-3',-180],['UTC-3',-180],['GMT-2:30',-150],['UTC-2:30',-150],['GMT-2',-120],['UTC-2',-120],['GMT-1',-60],['UTC-1',-60],['GMT+1',60],['UTC+1',60],['GMT+2',120],['UTC+2',120],['GMT+3',180],['UTC+3',180],['GMT+3:30',210],['UTC+3:30',210],['GMT+4',240],['UTC+4',240],['GMT+4:30',270],['UTC+4:30',270],['GMT+5',300],['UTC+5',300],['GMT+5:30',330],['UTC+5:30',330],['GMT+5:45',345],['UTC+5:45',345],['GMT+6',360],['UTC+6',360],['GMT+6:30',390],['UTC+6:30',390],['GMT+7',420],['UTC+7',420],['GMT+8',480],['UTC+8',480],['GMT+8:45',525],['UTC+8:45',525],['GMT+9',540],['UTC+9',540],['GMT+9:30',570],['UTC+9:30',570],['GMT+10',600],['UTC+10',600],['GMT+10:30',630],['UTC+10:30',630],['GMT+11',660],['UTC+11',660],['GMT+11:30',690],['UTC+11:30',690],['GMT+12',720],['UTC+12',720],['GMT+12:45',765],['UTC+12:45',765],['GMT+13',780],['UTC+13',780],['GMT+13:45',825],['UTC+13:45',825],['GMT+14',840],['UTC+14',840]];
	var locationsToOffsets = offsetsToOffsets.concat(abbreviationToTimeZones);

    return {
        getLocations: function() {
			var locations = new Array();
			for(var i = 0; i < locationsToTimeZones.length; i++) {
				locations.push(locationsToTimeZones[i][0]);
			}
			for(var i = 0; i < locationsToOffsets.length; i++) {
				locations.push(locationsToOffsets[i][0]);
			}
			return locations;
        },
        getTimeZone: function(key) {
			for(var i = 0; i < locationsToTimeZones.length; i++) {
				if(locationsToTimeZones[i][0] == key) {
					return locationsToTimeZones[i][1];
				}
			}
        },
        getOffset: function(key) {
			for(var i = 0; i < locationsToOffsets.length; i++) {
				if(locationsToOffsets[i][0] == key) {
					return locationsToOffsets[i][1];
				}
			}
        }
    }
}]);

app.directive('uiTimepickerEvents', ['TimeZoneClocksManager', function(TimeZoneClocksManager) {
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

app.directive('autoComplete', ['TimeZoneAutoCompleteService', 'TimeZoneClocksManager', function(TimeZoneAutoCompleteService, TimeZoneClocksManager) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, elem, attr, ctrl) {
            elem.autocomplete({
				lookupLimit: 10,
				triggerSelectOnValidInput: false,
				lookup: TimeZoneAutoCompleteService.getLocations(),
				autoSelectFirst: true,
				onSelect: function (suggestion) {
					scope.timeZoneBeingAddedIsValid = true;
					scope.isInterimChange = true;

					var locationToBeAdded = suggestion.value;
					if(timeZoneName = TimeZoneAutoCompleteService.getTimeZone(locationToBeAdded))
					{
						TimeZoneClocksManager.addTimeZone(timeZoneName, locationToBeAdded);
					}
					else if((offset = TimeZoneAutoCompleteService.getOffset(locationToBeAdded)) != undefined)
					{
						TimeZoneClocksManager.addOffsetBasedTimeZone(offset, locationToBeAdded);
					}
					else
					{
						throw "An unexpected error. The requested location " + locationToBeAdded + " is not known.";
					}
					scope.$apply();
				}
            });

			elem.on('change', function() {
				var valueEntered = elem.val().trim();
				console.log("User trying to add a time zone. Value changed to " + valueEntered);

				elem.val(valueEntered);
				// The events being raised by the autocomplete plugin aren't really sufficient to detect
				// invalid entries. So a rather hacky solution is being implemented.
				// If user types a partial name and then clicks on one of the suggestions (say they type 'chic'
				// and then click on 'America/Chicago' from the suggestions), we get several events like onChange,
				// onBlur, onHide etc. with a value of 'chic' and an onSelect with a value of 'America/Chicago'. So
				// there is no way to tell if a user entered an invalid value ('chic') or was in the process of
				// selecting the right value ('America/Chicago'). Previous solution was to blindly render an error
				// message in UI in response to onChange event and then immediately clear the error message once
				// the user clicks on a suggestion. That solution looked jarry because we would show an error
				// message unnecessarily.

				// So the hack is to maintain a flag in response to onChange event, wait for about 150 ms and if
				// no onSelect event is raised in the meantime, only then do we render an error message.
				scope.isInterimChange = false;
				if(valueEntered == '')
				{
					scope.timeZoneBeingAddedIsValid = true;
					scope.$apply();
					return;
				}
				setTimeout(function() {
					if(!scope.isInterimChange) {
						scope.timeZoneBeingAddedIsValid = false;
						scope.$apply();
					}
				}, 150);
            });

			elem.on('mouseup', function() {
				elem.select();
            });
        }
    };
}]);

app.controller('ClockController', ['$scope', '$interval', 'TimeZoneClocksManager', function($scope, $interval, TimeZoneClocksManager) {
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
		TimeZoneClocksManager.stopClocks();
    };

	// A time zone is being removed.
	$scope.removeTimeZone = function(index) {
        console.log("Attempting to remove added clock at index " + index);
		TimeZoneClocksManager.removeTimeZone(index);

		$scope.addedTimeZoneChunks = chunk(TimeZoneClocksManager.addedTimeZones(), 2);
    };

	// All clocks being reset.
	$scope.resetAllClocks = function() {
        console.log("All clocks are being reset to the current time");
		TimeZoneClocksManager.resetAllClocks();
    };

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

		TimeZoneClocksManager.setInEditMode(index);
	};

	$scope.dateChanged = function(index) {
		console.log("User changed the data on clock at index: " + index + ". Adjust time across all clocks.");
		TimeZoneClocksManager.adjustAllClocks(index);
	};
/*
	$interval(function(){
		$scope.localTime = localTimeZoneObject;
	},1000);
*/
	function chunk(array, size) {
	  var arrayOfChunks = [];
	  for (var i = 0; i < array.length; i += size) {
		arrayOfChunks.push(array.slice(i, i + size));
	  }
	  return arrayOfChunks;
	};
}]);

// Temporary workaround for https://github.com/angular-ui/bootstrap/issues/2659 to avoid showing the
// entire date in the datepicker text box. Once the above issue is fixed, make sure the latest bootstrap-ui
// is being used and remove the following directive.
app.directive('datepickerPopup', function (){
    return {
        restrict: 'EAC',
        require: 'ngModel',
        link: function(scope, element, attr, controller) {
			//remove the default formatter from the input directive to prevent conflict
			controller.$formatters.shift();
		}
	}
});

})();

