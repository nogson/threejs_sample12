const baseVert = require('./../shader/base.vert');
const baseFrag = require('./../shader/base.frag');

let notWebGL = function () {
    // webGL非対応時の記述
    console.log('this browser does not support webGL')
};

if (document.getElementsByTagName('html')[0].classList.contains('no-webgl')) {
    notWebGL();
}

// three.jsのとき
try {
    let renderer = new THREE.WebGLRenderer();
} catch (e) {
    notWebGL();
}

// 返ってくる値を確認してみましょう！
console.log(ubu.detect);
// IEの時
if (ubu.detect.browser.ie) {
    console.log('IEさん、動画テクスチャはちょっと…無理ですね…')
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
    let context;
    let analyser;
    let bufferLength;
    let dataArray;
    let source;
    let fftSize;


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
        }

        //エフェクト結果をスクリーンに描画する
        customPass = new THREE.ShaderPass(myEffect);
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
            },
            function (stream) {
                source = context.createMediaStreamSource(stream);
                // オーディオの出力先を設定
                source.connect(analyser);
            },
            function (err) {
                console.log(err);
            }
        );
    }

    function sum(arr) {
        return arr.reduce(function(prev, current, i, arr) {
            return prev+current;
        });
    };

    function render() {

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            if (videoTexture) videoTexture.needsUpdate = true;
        }
        analyser.getByteFrequencyData(dataArray)

        time = clock.getElapsedTime();
        customPass.uniforms.time.value = time;
        
        customPass.uniforms.distortion.value = sum(dataArray)/dataArray.length;
        customPass.uniforms.distortion2.value = sum(dataArray)/(dataArray.length * Math.random()*10 + 10);
        customPass.uniforms.scrollSpeed.value = sum(dataArray)/(dataArray.length * Math.random()*500 + 500);               
        composer.render();

        requestAnimationFrame(render);
    }
};