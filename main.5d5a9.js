window.boot = function () {
  var settings = window._CCSettings;
  window._CCSettings = undefined;
  var onProgress = null;

  var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
  var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
  var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;

  function setLoadingDisplay() {
    var splash = document.getElementById("splash");
    var progressBar = splash.querySelector(".progress-bar span");
    onProgress = function (finish, total) {
      var percent = (100 * finish) / total;
      if (progressBar) {
        progressBar.style.width = percent.toFixed(2) + "%";
      }
    };
    splash.style.display = "block";
    progressBar.style.width = "0%";

    cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
      splash.style.display = "none";
    });
  }

  function getLaunchBundleName(launchScene) {
    if (settings.hasStartSceneBundle) {
      return "start-scene";
    }
    var match = /^db:\/\/assets\/([^/]+)\//.exec(launchScene);
    return match ? match[1] : MAIN;
  }

  var onStart = function () {
    cc.view.enableRetina(true);
    cc.view.resizeWithBrowserSize(true);

    if (cc.sys.isBrowser) {
      setLoadingDisplay();
    }

    if (cc.sys.isMobile) {
      if (settings.orientation === "landscape") {
        cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
      } else if (settings.orientation === "portrait") {
        cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
      }
      cc.view.enableAutoFullScreen(
        [
          cc.sys.BROWSER_TYPE_BAIDU,
          cc.sys.BROWSER_TYPE_BAIDU_APP,
          cc.sys.BROWSER_TYPE_WECHAT,
          cc.sys.BROWSER_TYPE_MOBILE_QQ,
          cc.sys.BROWSER_TYPE_MIUI,
          cc.sys.BROWSER_TYPE_HUAWEI,
          cc.sys.BROWSER_TYPE_UC,
        ].indexOf(cc.sys.browserType) < 0
      );
    }

    if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
      cc.assetManager.downloader.maxConcurrency = 2;
      cc.assetManager.downloader.maxRequestsPerFrame = 2;
    }

    var launchScene = settings.launchScene;
    var bundle = cc.assetManager.bundles.find(function (item) {
      return item.getSceneInfo(launchScene);
    });

    if (!bundle) {
      console.error("Cannot find the launch-scene bundle: " + launchScene);
      return;
    }

    bundle.loadScene(launchScene, null, onProgress, function (err, scene) {
      if (err) {
        console.error(err.message, err.stack);
        return;
      }

      cc.director.runSceneImmediate(scene);
      if (cc.sys.isBrowser) {
        var canvas = document.getElementById("GameCanvas");
        canvas.style.visibility = "";
        var div = document.getElementById("GameDiv");
        if (div) {
          div.style.backgroundImage = "";
        }
        console.log("Success to load scene: " + launchScene);
      }
    });
  };

  var option = {
    id: "GameCanvas",
    debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
    showFPS: settings.debug,
    frameRate: 60,
    groupList: settings.groupList,
    collisionMatrix: settings.collisionMatrix,
  };

  cc.assetManager.init({
    bundleVers: settings.bundleVers,
    remoteBundles: settings.remoteBundles,
    server: settings.server,
  });

  var bundleRoot = [INTERNAL];
  settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

  var count = 0;
  function cb(err) {
    if (err) {
      console.error(err.message, err.stack);
      return;
    }

    count++;
    if (count !== bundleRoot.length + 1) {
      return;
    }

    cc.assetManager.loadBundle(MAIN, function (mainError) {
      if (mainError) {
        console.error(mainError.message, mainError.stack);
        return;
      }

      var launchBundleName = getLaunchBundleName(settings.launchScene);
      if (launchBundleName === MAIN) {
        cc.game.run(option, onStart);
        return;
      }

      cc.assetManager.loadBundle(launchBundleName, function (launchError) {
        if (launchError) {
          console.error(launchError.message, launchError.stack);
          return;
        }
        cc.game.run(option, onStart);
      });
    });
  }

  cc.assetManager.loadScript(
    settings.jsList.map(function (item) {
      return "src/" + item;
    }),
    cb
  );

  for (var i = 0; i < bundleRoot.length; i++) {
    cc.assetManager.loadBundle(bundleRoot[i], cb);
  }
};

if (window.jsb) {
  var isRuntime = typeof loadRuntime === "function";
  if (isRuntime) {
    require("src/settings.c34cf.js");
    require("src/cocos2d-runtime.js");
    if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
      require("src/physics.js");
    }
    require("jsb-adapter/engine/index.js");
  } else {
    require("src/settings.c34cf.js");
    require("src/cocos2d-jsb.js");
    if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
      require("src/physics.js");
    }
    require("jsb-adapter/jsb-engine.js");
  }

  cc.macro.CLEANUP_IMAGE_CACHE = true;
  window.boot();
}

/* Orbital Rescue project edition 2026-10-27 */
