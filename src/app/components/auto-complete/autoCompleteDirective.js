angular.module('TimeZoneMate').directive('autoComplete', ['TimeZoneAutoCompleteFactory', 'TimeZoneClocksManager', function(TimeZoneAutoCompleteFactory, TimeZoneClocksManager) {
    return {
        restrict: 'A',
        scope: {
			timeZoneBeingAddedIsValid: '=',
			includePeripehralLocations: '=',
		},
		controller: ['$scope', '$element', function ($scope, $element) {
			$scope.includePeripehralLocations = function (isIncludePeripehralLocations) {
				if (isIncludePeripehralLocations === true) {
					console.log('Loading all possible search entries...');

					var promise = TimeZoneAutoCompleteFactory.loadPeripehralLocations();
					promise.then(function (result) {
						$element.autocomplete('clear');
						$element.autocomplete().setOptions({ lookup: TimeZoneAutoCompleteFactory.getLocations() });
					});

					console.log('Completed loading all possible search entries');
				}
				else {
					TimeZoneAutoCompleteFactory.purgePeripehralLocations();
					$element.autocomplete('clear');
					$element.autocomplete().setOptions({ lookup: TimeZoneAutoCompleteFactory.getLocations() });
				}
			};
		}],
        link: function(scope, elem, attr, ctrl) {
            elem.autocomplete({
				lookupLimit: 10,
				triggerSelectOnValidInput: false,
				lookup: TimeZoneAutoCompleteFactory.getLocations(),
				autoSelectFirst: true,
				onSelect: function (suggestion) {
					scope.timeZoneBeingAddedIsValid = true;
					scope.isInterimChange = true;

					var locationToBeAdded = suggestion.value;
					if(timeZoneName = TimeZoneAutoCompleteFactory.getTimeZone(locationToBeAdded))
					{
						TimeZoneClocksManager.addTimeZone(timeZoneName, locationToBeAdded);
					}
					else if((offset = TimeZoneAutoCompleteFactory.getOffset(locationToBeAdded)) != undefined)
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
				if(valueEntered == '' || TimeZoneAutoCompleteFactory.isValidLocation(valueEntered))
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