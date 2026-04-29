import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as TWEEN from './tween.esm.js';
import {GammaCorrectionShader} from 'three/addons/shaders/GammaCorrectionShader.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// 引入渲染器通道RenderPass
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// 引入OutlinePass通道
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';



const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xadd8e6, 4.0);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 100, 0);
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xfffafa, 4.0);
directionalLight.position.set(100, 200, 0);
scene.add(directionalLight);

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.PerspectiveCamera(60, width / height, 0.8, 4000);
camera.position.set(170, 170, 170);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("webGL").appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', function () {
    renderer.render(scene, camera);
});

renderer.setClearColor(0x000000, 0.0);

function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};
animate()
const loader = new GLTFLoader();
let model;
var lastDrawnRect = null;
loader.load('model.gltf', function (gltf) {
    model = gltf.scene;
    scene.add(model);

            //后处理加发光处理
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 创建OutlinePass通道
    const v2 = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const outlinePass = new OutlinePass(v2, scene, camera);
    const child1 = scene.getObjectByName('diban');
    outlinePass.selectedObjects = [child1];
    outlinePass.visibleEdgeColor.set(0x00ffff);
    outlinePass.edgeThickness = 3;
    outlinePass.edgeStrength = 7;
    outlinePass.pulsePeriod = 2;
    composer.addPass(outlinePass);

    function render() {
        composer.render();
        // renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    render();

    const gammaPass= new ShaderPass(GammaCorrectionShader);
    composer.addPass(gammaPass);


var windowObject = scene.getObjectByName("window");
if (windowObject) {
    if (windowObject.material instanceof THREE.MeshBasicMaterial || windowObject.material instanceof THREE.MeshStandardMaterial) {
        windowObject.material.transparent = true; // 启用透明度
        windowObject.material.opacity = 0.3; // 设置透明度值（0-1 范围内）
        // 如果需要，可以设置材质的其他属性，比如颜色
    } else {
        console.error("Object's material does not support transparency."); // 输出错误信息
    }
} else {
    console.error("Object with name 'window' not found in the scene."); // 输出错误信息
}

function updateModel(){
    var xhr1 = new XMLHttpRequest();
    xhr1.open("GET", "http://localhost:8080/data/getList", false);
    xhr1.onload = function () {
        if (xhr1.status === 200) {
            var responseData = xhr1.responseText;
            responseData = JSON.parse(responseData);
            var temperature = Object.values(responseData[0]);

            checkAndUpdateModelVisibility(temperature[0], 'oneFire');
            checkAndUpdateModelVisibility(temperature[1], 'twoFire');
            checkAndUpdateModelVisibility(temperature[2], 'threeFire');
            checkAndUpdateModelVisibility(temperature[3], 'fourFire');
            checkAndUpdateModelVisibility(temperature[4], 'fiveFire');
            checkAndUpdateModelVisibility(temperature[5], 'sixFire');
            checkAndUpdateModelVisibility(temperature[6], 'sevenFire');
            checkAndUpdateModelVisibility(temperature[7], 'eightFire');
            checkAndUpdateModelVisibility(temperature[8], 'nineFire');
            checkAndUpdateModelVisibility(temperature[9], 'tenFire');
        }
    };
        xhr1.onerror = function () {console.error("请求出错");};
        xhr1.send();
 }

function checkAndUpdateModelVisibility(temperature, modelName) {
        var model = scene.getObjectByName(modelName);
        if (model) {
            if (temperature > 43) {
                // var xhr = new XMLHttpRequest();
                // xhr.open('GET', 'http://localhost:8080/data/Open', true); // 第三个参数设置为false表示将请求设置为同步
                // xhr.send();
                model.visible = true;
            } else if (temperature > 40) {
                model.visible = true;
                var xhr4 = new XMLHttpRequest();// 大于40度小于等于60度时隐藏模型
                xhr4.open('GET', 'http://localhost:8080/data/playerAudio', true); 
                xhr4.send(); 
            } else {
                model.visible = false;// 小于等于40度时隐藏模型
            }
        } else {console.log("Object '" + modelName + "' not found in the scene.");}
    }
      setInterval(updateModel, 1000)
      window.addEventListener('mousemove', onMouseOver, false);
});


function render() {
    TWEEN.update();
    requestAnimationFrame(render);
}
render();

document.getElementById('A').addEventListener('click', function () {
    const A = model.getObjectByName('jigui09');
    const pos = new THREE.Vector3();
    A.getWorldPosition(pos); //获取三维场景中某个对象世界坐标
    // 相机飞行到的位置和观察目标拉开一定的距离
    const pos2 = new THREE.Vector3().copy(pos).add(new THREE.Vector3(45, -21, -1));//向量的x、y、z坐标分别在pos基础上增加30
    // 相机从当前位置camera.position飞行三维场景中某个世界坐标附近
    new TWEEN.Tween({
            // 相机开始坐标
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            // 相机开始指向的目标观察点
            tx: 0,
            ty: 0,
            tz: 0,
        })
        .to({
            // 相机结束坐标
            x: pos2.x,
            y: pos2.y,
            z: pos2.z,
            // 相机结束指向的目标观察点
            tx: pos.x,
            ty: pos.y-20,
            tz: pos.z,
        }, 2000)
        .onUpdate(function (obj) {
            // 动态改变相机位置
            camera.position.set(obj.x, obj.y, obj.z);
            // 动态计算相机视线
            camera.lookAt(obj.tx, obj.ty, obj.tz);
        })
        .start();
})

function onMouseOver(event) {
    // 获取鼠标点击位置的二维坐标
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 创建一个射线投射器
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // 计算射线投射的物体
    const intersects = raycaster.intersectObjects(scene.children, true);

    function fetchData3() {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
                    xhr.open("GET", "http://localhost:8080/data/getList", false);
                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            var responseData = xhr.responseText;
                            responseData = JSON.parse(responseData);
                            var data2 = Object.values(responseData[0]);
                            resolve(data2);
                        } else {reject(new Error("请求失败"));}
                    };
                    xhr.send();
        });
    }
    fetchData3().then(function (data2) { 
    if (intersects.length > 0) {
        // 输出点击的物体名称
        const clickedObjectName = intersects[0].object.name;
        if (clickedObjectName === "jigui01") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100001\n\n温度:'+data2[0]+"℃"+"\n\n机柜名称：1号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
        }else {
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
        }

        if (clickedObjectName === "jigui02") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100081\n\n温度:'+data2[1]+"℃"+"\n\n机柜名称：2号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }

        if (clickedObjectName === "jigui03") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100011\n\n温度:'+data2[2]+"℃"+"\n\n机柜名称：3号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }
        if (clickedObjectName === "jigui04") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100021\n\n温度:'+data2[3]+"℃"+"\n\n机柜名称：4号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }
        if (clickedObjectName === "jigui05") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100001\n\n温度:'+data2[4]+"℃"+"\n\n机柜名称：5号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }
        if (clickedObjectName === "jigui06") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100031\n\n温度:'+data2[5]+"℃+"+"\n\n机柜名称：6号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }
        if (clickedObjectName === "jigui07") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100041\n\n温度:'+data2[6]+"℃"+"\n\n机柜名称：7号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }
        if (clickedObjectName === "jigui08") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100051\n\n温度:'+data2[7]+"℃"+"\n\n机柜名称：8号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }
        if (clickedObjectName === "jigui09") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100061\n\n温度:'+data2[8]+"℃"+"\n\n机柜名称：9号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }

        if (clickedObjectName === "jigui10") {
            var x = event.pageX; // 鼠标相对于整个文档的水平位置  
            var y = event.pageY; // 鼠标相对于整个文档的垂直位置 
            if (lastDrawnRect) {
                document.body.removeChild(lastDrawnRect);
                lastDrawnRect = null;
            }
            // 创建一个新的 div 元素  
            var newDiv = document.createElement('div');
            newDiv.classList.add('myDiv');
            newDiv.style.zIndex = 10;
            newDiv.style.borderRadius = '5px';
            newDiv.style.textAlign = 'left';
            newDiv.style.paddingLeft = '11px';
            newDiv.style.left = x+'px';  
            newDiv.style.top = y+'px';  
            newDiv.innerText = '机柜编号：100071\n\n温度:'+data2[9]+"℃"+"\n\n机柜名称：10号机柜\n\n包含设备:\n\nBBU(DBS5900)\n\nBBU(DBS5901)\n\n业务范围：连接PCI032";
            newDiv.style.whiteSpace = 'pre-wrap';
            
            // 将 div 添加到 body 元素内  
            document.body.appendChild(newDiv);
            lastDrawnRect = newDiv;
           
        }
        
    }
});
}







