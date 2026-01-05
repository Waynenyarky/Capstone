package com.yourorg.capstone

import android.content.ContentValues
import android.media.MediaScannerConnection
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugins.GeneratedPluginRegistrant
import java.io.File
import java.io.FileOutputStream

class MainActivity : FlutterFragmentActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        GeneratedPluginRegistrant.registerWith(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "app.saveImage").setMethodCallHandler { call, result ->
            if (call.method == "saveImageToGallery") {
                try {
                    val bytes = call.argument<ByteArray>("bytes")
                    val name = call.argument<String>("name") ?: ("profile_" + System.currentTimeMillis() + ".jpg")
                    if (bytes == null || bytes.isEmpty()) {
                        result.error("EMPTY", "No image data", null)
                        return@setMethodCallHandler
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        val values = ContentValues().apply {
                            put(MediaStore.Images.Media.DISPLAY_NAME, name)
                            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
                            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Capstone")
                            put(MediaStore.Images.Media.IS_PENDING, 1)
                        }
                        val resolver = contentResolver
                        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                        if (uri == null) {
                            result.error("INSERT_FAIL", "Failed to insert MediaStore record", null)
                            return@setMethodCallHandler
                        }
                        resolver.openOutputStream(uri).use { os ->
                            if (os == null) {
                                result.error("STREAM_FAIL", "Unable to open output stream", null)
                                return@setMethodCallHandler
                            }
                            os.write(bytes)
                            os.flush()
                        }
                        values.clear()
                        values.put(MediaStore.Images.Media.IS_PENDING, 0)
                        resolver.update(uri, values, null, null)
                        result.success(true)
                    } else {
                        val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Capstone")
                        if (!dir.exists()) dir.mkdirs()
                        val file = File(dir, name)
                        FileOutputStream(file).use { fos ->
                            fos.write(bytes)
                            fos.flush()
                        }
                        MediaScannerConnection.scanFile(this, arrayOf(file.absolutePath), arrayOf("image/jpeg"), null)
                        result.success(true)
                    }
                } catch (e: Exception) {
                    result.error("SAVE_FAIL", e.message, null)
                }
            } else {
                result.notImplemented()
            }
        }
    }
}
