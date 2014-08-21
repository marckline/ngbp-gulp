
angular.module( 'ngBoilerplate.myBooks', [
    'ui.router',
    'placeholders',
    'ui.bootstrap',
    'ngBoilerplate.localStorageService'
])

    .config(function config( $stateProvider ) {
        $stateProvider.state( 'myBooks', {
            url: '/myBooks',
            views: {
                'main': {
                    controller: 'MyBooksCtrl',
                    templateUrl: 'myBooks/myBooks.tpl.html'
                }
            },
            data:{ pageTitle: 'myBooks' }
        });
    })

    .controller( 'MyBooksCtrl', function( $scope, $rootScope, LocalStorageService, $filter) {

        var myBooks = $scope.myBooks = LocalStorageService.get();
        $scope.name ='MyBooksCtrl';
        $scope.readCount = {
            read:   $filter('filter')(myBooks, { read: true }).length,
            unread:  $filter('filter')(myBooks, { read: false }).length
        };

        $scope.$watch('myBooks', function (newValue, oldValue, args) {
            if (newValue !== oldValue) {
                LocalStorageService.put(myBooks);
                $scope.readCount = {
                    read:   $filter('filter')(myBooks, { read: true }).length,
                    unread:  $filter('filter')(myBooks, { read: false }).length
                };
            }
        }, true);

    })
;
