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

// Fullscreen shader setup
var texLoader = new THREE.TextureLoader();
var scene = new THREE.Scene();

var uniforms = {
    tex: { type: 't', value: texLoader.load('texture.jpg') },
    time: { type: 'f', value: 0 },
    rotation: { type: 'f', value: 0 },
}

var quadSize = 1000
var quadGeometry = new THREE.Geometry();
quadGeometry.vertices.push(new THREE.Vector3(0, 0, 0))
quadGeometry.vertices.push(new THREE.Vector3(quadSize, 0, 0))
quadGeometry.vertices.push(new THREE.Vector3(0, quadSize, 0))
quadGeometry.vertices.push(new THREE.Vector3(quadSize, quadSize, 0))
quadGeometry.faces.push(new THREE.Face3(0, 2, 3))
quadGeometry.faces.push(new THREE.Face3(0, 3, 1))
quadGeometry.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)])
quadGeometry.faceVertexUvs[0].push([new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(1, 0)])
quadGeometry.uvsNeedUpdate = true

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

// Render loop
function render() {
    var dt = clock.getDelta()

    uniforms.time.value += dt
    uniforms.time.needsUpdate = true
    uniforms.rotation.value += dt
    uniforms.rotation.needsUpdate = true

    camera.rotateZ(dt)

    renderer.render(scene, camera)
    requestAnimationFrame(render)
}
render()