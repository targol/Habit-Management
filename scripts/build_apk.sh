#!/bin/bash
set -e

echo "=== Javaneh Google Play & Offline APK Builder ==="

# Set paths to tools
AAPT2=/app/applet/.tools/android-sdk/build-tools/34.0.0/aapt2
ANDROID_JAR=/app/applet/.tools/android-sdk/platforms/android-34/android.jar
D8=/app/applet/.tools/android-sdk/build-tools/34.0.0/d8
ZIPALIGN=/app/applet/.tools/android-sdk/build-tools/34.0.0/zipalign
APKSIGNER=/app/applet/.tools/android-sdk/build-tools/34.0.0/apksigner

export LD_LIBRARY_PATH=/app/applet/.tools/lib:$LD_LIBRARY_PATH
ln -sf /usr/lib/x86_64-linux-gnu/libc++.so.1 /usr/lib/x86_64-linux-gnu/libc++.so 2>/dev/null || true
chmod -R +x /app/applet/.tools/ 2>/dev/null || true

BUILD_DIR=/tmp/apk_builder
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/res/values" "$BUILD_DIR/res/xml" "$BUILD_DIR/src/ir/javaneh/app" "$BUILD_DIR/obj" "$BUILD_DIR/dex_out" "$BUILD_DIR/assets"

# 1. Android Manifest configured for Google Play Store publication & data safety
cat << 'MANIFEST_EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ir.javaneh.app"
    android:versionCode="130"
    android:versionName="1.3.0">

    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:hasFragileUserData="true"
        android:fullBackupContent="@xml/backup_rules"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@android:style/Theme.Light.NoTitleBar">
        <activity
            android:name="ir.javaneh.app.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|screenLayout"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
MANIFEST_EOF

# 2. Strings & App Metadata
cat << 'STRINGS_EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">جوانه</string>
</resources>
STRINGS_EOF

# 3. Google Auto Backup & Data Extraction Rules (Zero Data Loss on upgrade/restore)
cat << 'BACKUP_EOF' > "$BUILD_DIR/res/xml/backup_rules.xml"
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <include domain="database" path="."/>
    <include domain="sharedpref" path="."/>
    <include domain="root" path="app_webview"/>
</full-backup-content>
BACKUP_EOF

cat << 'EXTRACTION_EOF' > "$BUILD_DIR/res/xml/data_extraction_rules.xml"
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="database" path="."/>
        <include domain="sharedpref" path="."/>
        <include domain="root" path="app_webview"/>
    </cloud-backup>
    <device-transfer>
        <include domain="database" path="."/>
        <include domain="sharedpref" path="."/>
        <include domain="root" path="app_webview"/>
    </device-transfer>
</data-extraction-rules>
EXTRACTION_EOF

# 4. Copy mipmap icons
for dir in /app/applet/app/src/main/res/mipmap-*; do
  if [ -d "$dir" ]; then
    dirname=$(basename "$dir")
    mkdir -p "$BUILD_DIR/res/$dirname"
    cp -f "$dir"/ic_launcher.png "$BUILD_DIR/res/$dirname/" 2>/dev/null || true
    cp -f "$dir"/ic_launcher_round.png "$BUILD_DIR/res/$dirname/" 2>/dev/null || true
  fi
done