// // 创建一个粒子系统
// const particleSystem = new THREE.Group();
// scene.add(particleSystem);

// // 粒子参数
// const particleCount = 5000; // Increase particle count for a denser effect
// const particles = new THREE.BufferGeometry();
// const particleMaterial = new THREE.PointsMaterial({
//     color: 0xffffff,
//     size: 20,
//     map: new THREE.TextureLoader().load("./img/fire.png"),
//     blending: THREE.AdditiveBlending,
//     transparent: true
// });

// // 创建粒子并将它们分布在整个屏幕上
// const positions = new Float32Array(particleCount * 1);
// for (let i = 0; i < particleCount * 3; i += 3) {
//     // Distribute particles across the entire screen
//     positions[i] = (Math.random() - 0.5) * window.innerWidth; // X coordinate
//     positions[i + 1] = (Math.random() - 0.5) * window.innerHeight; // Y coordinate
//     positions[i + 2] = Math.random() * 800 - 400; // Z coordinate (depth)
// }
// particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// 将粒子添加到粒子系统中
// const particleSystemObj = new THREE.Points(particles, particleMaterial);
// particleSystem.add(particleSystemObj);

// // 更新粒子位置
// function updateParticles() {
//     const positions = particles.attributes.position.array;
//     for (let i = 0; i < positions.length; i += 3) {
//         positions[i + 1] += 2; // 上升速度可以根据需要调整
//         if (positions[i + 1] > window.innerHeight / 2) { // 如果粒子超出屏幕范围，则重新放置到屏幕顶部
//             positions[i] = (Math.random() - 0.5) * window.innerWidth; // X coordinate
//             positions[i + 1] = -window.innerHeight / 2; // Y coordinate
//             positions[i + 2] = Math.random() * 800 - 400; // Z coordinate (depth)
//         }
//     }
//     particles.attributes.position.needsUpdate = true;
// }

