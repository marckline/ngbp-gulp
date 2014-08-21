

angular.module( 'ngBoilerplate.search', [
    'ui.router',
    'placeholders'
])

    .config(function config( $stateProvider ) {
        $stateProvider.state( 'search', {
            url: '/search',
            views: {
                "main": {
                    controller: 'SearchCtrl',
                    templateUrl: 'search/search.tpl.html',
                    reloadOnSearch: false
                }
            },
            resolve: {
                search: function($stateParams, BookService, $location) {
                    var search = $location.search().query;
                    return search;
                },
                item: function($stateParams, BookService, $location) {
                    var item = '';
                    if(BookService.cached.length){
                        item = BookService.cached;
                    }
                    return item;
                }

                //TODO check if it is "back" or if search is loaded
            },
            data:{ pageTitle: 'search' }
        });
    })

    .controller( 'SearchCtrl', function SearchCtrl( $scope, BookService, $location, search, item) {

        console.log(item);
        var serj = function (term, url){
            if (url) {$location.search('query', term);}
            BookService.search(term).then(function(response) {
                $scope.bookResults = response.items;
                $scope.orderProp = 'volumeInfo.title';
            });
        };


        if (search){
            $scope.searchTerm = search;
            if (!item){serj(search, false);}
            if(item){$scope.bookResults = item;}

        } else {
            $scope.searchTerm = "Javascript";
        }

        $scope.doSearch = function () {
            serj($scope.searchTerm, true);
        };
    })

    .factory('BookService', function ($resource) {
        var books = {
            cached: []
        };

        books.api = $resource('https://www.googleapis.com/books/v1/volumes',
            {
                maxResults: '10',
                callback: 'JSON_CALLBACK',
                key: 'AIzaSyATldFLGtPPZVLecasP0nFXkX6RqXa7VEI'
            },
            {
                get: {
                    method: 'JSONP'
                }
            });

        books.search = function(term) {
            return books.api.get({ q: term }).$promise.then(function (response) {
                books.cached = response.items;
                return response;
                // by returning response as it was passed into this function,
                // the controller can use this promise too, as it does above
            });
        };

        return books;
    })
;