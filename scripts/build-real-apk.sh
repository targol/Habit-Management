#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="/tmp/apk-real-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen"
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/src/ir/javaneh/mobile"
mkdir -p "$BUILD_DIR/assets"

echo "=== [1/8] Setting up launcher icon & strings ==="
if [ -f "$ROOT_DIR/app/src/main/res/mipmap-xxhdpi/ic_launcher.png" ]; then
    cp "$ROOT_DIR/app/src/main/res/mipmap-xxhdpi/ic_launcher.png" "$BUILD_DIR/res/drawable/ic_launcher.png"
elif [ -f "$ROOT_DIR/web/public/pwa-192x192.png" ]; then
    cp "$ROOT_DIR/web/public/pwa-192x192.png" "$BUILD_DIR/res/drawable/ic_launcher.png"
fi

cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">جوانه</string>
</resources>
EOF

echo "=== [2/8] Generating AndroidManifest.xml (Fresh Package: ir.javaneh.mobile) ==="
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ir.javaneh.mobile"
    android:versionCode="200"
    android:versionName="2.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="28" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:hasCode="true"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name="ir.javaneh.mobile.MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

echo "=== [3/8] Writing MainActivity.java ==="
cat << 'EOF' > "$BUILD_DIR/src/ir/javaneh/mobile/MainActivity.java"
package ir.javaneh.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
DX="/usr/lib/android-sdk/build-tools/debian/dx"

echo "=== [4/8] Compiling resources with aapt ==="
aapt package -f -m -J "$BUILD_DIR/gen" -M "$BUILD_DIR/AndroidManifest.xml" -S "$BUILD_DIR/res" -I "$ANDROID_JAR"

echo "=== [5/8] Compiling Java source & converting to classes.dex ==="
javac -source 1.8 -target 1.8 -cp "$ANDROID_JAR" -d "$BUILD_DIR/bin" "$BUILD_DIR/gen/ir/javaneh/mobile/R.java" "$BUILD_DIR/src/ir/javaneh/mobile/MainActivity.java"
"$DX" --dex --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/bin"

echo "=== [6/8] Packaging assets into APK ==="
if [ -d "$ROOT_DIR/web/dist" ]; then
    cp -r "$ROOT_DIR/web/dist/"* "$BUILD_DIR/assets/"
elif [ -d "$ROOT_DIR/dist" ]; then
    cp -r "$ROOT_DIR/dist/"* "$BUILD_DIR/assets/"
fi
find "$BUILD_DIR/assets" -type f -name "*.apk" -delete

# Create clean APK with manifest, resources, and assets (NO .class files)
aapt package -f -M "$BUILD_DIR/AndroidManifest.xml" -S "$BUILD_DIR/res" -A "$BUILD_DIR/assets" -I "$ANDROID_JAR" -F "$BUILD_DIR/unaligned.apk"

# Add classes.dex into APK
(cd "$BUILD_DIR" && zip -u -0 unaligned.apk classes.dex)

echo "=== [7/8] Running zipalign 4-byte optimization ==="
zipalign -f -p 4 "$BUILD_DIR/unaligned.apk" "$BUILD_DIR/aligned.apk"

echo "=== [8/8] Signing with apksigner (v1, v2, v3 schemes) using permanent keystore ==="
KEYSTORE="$ROOT_DIR/keystore/javaneh-release.jks"
if [ ! -f "$KEYSTORE" ]; then
    mkdir -p "$ROOT_DIR/keystore"
    keytool -genkeypair -v -keystore "$KEYSTORE" -alias javaneh -keyalg RSA -keysize 2048 -validity 10000 -storepass javaneh123 -keypass javaneh123 -dname "CN=Javaneh, OU=Mobile, O=JavanehApp, L=Tehran, ST=Tehran, C=IR"
fi

apksigner sign --ks "$KEYSTORE" \
  --ks-pass pass:javaneh123 \
  --key-pass pass:javaneh123 \
  --ks-key-alias javaneh \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out "$BUILD_DIR/javaneh.apk" "$BUILD_DIR/aligned.apk"

echo "=== Verifying signature ==="
apksigner verify --verbose "$BUILD_DIR/javaneh.apk"

# Deploy to destinations
mkdir -p "$ROOT_DIR/web/public" "$ROOT_DIR/public" "$ROOT_DIR/web/dist" "$ROOT_DIR/dist"
cp "$BUILD_DIR/javaneh.apk" "$ROOT_DIR/web/public/javaneh.apk"
cp "$BUILD_DIR/javaneh.apk" "$ROOT_DIR/public/javaneh.apk"
cp "$BUILD_DIR/javaneh.apk" "$ROOT_DIR/web/dist/javaneh.apk"
cp "$BUILD_DIR/javaneh.apk" "$ROOT_DIR/dist/javaneh.apk"

SIZE_BYTES=$(wc -c < "$BUILD_DIR/javaneh.apk")
echo "=== BUILD SUCCESS: Completely valid, freshly packaged javaneh.apk ($SIZE_BYTES bytes) ready! ==="
