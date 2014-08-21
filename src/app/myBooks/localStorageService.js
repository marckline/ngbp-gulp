/**
 * Created by jakeforaker on 8/15/14.
 */

// Service definition
angular.module('ngBoilerplate.localStorageService', [])
    .factory('LocalStorageService', function () {

        var STORAGE_ID = 'myBooks';

        return {
            get: function () {
                return JSON.parse(localStorage.getItem(STORAGE_ID)) || [];
            },

            put: function (books) {
                localStorage.setItem(STORAGE_ID, JSON.stringify(books));
            },

            getCount: function(){
                var books = JSON.parse(localStorage.getItem(STORAGE_ID));
                var count = !books ? 0 : books.length;
                return count === 0 ? 'No books yet' : (count === 1 ? count + ' book' : count + ' books');
            }
        };
    });