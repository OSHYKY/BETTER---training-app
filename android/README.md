# BETTER Interval Coach — native Android

The `android/` folder contains the native Android implementation of the interval coach.

It uses an Android foreground service for the workout timer, so the timer is not dependent on a browser tab staying alive. Phase state and deadlines are persisted locally, allowing the service to recover after process recreation. Interval/rest changes use Android vibration and Android Text-to-Speech, and a locally recorded `voice.3gp` cue can be played instead of the default phrase.

The timer needs no internet connection during a workout. The screen can be turned off after the workout starts.

For maximum background reliability on some Android phones, disable battery optimisation for BETTER in Android settings.

Build with Android Studio using the `android/` directory and install the debug APK on the phone. The repository also contains a GitHub Actions workflow at `.github/workflows/android-build.yml` that builds and uploads the debug APK as an Actions artifact.
