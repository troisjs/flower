<template>
  <Renderer ref="rendererRef" resize="window" :orbit-ctrl="{ enableDamping: true }" shadow>
    <Camera :position="{ y: -5, z: 5 }" />
    <Scene background="#ffffff">
      <AmbientLight color="#505050" />
      <SpotLight ref="light"
        :color="lightParams.color1" :intensity="0.5" :position="{ y: -1, z: 3 }"
        cast-shadow :shadow-map-size="{ width: 1024, height: 1024 }"
      />
      <SpotLight ref="light"
        :color="lightParams.color2" :intensity="0.5" :position="{ y: 1, z: -3 }"
        cast-shadow :shadow-map-size="{ width: 1024, height: 1024 }"
      />
      <InstancedMesh ref="meshRef" @created="initMesh" :count="NUM_INSTANCES" cast-shadow receive-shadow>
        <PetalGeometry v-bind="petalParams" />
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
import { onMounted, onUnmounted, ref } from 'vue'
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
import { Pane } from 'tweakpane'

const N1 = 50
const N2 = 8
const NUM_INSTANCES = N1 * N2

const params = {
  color1: '#ffffff',
  color2: '#ff0000',
  maxRadius: 0.25,
  maxScale: 3,
  startRx: Math.PI / 3,
  zOffsetCoef: 5
}

const petalParams = ref({ size: 1, dx: 0.4, dy: 0.8 })
const lightParams = ref({ color1: '#6090ff', color2: '#ff9060' })

const dummy = new Object3D()

const rendererRef = ref()
const meshRef = ref()

onMounted(() => {
  const renderer = rendererRef.value
  const mesh = meshRef.value.mesh

  const pane = new Pane({ title: 'Parameters', expanded: false })

  const folder1 = pane.addFolder({ title: 'Colors' })
  folder1.addInput(params, 'color1', { view: 'color' }).on('change', () => { updateInstanceColor(mesh) })
  folder1.addInput(params, 'color2', { view: 'color' }).on('change', () => { updateInstanceColor(mesh) })
  folder1.addInput(lightParams.value, 'color1', { view: 'color', label: 'lightColor1' })
  folder1.addInput(lightParams.value, 'color2', { view: 'color', label: 'lightColor2' })
  folder1.addButton({ title: 'Random colors' }).on('click', () => { randomColors(mesh); pane.refresh() })

  const folder2 = pane.addFolder({ title: 'Petals' })
  folder2.addInput(petalParams.value, 'size', { min: 0.5, max: 2, step: 0.1 })
  folder2.addInput(petalParams.value, 'dx', { min: 0.1, max: 2, step: 0.1 })
  folder2.addInput(petalParams.value, 'dy', { min: 0, max: 2, step: 0.1 })

  const folder3 = pane.addFolder({ title: 'Flower' })
  folder3.addInput(params, 'maxRadius', { min: 0, max: 5, step: 0.1 })
  folder3.addInput(params, 'maxScale', { min: 0.5, max: 5, step: 0.1 })
  folder3.addInput(params, 'startRx', { min: 0.1, max: Math.PI, step: 0.1 })
  folder3.addInput(params, 'zOffsetCoef', { min: 0, max: 10, step: 0.25 })

  const folder4 = pane.addFolder({ title: 'Material' })
  folder4.addInput(mesh.material, 'metalness', { min: 0, max: 1, step: 0.01 })
  folder4.addInput(mesh.material, 'roughness', { min: 0, max: 1, step: 0.01 })

  onUnmounted(() => {
    pane.dispose()
  })

  renderer.onBeforeRender(() => {
    updateInstanceMatrix(mesh)
  })
})

function initMesh(mesh) {
  updateInstanceColor(mesh)
}

function randomColors(mesh) {
  params.color1 = chroma.random().hex()
  params.color2 = chroma.random().hex()
  updateInstanceColor(mesh)

  lightParams.value.color1 = chroma.random().hex()
  lightParams.value.color2 = chroma.random().hex()
}

function updateInstanceColor(mesh) {
  const cscale = chroma.scale([params.color1, params.color2])
  for (let i = 0; i < N1; i++) {
    for (let j = 0; j < N2; j++) {
      const n = i * N2 + j
      // mesh.setColorAt(n, new Color(cscale(n / NUM_INSTANCES).hex()))
      mesh.setColorAt(n, new Color(cscale(j / N2).hex()))
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
    // zOffset = params.zOffsetCoef * i
    zOffset = i * params.zOffsetCoef * Math.PI / N1
    r = tcoef * params.maxRadius
    scale = tcoef * params.maxScale
    for (let j = 0; j < N2; j++) {
      n = i * N2 + j
      // a = da * (j + zOffset)
      a = da * j + zOffset
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
