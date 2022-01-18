<template>
  <Renderer ref="rendererRef" resize="window" :orbit-ctrl="{ enableDamping: true }" shadow>
    <Camera :position="{ y: -5, z: 5 }" />
    <Scene background="#ffffff">
      <AmbientLight color="#505050" />
      <SpotLight ref="light"
        color="#ff9060" :intensity="0.5" :position="{ y: 1, z: -3 }"
        cast-shadow :shadow-map-size="{ width: 1024, height: 1024 }"
      />
      <SpotLight ref="light"
        color="#6090ff" :intensity="0.5" :position="{ y: -1, z: 3 }"
        cast-shadow :shadow-map-size="{ width: 1024, height: 1024 }"
      />
      <InstancedMesh ref="meshRef" @created="initMesh" :count="NUM_INSTANCES" cast-shadow receive-shadow>
        <PetalGeometry />
        <StandardMaterial :props="{ metalness: 0.75, roughness: 0.5 }" />
      </InstancedMesh>
    </Scene>
    <EffectComposer>
      <RenderPass />
      <UnrealBloomPass :strength="0.5" />
    </EffectComposer>
  </Renderer>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Color, Object3D } from 'three'
import {
  AmbientLight,
  Camera,
  EffectComposer,
  InstancedMesh,
  RenderPass,
  SpotLight,
  StandardMaterial,
  Renderer,
  Scene,
  UnrealBloomPass
} from 'troisjs'
import PetalGeometry from './PetalGeometry.js'
import chroma from 'chroma-js'

const N1 = 50
const N2 = 6
const NUM_INSTANCES = N1 * N2

const params = {
  color1: chroma.random(),
  color2: chroma.random(),
  maxRadius: 0.25,
  maxScale: 3,
  startRx: Math.PI / 3,
  zOffsetCoef: 0.7
}

params.cscale = chroma.scale([params.color1, params.color2, params.color1])

const dummy = new Object3D()

const rendererRef = ref()
const meshRef = ref()

onMounted(() => {
  const renderer = rendererRef.value
  const mesh = meshRef.value.mesh

  renderer.onBeforeRender(() => {
    updateInstanceMatrix(mesh)
  })
})

function initMesh(mesh) {
  updateInstanceColor(mesh)
}

function updateInstanceColor(mesh) {
  for (let i = 0; i < N1; i++) {
    for (let j = 0; j < N2; j++) {
      const n = i * N2 + j
      mesh.setColorAt(n, new Color(params.cscale(n / NUM_INSTANCES).hex()))
    }
  }
  mesh.instanceColor.needsUpdate = true
}

function updateInstanceMatrix(mesh) {
  const t = (Date.now() * 0.00005) % 1
  const da = 2 * Math.PI / N2
  const drx = 2 * params.startRx / N1
  let k, tcoef, zOffset, r, scale, n, a, x, y
  for (let i = 0; i < N1; i++) {
    k = (i + t * N1) % N1
    tcoef = Math.sin(Math.PI * k / N1)
    zOffset = params.zOffsetCoef * i
    r = tcoef * params.maxRadius
    scale = tcoef * params.maxScale
    for (let j = 0; j < N2; j++) {
      n = i * N2 + j
      a = da * (j + zOffset)
      x = r * Math.cos(a)
      y = r * Math.sin(a)
      dummy.position.set(x, y, 0)
      dummy.rotation.set(params.startRx - k * drx, 0, a - Math.PI / 2, 'ZXY')
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(n, dummy.matrix)
    }
  }
  mesh.instanceMatrix.needsUpdate = true
}
</script>

<style>
body {
  margin: 0;
}
canvas {
  display: block;
}
</style>
