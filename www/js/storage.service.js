(function() {
    'use strict';

    /**
     * @ngdoc function
     * @name app.service:StorageService
     * @description
     * # storageService
     * Service of the app
     */
    angular.module('app')
        .factory('StorageService', storageService);

    storageService.$inject = ['$localStorage'];

    function storageService($localStorage) {


        return {
            cleanUp: cleanUp,
            remove: remove,
            get: get,
            set: set
        };


        function cleanUp() {

            var cur_time = new Date().getTime();
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key.indexOf('_expire') === -1) {
                    var new_key = key + "_expire";
                    var value = localStorage.getItem(new_key);
                    if (value && cur_time > value) {
                        localStorage.removeItem(key);
                        localStorage.removeItem(new_key);
                    }
                }
            }
        }

        function remove(key) {

            this.cleanUp();
            var time_key = key + '_expire';
            $localStorage[key] = false;
            $localStorage[time_key] = false;
        }

        function set(key, data, hours) {

            this.cleanUp();
            $localStorage[key] = data;
            var time_key = key + '_expire';
            var time = new Date().getTime();
            time = time + (hours * 1 * 60 * 60 * 1000);
            $localStorage[time_key] = time;
        }

        function get(key) {

            this.cleanUp();
            var time_key = key + "_expire";
            if (!$localStorage[time_key]) {
                return false;
            }
            var expire = $localStorage[time_key] * 1;
            if (new Date().getTime() > expire) {
                $localStorage[key] = null;
                $localStorage[time_key] = null;
                return false;
            }
            return $localStorage[key];
        }

    }

})();