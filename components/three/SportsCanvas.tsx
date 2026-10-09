"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type MaterialProfile = "ball" | "metal" | "medal";

function setOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.4;
    });
  });
  object.visible = opacity > 0.002;
}

function smooth(a: number, b: number, value: number) {
  const x = THREE.MathUtils.clamp((value - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function tuneTexture(texture: THREE.Texture | null, anisotropy: number) {
  if (!texture) return;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

function tuneMaterial(
  material: THREE.Material,
  profile: MaterialProfile,
  anisotropy: number,
) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;

  tuneTexture(material.map, anisotropy);
  tuneTexture(material.normalMap, anisotropy);
  tuneTexture(material.roughnessMap, anisotropy);
  tuneTexture(material.metalnessMap, anisotropy);
  tuneTexture(material.aoMap, anisotropy);
  material.envMapIntensity =
    profile === "metal" ? 2.15 : profile === "medal" ? 1.65 : 1.25;

  if (profile === "ball") {
    material.roughness = THREE.MathUtils.clamp(material.roughness, 0.32, 0.76);
    material.metalness = Math.min(material.metalness, 0.14);
    if (material.normalMap) material.normalScale.multiplyScalar(1.12);
  } else if (profile === "metal") {
    material.metalness = Math.max(material.metalness, 0.82);
    material.roughness = THREE.MathUtils.clamp(material.roughness, 0.13, 0.26);
  } else {
    material.metalness = Math.max(material.metalness, 0.58);
    material.roughness = THREE.MathUtils.clamp(material.roughness, 0.22, 0.4);
  }

  if (material instanceof THREE.MeshPhysicalMaterial) {
    material.clearcoat = profile === "ball" ? 0.18 : 0.72;
    material.clearcoatRoughness = profile === "ball" ? 0.44 : 0.19;
  }
  material.needsUpdate = true;
}

function prepareModel(
  root: THREE.Object3D,
  targetSize: number,
  profile: MaterialProfile,
  anisotropy: number,
) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) =>
      tuneMaterial(material, profile, anisotropy),
    );
  });

  const initialBox = new THREE.Box3().setFromObject(root);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  const largestAxis =
    Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
  root.scale.multiplyScalar(targetSize / largestAxis);

  const fittedBox = new THREE.Box3().setFromObject(root);
  const center = fittedBox.getCenter(new THREE.Vector3());
  root.position.sub(center);

  const container = new THREE.Group();
  container.add(root);
  return container;
}

