angular.module('TimeZoneMate').directive('blurOnRelease', [function () {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			element.bind('mouseup', function () {
				element.blur();
			});
		}
	};
}]);