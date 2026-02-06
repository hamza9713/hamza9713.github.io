
// // Add this temporarily at the top of hate-speech-viz.js
// console.log('Script loaded, attempting to fetch:', window.location.origin + '/HS_analysis_3d.json');
// hate-speech-viz.js - Modern, Conflict-Free Version


(function() {
    'use strict';

    // Check if Three.js is available and at correct version
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded. Please include Three.js before this script.');
        return;
    }

    class HateSpeechBiasViz {
        constructor(containerId) {
            this.containerId = containerId;
            this.container = null;
            this.data = [];
            this.filteredData = [];
            
            // Three.js components - Use the global THREE object
            this.THREE = window.THREE;
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.raycaster = new this.THREE.Raycaster();
            this.mouse = new this.THREE.Vector2();
            this.clock = new this.THREE.Clock();
            
            // Visualization state
            this.currentView = 'manifold';
            this.showTrueLabels = true;
            this.highlightAmbiguous = false;
            this.selectedClasses = ['Hate Speech', 'Offensive', 'Neither'];
            this.animationRunning = true;
            
            // Visualization objects
            this.points = [];
            this.centroids = [];
            this.forceFields = [];
            this.particleSystems = [];
            this.tooltip = null;
            this.highlightedPoint = null;
            this.selectedPoint = null;
            this.interactionData = null;
            
            // Color palette with gradients
            this.colors = {
                'Hate Speech': { base: 0xFF6B6B, light: 0xFF9999, dark: 0xD95454 },
                'Offensive': { base: 0x4ECDC4, light: 0x7DE4DD, dark: 0x3AA59E },
                'Neither': { base: 0x45B7D1, light: 0x6FCEE6, dark: 0x3595B1 },
                'Misclassified': { base: 0xFFD166, light: 0xFFE0A3, dark: 0xFFC233 },
                'High Uncertainty': { base: 0x9B5DE5, light: 0xB28AEF, dark: 0x7D46B8 },
                'Ambient': 0x1E1E2E,
                'Grid': 0x2D2D44
            };
            
            // Interaction states
            this.isDragging = false;
            this.previousMouse = { x: 0, y: 0 };
            this.autoRotate = false;
            this.rotationSpeed = 0.0005;
            
            // Performance settings
            this.pointCount = 0;
            this.maxPoints = 5000;
            
            // Camera settings
            this.cameraDistance = 25;
            this.cameraTarget = new this.THREE.Vector3(0, 0, 0);
            
            // Transition animation
            this.transitionInProgress = false;
            this.transitionStartTime = 0;
            this.transitionDuration = 1000;
            this.originalPositions = new Map();
        }
        
        async init() {
            try {
                this.container = document.getElementById(this.containerId);
                if (!this.container) {
                    throw new Error(`Container ${this.containerId} not found`);
                }
                
                this.createTooltip();
                await this.loadData();
                this.initThreeJS();
                this.createVisualization();
                this.setupEventListeners();
                this.animate();
                this.updateUI();
                
                console.log('Hate Speech Visualization initialized successfully');
                
            } catch (error) {
                this.handleError(error);
            }
        }
        
        async loadData() {
            try {
                // Try multiple possible paths for the JSON file
                const possiblePaths = [
                    '/HS_analysis_3d.json',
                    './HS_analysis_3d.json',
                    window.location.origin + '/HS_analysis_3d.json'
                ];
                
                let response = null;
                for (const path of possiblePaths) {
                    try {
                        console.log(`Trying to load from: ${path}`);
                        response = await fetch(path);
                        if (response.ok) break;
                    } catch (e) {
                        console.log(`Failed to load from ${path}:`, e);
                        continue;
                    }
                }
                
                if (!response || !response.ok) {
                    throw new Error(`Failed to load data from any path. Ensure HS_analysis_3d.json exists.`);
                }
                
                this.data = await response.json();
                
                if (!Array.isArray(this.data) || this.data.length === 0) {
                    // Generate demo data if JSON is empty or invalid
                    console.warn('Invalid or empty data, generating demo data');
                    this.generateDemoData();
                } else {
                    // Process and normalize data
                    this.data = this.data.map((point, index) => ({
                        id: index,
                        original_text: point.original_text || `Text sample ${index}`,
                        true_label_name: point.true_label_name || 'Neither',
                        predicted_label_name: point.predicted_label_name || 'Neither',
                        position_3d: point.position_3d || [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
                        entropy: point.entropy || Math.random(),
                        probability_margin: point.probability_margin || Math.random(),
                        is_ambiguous_flag: point.is_ambiguous_flag || Math.random() > 0.7,
                        error_taxonomy_type: point.error_taxonomy_type || 'Unknown',
                        distance_to_hate_speech_centroid: point.distance_to_hate_speech_centroid || Math.random(),
                        distance_to_offensive_centroid: point.distance_to_offensive_centroid || Math.random(),
                        distance_to_neither_centroid: point.distance_to_neither_centroid || Math.random(),
                        confidence: point.confidence || Math.random(),
                        embeddings: point.embeddings || Array(10).fill(0).map(() => Math.random())
                    }));
                }
                
                // Limit points for performance
                if (this.data.length > this.maxPoints) {
                    console.warn(`Limiting data from ${this.data.length} to ${this.maxPoints} points for performance`);
                    this.data = this.data.slice(0, this.maxPoints);
                }
                
                this.filteredData = [...this.data];
                this.pointCount = this.data.length;
                console.log(`Loaded ${this.data.length} points`);
                
            } catch (error) {
                console.error('Load error:', error);
                this.generateDemoData();
                this.showError(`Using demo data. Ensure HS_analysis_3d.json is accessible. Error: ${error.message}`);
            }
        }
        
        generateDemoData() {
            // Generate realistic demo data
            const labels = ['Hate Speech', 'Offensive', 'Neither'];
            this.data = Array.from({ length: 1000 }, (_, index) => {
                const trueLabel = labels[Math.floor(Math.random() * 3)];
                const predictedLabel = Math.random() > 0.2 ? trueLabel : labels[Math.floor(Math.random() * 3)];
                
                return {
                    id: index,
                    original_text: `Sample text ${index} demonstrating hate speech detection patterns in algorithmic bias analysis.`,
                    true_label_name: trueLabel,
                    predicted_label_name: predictedLabel,
                    position_3d: [
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2
                    ],
                    entropy: Math.random(),
                    probability_margin: Math.random(),
                    is_ambiguous_flag: Math.random() > 0.8,
                    error_taxonomy_type: Math.random() > 0.7 ? 'Misclassification' : 'Correct',
                    distance_to_hate_speech_centroid: Math.random(),
                    distance_to_offensive_centroid: Math.random(),
                    distance_to_neither_centroid: Math.random(),
                    confidence: Math.random(),
                    embeddings: Array(10).fill(0).map(() => Math.random())
                };
            });
            
            this.filteredData = [...this.data];
            this.pointCount = this.data.length;
        }
        
        initThreeJS() {
            // Scene
            this.scene = new this.THREE.Scene();
            this.scene.background = new this.THREE.Color(this.colors.Ambient);
            
            // Camera
            this.camera = new this.THREE.PerspectiveCamera(
                60,
                this.container.clientWidth / this.container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, this.cameraDistance * 0.7, this.cameraDistance);
            
            // Renderer
            this.renderer = new this.THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
            this.container.appendChild(this.renderer.domElement);
            
            // Setup controls using orbit controls if available
            this.setupControls();
            this.setupLighting();
            this.createEnvironment();
        }
        
        setupControls() {
            // Check if OrbitControls is available
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.rotateSpeed = 0.5;
                this.controls.zoomSpeed = 0.8;
                this.controls.panSpeed = 0.5;
                this.controls.minDistance = 5;
                this.controls.maxDistance = 100;
            } else {
                // Fallback to simple controls
                this.setupSimpleControls();
            }
        }
        
        setupSimpleControls() {
            const onMouseDown = (e) => {
                this.isDragging = true;
                this.previousMouse = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            };
            
            const onMouseMove = (e) => {
                if (!this.isDragging) return;
                
                const deltaX = e.clientX - this.previousMouse.x;
                const deltaY = e.clientY - this.previousMouse.y;
                
                // Rotate camera around target
                const radius = this.camera.position.distanceTo(this.cameraTarget);
                const theta = Math.atan2(this.camera.position.z, this.camera.position.x);
                const phi = Math.acos(this.camera.position.y / radius);
                
                const newTheta = theta - deltaX * 0.01;
                const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.01));
                
                this.camera.position.x = radius * Math.sin(newPhi) * Math.cos(newTheta);
                this.camera.position.y = radius * Math.cos(newPhi);
                this.camera.position.z = radius * Math.sin(newPhi) * Math.sin(newTheta);
                this.camera.lookAt(this.cameraTarget);
                
                this.previousMouse = { x: e.clientX, y: e.clientY };
            };
            
            const onMouseUp = () => {
                this.isDragging = false;
            };
            
            const onWheel = (e) => {
                e.preventDefault();
                const delta = e.deltaY * 0.005;
                const direction = new this.THREE.Vector3();
                this.camera.getWorldDirection(direction);
                this.camera.position.addScaledVector(direction, delta);
            };
            
            this.renderer.domElement.addEventListener('mousedown', onMouseDown);
            this.renderer.domElement.addEventListener('mousemove', onMouseMove);
            this.renderer.domElement.addEventListener('mouseup', onMouseUp);
            this.renderer.domElement.addEventListener('wheel', onWheel);
            this.renderer.domElement.addEventListener('mouseleave', onMouseUp);
        }
        
        setupLighting() {
            // Ambient light
            const ambientLight = new this.THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);
            
            // Main directional light
            const directionalLight = new this.THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 20, 15);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            this.scene.add(directionalLight);
            
            // Colored point lights for each class
            const pointLight1 = new this.THREE.PointLight(this.colors['Hate Speech'].base, 0.4, 30);
            pointLight1.position.set(-10, 8, -10);
            this.scene.add(pointLight1);
            
            const pointLight2 = new this.THREE.PointLight(this.colors['Offensive'].base, 0.4, 30);
            pointLight2.position.set(10, 8, -10);
            this.scene.add(pointLight2);
            
            const pointLight3 = new this.THREE.PointLight(this.colors['Neither'].base, 0.4, 30);
            pointLight3.position.set(0, 8, 10);
            this.scene.add(pointLight3);
            
            // Hemisphere light for natural lighting
            const hemisphereLight = new this.THREE.HemisphereLight(0x4488AA, 0x002244, 0.3);
            this.scene.add(hemisphereLight);
        }
        
        createEnvironment() {
            // Grid
            const gridSize = 30;
            const gridDivisions = 30;
            const gridHelper = new this.THREE.GridHelper(gridSize, gridDivisions, this.colors.Grid, this.colors.Grid);
            gridHelper.position.y = -8;
            gridHelper.material.opacity = 0.2;
            gridHelper.material.transparent = true;
            this.scene.add(gridHelper);
            
            // Simple axes indicator
            const axesSize = 5;
            const axesMaterial = new this.THREE.LineBasicMaterial({ 
                vertexColors: true,
                linewidth: 2
            });
            
            const axesGeometry = new this.THREE.BufferGeometry();
            const axesVertices = new Float32Array([
                0, 0, 0, axesSize, 0, 0,  // X axis
                0, 0, 0, 0, axesSize, 0,  // Y axis
                0, 0, 0, 0, 0, axesSize   // Z axis
            ]);
            const axesColors = new Float32Array([
                1, 0, 0, 1, 0.5, 0.5,  // Red to light red (X)
                0, 1, 0, 0.5, 1, 0.5,  // Green to light green (Y)
                0, 0, 1, 0.5, 0.5, 1   // Blue to light blue (Z)
            ]);
            
            axesGeometry.setAttribute('position', new this.THREE.BufferAttribute(axesVertices, 3));
            axesGeometry.setAttribute('color', new this.THREE.BufferAttribute(axesColors, 3));
            
            const axes = new this.THREE.LineSegments(axesGeometry, axesMaterial);
            axes.position.y = -7;
            this.scene.add(axes);
        }
        
        createVisualization() {
            this.clearVisualization();
            
            switch(this.currentView) {
                case 'manifold':
                    this.createManifoldView();
                    break;
                case 'centroid':
                    this.createCentroidView();
                    break;
                case 'confusion':
                    this.createConfusionMatrix();
                    break;
            }
            
            this.updatePointCount();
        }
        
        createManifoldView() {
            const scale = 15;
            
            // Create instanced mesh for better performance
            const geometry = new this.THREE.SphereGeometry(0.3, 8, 8);
            const material = new this.THREE.MeshStandardMaterial({
                roughness: 0.4,
                metalness: 0.3,
                vertexColors: false
            });
            
            this.filteredData.forEach((dataPoint, i) => {
                let [x, y, z] = dataPoint.position_3d;
                x *= scale;
                y *= scale;
                z *= scale;
                
                const { color, size, emissiveIntensity } = this.getPointStyle(dataPoint);
                
                const pointGeometry = new this.THREE.SphereGeometry(size, 12, 12);
                const pointMaterial = new this.THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.3,
                    metalness: 0.5,
                    emissive: new this.THREE.Color(color),
                    emissiveIntensity: emissiveIntensity
                });
                
                const sphere = new this.THREE.Mesh(pointGeometry, pointMaterial);
                sphere.position.set(x, y, z);
                sphere.userData = { 
                    type: 'dataPoint', 
                    data: dataPoint, 
                    index: i,
                    originalPosition: [x, y, z]
                };
                
                // Save original position for animations
                this.originalPositions.set(sphere, sphere.position.clone());
                
                // Add subtle initial animation
                if (i < 100) { // Animate only first 100 for performance
                    sphere.scale.setScalar(0);
                    this.animatePointIn(sphere, i * 20);
                }
                
                this.scene.add(sphere);
                this.points.push(sphere);
            });
            
            this.createCentroids();
            this.createConnections();
        }
        
        createCentroids() {
            const positions = {
                'Hate Speech': new this.THREE.Vector3(-10, 5, -10),
                'Offensive': new this.THREE.Vector3(10, 5, -10),
                'Neither': new this.THREE.Vector3(0, 5, 10)
            };
            
            Object.entries(positions).forEach(([className, position]) => {
                const colorData = this.colors[className];
                const geometry = new this.THREE.SphereGeometry(1.5, 32, 32);
                const material = new this.THREE.MeshStandardMaterial({
                    color: colorData.base,
                    roughness: 0.1,
                    metalness: 0.9,
                    emissive: new this.THREE.Color(colorData.light),
                    emissiveIntensity: 0.3
                });
                
                const sphere = new this.THREE.Mesh(geometry, material);
                sphere.position.copy(position);
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                sphere.userData = { type: 'centroid', className: className };
                
                this.scene.add(sphere);
                this.centroids.push(sphere);
                
                // Create attractive force field
                this.createForceField(position, colorData.base, 10);
                
                // Create label
                this.createCentroidLabel(className, position);
            });
        }
        
        createForceField(position, color, radius) {
            const geometry = new this.THREE.SphereGeometry(radius, 32, 32);
            const material = new this.THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.03,
                side: this.THREE.BackSide,
                wireframe: true
            });
            
            const field = new this.THREE.Mesh(geometry, material);
            field.position.copy(position);
            this.scene.add(field);
            this.forceFields.push(field);
        }
        
        createCentroidLabel(className, position) {
            // Create HTML label
            const label = document.createElement('div');
            label.className = 'centroid-label';
            label.textContent = className;
            label.style.cssText = `
                position: absolute;
                color: white;
                background: rgba(0, 0, 0, 0.7);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                transform: translate(-50%, -50%);
                white-space: nowrap;
                z-index: 1000;
            `;
            
            // Create update function
            const updatePosition = () => {
                const vector = position.clone();
                vector.project(this.camera);
                
                const width = this.container.clientWidth;
                const height = this.container.clientHeight;
                
                const x = (vector.x * 0.5 + 0.5) * width;
                const y = (-vector.y * 0.5 + 0.5) * height;
                
                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
                label.style.display = vector.z > 1 ? 'none' : 'block';
            };
            
            this.container.appendChild(label);
            
            // Store for updates
            if (!this.labels) this.labels = [];
            this.labels.push({ element: label, update: updatePosition });
        }
        
        createConnections() {
            // Create connections between misclassified points and their true class centroid
            if (this.highlightAmbiguous) {
                this.filteredData.forEach((dataPoint, i) => {
                    if (dataPoint.is_ambiguous_flag || 
                        dataPoint.true_label_name !== dataPoint.predicted_label_name) {
                        
                        const point = this.points[i];
                        const className = dataPoint.true_label_name;
                        const centroid = this.centroids.find(c => c.userData.className === className);
                        
                        if (point && centroid) {
                            this.createConnectionLine(point.position, centroid.position, 0xFFFFFF, 0.3);
                        }
                    }
                });
            }
        }
        
        createConnectionLine(start, end, color, opacity) {
            const geometry = new this.THREE.BufferGeometry().setFromPoints([start, end]);
            const material = new this.THREE.LineBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: opacity,
                linewidth: 1
            });
            
            const line = new this.THREE.Line(geometry, material);
            this.scene.add(line);
            this.points.push(line); // Add to points for easy cleanup
        }
        
        getPointStyle(dataPoint) {
            let color, size = 0.3, emissiveIntensity = 0.1;
            
            if (this.highlightAmbiguous && dataPoint.is_ambiguous_flag) {
                color = this.colors['High Uncertainty'].base;
                size = 0.5;
                emissiveIntensity = 0.4;
            } else if (dataPoint.true_label_name !== dataPoint.predicted_label_name) {
                color = this.colors['Misclassified'].base;
                size = 0.4;
                emissiveIntensity = 0.3;
            } else {
                const label = this.showTrueLabels ? dataPoint.true_label_name : dataPoint.predicted_label_name;
                const colorData = this.colors[label];
                color = colorData ? colorData.base : 0x888888;
                emissiveIntensity = 0.2;
            }
            
            // Adjust size based on confidence
            size *= (0.5 + dataPoint.confidence * 0.5);
            
            return { color, size, emissiveIntensity };
        }
        
        createCentroidView() {
            this.createManifoldView();
            this.animatePointsToCentroids();
        }
        
        animatePointsToCentroids() {
            this.transitionInProgress = true;
            this.transitionStartTime = Date.now();
            
            // Store original positions
            this.points.forEach(point => {
                if (point.userData.type === 'dataPoint') {
                    this.originalPositions.set(point, point.position.clone());
                }
            });
        }
        
        createConfusionMatrix() {
            const matrixData = [
                { true: 'Hate Speech', predicted: 'Hate Speech', value: 120 },
                { true: 'Hate Speech', predicted: 'Offensive', value: 40 },
                { true: 'Hate Speech', predicted: 'Neither', value: 25 },
                { true: 'Offensive', predicted: 'Hate Speech', value: 35 },
                { true: 'Offensive', predicted: 'Offensive', value: 345 },
                { true: 'Offensive', predicted: 'Neither', value: 45 },
                { true: 'Neither', predicted: 'Hate Speech', value: 20 },
                { true: 'Neither', predicted: 'Offensive', value: 30 },
                { true: 'Neither', predicted: 'Neither', value: 210 }
            ];
            
            const spacing = 4;
            matrixData.forEach((item, index) => {
                const x = ((index % 3) - 1) * spacing;
                const z = (Math.floor(index / 3) - 1) * spacing;
                const height = Math.log(item.value + 1) * 0.3;
                
                const geometry = new this.THREE.BoxGeometry(2, height, 2);
                const isCorrect = item.true === item.predicted;
                const material = new this.THREE.MeshStandardMaterial({
                    color: isCorrect ? 0x96CEB4 : 0xFF6B6B,
                    roughness: 0.2,
                    metalness: 0.7,
                    emissive: isCorrect ? 0x96CEB4 : 0xFF6B6B,
                    emissiveIntensity: 0.1
                });
                
                const cube = new this.THREE.Mesh(geometry, material);
                cube.position.set(x, height / 2, z);
                cube.castShadow = true;
                cube.receiveShadow = true;
                cube.userData = { type: 'confusion', data: item };
                
                this.scene.add(cube);
                this.points.push(cube);
            });
        }
        
        createTooltip() {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'hate-speech-tooltip';
            this.tooltip.style.cssText = `
                position: fixed;
                background: rgba(20, 20, 30, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 15px;
                color: white;
                font-family: 'Inter', sans-serif;
                max-width: 350px;
                z-index: 10000;
                pointer-events: none;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                display: none;
                font-size: 14px;
            `;
            document.body.appendChild(this.tooltip);
        }
        
        setupEventListeners() {
            // Mouse events
            this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
            this.renderer.domElement.addEventListener('dblclick', (e) => this.onDoubleClick(e));
            
            // Touch events for mobile
            this.renderer.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
            this.renderer.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
            this.renderer.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e));
            
            // Window events
            window.addEventListener('resize', () => this.onResize());
            
            // Keyboard events
            document.addEventListener('keydown', (e) => this.onKeyDown(e));
            
            // Setup UI controls
            this.setupUIControls();
        }
        
        setupUIControls() {
            // View mode buttons
            document.querySelectorAll('.hate-control-btn[data-view]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.hate-control-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentView = btn.getAttribute('data-view');
                    document.getElementById('hate-viz-mode').textContent = this.currentView.toUpperCase();
                    this.createVisualization();
                });
            });
            
            // Filter buttons
            document.querySelectorAll('.hate-filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    btn.classList.toggle('active');
                    const className = btn.getAttribute('data-class');
                    
                    if (btn.classList.contains('active')) {
                        if (!this.selectedClasses.includes(className)) {
                            this.selectedClasses.push(className);
                        }
                    } else {
                        this.selectedClasses = this.selectedClasses.filter(c => c !== className);
                    }
                    
                    this.filterData();
                });
            });
            
            // Toggle buttons
            document.getElementById('toggle-true-labels')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTrueLabels = true;
                this.updateToggleButtons();
                this.createVisualization();
            });
            
            document.getElementById('toggle-predicted-labels')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTrueLabels = false;
                this.updateToggleButtons();
                this.createVisualization();
            });
            
            document.getElementById('toggle-ambiguous')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.highlightAmbiguous = !this.highlightAmbiguous;
                document.getElementById('toggle-ambiguous').classList.toggle('active', this.highlightAmbiguous);
                this.createVisualization();
            });
            
            // Reset view button
            const resetBtn = document.createElement('button');
            resetBtn.className = 'hate-control-btn';
            resetBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Reset View';
            resetBtn.addEventListener('click', () => this.resetView());
            document.querySelector('.hate-control-panel')?.appendChild(resetBtn);
        }
        
        onMouseMove(event) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.points);
            
            if (intersects.length > 0 && intersects[0].object.userData.data) {
                const object = intersects[0].object;
                this.showTooltip(object, event.clientX, event.clientY);
                
                if (this.highlightedPoint !== object) {
                    this.resetHighlight();
                    this.highlightedPoint = object;
                    object.scale.set(1.3, 1.3, 1.3);
                    
                    // Pulse effect
                    gsap.to(object.scale, {
                        x: 1.5,
                        y: 1.5,
                        z: 1.5,
                        duration: 0.5,
                        yoyo: true,
                        repeat: -1,
                        ease: "power1.inOut"
                    });
                }
            } else {
                this.hideTooltip();
                this.resetHighlight();
            }
        }
        
        onMouseClick(event) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.points);
            
            if (intersects.length > 0 && intersects[0].object.userData.data) {
                const data = intersects[0].object.userData.data;
                this.selectPoint(intersects[0].object);
                this.showDetailPanel(data);
            } else {
                this.deselectPoint();
            }
        }
        
        onDoubleClick(event) {
            // Reset camera position on double click
            this.resetView();
        }
        
        onTouchStart(event) {
            event.preventDefault();
            if (event.touches.length === 1) {
                this.isDragging = true;
                this.previousMouse = { 
                    x: event.touches[0].clientX, 
                    y: event.touches[0].clientY 
                };
            }
        }
        
        onTouchMove(event) {
            event.preventDefault();
            if (this.isDragging && event.touches.length === 1) {
                const deltaX = event.touches[0].clientX - this.previousMouse.x;
                const deltaY = event.touches[0].clientY - this.previousMouse.y;
                
                // Simple rotation
                this.camera.position.x -= deltaX * 0.01;
                this.camera.position.y += deltaY * 0.01;
                this.camera.lookAt(this.cameraTarget);
                
                this.previousMouse = { 
                    x: event.touches[0].clientX, 
                    y: event.touches[0].clientY 
                };
            }
        }
        
        onTouchEnd(event) {
            this.isDragging = false;
        }
        
        onKeyDown(event) {
            switch(event.key.toLowerCase()) {
                case 'm':
                    this.toggleViewMode();
                    break;
                case 'r':
                    this.resetView();
                    break;
                case 'a':
                    this.toggleAutoRotate();
                    break;
                case ' ':
                    this.toggleAnimation();
                    break;
                case 'escape':
                    this.deselectPoint();
                    break;
            }
        }
        
        toggleViewMode() {
            const modes = ['manifold', 'centroid', 'confusion'];
            const currentIndex = modes.indexOf(this.currentView);
            this.currentView = modes[(currentIndex + 1) % modes.length];
            this.createVisualization();
            this.updateUI();
        }
        
        toggleAutoRotate() {
            this.autoRotate = !this.autoRotate;
            this.showNotification(`Auto-rotate ${this.autoRotate ? 'enabled' : 'disabled'}`);
        }
        
        toggleAnimation() {
            this.animationRunning = !this.animationRunning;
            this.showNotification(`Animation ${this.animationRunning ? 'resumed' : 'paused'}`);
        }
        
        resetView() {
            if (this.controls) {
                this.controls.reset();
            } else {
                this.camera.position.set(0, this.cameraDistance * 0.7, this.cameraDistance);
                this.camera.lookAt(this.cameraTarget);
            }
            
            // Reset points to original positions
            this.points.forEach(point => {
                if (point.userData.type === 'dataPoint' && this.originalPositions.has(point)) {
                    const originalPos = this.originalPositions.get(point);
                    gsap.to(point.position, {
                        x: originalPos.x,
                        y: originalPos.y,
                        z: originalPos.z,
                        duration: 1,
                        ease: "power2.out"
                    });
                }
            });
        }
        
        selectPoint(object) {
            this.deselectPoint();
            this.selectedPoint = object;
            
            // Highlight selected point
            object.material.emissiveIntensity = 1;
            object.material.color = new this.THREE.Color(0xFFFFFF);
            
            // Create selection ring
            const ringGeometry = new this.THREE.RingGeometry(0.5, 0.6, 32);
            const ringMaterial = new this.THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                side: this.THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const ring = new this.THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(object.position);
            ring.position.y += 0.5;
            ring.rotation.x = -Math.PI / 2;
            this.scene.add(ring);
            this.selectedPoint.ring = ring;
            
            // Animate ring
            gsap.to(ring.rotation, {
                z: Math.PI * 2,
                duration: 4,
                repeat: -1,
                ease: "none"
            });
        }
        
        deselectPoint() {
            if (this.selectedPoint) {
                // Restore original material
                const data = this.selectedPoint.userData.data;
                const { color } = this.getPointStyle(data);
                this.selectedPoint.material.color.set(color);
                this.selectedPoint.material.emissiveIntensity = 0.2;
                
                // Remove ring
                if (this.selectedPoint.ring) {
                    this.scene.remove(this.selectedPoint.ring);
                    this.selectedPoint.ring.geometry.dispose();
                    this.selectedPoint.ring.material.dispose();
                }
                
                this.selectedPoint = null;
                
                // Hide detail panel
                const detailPanel = document.querySelector('.detail-panel');
                if (detailPanel) detailPanel.style.display = 'none';
            }
        }
        
        showTooltip(object, x, y) {
            const data = object.userData.data;
            if (!data) return;
            
            const isCorrect = data.true_label_name === data.predicted_label_name;
            const label = this.showTrueLabels ? data.true_label_name : data.predicted_label_name;
            const labelClass = label.replace(' ', '-').toLowerCase();
            
            this.tooltip.innerHTML = `
                <div class="tooltip-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span class="tooltip-class ${labelClass}" style="padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; background: ${labelClass === 'hate-speech' ? 'rgba(255,107,107,0.2)' : labelClass === 'offensive' ? 'rgba(78,205,196,0.2)' : 'rgba(69,183,209,0.2)'}; color: ${labelClass === 'hate-speech' ? '#FF6B6B' : labelClass === 'offensive' ? '#4ECDC4' : '#45B7D1'};">${label}</span>
                    <span class="tooltip-status ${isCorrect ? 'correct' : 'incorrect'}" style="font-size: 12px; padding: 4px 8px; border-radius: 6px; background: ${isCorrect ? 'rgba(150,206,180,0.2)' : 'rgba(255,209,102,0.2)'}; color: ${isCorrect ? '#96CEB4' : '#FFD166'};">${isCorrect ? '✓ Correct' : '✗ Misclassified'}</span>
                </div>
                <div class="tooltip-text" style="font-size: 13px; color: #8a8f9c; line-height: 1.4; margin-bottom: 15px;">${data.original_text.substring(0, 100)}...</div>
                <div class="tooltip-metrics" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div class="metric">
                        <div class="metric-label" style="font-size: 11px; color: #8a8f9c; margin-bottom: 2px;">Confidence</div>
                        <div class="metric-value" style="font-size: 13px; color: white; font-family: monospace;">${(data.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label" style="font-size: 11px; color: #8a8f9c; margin-bottom: 2px;">Entropy</div>
                        <div class="metric-value" style="font-size: 13px; color: white; font-family: monospace;">${data.entropy.toFixed(3)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label" style="font-size: 11px; color: #8a8f9c; margin-bottom: 2px;">Class</div>
                        <div class="metric-value" style="font-size: 13px; color: white; font-family: monospace;">${data.true_label_name}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label" style="font-size: 11px; color: #8a8f9c; margin-bottom: 2px;">Predicted</div>
                        <div class="metric-value" style="font-size: 13px; color: white; font-family: monospace;">${data.predicted_label_name}</div>
                    </div>
                </div>
            `;
            
            this.tooltip.style.left = `${x + 15}px`;
            this.tooltip.style.top = `${y - 15}px`;
            this.tooltip.style.display = 'block';
        }
        
        hideTooltip() {
            if (this.tooltip) this.tooltip.style.display = 'none';
        }
        
        resetHighlight() {
            if (this.highlightedPoint) {
                gsap.killTweensOf(this.highlightedPoint.scale);
                this.highlightedPoint.scale.set(1, 1, 1);
                
                // Restore original color
                if (this.highlightedPoint.userData.data) {
                    const data = this.highlightedPoint.userData.data;
                    const { color } = this.getPointStyle(data);
                    this.highlightedPoint.material.color.set(color);
                }
                
                this.highlightedPoint = null;
            }
        }
        
        showDetailPanel(data) {
            const detailPanel = document.querySelector('.detail-panel') || this.createDetailPanel();
            
            detailPanel.innerHTML = `
                <div class="detail-header" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.2rem;">Text Analysis</h3>
                    <div class="detail-class-badges" style="display: flex; gap: 10px;">
                        <div class="class-badge true ${data.true_label_name.replace(' ', '-').toLowerCase()}" style="padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; background: rgba(255,255,255,0.1); color: white; border-left: 3px solid ${data.true_label_name === 'Hate Speech' ? '#FF6B6B' : data.true_label_name === 'Offensive' ? '#4ECDC4' : '#45B7D1'};">True: ${data.true_label_name}</div>
                        <div class="class-badge predicted ${data.predicted_label_name.replace(' ', '-').toLowerCase()}" style="padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; background: rgba(255,255,255,0.05); color: #8a8f9c; border-left: 3px solid ${data.predicted_label_name === 'Hate Speech' ? '#FF6B6B' : data.predicted_label_name === 'Offensive' ? '#4ECDC4' : '#45B7D1'};">Predicted: ${data.predicted_label_name}</div>
                    </div>
                </div>
                <div class="detail-text" style="margin-bottom: 20px;">
                    <p style="margin: 0; color: #8a8f9c; font-size: 14px; line-height: 1.5;">${data.original_text}</p>
                </div>
                <div class="detail-metrics" style="margin-bottom: 20px;">
                    <div class="metric-row" style="display: flex; gap: 15px; margin-bottom: 20px;">
                        <div class="metric-card" style="flex: 1; background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px;">
                            <div class="metric-title" style="font-size: 12px; color: #8a8f9c; margin-bottom: 5px;">Confidence</div>
                            <div class="metric-value" style="font-size: 1.5rem; font-weight: 700; color: white; font-family: monospace; margin-bottom: 10px;">${(data.confidence * 100).toFixed(1)}%</div>
                            <div class="metric-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                <div class="metric-fill" style="height: 100%; background: #4ECDC4; border-radius: 2px; width: ${data.confidence * 100}%;"></div>
                            </div>
                        </div>
                        <div class="metric-card" style="flex: 1; background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px;">
                            <div class="metric-title" style="font-size: 12px; color: #8a8f9c; margin-bottom: 5px;">Entropy</div>
                            <div class="metric-value" style="font-size: 1.5rem; font-weight: 700; color: white; font-family: monospace; margin-bottom: 10px;">${data.entropy.toFixed(3)}</div>
                            <div class="metric-bar" style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                <div class="metric-fill entropy" style="height: 100%; background: #FF6B6B; border-radius: 2px; width: ${Math.min(data.entropy * 100, 100)}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="distance-metrics" style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: white; font-size: 14px;">Distance to Centroids</h4>
                    <div class="distance-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div class="distance-label hate-speech" style="font-size: 13px; color: #FF6B6B;">Hate Speech</div>
                        <div class="distance-value" style="font-size: 13px; color: white; font-family: monospace;">${data.distance_to_hate_speech_centroid.toFixed(3)}</div>
                    </div>
                    <div class="distance-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div class="distance-label offensive" style="font-size: 13px; color: #4ECDC4;">Offensive</div>
                        <div class="distance-value" style="font-size: 13px; color: white; font-family: monospace;">${data.distance_to_offensive_centroid.toFixed(3)}</div>
                    </div>
                    <div class="distance-row" style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <div class="distance-label neither" style="font-size: 13px; color: #45B7D1;">Neither</div>
                        <div class="distance-value" style="font-size: 13px; color: white; font-family: monospace;">${data.distance_to_neither_centroid.toFixed(3)}</div>
                    </div>
                </div>
            `;
            
            detailPanel.style.display = 'block';
            
            // Animate in
            gsap.fromTo(detailPanel, 
                { opacity: 0, y: 20 }, 
                { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
            );
        }
        
        createDetailPanel() {
            const panel = document.createElement('div');
            panel.className = 'detail-panel';
            panel.style.cssText = `
                position: absolute;
                bottom: 20px;
                left: 20px;
                width: 400px;
                max-height: 300px;
                background: rgba(20, 20, 30, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 10;
                overflow-y: auto;
                display: none;
            `;
            this.container.appendChild(panel);
            return panel;
        }
        
        onResize() {
            if (!this.camera || !this.renderer) return;
            
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            
            // Update label positions
            if (this.labels) {
                this.labels.forEach(label => label.update());
            }
        }
        
        animate() {
            if (!this.animationRunning) {
                requestAnimationFrame(() => this.animate());
                return;
            }
            
            const delta = this.clock.getDelta();
            const time = this.clock.elapsedTime;
            
            // Auto-rotate camera
            if (this.autoRotate) {
                this.camera.position.x = Math.cos(time * this.rotationSpeed) * this.cameraDistance;
                this.camera.position.z = Math.sin(time * this.rotationSpeed) * this.cameraDistance;
                this.camera.lookAt(this.cameraTarget);
            }
            
            // Animate centroids
            this.centroids.forEach((centroid, index) => {
                const pulse = Math.sin(time * 2 + index) * 0.1 + 1;
                centroid.scale.setScalar(pulse);
                
                // Gentle floating animation
                centroid.position.y = 5 + Math.sin(time * 1.5 + index) * 0.5;
            });
            
            // Animate force fields
            this.forceFields.forEach((field, index) => {
                field.rotation.y += delta * 0.5;
                const pulse = Math.sin(time * 1.5 + index) * 0.02 + 1;
                field.scale.setScalar(pulse);
            });
            
            // Handle point transitions
            if (this.transitionInProgress) {
                const elapsed = Date.now() - this.transitionStartTime;
                const progress = Math.min(elapsed / this.transitionDuration, 1);
                
                this.points.forEach(point => {
                    if (point.userData.type === 'dataPoint') {
                        const originalPos = this.originalPositions.get(point);
                        const data = point.userData.data;
                        const className = this.currentView === 'centroid' ? data.true_label_name : data.predicted_label_name;
                        const centroid = this.centroids.find(c => c.userData.className === className);
                        
                        if (centroid && originalPos) {
                            const targetPos = this.currentView === 'centroid' ? 
                                centroid.position.clone().multiplyScalar(0.7) : 
                                originalPos;
                            
                            point.position.lerpVectors(originalPos, targetPos, progress);
                        }
                    }
                });
                
                if (progress >= 1) {
                    this.transitionInProgress = false;
                }
            }
            
            // Update controls if available
            if (this.controls) {
                this.controls.update();
            }
            
            // Update labels
            if (this.labels) {
                this.labels.forEach(label => label.update());
            }
            
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(() => this.animate());
        }
        
        animatePointIn(point, delay) {
            setTimeout(() => {
                gsap.to(point.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    duration: 0.5,
                    ease: "back.out(1.7)"
                });
                
                // Add floating animation
                const originalY = point.position.y;
                const float = () => {
                    if (!point.userData) return;
                    point.position.y = originalY + Math.sin(Date.now() * 0.001 + point.userData.index) * 0.3;
                };
                
                point.userData.float = float;
            }, delay);
        }
        
        clearVisualization() {
            // Remove all objects from scene
            [...this.points, ...this.centroids, ...this.forceFields].forEach(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
                this.scene.remove(obj);
            });
            
            this.points = [];
            this.centroids = [];
            this.forceFields = [];
            
            // Clear labels
            if (this.labels) {
                this.labels.forEach(label => label.element.remove());
                this.labels = [];
            }
        }
        
        updateUI() {
            this.updatePointCount();
            const modeElement = document.getElementById('hate-viz-mode');
            if (modeElement) {
                modeElement.textContent = this.currentView.toUpperCase();
            }
            this.updateToggleButtons();
        }
        
        updateToggleButtons() {
            const trueBtn = document.getElementById('toggle-true-labels');
            const predictedBtn = document.getElementById('toggle-predicted-labels');
            
            if (trueBtn) trueBtn.classList.toggle('active', this.showTrueLabels);
            if (predictedBtn) predictedBtn.classList.toggle('active', !this.showTrueLabels);
        }
        
        filterData() {
            this.filteredData = this.data.filter(point => 
                this.selectedClasses.includes(point.true_label_name)
            );
            this.createVisualization();
        }
        
        updatePointCount() {
            const countElement = document.getElementById('hate-point-count');
            if (countElement) {
                countElement.textContent = this.filteredData.length;
            }
        }
        
        showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 107, 107, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                max-width: 400px;
                z-index: 1000;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            `;
            errorDiv.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">⚠️ Error Loading Visualization</h3>
                <p style="margin: 0; font-size: 14px;">${message}</p>
            `;
            this.container.appendChild(errorDiv);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
        
        showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(78, 205, 196, 0.9);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 14px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(0)';
            }, 10);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
        
        handleError(error) {
            console.error('Visualization Error:', error);
            this.showError(error.message || 'An unexpected error occurred');
        }
        
        destroy() {
            // Stop animation loop
            this.animationRunning = false;
            
            // Dispose Three.js resources
            if (this.renderer) {
                this.renderer.dispose();
                if (this.container && this.renderer.domElement.parentNode === this.container) {
                    this.container.removeChild(this.renderer.domElement);
                }
            }
            
            // Remove tooltip
            if (this.tooltip && this.tooltip.parentNode) {
                this.tooltip.parentNode.removeChild(this.tooltip);
            }
            
            // Remove labels
            if (this.labels) {
                this.labels.forEach(label => {
                    if (label.element.parentNode) {
                        label.element.parentNode.removeChild(label.element);
                    }
                });
            }
            
            // Clear visualization
            this.clearVisualization();
            
            // Dispose controls
            if (this.controls) {
                this.controls.dispose();
            }
            
            // Remove event listeners
            window.removeEventListener('resize', this.onResize);
            document.removeEventListener('keydown', this.onKeyDown);
            
            console.log('Hate Speech Visualization destroyed');
        }
    }

    // Modal Management
    document.addEventListener('DOMContentLoaded', function() {
        let hateSpeechViz = null;
        
        function openHateSpeechModal() {
            const modal = document.getElementById('hate-speech-modal');
            const overlay = document.getElementById('hate-speech-overlay');
            
            if (modal && overlay) {
                modal.classList.add('active');
                overlay.classList.add('active');
                
                // Prevent body scroll
                document.body.style.overflow = 'hidden';
                
                // Initialize visualization after a small delay
                setTimeout(async () => {
                    try {
                        hateSpeechViz = new HateSpeechBiasViz('hate-speech-3d-canvas');
                        await hateSpeechViz.init();
                        
                        // Add hotkey instructions
                        const hotkeyInfo = document.createElement('div');
                        hotkeyInfo.className = 'hotkey-info';
                        hotkeyInfo.style.cssText = `
                            position: absolute;
                            bottom: 60px;
                            right: 20px;
                            background: rgba(20, 20, 30, 0.8);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            border-radius: 8px;
                            padding: 10px;
                            color: #8a8f9c;
                            font-size: 12px;
                            z-index: 10;
                        `;
                        hotkeyInfo.innerHTML = `
                            <div><kbd>M</kbd> Change View</div>
                            <div><kbd>R</kbd> Reset View</div>
                            <div><kbd>A</kbd> Auto-rotate</div>
                            <div><kbd>Space</kbd> Pause/Resume</div>
                        `;
                        document.querySelector('.hate-viz-container')?.appendChild(hotkeyInfo);
                        
                    } catch (error) {
                        console.error('Failed to initialize visualization:', error);
                    }
                }, 100);
            }
        }
        
        function closeHateSpeechModal() {
            const modal = document.getElementById('hate-speech-modal');
            const overlay = document.getElementById('hate-speech-overlay');
            
            if (modal) modal.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            if (hateSpeechViz) {
                hateSpeechViz.destroy();
                hateSpeechViz = null;
            }
        }
        
        // Event listeners for modal
        document.addEventListener('click', function(e) {
            if (e.target.closest('.hate-speech-viz-btn')) {
                e.preventDefault();
                openHateSpeechModal();
            }
            
            if (e.target.closest('#hate-speech-close-btn') || 
                e.target.id === 'hate-speech-overlay') {
                closeHateSpeechModal();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('hate-speech-modal')?.classList.contains('active')) {
                closeHateSpeechModal();
            }
        });
        
        // Close modal when clicking outside (on overlay)
        document.getElementById('hate-speech-overlay')?.addEventListener('click', function(e) {
            if (e.target === this) {
                closeHateSpeechModal();
            }
        });
        
        console.log('Hate Speech Visualization Module Loaded');
    });

    // Make class available globally
    window.HateSpeechBiasViz = HateSpeechBiasViz;
})();