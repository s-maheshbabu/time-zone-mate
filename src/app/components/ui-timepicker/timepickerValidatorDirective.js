angular.module('TimeZoneMate').directive("timePickerValidator", function() {
	return {
	restrict: 'A',
	require: 'ngModel',
	link: function(scope, ele, attrs, ctrl){
	  ctrl.$parsers.unshift(function(value) {
		if(!value){
		  ctrl.$setValidity('userEnteredNullForTimeValue', false);
		  // Set the time to midnight (the date part doesn't matter)
		  return new Date(5555, 5, 5, 0, 0, 0, 0);
		}
		return value;
	  });

	}
  }
});