# Downloads

Place the Android release APK here:

```
website/downloads/questvault.apk
```

The landing page checks for this file and enables the **BAIXAR PARA ANDROID** button automatically.

## Build the APK (Expo)

From the `app/` folder, after configuring EAS or a local release build:

```powershell
cd app
npx expo prebuild --platform android   # if needed
# then your release pipeline, e.g. EAS:
# eas build --platform android --profile preview
```

Copy the resulting `.apk` to this folder as `questvault.apk`.

## App Store / Google Play

Keep store badges disabled on the site until approval. Update `website/index.html` store links when live.
