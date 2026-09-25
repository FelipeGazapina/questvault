# Downloads

The Android APK is published by the **Android APK** GitHub workflow
(`.github/workflows/android-apk.yml`) to the `android-latest` release:

```
https://github.com/FelipeGazapina/questvault/releases/download/android-latest/questvault.apk
```

The Netlify build (`scripts/netlify-build.mjs`) writes that URL to `config.js` when it answers,
and the landing page enables the **Baixar APK** button.

## Local fallback

If `QV_APK_URL` is empty, the page looks for `website/downloads/questvault.apk` instead.
To build one by hand:

```powershell
cd app
npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease
```

The workflow signs with the default debug key, which is fine for sideloading. Use a real
keystore (or EAS) before publishing to Google Play.