// // 每帧更新粒子位置
// function animateParticles() {
//     updateParticles();
//     renderer.render(scene, camera);
//     requestAnimationFrame(animateParticles);
// }

// animateParticles();

// if(model){
// var geometry = new THREE.BufferGeometry();
// var positionAttribute = geometry.getAttribute('position');

// // 确保 positionAttribute 对象被正确获取
// if (positionAttribute !== undefined) {
//     var positions1 = positionAttribute.array;

//     // 对顶点属性进行处理
//     for (var i = 0; i < positions1.length; i += 3) {
//         var x = positions1[i];
//         var y = positions1[i + 1];
//         var z = positions1[i + 2];

//         // 检查是否存在NaN值
//         if (isNaN(x) || isNaN(y) || isNaN(z)) {
//             // 将NaN值替换为合适的数值，这里简单地替换为0
//             positions1[i] = 0;
//             positions1[i + 1] = 0;
//             positions1[i + 2] = 0;
//         }
//     }

//     // 更新顶点数据
//     positionAttribute.needsUpdate = true;
// } else {
//     console.error("Failed to retrieve 'position' attribute from geometry.");
// }
    
// }

// document.getElementById('close').addEventListener('click', function () {
// // 假设door是你的门对象
// const door = model.getObjectByName('men');

// // 定义门打开的角度
// const openAngle = Math.PI / 2; // 90度

// // 初始角度为0
// let currentAngle = 0;

// // 创建一个Tween对象来控制门的动画
// const tween = new TWEEN.Tween({ angle: currentAngle })
//     .to({ angle: openAngle }, 2000) // 动画持续时间为2秒
//     .easing(TWEEN.Easing.Quadratic.InOut) // 使用缓动函数使动画更加自然
//     .onUpdate(function () {
//         // 更新门的角度
//         door.rotation.y = this.angle;
//     })
//     .start(); // 开始动画


// })
