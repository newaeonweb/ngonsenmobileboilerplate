(function(){
    "use strict";

    angular.module('app', ['onsen','ngStorage'])

    .controller('LoginCtrl', function($scope, GoogleService, StorageService){

        $scope.login = function () {
            console.log('running from login button');

            $scope.isLoading = true;

            GoogleService.startLogin().then(function(res){

                //window.localStorage.setItem('currentUser', JSON.stringify(res));

                StorageService.set('currentUser', res, Date.now());

                $scope.myNavigator.pushPage('page2.html', { animation : 'slide' });

                $scope.isLoading = false;

            }, function (res){

                $scope.error = res;
                console.log($scope.error);
            });

        };

    })

    .controller('ScanCtrl', function($scope, StorageService){

        //$scope.currentUser = JSON.parse(window.localStorage.getItem('currentUser'));

        $scope.currentUser = StorageService.get('currentUser');

        console.log($scope.currentUser);


        $scope.scan = function () {
            console.log('running from scan button');

            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    alert("We got a barcode\n" +
                        "Result: " + result.text + "\n" +
                        "Format: " + result.format + "\n" +
                        "Cancelled: " + result.cancelled);
                },
                function (error) {
                    alert("Scanning failed: " + error);
                }
            );
        };

        $scope.confirm = function(material) {
            var mod = material ? 'material' : undefined;

            ons.notification.confirm({
                message: 'Deseja encerrar o aplicativo?',
                modifier: mod,
                callback: function(idx) {
                    switch (idx) {
                        case 0:
                            ons.notification.alert({
                                message: 'Você continua logado.',
                                modifier: mod
                            });
                            break;
                        case 1:
                            ons.notification.alert({
                                message: 'Logout com sucesso.',
                                modifier: mod,
                                callback: $scope.logout()
                            });
                            break;
                    }
                }
            });
        };

        $scope.logout = function () {
            console.log('running from logout');
            
            $scope.myNavigator.pushPage('page1.html', { animation : 'fade' });

            StorageService.remove('currentUser');
            StorageService.remove('google_access_token');

        };

    });


})();