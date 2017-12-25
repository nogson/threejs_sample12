(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var baseVert = require('./../shader/base.vert');
var baseFrag = require('./../shader/base.frag');

var notWebGL = function notWebGL() {
    // webGL非対応時の記述
    console.log('this browser does not support webGL');
};

if (document.getElementsByTagName('html')[0].classList.contains('no-webgl')) {
    notWebGL();
}

// three.jsのとき
try {
    var renderer = new THREE.WebGLRenderer();
} catch (e) {
    notWebGL();
}

// 返ってくる値を確認してみましょう！
console.log(ubu.detect);
// IEの時
if (ubu.detect.browser.ie) {
    console.log('IEさん、動画テクスチャはちょっと…無理ですね…');
}

window.onload = function () {

    var renderer;
    var camera, scene;
    var theta = 0;
    var clock = new THREE.Clock();
    var composer;
    var customPass;

    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var aspect = windowWidth / windowHeight;
    var videoTexture;
    var video;

    //uniform用
    var distortion = 0.0;
    var distortion2 = 0.0;
    var scrollSpeed = 0.0;
    var time = 0.0;

    //audio関連の変数
    var context = void 0;
    var analyser = void 0;
    var bufferLength = void 0;
    var dataArray = void 0;
    var source = void 0;
    var fftSize = void 0;

    audioInit();
    init();

    function init() {

        // rendererの作成
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(0xffffff), 1.0);

        // canvasをbodyに追加
        document.body.appendChild(renderer.domElement);

        // canvasをリサイズ
        renderer.setSize(windowWidth, windowHeight);

        // ベースの描画処理（renderTarget への描画用）
        scene = new THREE.Scene();

        //LIGHTS
        var light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);

        //ベースの描画処理用カメラ                      
        camera = new THREE.PerspectiveCamera(60, windowWidth / windowHeight, 0.1, 1000);
        camera.position.z = 1;

        //Load Video
        video = document.createElement('video');
        video.loop = true;
        video.src = 'movie/mv.mp4';
        video.play();

        videoTexture = new THREE.Texture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        var material = new THREE.MeshBasicMaterial({
            map: videoTexture
        });

        //var material = new THREE.MeshLambertMaterial();
        var geometry = new THREE.PlaneGeometry(2, 3, 1, 1);
        var mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        composer = new THREE.EffectComposer(renderer);

        //現在のシーンを設定
        var renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);
        //カスタムシェーダー
        var myEffect = {
            uniforms: {
                "tDiffuse": {
                    value: null
                },
                "time": {
                    type: "f",
                    value: time
                },
                "distortion": {
                    type: "f",
                    value: distortion
                },
                "distortion2": {
                    type: "f",
                    value: 2.0
                },
                "scrollSpeed": {
                    type: "f",
                    value: 0.5
                },
                "speed": {
                    type: "f",
                    value: 1.0
                },
                "resolution": {
                    type: 'v2',
                    value: new THREE.Vector2(windowWidth, windowHeight)
                }
            },
            vertexShader: baseVert,
            fragmentShader: baseFrag

            //エフェクト結果をスクリーンに描画する
        };customPass = new THREE.ShaderPass(myEffect);
        customPass.renderToScreen = true;
        composer.addPass(customPass);

        render();
    }

    function audioInit() {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.minDecibels = -90; //最小値
        analyser.maxDecibels = 0; //最大値
        analyser.smoothingTimeConstant = 0.65;
        analyser.fftSize = 512; //音域の数

        bufferLength = analyser.frequencyBinCount; //fftSizeの半分のサイズ
        dataArray = new Uint8Array(bufferLength); //波形データ格納用の配列を初期化
        analyser.getByteFrequencyData(dataArray); //周波数領域の波形データを取得

        //マイクの音を取得
        navigator.webkitGetUserMedia({
            audio: true
        }, function (stream) {
            source = context.createMediaStreamSource(stream);
            // オーディオの出力先を設定
            source.connect(analyser);
        }, function (err) {
            console.log(err);
        });
    }

    function sum(arr) {
        return arr.reduce(function (prev, current, i, arr) {
            return prev + current;
        });
    };

    function render() {

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            if (videoTexture) videoTexture.needsUpdate = true;
        }
        analyser.getByteFrequencyData(dataArray);

        time = clock.getElapsedTime();
        customPass.uniforms.time.value = time;

        customPass.uniforms.distortion.value = sum(dataArray) / dataArray.length;
        customPass.uniforms.distortion2.value = sum(dataArray) / (dataArray.length * Math.random() * 10 + 10);
        customPass.uniforms.scrollSpeed.value = sum(dataArray) / (dataArray.length * Math.random() * 500 + 500);
        composer.render();

        requestAnimationFrame(render);
    }
};

},{"./../shader/base.frag":2,"./../shader/base.vert":3}],2:[function(require,module,exports){
module.exports = "\nuniform sampler2D tDiffuse;\nuniform float time;\nuniform float distortion;\nuniform float distortion2;\nuniform float speed;\nuniform float scrollSpeed;\nvarying vec2 vUv;\n\n//シンプレックスノイズ\n//https://github.com/ashima/webgl-noise/blob/master/src/noise2D.glsl\nvec3 mod289(vec3 x) {\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec2 mod289(vec2 x) {\n    return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec3 permute(vec3 x) {\n    return mod289(((x * 34.0) + 1.0) * x);\n}\n\nfloat snoise(vec2 v) {\n    const vec4 C = vec4(0.211324865405187, // (3.0-sqrt(3.0))/6.0,\n        0.366025403784439, // 0.5*(sqrt(3.0)-1.0),\n        -0.577350269189626, // -1.0 + 2.0 * C.x,\n        0.024390243902439); // 1.0 / 41.0,\n    vec2 i = floor(v + dot(v, C.yy));\n    vec2 x0 = v - i + dot(i, C.xx);\n\n    vec2 i1;\n    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n    vec4 x12 = x0.xyxy + C.xxzz;\n    x12.xy -= i1;\n\n    i = mod289(i);\n    // Avoid truncation effects in permutation,\n    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));\n\n    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);\n    m = m * m;\n    m = m * m;\n\n    vec3 x = 2.0 * fract(p * C.www) - 1.0;\n    vec3 h = abs(x) - 0.5;\n    vec3 ox = floor(x + 0.5);\n    vec3 a0 = x - ox;\n\n    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);\n\n    vec3 g;\n    g.x = a0.x * x0.x + h.x * x0.y;\n    g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n    return 130.0 * dot(m, g);\n}\n\nvoid main() {\n   \n    vec2 p = vUv;\n    float y = p.y + time * speed;\n\n    float n = snoise(vec2(y,0.0));\n    float offset = snoise(vec2(y,0.0));\n\n    offset = offset * distortion * 0.01;\n    offset += snoise(vec2(y * 50.0,0.0)) * 0.01 * distortion2;\n\n    //走査線\n    float scanLine = abs(sin(p.y * 400.0 + time * 5.0)) * 0.7 + 0.3;\n\n    //UV座標  \n    vec2 u = vec2(fract(p.x + offset),fract(p.y + time * scrollSpeed * 0.5));\n    vec4 color = vec4(1.0);\n    color.r = texture2D(tDiffuse, u + vec2(0.01 * distortion2,0.0)).r;\n    color.g = texture2D(tDiffuse, u + vec2(-0.01 * distortion2,0.0)).g;\n    color.b = texture2D(tDiffuse, u + vec2(0.0,0.0)).b;\n\n    gl_FragColor =  color * scanLine;\n\n}";

},{}],3:[function(require,module,exports){
module.exports = "\n\nvarying vec3 vNormal;\nvarying vec2 vUv;\n\nvoid main() {\n  vUv = uv; \n  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}";

},{}]},{},[1]);
