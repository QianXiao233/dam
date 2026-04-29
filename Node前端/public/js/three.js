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
;
const scene = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xadd8e6, 4.0);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xff0000, 1, 100);
pointLight.position.set(0, 100, 0);
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xfffafa, 9.0);
directionalLight.position.set(100, 200, 0);
scene.add(directionalLight);

// 添加辅助坐标系（调试用）
const axesHelper = new THREE.AxesHelper(500);
scene.add(axesHelper);

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.PerspectiveCamera(30, width / height, 0.8, 4000);
camera.position.set(-1000, 800, 100);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("webgl").appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', function () {
    renderer.render(scene, camera);
});

renderer.setClearColor(0x000000, 1.0);

let water; // 将water声明移到顶部，使其在全局作用域中可访问

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    if (water) {
        water.material.uniforms['time'].value += 0.01;
    }
    renderer.render(scene, camera);
};
animate();

const loader = new GLTFLoader();
let model;
loader.load('/model/无标题.glb', function (gltf) {
    model = gltf.scene;
    scene.add(model);
    model.position.set(0, 200, 300);
    model.scale.set(1, 1.3, 1);
    // model.rotation.x -= 0.01
    
    // 初始化水面（添加在模型加载完成后）
    const sunDirection = new THREE.Vector3(1, 1, 1).normalize();
    water = setupWater(sunDirection);
    document.getElementById("container").style.display = 'none';

    // 计算模型中心点并让相机看向它
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    controls.update();

    renderer.render(scene, camera);
    // window.addEventListener('mousemove', onMouseOver, false);
}, function (xhr) {
    const percentDiv = document.getElementById("per");
    const percent = xhr.loaded / xhr.total;
    percentDiv.style.width = percent * 400 + "px";
    percentDiv.style.textIndent = percent * 400 + 5 + "px";
    percentDiv.innerHTML = Math.floor(percent * 100) + '%';
});
renderer.setClearAlpha(0); // 设置清除缓冲区的透明度（0=完全透明）
renderer.setClearColor(0x000000, 0)
function setupWater(sunDirection) {
  const waterGeometry = new THREE.PlaneGeometry(1500, 2950);
  const textureLoader = new THREE.TextureLoader();
  
  const waterNormals = textureLoader.load(CONFIG.WATER.TEXTURE, function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
  });
  
  const water = new Water(waterGeometry, {
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

  water.rotation.x = -Math.PI / 2;
//   water.rotation.y = -Math.PI / 0.2;
water.rotation.z = -Math.PI / 1.08;
  water.position.set(-1100, 400, 2800);
  scene.add(water);
  return water;
}

 window.updatewatermodel=function(){
if (water) {
    const height = window.getData()[0][0]/2;
    if (height) {
      const newheight = (5 / 6) * height + 400;
      water.position.y = newheight;
    }
  }
}