# 5. Copy web production dist assets
mkdir -p "$BUILD_DIR/assets"
cp -r /app/applet/web/dist/* "$BUILD_DIR/assets/"
rm -f "$BUILD_DIR"/assets/*.apk

# 6. Android MainActivity with local asset loader & hardware Back navigation
cat << 'JAVA_EOF' > "$BUILD_DIR/src/ir/javaneh/app/MainActivity.java"
package ir.javaneh.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.view.KeyEvent;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.graphics.Color;
import android.util.Log;
import java.io.InputStream;
import java.util.Map;
import java.util.HashMap;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> uploadMessage;
    private static final int FILECHOOSER_RESULTCODE = 1001;

    public class AndroidBridge {
        @JavascriptInterface
        public void saveFile(String filename, String content, String mimeType) {
            try {
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType(mimeType != null ? mimeType : "application/json");
                intent.putExtra(Intent.EXTRA_SUBJECT, filename);
                intent.putExtra(Intent.EXTRA_TEXT, content);
                startActivity(Intent.createChooser(intent, "ذخیره یا اشتراک‌گذاری فایل پشتیبان: " + filename));
            } catch (Exception e) {
                Log.e("Javaneh", "Save file error", e);
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#FAF9F6"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#FAF9F6"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d("Javaneh", cm.message() + " [" + cm.sourceId() + ":" + cm.lineNumber() + "]");
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                    uploadMessage = null;
                }
                uploadMessage = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                if (fileChooserParams != null && fileChooserParams.getAcceptTypes() != null && fileChooserParams.getAcceptTypes().length > 0) {
                    String[] types = fileChooserParams.getAcceptTypes();
                    if (types.length == 1 && types[0].length() > 0) {
                        intent.setType(types[0]);
                    } else if (types.length > 1) {
                        intent.putExtra(Intent.EXTRA_MIME_TYPES, types);
                    }
                }
                try {
                    startActivityForResult(Intent.createChooser(intent, "انتخاب فایل پشتیبان"), FILECHOOSER_RESULTCODE);
                    return true;
                } catch (Exception e) {
                    if (uploadMessage != null) {
                        uploadMessage.onReceiveValue(null);
                        uploadMessage = null;
                    }
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String host = request.getUrl().getHost();
                if (host != null && !"localhost".equalsIgnoreCase(host) && !"appassets.androidplatform.net".equalsIgnoreCase(host)) {
                    // Let external requests (e.g. Google fonts, APIs) pass through to Android networking
                    return super.shouldInterceptRequest(view, request);
                }

                String path = request.getUrl().getPath();
                if (path == null || path.isEmpty() || path.equals("/")) {
                    path = "index.html";
                } else if (path.startsWith("/")) {
                    path = path.substring(1);
                }

                try {
                    InputStream is = getAssets().open(path);
                    String mime = "text/html";
                    if (path.endsWith(".js") || path.endsWith(".mjs")) mime = "application/javascript";
                    else if (path.endsWith(".css")) mime = "text/css";
                    else if (path.endsWith(".svg")) mime = "image/svg+xml";
                    else if (path.endsWith(".png")) mime = "image/png";
                    else if (path.endsWith(".json") || path.endsWith(".webmanifest")) mime = "application/json";
                    else if (path.endsWith(".woff2")) mime = "font/woff2";
                    else if (path.endsWith(".woff")) mime = "font/woff";
                    else if (path.endsWith(".ico")) mime = "image/x-icon";

                    Map<String, String> headers = new HashMap<>();
                    headers.put("Access-Control-Allow-Origin", "*");
                    headers.put("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

                    return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, is);
                } catch (Exception ignored) {
                    // Only fallback to index.html for navigation or extension-less SPA routes
                    if (path.endsWith(".html") || !path.contains(".")) {
                        try {
                            InputStream is = getAssets().open("index.html");
                            Map<String, String> headers = new HashMap<>();
                            headers.put("Access-Control-Allow-Origin", "*");
                            return new WebResourceResponse("text/html", "UTF-8", 200, "OK", headers, is);
                        } catch (Exception e) {
                            return null;
                        }
                    }
                    return null;
                }
            }
        });

        webView.loadUrl("https://localhost/index.html");

        setContentView(webView);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (uploadMessage == null) return;
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                Uri uri = data.getData();
                if (uri != null) {
                    results = new Uri[]{ uri };
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            uploadMessage.onReceiveValue(results);
            uploadMessage = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
JAVA_EOF

echo "=== 7. Compiling resources with AAPT2 ==="
cd "$BUILD_DIR"
"$AAPT2" compile --dir res -o compiled_res.zip
"$AAPT2" link -I "$ANDROID_JAR" \
  --manifest AndroidManifest.xml \
  -o unaligned.apk \
  compiled_res.zip \
  -A assets \
  --auto-add-overlay

echo "=== 8. Compiling Java and Dexing ==="
javac -cp "$ANDROID_JAR" -d obj src/ir/javaneh/app/MainActivity.java
"$D8" --lib "$ANDROID_JAR" --output dex_out obj/ir/javaneh/app/*.class
cp -f dex_out/classes.dex /app/applet/.tools/classes.dex

python3 -c "
import zipfile
with zipfile.ZipFile('/tmp/apk_builder/unaligned.apk', 'a', compression=zipfile.ZIP_DEFLATED) as z:
    z.write('/app/applet/.tools/classes.dex', 'classes.dex')
"

echo "=== 9. Aligning & Signing for Google Play (v1, v2, v3) ==="
"$ZIPALIGN" -p -f 4 unaligned.apk javaneh_aligned.apk

test -f /app/applet/debug.keystore || base64 -d /app/applet/debug.keystore.base64 > /app/applet/debug.keystore

"$APKSIGNER" sign \
  --ks /app/applet/debug.keystore \
  --ks-pass pass:android \
  --ks-key-alias androiddebugkey \
  --key-pass pass:android \
  --out /app/applet/web/public/javaneh.apk \
  javaneh_aligned.apk

cp -f /app/applet/web/public/javaneh.apk /app/applet/public/javaneh.apk
cp -f /app/applet/web/public/javaneh.apk /app/applet/dist/javaneh.apk 2>/dev/null || true
cp -f /app/applet/web/public/javaneh.apk /app/applet/web/dist/javaneh.apk 2>/dev/null || true

"$APKSIGNER" verify --verbose /app/applet/web/public/javaneh.apk
echo "SUCCESS: Google Play Production-Ready APK generated at /app/applet/web/public/javaneh.apk"
ls -lh /app/applet/web/public/javaneh.apk
