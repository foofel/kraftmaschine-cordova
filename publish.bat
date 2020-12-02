@echo off
set MAJOR=%1
set MINOR=%2
set PATCH=%3
set RELEASE_PATH=releases\%MAJOR%.%MINOR%.%PATCH%
IF EXIST %RELEASE_PATH% (
	echo release already exists, aborting
	goto END
)
if "%~1"=="" (
    echo please specify MAJOR MINOR PATCH
    goto END
)
if "%~2"=="" (
    echo please specify MAJOR MINOR PATCH
    goto END
)
if "%~3"=="" (
    echo please specify MAJOR MINOR PATCH
    goto END
)
call npm run cordova-build-android
mkdir %RELEASE_PATH%
copy src-cordova\platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk %RELEASE_PATH%
copy %RELEASE_PATH%\app-release-unsigned.apk %RELEASE_PATH%\app-release-signed.apk 
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ..\keystore.jks %RELEASE_PATH%\app-release-signed.apk key0
C:\Users\Jakob\AppData\Local\Android\Sdk\build-tools\29.0.2\zipalign.exe -v 4 %RELEASE_PATH%\app-release-signed.apk %RELEASE_PATH%\app-release-signed-aligned.apk

:END