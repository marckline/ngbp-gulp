(function() {

    'use strict';

    angular.module( 'ngBoilerplate.details', [
        'ui.router',
        'placeholders'
    ])

        .config(function config( $stateProvider ) {
            $stateProvider.state( 'details', {
                url: '/details/:id',
                views: {
                    'main': {
                        controller: 'DetailsCtrl',
                        templateUrl: 'details/details.tpl.html'
                    }
                },
                resolve: {
                    item: function($stateParams, BookService) {
                        var requestedId = $stateParams.id,
                            item;

                        if(BookService.cached.length){
                            BookService.cached.forEach(function(book) {
                                if (book.id === requestedId || book.volumeInfo.title == requestedId) {
                                    item = book;
                                }
                            });
                        } else {
                            console.log('No item found, going to search for book > ' + requestedId);
                            item = BookService.search(requestedId).then(function (result){
                                BookService.cached = result;
                                //something like this, which should return a promise
                            });
                        }
                        return item;
                    }
                },
                data:{ pageTitle: 'details' }
            });
        })

        .controller( 'DetailsCtrl',  function( $scope, $rootScope, $timeout, item, LocalStorageService, BookService) {

            $scope.name ='DetailsCtrl';
            $scope.book = typeof item !== 'undefined' ? item : BookService.cached.items[0];
            $scope.books = LocalStorageService.get();

            $scope.saveBook = function(book) {
                $scope.books.push({
                    id: book.id,
                    title: book.volumeInfo.title,
                    img: typeof book.volumeInfo.imageLinks !== 'undefined' ? book.volumeInfo.imageLinks.thumbnail : 'http://placehold.it/150x150',
                    read: false
                });
                LocalStorageService.put($scope.books);

                $rootScope.alerts.push({type: 'success', msg: book.volumeInfo.title + ' added!'});
                $timeout(function(index){
                    $rootScope.alerts.splice(index, 1);
                }, 30000);

            };

            $scope.$watch('books', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $rootScope.counter = LocalStorageService.getCount();
                }
            }, true);
        });
}) ();