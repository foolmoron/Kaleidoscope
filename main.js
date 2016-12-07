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
    morphphase: { type: 'f', value: 0 },
    colorphase: { type: 'f', value: 0 },
}
var prevUniforms = {} // for diffing

var uniformsExtras = {
    texName: 'wall',
    advanceTime: true,
    morphphaseVelocity: 0.1,
    colorphaseVelocity: 1,
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

// Render loop
function render() {
    var dt = clock.getDelta()

    uniforms.tex.value = tex[uniformsExtras.texName]
    uniforms.time.value += (uniformsExtras.advanceTime) ? dt : 0
    uniforms.morphphase.value = (uniforms.morphphase.value + dt * uniformsExtras.morphphaseVelocity + 2*Math.PI) % (2*Math.PI)
    uniforms.colorphase.value = (uniforms.colorphase.value + dt * uniformsExtras.colorphaseVelocity + 2*Math.PI) % (2*Math.PI)

    // camera.rotateZ(dt)

    // check uniform diffs
    for (key in uniforms) {
        if (uniforms[key].value !== prevUniforms[key]) {
            uniforms[key].needsUpdate = true
        }
        prevUniforms[key] = uniforms[key].value
    }

    renderer.render(scene, camera)
    requestAnimationFrame(render)
}

// Init
window.onload = function() {
    // GUI
    var gui = new dat.GUI()

    gui.remember(uniformsExtras, uniforms.time, uniforms.iterations, uniforms.period, uniforms.offset, uniforms.amplitude, uniforms.morphphase, uniforms.colorphase)
    setTimeout(() => { // force dat.gui local storage saving
        var checkbox = document.getElementById('dg-local-storage')
        if (!checkbox.getAttribute('checked')) {
            checkbox.click()
        }
    }, 0)
    
    var fProps = gui.addFolder('Pulsation')
    fProps.open()
    fProps.add(uniformsExtras, 'texName', { Wall: 'wall', Psych: 'psych', Grid: 'grid' })
        .name('Texture')
    fProps.add(uniformsExtras, 'advanceTime')
        .name('Advance Time')
    fProps.add(uniforms.time, 'value')
        .name('Time')
        .min(0)
        .step(0.1)
        .listen()
    fProps.add(uniforms.iterations, 'value')
        .name('Iterations')
        .min(1)
        .max(64)
    fProps.add(uniforms.period, 'value')
        .name('Period')
        .min(0)
        .max(10)
        .step(0.01)
    fProps.add(uniforms.amplitude, 'value')
        .name('Amplitude')
        .min(0)
        .max(1)
        .step(0.01)
    fProps.add(uniforms.offset, 'value')
        .name('Amplitude Offset')
        .min(-0.4)
        .max(0.4)
        .step(0.01)

    var fMorph = gui.addFolder('Morph')
    fMorph.open()
    fMorph.add(uniforms.morphphase, 'value')
        .name('Phase')
        .min(0)
        .max(2*Math.PI)
        .step(0.01)
        .listen()
    fMorph.add(uniformsExtras, 'morphphaseVelocity')
        .name('Velocity')
        .min(-0.3*Math.PI)
        .max(0.3*Math.PI)
        .step(0.01)

    var fColor = gui.addFolder('Color')
    fColor.open()
    fColor.add(uniforms.colorphase, 'value')
        .name('Phase')
        .min(0)
        .max(2*Math.PI)
        .step(0.01)
        .listen()
    fColor.add(uniformsExtras, 'colorphaseVelocity')
        .name('Velocity')
        .min(-3*Math.PI)
        .max(3*Math.PI)
        .step(0.01)

    // render
    render()
}