export function SportsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.innerWidth > 700,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.15 : 1.55),
    );
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.055);
    const camera = new THREE.PerspectiveCamera(
      33,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0.05, 8.5);

    const roomEnvironment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environmentTexture = pmremGenerator.fromScene(
      roomEnvironment,
      0.04,
    ).texture;
    scene.environment = environmentTexture;
    scene.environmentIntensity = 1.08;

    const world = new THREE.Group();
    scene.add(world);
    const football = new THREE.Group();
    const futsal = new THREE.Group();
    const basketball = new THREE.Group();
    const awards = new THREE.Group();
    const trophy = new THREE.Group();
    const medal = new THREE.Group();
    awards.add(trophy, medal);
    trophy.position.x = -0.46;
    medal.position.set(1.08, 0.12, 0.2);
    medal.rotation.set(-0.08, Math.PI / 2, -0.08);
    world.add(football, futsal, basketball, awards);
    futsal.position.x = 7;
    basketball.position.x = 7;
    awards.position.set(0, -7, 0);

    const loader = new GLTFLoader();
    const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    let disposed = false;
    const loadAsset = async (
      url: string,
      slot: THREE.Group,
      size: number,
      profile: MaterialProfile,
    ) => {
      try {
        const gltf = await loader.loadAsync(url);
        const model = prepareModel(gltf.scene, size, profile, anisotropy);
        if (disposed) {
          disposeObject(model);
          return;
        }
        slot.add(model);
      } catch (error) {
        console.error(`Não foi possível carregar o asset 3D: ${url}`, error);
      }
    };
    void loadAsset("/models/football.glb", football, 2.72, "ball");
    void loadAsset("/models/futsal.glb", futsal, 2.66, "ball");
    void loadAsset("/models/basketball.glb", basketball, 2.7, "ball");
    void loadAsset("/models/trophy.glb", trophy, 2.78, "metal");
    void loadAsset("/models/medal.glb", medal, 1.58, "medal");

    const court = new THREE.GridHelper(18, 18, 0x555555, 0x161616);
    court.position.set(0, -2.5, -1.5);
    court.rotation.x = 0.08;
    scene.add(court);
    setOpacity(court, 0);

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(6.5, 6.5),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.32 }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, -1.49, 0.12);
    contactShadow.receiveShadow = true;
    scene.add(contactShadow);

    scene.add(new THREE.HemisphereLight(0xdce8ff, 0x050505, 1.2));
    const key = new THREE.SpotLight(0xffffff, 92, 30, Math.PI / 5, 0.6, 1.35);
    key.position.set(-4, 6, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(
      window.innerWidth < 700 ? 512 : 1024,
      window.innerWidth < 700 ? 512 : 1024,
    );
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const rim = new THREE.PointLight(0xf3df13, 13, 14, 2);
    rim.position.set(4, -1, 3);
    scene.add(rim);
    const fill = new THREE.PointLight(0x6c80bd, 8, 12, 2);
    fill.position.set(-5, -2, 2);
    scene.add(fill);
    const softbox = new THREE.RectAreaLight(0xffffff, 7, 4.5, 3.2);
    softbox.position.set(3.4, 4.2, 5.5);
    softbox.lookAt(0, 0, 0);
    scene.add(softbox);

    let progress = 0;
    let mouseX = 0;
    let mouseY = 0;
    let scrollTrigger: { kill: () => void } | undefined;
    const pointer = (event: PointerEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("pointermove", pointer, { passive: true });

    void import("gsap").then(async ({ gsap }) => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      scrollTrigger = ScrollTrigger.create({
        trigger: "#cinematic-sequence",
        start: "top top",
        end: "bottom bottom",
        scrub: reducedMotion ? false : 0.7,
        onUpdate: (self) => {
          progress = self.progress;
        },
      });
    });

    const startedAt = performance.now();
    let frame = 0;
    const render = () => {
      const t = (performance.now() - startedAt) / 1000;
      const pSoccer = 1 - smooth(0.18, 0.3, progress);
      const pVolley =
        smooth(0.18, 0.3, progress) * (1 - smooth(0.37, 0.48, progress));
      const pBasket =
        smooth(0.37, 0.48, progress) * (1 - smooth(0.61, 0.7, progress));
      const pTrophy = smooth(0.63, 0.76, progress);
      setOpacity(football, pSoccer);
      setOpacity(futsal, pVolley);
      setOpacity(basketball, pBasket);
      setOpacity(awards, pTrophy);
      setOpacity(
        court,
        smooth(0.48, 0.6, progress) * (1 - smooth(0.7, 0.79, progress)) * 0.5,
      );

      football.position.x = THREE.MathUtils.lerp(
        1.85,
        0,
        smooth(0.04, 0.17, progress),
      );
      football.position.z = THREE.MathUtils.lerp(
        0,
        1.15,
        smooth(0.05, 0.2, progress),
      );
      futsal.position.x = THREE.MathUtils.lerp(
        6,
        0.95,
        smooth(0.18, 0.3, progress),
      );
      basketball.position.x = THREE.MathUtils.lerp(
        6,
        1.25,
        smooth(0.37, 0.5, progress),
      );
      basketball.position.y = THREE.MathUtils.lerp(
        0.3,
        -0.55,
        smooth(0.49, 0.64, progress),
      );
      awards.position.y = THREE.MathUtils.lerp(
        -6,
        -0.05,
        smooth(0.63, 0.78, progress),
      );
      awards.rotation.y = progress * 3.4;

      football.rotation.set(t * 0.13 + progress * 7, progress * 8, -0.1);
      futsal.rotation.set(progress * 6, t * 0.16 + progress * 5, 0.2);
      basketball.rotation.set(progress * 4, progress * 7 + t * 0.12, -0.15);
      medal.rotation.x = -0.08 + Math.sin(t * 0.55) * 0.025;
      medal.rotation.y = Math.PI / 2 + Math.sin(t * 0.38) * 0.08;
      world.rotation.y +=
        ((reducedMotion ? 0 : mouseX) - world.rotation.y) * 0.025;
      world.rotation.x +=
        ((reducedMotion ? 0 : mouseY) - world.rotation.x) * 0.025;
      camera.position.z =
        THREE.MathUtils.lerp(8.5, 6.15, smooth(0.04, 0.2, progress)) +
        smooth(0.58, 0.7, progress) * 2;
      camera.position.x +=
        ((progress > 0.48 && progress < 0.7 ? -1.25 : 0) - camera.position.x) *
        0.035;
      key.position.x = -4 + Math.sin(progress * Math.PI * 2) * 5;
      rim.intensity = 8 + smooth(0.6, 0.8, progress) * 18;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointer);
      scrollTrigger?.kill();
      scene.environment = null;
      environmentTexture.dispose();
      pmremGenerator.dispose();
      roomEnvironment.dispose();
      disposeObject(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="sports-canvas" aria-hidden="true" />
  );
}
