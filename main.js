// Util
function debounce(func, time, context) {
    var timeoutId
    return function() {
        clearTimeout(timeoutId)
        var args = arguments
        timeoutId = setTimeout(function() { func.apply(context, args) }, time)
    }
}

// Renderer setup
var renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') })
renderer.setPixelRatio(window.devicePixelRatio)
var camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0, 1000)
var clock = new THREE.Clock()

var w, h
var handleResize = function() {
    w = window.innerWidth
    h = window.innerHeight
    renderer.setSize(w, h)
    camera.left = -w/2
    camera.right = w/2
    camera.top = -h/2
    camera.bottom = h/2
    camera.zoom = Math.max(w, h)/700
    camera.updateProjectionMatrix()
}
handleResize() // once on load
window.addEventListener('resize', debounce(handleResize, 100)) // then on every resize

// Textures
var texLoader = new THREE.TextureLoader()
var loadTex = function(path) {
    var texture = texLoader.load(path)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.NearestFilter
    return texture
}
var tex = {
    wall: loadTex('texWall.jpg'),
    psych: loadTex('texPsych.jpg'),
    grid: loadTex('texGrid.png'),
}

// Fullscreen shader setup
var scene = new THREE.Scene()

var quadSize = 1000
var quadGeometry = new THREE.Geometry()
quadGeometry.vertices.push(new THREE.Vector3(0, 0, 0))
quadGeometry.vertices.push(new THREE.Vector3(quadSize, 0, 0))
quadGeometry.vertices.push(new THREE.Vector3(0, quadSize, 0))
quadGeometry.vertices.push(new THREE.Vector3(quadSize, quadSize, 0))
quadGeometry.faces.push(new THREE.Face3(0, 2, 3))
quadGeometry.faces.push(new THREE.Face3(0, 3, 1))
quadGeometry.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)])
quadGeometry.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(1, 0)])
quadGeometry.uvsNeedUpdate = true

var uniforms = {
    tex: { type: 't', value: tex.wall },
    time: { type: 'f', value: 0 },
    rotation: { type: 'f', value: 0 },

    iterations: { type: 'i', value: 32 },
    period: { type: 'f', value: 4 },
    offset: { type: 'f', value: 0.1 },
    amplitude: { type: 'f', value: 0.2 },
    morphphase: { type: 'f', value: 4 },
    colorphase: { type: 'f', value: 0 },
}

var quad = new THREE.Mesh(quadGeometry, new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vert').textContent,
    fragmentShader: document.getElementById('frag').textContent,
    uniforms: uniforms,
    depthWrite: false,
    depthTest: false,
}))
quad.position.x = -quadSize/2
quad.position.y = -quadSize/2
scene.add(quad)

var md = [false, false, false]
document.addEventListener('mousedown', (e) => md[e.button] = true)
document.addEventListener('mouseup', (e) => md[e.button] = false)
document.oncontextmenu = function(e) {
    e.preventDefault()
    return false
}

// Render loop
function render() {
    var dt = clock.getDelta()

    uniforms.time.value += dt
    uniforms.time.needsUpdate = true
    // uniforms.rotation.value += dt
    // uniforms.rotation.needsUpdate = true

    if (md[0]) {
        uniforms.morphphase.value += dt * 3
        uniforms.morphphase.needsUpdate = true
    }
    if (md[2]) {
        uniforms.colorphase.value += dt * 3
        uniforms.colorphase.needsUpdate = true
    }

    // camera.rotateZ(dt)

    renderer.render(scene, camera)
    requestAnimationFrame(render)
}
render()