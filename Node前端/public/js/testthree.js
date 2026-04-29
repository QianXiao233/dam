import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as TWEEN from '../../build/tween.esm.js';
import { Water } from 'three/addons/objects/Water.js';

const CONFIG = {
  WATER: {
    COLOR: 0x4a90e2,
    DISTORTION: 7,
    TEXTURE: '/images/water.png'
  },
};

// ========== 调试面板 ==========
const debugDiv = document.createElement('div');
debugDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 11px;
    padding: 10px;
    border-radius: 5px;
    z-index: 10000;
    max-width: 300px;
    pointer-events: none;
    border-left: 3px solid #0f0;
`;
debugDiv.innerHTML = '<strong>🔍 调试信息</strong><br>初始化中...';
document.body.appendChild(debugDiv);

function updateDebug(message) {
    debugDiv.innerHTML = '<strong>🔍 调试信息</strong><br>' + message;
    console.log('[DEBUG]', message);
}

// ========== 场景初始化 ==========
updateDebug('创建场景...');
const scene = new THREE.Scene();

// 环境光（提高亮度）
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// 主光源方向光
const directionalLight = new THREE.DirectionalLight(0xfffafa, 2.0);
directionalLight.position.set(100, 200, 100);
scene.add(directionalLight);

// 补光 - 从背面
const backLight = new THREE.DirectionalLight(0x88aaff, 0.8);
backLight.position.set(-50, 100, -100);
scene.add(backLight);

// 添加一个简单的网格辅助平面（确认地面位置）
const gridHelper = new THREE.GridHelper(2000, 20, 0x888888, 0x444444);
gridHelper.position.y = -100;
scene.add(gridHelper);

// 添加辅助坐标系（红X, 绿Y, 蓝Z）
const axesHelper = new THREE.AxesHelper(500);
scene.add(axesHelper);

// 添加一个参考立方体（确认场景中心）
const testBoxGeometry = new THREE.BoxGeometry(100, 100, 100);
const testBoxMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true });
const testBox = new THREE.Mesh(testBoxGeometry, testBoxMaterial);
testBox.position.set(0, 0, 0);
scene.add(testBox);
updateDebug('场景创建完成，添加了参考网格和立方体');

// ========== 相机 ==========
const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.PerspectiveCamera(45, width / height, 0.8, 5000);
camera.position.set(500, 400, 800);
camera.lookAt(0, 200, 0);

// ========== 渲染器 ==========
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
document.getElementById("webgl").appendChild(renderer.domElement);

// ========== 轨道控制 ==========
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;
controls.enableZoom = true;
controls.zoomSpeed = 1.2;
controls.target.set(0, 200, 0);
controls.update();

// ========== 水面变量 ==========
let water;
let model;

// ========== 动画循环 ==========
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    if (water) {
        water.material.uniforms['time'].value += 0.01;
    }
    controls.update(); // 更新轨道控制
    renderer.render(scene, camera);
}
animate();

// ========== 水面设置函数 ==========
function setupWater(sunDirection) {
    updateDebug('正在创建水面...');
    const waterGeometry = new THREE.PlaneGeometry(1500, 2950);
    const textureLoader = new THREE.TextureLoader();
    
    const waterNormals = textureLoader.load(CONFIG.WATER.TEXTURE, function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        updateDebug('水面纹理加载完成');
    }, undefined, function(err) {
        console.error('水面纹理加载失败:', err);
        updateDebug('❌ 水面纹理加载失败');
    });
    
    const waterObj = new Water(waterGeometry, {
        textureWidth: 1000,
        textureHeight: 12,
        waterNormals: waterNormals,
        alpha: 1.0,
        sunDirection: sunDirection,
        sunColor: 0xffffff,
        waterColor: CONFIG.WATER.COLOR,
        distortionScale: CONFIG.WATER.DISTORTION,
        fog: scene.fog !== undefined
    });

    waterObj.rotation.x = -Math.PI / 2;
    waterObj.rotation.z = -Math.PI / 1.08;
    waterObj.position.set(-1100, 400, 2800);
    scene.add(waterObj);
    updateDebug('水面创建完成，位置: y=400');
    return waterObj;
}

// ========== 模型加载 ==========
const loader = new GLTFLoader();
updateDebug('开始加载模型 /model/daba.glb');

loader.load('/model/daba2-v1.glb', function (gltf) {
    model = gltf.scene;
    scene.add(model);
    
    // 模型位置和缩放
    model.position.set(0, 0, 0);
    model.scale.set(1, 1.3, 1);
    
    updateDebug('✅ 模型加载成功！');
    
    // 遍历模型，打印所有网格信息
    let meshCount = 0;
    model.traverse((child) => {
        if (child.isMesh) {
            meshCount++;
            console.log(`网格 ${meshCount}:`, child.name);
            console.log('  - 位置:', child.position);
            console.log('  - 几何体:', child.geometry);
            console.log('  - 材质:', child.material);
            
            // 确保材质有光照响应
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.metalness = 0.5;
                        mat.roughness = 0.5;
                        mat.needsUpdate = true;
                    });
                } else {
                    child.material.metalness = 0.5;
                    child.material.roughness = 0.5;
                    child.material.needsUpdate = true;
                }
            }
        }
    });
    
    updateDebug(`✅ 模型包含 ${meshCount} 个网格`);
    
    // 计算模型包围盒
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    updateDebug(`模型中心: (${center.x.toFixed(0)}, ${center.y.toFixed(0)}, ${center.z.toFixed(0)})<br>模型尺寸: (${size.x.toFixed(0)}, ${size.y.toFixed(0)}, ${size.z.toFixed(0)})`);
    
    // 更新相机控制目标
    controls.target.copy(center);
    controls.update();
    
    // 初始化水面
    const sunDirection = new THREE.Vector3(1, 1, 1).normalize();
    water = setupWater(sunDirection);
    
    // 隐藏进度条容器
    const container = document.getElementById("container");
    if (container) {
        container.style.display = 'none';
    }
    
    // 可选：添加一个包围盒可视化（调试用）
    const boxHelper = new THREE.Box3Helper(box, 0xffff00);
    scene.add(boxHelper);
    updateDebug('已添加黄色包围盒辅助线');
    
    renderer.render(scene, camera);
    
}, function (xhr) {
    const percent = (xhr.loaded / xhr.total * 100).toFixed(1);
    updateDebug(`加载模型: ${percent}%`);
    
    const percentDiv = document.getElementById("per");
    if (percentDiv) {
        percentDiv.style.width = (xhr.loaded / xhr.total) * 400 + "px";
        percentDiv.style.textIndent = (xhr.loaded / xhr.total) * 400 + 5 + "px";
        percentDiv.innerHTML = Math.floor(percent) + '%';
    }
}, function (error) {
    console.error('❌ 模型加载失败:', error);
    updateDebug(`❌ 模型加载失败: ${error.message || '未知错误'}<br>请检查文件路径是否正确`);
});

// ========== 全局函数：更新水面高度 ==========
window.updatewatermodel = function() {
    console.log('[updatewatermodel] 被调用');
    updateDebug('updatewatermodel 被调用');
    
    if (!water) {
        console.warn('water 对象未就绪');
        updateDebug('⚠️ water 对象未就绪');
        return;
    }
    
    if (typeof window.getData !== 'function') {
        console.warn('window.getData 函数不存在');
        updateDebug('⚠️ window.getData 函数不存在');
        return;
    }
    
    try {
        const data = window.getData();
        console.log('[updatewatermodel] 获取到的数据:', data);
        
        if (data && data[0] && data[0][0] !== undefined) {
            const height = data[0][0] / 2;
            const newheight = (5 / 6) * height + 400;
            water.position.y = newheight;
            console.log(`[updatewatermodel] 水面高度更新: ${newheight.toFixed(2)}`);
            updateDebug(`✅ 水面高度更新为: ${newheight.toFixed(2)}`);
        } else {
            console.warn('[updatewatermodel] 数据格式不正确');
            updateDebug('⚠️ 数据格式不正确');
        }
    } catch (e) {
        console.error('[updatewatermodel] 执行出错:', e);
        updateDebug(`❌ 执行出错: ${e.message}`);
    }
};

// ========== 模拟 getData 函数（如果不存在） ==========
if (typeof window.getData !== 'function') {
    console.warn('window.getData 未定义，使用模拟数据');
    window.getData = function() {
        return [[100]];  // 模拟水位数据
    };
    updateDebug('⚠️ 使用模拟 getData 函数，水位=100');
}

// ========== 添加一些辅助光源用于调试 ==========
// 添加一个点光源在模型位置附近
const debugLight = new THREE.PointLight(0xffaa00, 0.5);
debugLight.position.set(0, 300, 300);
scene.add(debugLight);

// 添加一个小球体标记光源位置
const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(20, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200 })
);
lightSphere.position.copy(debugLight.position);
scene.add(lightSphere);

// 每秒输出一次相机位置（调试用）
setInterval(() => {
    if (model) {
        console.log(`相机位置: (${camera.position.x.toFixed(0)}, ${camera.position.y.toFixed(0)}, ${camera.position.z.toFixed(0)})`);
        console.log(`模型位置: (${model.position.x}, ${model.position.y}, ${model.position.z})`);
        console.log(`水面位置: (${water?.position.x}, ${water?.position.y}, ${water?.position.z})`);
    }
}, 5000);

updateDebug('初始化完成，等待模型加载...');
console.log('========== Three.js 调试版本已启动 ==========');