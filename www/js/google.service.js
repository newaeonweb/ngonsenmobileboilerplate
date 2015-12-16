(function() {
    'use strict';

    /**
     * @ngdoc function
     * @name app.service:GoogleService
     * @description
     * # googleService
     * Service of the app
     */
    angular.module('app')
        .factory('GoogleService', googleService);

    googleService.$inject = ['$http', '$q', '$interval', '$log', 'StorageService'];

    function googleService($http, $q, $interval, $log, StorageService) {

        var access_token = false;
        var redirect_url = 'http://localhost/callback';
        var client_id = '';
        var secret = '';
        var scope = 'https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/plus.me';
        var gulp = function (url) {
            url = url.substring(url.indexOf('?') + 1, url.length);

            return url.replace('code=', '');

        };

        return {
            authorize: authorize,
            validateToken: validateToken,
            getUserInfo: getUserInfo,
            getUserFriends: getUserFriends,
            startLogin: startLogin,
            revokeToken: revokeToken,
            access_token: access_token,
            redirect_url: redirect_url,
            client_id: client_id,
            secret: secret,
            scope: scope,
            gulp: gulp

        };

        function authorize(options) {
            var def = $q.defer();
            var self = this;

            var access_token = StorageService.get('google_access_token');

            if (access_token) {
                $log.info('Direct Access Token :' + access_token);
                this.getUserInfo(access_token, def);
            } else {

                var params = 'client_id=' + encodeURIComponent(options.client_id);
                params += '&redirect_uri=' + encodeURIComponent(options.redirect_uri);
                params += '&response_type=code';
                params += '&scope=' + encodeURIComponent(options.scope);
                var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + params;

                var win = window.open(authUrl, '_blank', 'location=no,toolbar=no,width=800, height=800');
                var context = this;

                if (ons.platform.isWebView()) {
                    console.log('using in app browser');
                    win.addEventListener('loadstart', function (data) {
                        console.log('load start');
                        if (data.url.indexOf(context.redirect_url) === 0) {
                            console.log('redirect url found ' + context.redirect_url);
                            console.log('window url found ' + data.url);
                            win.close();
                            var url = data.url;
                            var access_code = context.gulp(url, 'code');
                            if (access_code) {
                                context.validateToken(access_code, def);
                            } else {
                                def.reject({error: 'Access Code Not Found'});
                            }
                        }

                    });
                } else {
                    console.log('InAppBrowser not found!');
                    var pollTimer = $interval(function () {
                        try {
                            console.log("google window url " + win.document.URL);
                            if (win.document.URL.indexOf(context.redirect_url) === 0) {
                                console.log('redirect url found');
                                win.close();
                                $interval.cancel(pollTimer);
                                pollTimer = false;
                                var url = win.document.URL;
                                $log.debug('Final URL ' + url);
                                var access_code = context.gulp(url, 'code');
                                if (access_code) {
                                    $log.info('Access Code: ' + access_code);
                                    context.validateToken(access_code, def);
                                } else {
                                    def.reject({error: 'Access Code Not Found'});
                                }
                            }
                        } catch (e) {
                        }
                    }, 100);
                }
            }
            return def.promise;
        }

        function validateToken(token, def) {
            $log.info('Code: ' + token);
            var http = $http({
                url: 'https://www.googleapis.com/oauth2/v3/token',
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                params: {
                    code: token,
                    client_id: this.client_id,
                    client_secret: this.secret,
                    redirect_uri: this.redirect_url,
                    grant_type: 'authorization_code',
                    scope: ''
                }
            });
            var context = this;
            http.then(function (data) {
                $log.debug(data);
                var access_token = data.data.access_token;
                var expires_in = data.data.expires_in;
                expires_in = expires_in * 1 / (60 * 60);
                StorageService.set('google_access_token', access_token, expires_in);
                if (access_token) {
                    $log.info('Access Token :' + access_token);
                    context.getUserInfo(access_token, def);
                } else {
                    def.reject({error: 'Access Token Not Found'});
                }
            });
        }

        function getUserInfo(access_token, def) {
            var http = $http({
                url: 'https://www.googleapis.com/oauth2/v3/userinfo',
                method: 'GET',
                params: {
                    access_token: access_token
                }
            });
            http.then(function (data) {
                $log.info('Get user success: ');
                $log.debug(data);

                var user_data = data.data;
                var user = {
                    name: user_data.name,
                    gender: user_data.gender,
                    email: user_data.email,
                    google_id: user_data.sub,
                    picture: user_data.picture,
                    profile: user_data.profile
                };
                def.resolve(user);

                StorageService.set('currentUser', user);

            });
        }

        function getUserFriends() {
            var access_token = this.access_token;
            var http = $http({
                url: 'https://www.googleapis.com/plus/v1/people/me/people/visible',
                method: 'GET',
                params: {
                    access_token: access_token
                }
            });
            http.then(function (data) {
                console.log(data);
            });
        }

        function startLogin() {
            var def = $q.defer();
            var promise = this.authorize({
                client_id: this.client_id,
                client_secret: this.secret,
                redirect_uri: this.redirect_url,
                scope: this.scope
            });
            promise.then(function (data) {
                def.resolve(data);
            }, function (data) {
                $log.error(data);
                def.reject(data.error);
            });
            return def.promise;
        }

        function revokeToken () {
            var token = StorageService.get('google_access_token');

            var http = $http({
                url: 'https://accounts.google.com/o/oauth2/revoke?token=' + token,
                method: 'GET'
            });
            http.then(function (data) {
                $log.debug(data);

                StorageService.remove('google_access_token');

            });
        }

    }

})();
