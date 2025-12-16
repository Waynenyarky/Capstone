plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}
import java.util.Properties

android {
    namespace = "com.yourorg.capstone"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    signingConfigs {
        val defaultStore = "${System.getProperty("user.home")}/.android/debug.keystore"
        create("teamDebug") {
            storeFile = file(System.getenv("TEAM_DEBUG_STORE_FILE") ?: defaultStore)
            storePassword = System.getenv("TEAM_DEBUG_STORE_PASSWORD") ?: "android"
            keyAlias = System.getenv("TEAM_DEBUG_KEY_ALIAS") ?: "androiddebugkey"
            keyPassword = System.getenv("TEAM_DEBUG_KEY_PASSWORD") ?: "android"
        }
        getByName("debug") {
            val team = signingConfigs.getByName("teamDebug")
            storeFile = team.storeFile
            storePassword = team.storePassword
            keyAlias = team.keyAlias
            keyPassword = team.keyPassword
        }
        // Load release keystore from key.properties or environment variables
        val keystoreProps = Properties()
        run {
            val f = rootProject.file("key.properties")
            if (f.exists()) {
                f.inputStream().use { keystoreProps.load(it) }
            }
        }
        val releaseStoreFileProp = keystoreProps.getProperty("storeFile") ?: System.getenv("RELEASE_STORE_FILE")
        val releaseStoreFile = releaseStoreFileProp?.let { file(it) }
        val releaseStorePassword = keystoreProps.getProperty("storePassword") ?: System.getenv("RELEASE_STORE_PASSWORD")
        val releaseKeyAlias = keystoreProps.getProperty("keyAlias") ?: System.getenv("RELEASE_KEY_ALIAS")
        val releaseKeyPassword = keystoreProps.getProperty("keyPassword") ?: System.getenv("RELEASE_KEY_PASSWORD")
        val hasValidFile = (releaseStoreFile != null) && releaseStoreFile.exists()
        val hasValidPasswords = !releaseStorePassword.isNullOrBlank() && !releaseKeyAlias.isNullOrBlank() && !releaseKeyPassword.isNullOrBlank()
        create("releaseSecure") {
            if (hasValidFile && hasValidPasswords) {
                storeFile = releaseStoreFile
                storePassword = releaseStorePassword!!
                keyAlias = releaseKeyAlias!!
                keyPassword = releaseKeyPassword!!
            } else {
                // Fallback to debug signing to keep builds working
                val team = signingConfigs.getByName("teamDebug")
                storeFile = team.storeFile
                storePassword = team.storePassword
                keyAlias = team.keyAlias
                keyPassword = team.keyPassword
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.yourorg.capstone"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("teamDebug")
            isMinifyEnabled = false
        }
        release {
            // Use release keystore if configured; otherwise fallback keeps build working
            signingConfig = signingConfigs.getByName("releaseSecure")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android.txt"),
                file("proguard-rules.pro"),
            )
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.9.3")
}
