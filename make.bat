call npm run cordova-build-android
cd src-cordova
call cordova run android
cd ..

REM cordova run android # debug build run (from src-cordova folder)
rem adb uninstall de.boulderbash.cordova.app # remove if signature mismatc