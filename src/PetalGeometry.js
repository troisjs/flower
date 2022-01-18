import { ExtrudeGeometry, Shape } from 'three'
import { BufferGeometry } from 'troisjs'

export default {
  extends: BufferGeometry,
  methods: {
    createGeometry() {
      this.geometry = createPetal({

      })
    }
  }
}

function createPetal({ length = 1, dx = 0.4, dy = 0.8 }) {
  const sp = [0, 0]
  const cp1 = [dx, dy]
  const cp2 = [-dx, dy]
  const ep = [0, length]

  const shape = new Shape()
  shape.moveTo(sp[0], sp[1])
  shape.quadraticCurveTo(cp1[0], cp1[1], ep[0], ep[1])
  shape.quadraticCurveTo(cp2[0], cp2[1], sp[0], sp[1])
  const geometry = new ExtrudeGeometry(shape, {
    steps: 1,
    depth: 0.005,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.01,
    bevelOffset: 0,
    bevelSegments: 10
  })
  return geometry
}
