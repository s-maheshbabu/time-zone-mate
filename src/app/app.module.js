angular.module('TimeZoneMate', ['ui.timepicker', 'ui.bootstrap']);

angular.module('ui.timepicker').value('uiTimepickerConfig', {
	showOnFocus: false,
	timeFormat: 'h:i:s A'
});