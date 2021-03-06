angular.module('app.aboutController', [])
    .controller('aboutController', function($rootScope, $scope, $http, $timeout, $mdSidenav) {
      $rootScope.$broadcast('showTabs', true);
      $scope.title = "About";

      $http({
        url: backend + '/',
        method: 'GET',
        dataType: 'json',
        data: '',
        headers: {}

      }).error(function(data, status, headers, config) {
        console.log("failed to get about data");

      }).success(function (data, status, headers, config) {
        $scope.authors = data.authors;
        $scope.version = data.version;
      });
    }
);
