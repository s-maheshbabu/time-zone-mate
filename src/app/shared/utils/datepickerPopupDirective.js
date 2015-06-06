// Temporary workaround for https://github.com/angular-ui/bootstrap/issues/2659 to avoid showing the
// entire date in the datepicker text box. Once the above issue is fixed, make sure the latest bootstrap-ui
// is being used and remove the following directive.
angular.module('TimeZoneMate').directive('datepickerPopup', function (){
    return {
        restrict: 'EAC',
        require: 'ngModel',
        link: function(scope, element, attr, controller) {
			//remove the default formatter from the input directive to prevent conflict
			controller.$formatters.shift();
		}
	}
});