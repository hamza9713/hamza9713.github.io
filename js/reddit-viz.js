// reddit-viz.js - Complete Reddit Network Visualization
// ========== GLOBAL VARIABLES ==========
let networkViz = null;

// ========== REDDIT NETWORK VISUALIZATION CLASS ==========
class RedditNetworkViz {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Visualization states
        this.currentView = 'network'; // 'network', 'topography', 'galaxy', 'multiples'
        this.activeSubreddit = null;
        this.activeFilter = null;
        this.showInsights = true;
        this.isAnimating = false;
        
        // Visualization objects
        this.discourseTopography = null;
        this.semanticGalaxy = null;
        this.nodeGroups = [];
        this.particlesData = [];
        this.connectionLines = [];
        this.insightCallouts = [];
        this.tooltip = null;
        this.controlsPanel = null;
        
        // Color palette - modern vibrant colors
        this.colorPalette = {
            relationships: { primary: 0xFF6B6B, secondary: 0xFF8E8E },
            Conservative: { primary: 0x4ECDC4, secondary: 0x88D3CE },
            Libertarian: { primary: 0x45B7D1, secondary: 0x79C4DE },
            MensRights: { primary: 0x96CEB4, secondary: 0xB0DBC4 },
            Feminism: { primary: 0xFFD166, secondary: 0xFFDA8A },
            politics: { primary: 0x9B5DE5, secondary: 0xB583EC },
            AmItheAsshole: { primary: 0x00BBF9, secondary: 0x4DC9F8 }
        };

        // Initialize data
        this.initializeData();
    }
    
    // Data loading method - updated to load from your JSON file
    async loadData() {
        try {
            // Try to load the data file
            const response = await fetch('data/reddit_network_summary.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.networkData = await response.json();
            console.log('Network data loaded successfully:', this.networkData);
            
            // Process the loaded data if needed
            this.processLoadedData();
        } catch (error) {
            console.error('Error loading data:', error);
            console.log('Using embedded data as fallback');
            // We'll use the embedded data as fallback
        }
    }
    
    processLoadedData() {
        // If you want to use your JSON data instead of hardcoded data,
        // you would process it here
        console.log('Processing loaded data...');
        
        // Example: Extract metrics from your JSON structure
        // This is where you would map your JSON structure to the format expected by the visualization
        // For now, we'll keep using the hardcoded data
    }
    
    initializeData() {
        // Use hardcoded data as base - this ensures visualization works even if JSON loading fails
        this.subredditData = [
            { 
                name: 'r/relationships', 
                nodes: 260, 
                edges: 257, 
                density: 0.003816,
                avgDegree: 0.006178,
                degreeCentralization: 0.102324, 
                pagerankCentralization: 0.088791,
                modularity: 0.911705, 
                communities: 61,
                sentimentScore: 0.04,
                color: this.colorPalette.relationships.primary,
                secondaryColor: this.colorPalette.relationships.secondary,
                dominantUsers: [
                    { user: 'Professional_Grab313', power: 0.0516, sentiment: -0.0716 },
                    { user: 'ssugarliciouss', power: 0.0441, sentiment: 0.1360 },
                    { user: 'classicicedtea', power: 0.0413, sentiment: 0.0643 }
                ],
                keyPhrases: ['sound like', 'feel like', 'dont know', 'dont think', 'make feel'],
                position: { x: -20, y: 5, z: 0 },
                description: "Highest centralization with star-like structure"
            },
            { 
                name: 'r/Conservative', 
                nodes: 302, 
                edges: 387, 
                density: 0.004257,
                avgDegree: 0.007305,
                degreeCentralization: 0.066004, 
                pagerankCentralization: 0.039092,
                modularity: 0.763636, 
                communities: 39,
                sentimentScore: 0.02,
                color: this.colorPalette.Conservative.primary,
                secondaryColor: this.colorPalette.Conservative.secondary,
                dominantUsers: [
                    { user: 'Hectoriu', power: 0.0740, sentiment: 0.0853 },
                    { user: 'triggernaut', power: 0.0733, sentiment: 0.0667 },
                    { user: 'mahvel50', power: 0.0669, sentiment: -0.0881 }
                ],
                keyPhrases: ['insurance company', 'health insurance', 'look like', 'day care'],
                position: { x: -10, y: -8, z: 12 },
                description: "Moderate centralization with cohesive discourse"
            },
            { 
                name: 'r/Libertarian', 
                nodes: 404, 
                edges: 525, 
                density: 0.003225,
                avgDegree: 0.005024,
                degreeCentralization: 0.044714, 
                pagerankCentralization: 0.020562,
                modularity: 0.849239, 
                communities: 56,
                sentimentScore: 0.08,
                color: this.colorPalette.Libertarian.primary,
                secondaryColor: this.colorPalette.Libertarian.secondary,
                dominantUsers: [
                    { user: 'yzkv_7', power: 0.0675, sentiment: 0.0637 },
                    { user: 'BringBackUsenet', power: 0.0670, sentiment: 0.0761 },
                    { user: 'sheep5555', power: 0.0636, sentiment: -0.0224 }
                ],
                keyPhrases: ['dont care', 'dont think', 'free market', 'dont want'],
                position: { x: 0, y: 15, z: -8 },
                description: "Distributed influence with positive sentiment correlation"
            },
            { 
                name: 'r/MensRights', 
                nodes: 318, 
                edges: 495, 
                density: 0.004910,
                avgDegree: 0.007718,
                degreeCentralization: 0.099852, 
                pagerankCentralization: 0.014842,
                modularity: 0.728055, 
                communities: 43,
                sentimentScore: 0.04,
                color: this.colorPalette.MensRights.primary,
                secondaryColor: this.colorPalette.MensRights.secondary,
                dominantUsers: [
                    { user: '63daddy', power: 0.1094, sentiment: 0.1223 },
                    { user: 'thelucklessking', power: 0.0958, sentiment: 0.0904 },
                    { user: 'SidewaysGiraffe', power: 0.0934, sentiment: 0.0653 }
                ],
                keyPhrases: ['men woman', 'woman men', 'men right', 'men dont'],
                position: { x: 12, y: 0, z: 10 },
                description: "Low modularity - unified echo-chamber structure"
            },
            { 
                name: 'r/Feminism', 
                nodes: 322, 
                edges: 357, 
                density: 0.003454,
                avgDegree: 0.005515,
                degreeCentralization: 0.044468, 
                pagerankCentralization: 0.014148,
                modularity: 0.905694, 
                communities: 80,
                sentimentScore: 0.00,
                color: this.colorPalette.Feminism.primary,
                secondaryColor: this.colorPalette.Feminism.secondary,
                dominantUsers: [
                    { user: 'VivaSiciliani', power: 0.0622, sentiment: -0.0255 },
                    { user: 'hadenoughoverit336', power: 0.0542, sentiment: 0.1083 },
                    { user: 'uuuuuummmmm_actually', power: 0.0512, sentiment: -0.0586 }
                ],
                keyPhrases: ['drag queen', 'dont think', 'feel like', 'trans woman'],
                position: { x: 20, y: -10, z: -6 },
                description: "High modularity - fragmented but egalitarian discourse"
            },
            { 
                name: 'r/politics', 
                nodes: 3533, 
                edges: 4607, 
                density: 0.000369,
                avgDegree: 0.000660,
                degreeCentralization: 0.033891, 
                pagerankCentralization: 0.012721,
                modularity: 0.836382, 
                communities: 223,
                sentimentScore: -0.15,
                color: this.colorPalette.politics.primary,
                secondaryColor: this.colorPalette.politics.secondary,
                dominantUsers: [
                    { user: 'No-Post4444', power: 0.0908, sentiment: -0.0132 },
                    { user: 'Ancient_Popcorn', power: 0.0852, sentiment: -0.0296 },
                    { user: 'B-Z_B-S', power: 0.0815, sentiment: -0.0319 }
                ],
                keyPhrases: ['epstein file', 'dont know', 'dont think', 'gon na'],
                position: { x: -8, y: 12, z: -12 },
                description: "Massive scale with pluralistic community structure"
            },
            { 
                name: 'r/AmItheAsshole', 
                nodes: 1742, 
                edges: 2160, 
                density: 0.000712,
                avgDegree: 0.001173,
                degreeCentralization: 0.040781, 
                pagerankCentralization: 0.0294,
                modularity: 0.9142, 
                communities: 218,
                sentimentScore: -0.03,
                color: this.colorPalette.AmItheAsshole.primary,
                secondaryColor: this.colorPalette.AmItheAsshole.secondary,
                dominantUsers: [
                    { user: 'Abba_Zaba_', power: 0.0519, sentiment: -0.0308 },
                    { user: 'witx', power: 0.0442, sentiment: 0.3000 },
                    { user: 'Solivagant0', power: 0.0431, sentiment: 0.0000 }
                ],
                keyPhrases: ['service dog', 'sound like', 'dont want', 'social medium'],
                position: { x: 10, y: 10, z: 15 },
                description: "Highly modular with diverse subcommunities"
            }
        ];
        
        // Initialize particles data
        this.particlesData = [];
        this.nodeGroups = [];
        this.connectionLines = [];
        this.insightCallouts = [];
    }
    
    // ========== INITIALIZATION ==========
    init() {
        const container = document.getElementById('reddit-3d-canvas');
        if (!container) {
            console.error('Canvas container not found!');
            return;
        }

        // Clear container
        container.innerHTML = '';
        
        // Create tooltip
        this.createTooltip(container);
        
        // Create controls panel
        this.createControlsPanel(container);
        
        // Setup Three.js scene
        this.setupScene(container);
        
        // Setup lighting
        this.setupLighting();
        
        // Create initial visualization
        this.switchView('network');
        
        // Create insight callouts
        setTimeout(() => this.createInsightCallouts(), 500);
        
        // Setup event listeners
        this.setupEventListeners(container);
        
        // Start animation loop
        this.startAnimation();
        
        // Populate UI
        this.populateDetailedUI();
        
        // Show onboarding tour
        setTimeout(() => this.showOnboardingTour(), 1500);
        
        console.log('Reddit Network Visualization initialized successfully!');
    }
    
    setupScene(container) {
        // Scene with gradient background
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f1116);
        this.scene.fog = new THREE.FogExp2(0x141820, 0.003);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 40, 80);
        
        // Renderer with WebGL
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.2;
            this.controls.maxDistance = 200;
            this.controls.minDistance = 20;
            this.controls.enablePan = true;
        }
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 50, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Accent lights
        const accentLight1 = new THREE.PointLight(this.colorPalette.relationships.primary, 0.3, 100);
        accentLight1.position.set(-20, 20, 0);
        this.scene.add(accentLight1);
        
        const accentLight2 = new THREE.PointLight(this.colorPalette.Libertarian.primary, 0.3, 100);
        accentLight2.position.set(20, 20, 0);
        this.scene.add(accentLight2);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
        rimLight.position.set(-30, -30, -30);
        this.scene.add(rimLight);
    }
    
    setupEventListeners(container) {
        window.addEventListener('resize', () => this.onWindowResize(container));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
    }
    
    // ========== NETWORK VISUALIZATION ==========
    createNetworkVisualization() {
        // Clear existing objects
        this.clearScene();
        
        const networkGroup = new THREE.Group();
        this.scene.add(networkGroup);
        
        // Create orbital rings
        this.createOrbitalRings(networkGroup);
        
        // Create subreddit clusters
        this.subredditData.forEach((subreddit, index) => {
            this.createSubredditCluster(subreddit, networkGroup, index);
        });
        
        // Create connections
        this.createNetworkConnections(networkGroup);
        
        // Add background particles
        this.createBackgroundParticles();
        
        console.log('Network visualization created');
    }
    
    createOrbitalRings(parent) {
        // Create 3 orbital rings for visual structure
        for (let i = 0; i < 3; i++) {
            const radius = 25 + i * 15;
            const ringGeometry = new THREE.RingGeometry(radius - 0.3, radius + 0.3, 128);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x8a8f9c,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2.3;
            ring.rotation.z = Math.PI / 6;
            parent.add(ring);
        }
    }
    
    createSubredditCluster(subreddit, parent, index) {
        const group = new THREE.Group();
        
        // Calculate size based on nodes
        const sizeMultiplier = Math.log10(subreddit.nodes) * 0.5 + 1;
        const coreSize = Math.max(2, sizeMultiplier);
        
        // Main core
        const coreGeometry = new THREE.IcosahedronGeometry(coreSize, 2);
        const coreMaterial = new THREE.MeshPhysicalMaterial({
            color: subreddit.color,
            roughness: 0.4,
            metalness: 0.3,
            emissive: new THREE.Color(subreddit.color),
            emissiveIntensity: 0.3,
            clearcoat: 0.2,
            clearcoatRoughness: 0.3
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.castShadow = true;
        core.receiveShadow = true;
        core.userData = { 
            type: 'subreddit', 
            data: subreddit,
            originalScale: new THREE.Vector3(1, 1, 1)
        };
        
        // Pulsing animation
        const pulseScale = 1 + Math.sin(Date.now() * 0.001 + index) * 0.05;
        core.scale.setScalar(pulseScale);
        group.add(core);
        
        // Create orbiting particles
        this.createOrbitingParticles(subreddit, group, coreSize);
        
        // Position the cluster
        group.position.set(
            subreddit.position.x,
            subreddit.position.y,
            subreddit.position.z
        );
        
        parent.add(group);
        
        // Store reference
        this.nodeGroups.push({
            group,
            subreddit,
            core,
            originalScale: core.scale.clone()
        });
    }
    
    createOrbitingParticles(subreddit, parent, coreSize) {
        const particleCount = Math.min(Math.floor(subreddit.nodes / 10), 150);
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const baseColor = new THREE.Color(subreddit.color);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Orbital position
            const radius = 8 + subreddit.degreeCentralization * 20;
            const angle = (i / particleCount) * Math.PI * 2;
            const height = (Math.random() - 0.5) * 6;
            
            positions[i3] = radius * Math.cos(angle);
            positions[i3 + 1] = height;
            positions[i3 + 2] = radius * Math.sin(angle);
            
            // Color variation
            const colorVariation = new THREE.Color();
            colorVariation.copy(baseColor);
            colorVariation.offsetHSL(Math.random() * 0.1 - 0.05, 0, 0);
            
            colors[i3] = colorVariation.r;
            colors[i3 + 1] = colorVariation.g;
            colors[i3 + 2] = colorVariation.b;
            
            // Size variation
            sizes[i] = Math.random() * 0.1 + 0.05 + subreddit.pagerankCentralization * 0.3;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    // Add subtle animation
                    float orbitOffset = sin(time * 0.5 + float(gl_VertexID) * 0.01) * 0.5;
                    pos.x += orbitOffset;
                    pos.z += orbitOffset;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if (r > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.4, 0.5, r);
                    gl_FragColor = vec4(vColor, alpha * 0.7);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData.shaderMaterial = material;
        parent.add(particles);
        
        this.particlesData.push({
            particles,
            parent,
            speed: 0.001 + subreddit.degreeCentralization * 0.0005
        });
    }
    
    createNetworkConnections(parent) {
        // Create connections between related subreddits
        this.subredditData.forEach((sub1, i) => {
            this.subredditData.slice(i + 1).forEach((sub2, j) => {
                // Connect if modularity difference is small
                const modularityDiff = Math.abs(sub1.modularity - sub2.modularity);
                if (modularityDiff < 0.2) {
                    const curve = new THREE.CatmullRomCurve3([
                        new THREE.Vector3(sub1.position.x, sub1.position.y, sub1.position.z),
                        new THREE.Vector3(
                            (sub1.position.x + sub2.position.x) / 2,
                            (sub1.position.y + sub2.position.y) / 2 + 10,
                            (sub1.position.z + sub2.position.z) / 2
                        ),
                        new THREE.Vector3(sub2.position.x, sub2.position.y, sub2.position.z)
                    ]);
                    
                    const points = curve.getPoints(50);
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.1,
                        linewidth: 2
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    parent.add(line);
                    this.connectionLines.push(line);
                }
            });
        });
    }
    
    createBackgroundParticles() {
        const particleCount = 5000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random position in a large sphere
            const radius = 150;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Subtle colors
            colors[i3] = Math.random() * 0.1 + 0.05;
            colors[i3 + 1] = Math.random() * 0.1 + 0.05;
            colors[i3 + 2] = Math.random() * 0.1 + 0.05;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.05,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
    }
    
    // ========== DISCOURSE TOPOGRAPHY ==========
    createDiscourseTopography() {
        this.clearScene();
        
        const terrainGroup = new THREE.Group();
        
        // Create terrain base
        const terrainGeometry = new THREE.PlaneGeometry(120, 120, 60, 60);
        const terrainMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1d2a,
            wireframe: false,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.y = -25;
        terrainGroup.add(terrain);
        
        // Generate heightmap based on subreddit metrics
        const vertices = terrainGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            let height = 0;
            
            // Calculate influence from each subreddit
            this.subredditData.forEach(sub => {
                const dx = x - sub.position.x;
                const dz = z - sub.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 40) {
                    // Height based on network size and activity
                    const influence = (sub.nodes / 1000) * Math.exp(-distance / 25);
                    height += influence * 20;
                    
                    // Add random terrain variation
                    height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3;
                }
            });
            
            vertices[i + 1] = height;
        }
        
        terrainGeometry.attributes.position.needsUpdate = true;
        
        // Create mountains for each subreddit
        this.subredditData.forEach(sub => {
            const mountainHeight = Math.log(sub.edges) * 3;
            const mountainRadius = Math.sqrt(sub.nodes) / 8;
            
            const mountainGeometry = new THREE.ConeGeometry(mountainRadius, mountainHeight, 12);
            const mountainMaterial = new THREE.MeshPhongMaterial({
                color: sub.color,
                emissive: sub.color,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.9
            });
            
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            mountain.position.set(sub.position.x, -25 + mountainHeight/2, sub.position.z);
            mountain.rotation.x = Math.PI;
            terrainGroup.add(mountain);
            
            // Add contour lines
            const contourGeometry = new THREE.RingGeometry(
                mountainRadius + 1,
                mountainRadius + 3,
                24
            );
            const contourMaterial = new THREE.MeshBasicMaterial({
                color: sub.secondaryColor,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            const contour = new THREE.Mesh(contourGeometry, contourMaterial);
            contour.position.copy(mountain.position);
            contour.position.y += 0.5;
            contour.rotation.x = Math.PI / 2;
            terrainGroup.add(contour);
        });
        
        this.scene.add(terrainGroup);
        
        // Add narrative
        this.addNarrativeOverlay("Discourse Topography", 
            "This terrain map visualizes Reddit communities as mountain ranges:\n" +
            "• Mountain height = Network engagement & activity\n" +
            "• Mountain size = Community size\n" +
            "• Contour lines = Echo chamber boundaries\n" +
            "• Color = Community sentiment & discourse patterns\n\n" +
            "High peaks represent highly active communities, while valleys show areas of less interaction."
        );
    }
    
    // ========== SEMANTIC GALAXY ==========
    createSemanticGalaxy() {
        this.clearScene();
        
        const galaxyGroup = new THREE.Group();
        
        // Collect all unique phrases
        const allPhrases = [];
        this.subredditData.forEach(sub => {
            sub.keyPhrases.forEach(phrase => {
                if (!allPhrases.find(p => p.text === phrase)) {
                    allPhrases.push({
                        text: phrase,
                        subreddit: sub.name,
                        sentiment: sub.sentimentScore,
                        color: sub.color
                    });
                }
            });
        });
        
        // Create starfield
        const starCount = Math.min(800, allPhrases.length * 20);
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Spherical distribution
            const radius = 40 + Math.random() * 60;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starPositions[i3 + 2] = radius * Math.cos(phi);
            
            // Color based on sentiment
            const phrase = allPhrases[i % allPhrases.length];
            const color = new THREE.Color(phrase.color);
            
            if (phrase.sentiment > 0.05) {
                color.offsetHSL(0.1, 0.3, 0.2); // Brighter for positive
            } else if (phrase.sentiment < -0.05) {
                color.offsetHSL(-0.1, 0.3, -0.1); // Darker for negative
            }
            
            starColors[i3] = color.r;
            starColors[i3 + 1] = color.g;
            starColors[i3 + 2] = color.b;
            
            starSizes[i] = 0.2 + Math.random() * 0.3 + Math.abs(phrase.sentiment) * 2;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Twinkle effect
                    float twinkle = sin(time * 2.0 + float(gl_VertexID) * 0.1) * 0.3 + 0.7;
                    gl_PointSize = size * (400.0 / -mvPosition.z) * twinkle;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if (r > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
                    // Add glow effect
                    float glow = smoothstep(0.4, 0.0, r);
                    gl_FragColor = vec4(vColor, alpha * glow * 0.9);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        galaxyGroup.add(stars);
        
        // Create central black hole for controversial topics
        const blackHoleGeometry = new THREE.SphereGeometry(6, 32, 32);
        const blackHoleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        
        const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        galaxyGroup.add(blackHole);
        
        // Add gravitational distortion
        const distortionGeometry = new THREE.SphereGeometry(10, 32, 32);
        const distortionMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a00ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
        galaxyGroup.add(distortion);
        
        this.scene.add(galaxyGroup);
        
        // Store for animation
        this.galaxyObjects = {
            stars,
            blackHole,
            distortion,
            starMaterial,
            time: 0
        };
        
        // Add narrative
        this.addNarrativeOverlay("Semantic Galaxy",
            "Explore discourse concepts in a cosmic scale:\n" +
            "• Stars = Key phrases from Reddit discussions\n" +
            "• Star size = Phrase frequency & impact\n" +
            "• Star color = Associated community sentiment\n" +
            "• Central black hole = Controversial polarized topics\n" +
            "• Glow effect = Topic popularity & engagement\n\n" +
            "Twinkling patterns reveal trending discourse topics across communities."
        );
    }
    
    // ========== SMALL MULTIPLES ==========
    showSmallMultiples() {
        const container = document.getElementById('reddit-3d-canvas');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'small-multiples-container';
        
        // Create cards for each subreddit
        this.subredditData.forEach((subreddit, index) => {
            const card = document.createElement('div');
            card.className = 'viz-card';
            card.dataset.subreddit = subreddit.name;
            
            card.innerHTML = `
                <h4>${subreddit.name}</h4>
                <canvas id="viz-${index}" width="280" height="160"></canvas>
                <div class="metrics">
                    <span>${subreddit.nodes} nodes</span>
                    <span>${subreddit.communities} comm</span>
                    <span>${subreddit.sentimentScore.toFixed(2)} sent</span>
                </div>
            `;
            
            gridContainer.appendChild(card);
            
            // Add click handler
            card.addEventListener('click', () => {
                this.drillDownSubreddit(subreddit.name);
            });
        });
        
        container.appendChild(gridContainer);
        
        // Create mini visualizations
        this.subredditData.forEach((subreddit, index) => {
            this.createMiniVisualization(subreddit, index);
        });
        
        // Add narrative
        this.addNarrativeOverlay("Cognitive-Optimized Small Multiples",
            "Research-grade comparison framework showing 4 key dimensions per community:\n" +
            "1. Network structure (Radial layout)\n" +
            "2. Sentiment distribution (Violin plot)\n" +
            "3. User influence hierarchy (Pie chart)\n" +
            "4. Community polarization (Radar chart)\n\n" +
            "Click any card to drill down into detailed analysis. Patterns emerge through coordinated comparison."
        );
    }
    
    createMiniVisualization(subreddit, index) {
        const canvas = document.getElementById(`viz-${index}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgba(20, 20, 30, 0.8)');
        gradient.addColorStop(1, 'rgba(30, 30, 45, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw 4 mini charts in 2x2 grid
        const margin = 10;
        const chartWidth = (canvas.width - margin * 3) / 2;
        const chartHeight = (canvas.height - margin * 3) / 2;
        
        // Chart 1: Network radial
        this.drawRadialNetwork(ctx, subreddit, margin, margin, chartWidth, chartHeight);
        
        // Chart 2: Sentiment distribution
        this.drawSentimentDistribution(ctx, subreddit, margin * 2 + chartWidth, margin, chartWidth, chartHeight);
        
        // Chart 3: User influence
        this.drawUserInfluence(ctx, subreddit, margin, margin * 2 + chartHeight, chartWidth, chartHeight);
        
        // Chart 4: Modularity radar
        this.drawModularityRadar(ctx, subreddit, margin * 2 + chartWidth, margin * 2 + chartHeight, chartWidth, chartHeight);
    }
    
    drawRadialNetwork(ctx, subreddit, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2 - 5;
        
        // Draw radial connections
        const nodeCount = Math.min(12, Math.floor(subreddit.nodes / 30));
        for (let i = 0; i < nodeCount; i++) {
            const angle = (i / nodeCount) * Math.PI * 2;
            const nodeX = centerX + Math.cos(angle) * radius;
            const nodeY = centerY + Math.sin(angle) * radius;
            
            // Connection line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(nodeX, nodeY);
            ctx.strokeStyle = `rgba(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255}, 0.4)`;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Node
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255})`;
            ctx.fill();
        }
        
        // Center node
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    drawSentimentDistribution(ctx, subreddit, x, y, width, height) {
        // Generate sample sentiment data
        const samples = 15;
        const data = [];
        for (let i = 0; i < samples; i++) {
            data.push(subreddit.sentimentScore + (Math.random() - 0.5) * 0.4);
        }
        data.sort((a, b) => a - b);
        
        // Draw violin plot
        ctx.beginPath();
        const step = width / samples;
        
        // Top curve
        for (let i = 0; i < samples; i++) {
            const xPos = x + i * step;
            const yPos = y + height / 2 - data[i] * height;
            if (i === 0) {
                ctx.moveTo(xPos, yPos);
            } else {
                ctx.lineTo(xPos, yPos);
            }
        }
        
        // Bottom curve
        for (let i = samples - 1; i >= 0; i--) {
            const xPos = x + i * step;
            const yPos = y + height / 2 + Math.abs(data[i]) * height * 0.5;
            ctx.lineTo(xPos, yPos);
        }
        
        ctx.closePath();
        ctx.fillStyle = `rgba(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255}, 0.3)`;
        ctx.fill();
        
        // Median line
        ctx.beginPath();
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x + width, y + height / 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    drawUserInfluence(ctx, subreddit, x, y, width, height) {
        const users = subreddit.dominantUsers.slice(0, 3);
        if (users.length === 0) return;
        
        const totalPower = users.reduce((sum, u) => sum + u.power, 0);
        let startAngle = 0;
        
        users.forEach((user, i) => {
            const sliceAngle = (user.power / totalPower) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y + height / 2);
            ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2 - 5, startAngle, endAngle);
            ctx.closePath();
            
            // Color based on sentiment
            const hue = i * 120;
            const saturation = 70;
            const lightness = user.sentiment > 0 ? 60 : 40;
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;
            ctx.fill();
            
            startAngle = endAngle;
        });
        
        // Center circle
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
    }
    
    drawModularityRadar(ctx, subreddit, x, y, width, height) {
        const metrics = [
            subreddit.degreeCentralization * 2,
            subreddit.pagerankCentralization * 3,
            subreddit.modularity,
            subreddit.density * 5000,
            (subreddit.sentimentScore + 1) / 2
        ];
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2 - 8;
        
        // Draw radar grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            const gridRadius = radius * (i / 3);
            for (let j = 0; j < metrics.length; j++) {
                const angle = (j / metrics.length) * Math.PI * 2;
                const pointX = centerX + Math.cos(angle) * gridRadius;
                const pointY = centerY + Math.sin(angle) * gridRadius;
                
                if (j === 0) {
                    ctx.moveTo(pointX, pointY);
                } else {
                    ctx.lineTo(pointX, pointY);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        // Draw radar shape
        ctx.beginPath();
        metrics.forEach((value, i) => {
            const angle = (i / metrics.length) * Math.PI * 2;
            const r = Math.max(0.1, Math.min(1, value)) * radius;
            const pointX = centerX + Math.cos(angle) * r;
            const pointY = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
                ctx.moveTo(pointX, pointY);
            } else {
                ctx.lineTo(pointX, pointY);
            }
        });
        
        ctx.closePath();
        ctx.fillStyle = `rgba(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255}, 0.3)`;
        ctx.fill();
        ctx.strokeStyle = `rgb(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // ========== CONTROLS & UI ==========
    createControlsPanel(container) {
        this.controlsPanel = document.createElement('div');
        this.controlsPanel.className = 'viz-controls-panel';
        
        // Collect all unique phrases
        const allPhrases = [...new Set(this.subredditData.flatMap(s => s.keyPhrases))];
        
        this.controlsPanel.innerHTML = `
            <div class="control-section">
                <h4>🎯 Visualization Views</h4>
                <div class="control-group">
                    <button class="control-btn ${this.currentView === 'network' ? 'active' : ''}" 
                            onclick="window.networkViz.switchView('network')">
                        <i class="bi bi-globe-americas"></i> Network
                    </button>
                    <button class="control-btn" 
                            onclick="window.networkViz.switchView('topography')">
                        <i class="bi bi-mountain"></i> Topography
                    </button>
                    <button class="control-btn" 
                            onclick="window.networkViz.switchView('galaxy')">
                        <i class="bi bi-stars"></i> Galaxy
                    </button>
                    <button class="control-btn" 
                            onclick="window.networkViz.switchView('multiples')">
                        <i class="bi bi-grid-3x3"></i> Multiples
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h4>🔍 Semantic Filters</h4>
                <div class="filter-chips">
                    ${allPhrases.slice(0, 10).map(phrase => `
                        <div class="filter-chip" data-phrase="${phrase}">${phrase}</div>
                    `).join('')}
                </div>
            </div>
            
            <div class="control-section">
                <h4>🎨 Interaction Lenses</h4>
                <div class="control-group">
                    <button class="control-btn" onclick="window.networkViz.enableFisheye()">
                        <i class="bi bi-search"></i> Fisheye
                    </button>
                    <button class="control-btn" onclick="window.networkViz.highlightBySentiment()">
                        <i class="bi bi-emoji-smile"></i> Sentiment
                    </button>
                    <button class="control-btn" onclick="window.networkViz.toggleInsights()">
                        <i class="bi bi-lightbulb"></i> ${this.showInsights ? 'Hide' : 'Show'} Insights
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h4>📖 Narrative Tour</h4>
                <button class="control-btn" onclick="window.networkViz.showOnboardingTour()">
                    <i class="bi bi-play-circle"></i> Restart Tour
                </button>
            </div>
        `;
        
        container.appendChild(this.controlsPanel);
        
        // Add event listeners to filter chips
        this.controlsPanel.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const phrase = e.target.dataset.phrase;
                this.applyPhraseFilter(phrase);
            });
        });
    }
    
    createInsightCallouts() {
        if (!this.showInsights) return;
        
        // Find key insights
        const highestCentralization = this.subredditData.reduce((max, sub) => 
            sub.degreeCentralization > max.degreeCentralization ? sub : max
        );
        
        const highestModularity = this.subredditData.reduce((max, sub) => 
            sub.modularity > max.modularity ? sub : max
        );
        
        const lowestModularity = this.subredditData.reduce((min, sub) => 
            sub.modularity < min.modularity ? sub : min
        );
        
        const largestCommunity = this.subredditData.reduce((max, sub) => 
            sub.nodes > max.nodes ? sub : max
        );
        
        // Create callouts
        this.createCallout(highestCentralization, "⚡ Highest Centralization", "Star-like power structure");
        this.createCallout(highestModularity, "🧩 Highest Modularity", "Fragmented discourse");
        this.createCallout(lowestModularity, "🔄 Lowest Modularity", "Unified echo-chamber");
        this.createCallout(largestCommunity, "🌐 Largest Network", "Massive-scale community");
    }
    
    createCallout(subreddit, title, description) {
        const callout = document.createElement('div');
        callout.className = 'insight-callout';
        callout.innerHTML = `
            <strong>${title}</strong>
            <p>${subreddit.name}</p>
            <small>${description}</small>
            <div class="callout-arrow"></div>
        `;
        
        const container = document.getElementById('reddit-3d-canvas');
        container.appendChild(callout);
        
        // Position near the subreddit
        setTimeout(() => {
            const vector = new THREE.Vector3(
                subreddit.position.x,
                subreddit.position.y + 12,
                subreddit.position.z
            );
            vector.project(this.camera);
            
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            const x = (vector.x * 0.5 + 0.5) * width;
            const y = (-vector.y * 0.5 + 0.5) * height;
            
            callout.style.left = `${Math.max(20, Math.min(width - 300, x))}px`;
            callout.style.top = `${Math.max(20, Math.min(height - 150, y))}px`;
            callout.classList.add('visible');
        }, 100);
        
        this.insightCallouts.push(callout);
    }
    
    createTooltip(container) {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'network-tooltip';
        container.appendChild(this.tooltip);
    }
    
    // ========== INTERACTION METHODS ==========
    switchView(view) {
        this.currentView = view;
        
        // Update active button
        if (this.controlsPanel) {
            this.controlsPanel.querySelectorAll('.control-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const activeBtn = this.controlsPanel.querySelector(`button[onclick*="'${view}'"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }
        
        // Switch to the selected view
        switch(view) {
            case 'network':
                this.createNetworkVisualization();
                break;
            case 'topography':
                this.createDiscourseTopography();
                break;
            case 'galaxy':
                this.createSemanticGalaxy();
                break;
            case 'multiples':
                this.showSmallMultiples();
                break;
        }
        
        // Hide tooltip when switching views
        this.hideTooltip();
    }
    
    applyPhraseFilter(phrase) {
        this.activeFilter = this.activeFilter === phrase ? null : phrase;
        
        // Update UI
        if (this.controlsPanel) {
            this.controlsPanel.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.toggle('active', chip.dataset.phrase === phrase && this.activeFilter === phrase);
            });
        }
        
        // Apply visual filter
        if (this.currentView === 'network' && this.nodeGroups.length > 0) {
            this.nodeGroups.forEach(nodeGroup => {
                const hasPhrase = nodeGroup.subreddit.keyPhrases.includes(phrase);
                const opacity = this.activeFilter ? (hasPhrase ? 1 : 0.2) : 1;
                const scale = this.activeFilter && hasPhrase ? 1.5 : 1;
                
                if (nodeGroup.core && nodeGroup.core.material) {
                    gsap.to(nodeGroup.core.material, {
                        opacity: opacity,
                        duration: 0.5
                    });
                }
                
                if (nodeGroup.group) {
                    gsap.to(nodeGroup.group.scale, {
                        x: scale,
                        y: scale,
                        z: scale,
                        duration: 0.5,
                        ease: "back.out(1.7)"
                    });
                }
            });
        }
    }
    
    enableFisheye() {
        if (!this.activeSubreddit || this.currentView !== 'network') return;
        
        this.nodeGroups.forEach(nodeGroup => {
            const activeNode = this.nodeGroups.find(g => g.subreddit.name === this.activeSubreddit);
            if (!activeNode) return;
            
            const distance = nodeGroup.group.position.distanceTo(activeNode.group.position);
            const distortion = Math.exp(-distance / 25);
            const targetScale = 1 + distortion * 0.8;
            
            gsap.to(nodeGroup.group.scale, {
                x: targetScale,
                y: targetScale,
                z: targetScale,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)"
            });
            
            gsap.to(nodeGroup.core.material, {
                opacity: 0.3 + distortion * 0.7,
                duration: 0.8
            });
        });
    }
    
    highlightBySentiment() {
        if (this.currentView !== 'network') return;
        
        this.nodeGroups.forEach(nodeGroup => {
            const sentiment = nodeGroup.subreddit.sentimentScore;
            let targetColor;
            
            if (sentiment > 0.05) {
                targetColor = new THREE.Color(0x10b981); // Emerald green
            } else if (sentiment < -0.05) {
                targetColor = new THREE.Color(0xef4444); // Red
            } else {
                targetColor = new THREE.Color(0x94a3b8); // Gray
            }
            
            gsap.to(nodeGroup.core.material.color, {
                r: targetColor.r,
                g: targetColor.g,
                b: targetColor.b,
                duration: 0.8,
                ease: "power2.out"
            });
        });
    }
    
    drillDownSubreddit(subredditName) {
        const subreddit = this.subredditData.find(s => s.name === subredditName);
        if (!subreddit) return;
        
        // Switch back to 3D view
        this.switchView('network');
        
        // Zoom to the subreddit
        setTimeout(() => {
            const targetPosition = new THREE.Vector3(
                subreddit.position.x,
                subreddit.position.y + 15,
                subreddit.position.z + 25
            );
            
            gsap.to(this.camera.position, {
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                duration: 1.5,
                ease: "power2.inOut"
            });
            
            // Highlight the subreddit
            this.highlightSubreddit(subreddit);
            
            // Show detailed panel
            setTimeout(() => {
                this.showUserDrillDown(subreddit);
            }, 1200);
        }, 300);
    }
    
    showUserDrillDown(subreddit) {
        const container = document.getElementById('reddit-3d-canvas');
        if (!container) return;
        
        const panel = document.createElement('div');
        panel.className = 'network-tooltip';
        panel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
            z-index: 1001;
            padding: 30px;
            background: rgba(20, 22, 30, 0.98);
            border: 2px solid rgba(96, 165, 250, 0.3);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="margin: 0; color: rgb(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255});">
                    ${subreddit.name} - User Network Analysis
                </h3>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 500;">
                    Close
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                <div>
                    <h4 style="margin: 0 0 15px 0; color: #60a5fa;">Ego Network</h4>
                    <canvas id="ego-network" width="250" height="200" style="width: 100%; height: 200px; border-radius: 12px; background: rgba(0,0,0,0.3);"></canvas>
                </div>
                <div>
                    <h4 style="margin: 0 0 15px 0; color: #60a5fa;">Top Influencers</h4>
                    ${subreddit.dominantUsers.map((user, i) => `
                        <div style="margin: 12px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px; border-left: 4px solid ${user.sentiment > 0 ? '#10b981' : '#ef4444'};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="color: #fff;">${i + 1}. ${user.user}</strong>
                                <span style="color: ${user.sentiment > 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">
                                    ${user.sentiment > 0 ? '+' : ''}${user.sentiment.toFixed(3)}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                                <span>Power: ${user.power.toFixed(4)}</span>
                                <span>${user.sentiment > 0 ? 'Positive' : 'Negative'} Influence</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div>
                <h4 style="margin: 0 0 15px 0; color: #60a5fa;">Community Metrics</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #60a5fa;">${subreddit.nodes}</div>
                        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Nodes</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #60a5fa;">${subreddit.communities}</div>
                        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Communities</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${subreddit.sentimentScore > 0 ? '#10b981' : '#ef4444'}">
                            ${subreddit.sentimentScore > 0 ? '+' : ''}${subreddit.sentimentScore.toFixed(3)}
                        </div>
                        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Sentiment</div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(panel);
        
        // Draw ego network
        setTimeout(() => this.drawEgoNetwork(subreddit), 100);
    }
    
    drawEgoNetwork(subreddit) {
        const canvas = document.getElementById('ego-network');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 2 - 20;
        
        // Draw center node (dominant user)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${(subreddit.color >> 16) & 255}, ${(subreddit.color >> 8) & 255}, ${subreddit.color & 255})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw connected nodes
        const neighborCount = Math.min(10, subreddit.dominantUsers.length * 2);
        for (let i = 0; i < neighborCount; i++) {
            const angle = (i / neighborCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Draw connection
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw neighbor node
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#ef4444';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    highlightSubreddit(subreddit) {
        if (this.currentView !== 'network') return;
        
        this.activeSubreddit = subreddit.name;
        
        this.nodeGroups.forEach(nodeGroup => {
            if (nodeGroup.subreddit.name === subreddit.name) {
                // Highlight this subreddit
                gsap.to(nodeGroup.core.material, {
                    emissiveIntensity: 0.8,
                    duration: 0.5
                });
                
                gsap.to(nodeGroup.core.scale, {
                    x: nodeGroup.originalScale.x * 1.4,
                    y: nodeGroup.originalScale.y * 1.4,
                    z: nodeGroup.originalScale.z * 1.4,
                    duration: 0.5,
                    ease: "back.out(1.7)"
                });
            }
        });
    }
    
    toggleInsights() {
        this.showInsights = !this.showInsights;
        
        // Update button text
        const insightBtn = this.controlsPanel?.querySelector('button[onclick*="toggleInsights"]');
        if (insightBtn) {
            insightBtn.innerHTML = `<i class="bi bi-lightbulb"></i> ${this.showInsights ? 'Hide' : 'Show'} Insights`;
        }
        
        // Toggle callouts
        this.insightCallouts.forEach(callout => {
            callout.style.opacity = this.showInsights ? '1' : '0';
        });
        
        if (!this.showInsights && this.insightCallouts.length === 0) {
            this.createInsightCallouts();
        }
    }
    
    // ========== NARRATIVE & ONBOARDING ==========
    showOnboardingTour() {
        const steps = [
            {
                title: "Welcome to Reddit Discourse Explorer",
                content: "This interactive visualization explores discourse patterns across seven major Reddit communities. Discover how online conversations form, interact, and evolve.",
                position: { x: '50%', y: '50%' }
            },
            {
                title: "Understanding Network Visualization",
                content: "Each glowing cluster represents a subreddit community. Cluster size shows network scale, orbiting particles represent user communities, and colors indicate sentiment patterns.",
                position: { x: '40%', y: '40%' }
            },
            {
                title: "Interactive Exploration",
                content: "• Hover over clusters to see detailed metrics • Click communities to drill down • Use filters to focus on specific phrases • Switch between visualization modes",
                position: { x: '60%', y: '60%' }
            },
            {
                title: "Advanced Features",
                content: "Try the Fisheye lens for focus+context exploration, switch to Topography view for terrain metaphors, explore the Semantic Galaxy, or analyze patterns with Small Multiples.",
                position: { x: '50%', y: '70%' }
            }
        ];
        
        let currentStep = 0;
        
        const tourOverlay = document.createElement('div');
        tourOverlay.className = 'tour-overlay';
        
        function showStep(stepIndex) {
            currentStep = stepIndex;
            const step = steps[stepIndex];
            tourOverlay.innerHTML = `
                <div class="tour-step" style="left: ${step.position.x}; top: ${step.position.y};">
                    <h3>${step.title}</h3>
                    <p>${step.content}</p>
                    <div class="tour-nav">
                        <button class="control-btn" onclick="this.closest('.tour-overlay').remove()">
                            <i class="bi bi-x-circle"></i> Skip Tour
                        </button>
                        <div class="tour-dots">
                            ${steps.map((_, i) => `
                                <div class="tour-dot ${i === stepIndex ? 'active' : ''}" onclick="showStep(${i})"></div>
                            `).join('')}
                        </div>
                        ${stepIndex < steps.length - 1 ? 
                            `<button class="control-btn" onclick="showStep(${stepIndex + 1})">
                                <i class="bi bi-arrow-right"></i> Next
                            </button>` :
                            `<button class="control-btn" onclick="this.closest('.tour-overlay').remove()">
                                <i class="bi bi-play-circle"></i> Start Exploring
                            </button>`
                        }
                    </div>
                </div>
            `;
        }
        
        function nextStep() {
            if (currentStep < steps.length - 1) {
                showStep(currentStep + 1);
            } else {
                tourOverlay.remove();
            }
        }
        
        showStep(0);
        document.body.appendChild(tourOverlay);
        
        // Add event listeners
        tourOverlay.querySelectorAll('.control-btn').forEach(btn => {
            if (btn.textContent.includes('Next')) {
                btn.addEventListener('click', nextStep);
            } else if (btn.textContent.includes('Skip') || btn.textContent.includes('Start')) {
                btn.addEventListener('click', () => tourOverlay.remove());
            }
        });
        
        tourOverlay.querySelectorAll('.tour-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => showStep(index));
        });
    }
    
    addNarrativeOverlay(title, content) {
        const container = document.getElementById('reddit-3d-canvas');
        if (!container) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'narrative-overlay';
        
        overlay.innerHTML = `
            <h3>${title}</h3>
            <p>${content}</p>
        `;
        
        container.appendChild(overlay);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transform = 'translate(-50%, -50%) scale(0.9)';
            overlay.style.transition = 'all 0.5s ease';
            setTimeout(() => overlay.remove(), 500);
        }, 8000);
    }
    
    // ========== EVENT HANDLERS ==========
    onMouseMove(event) {
        if (this.currentView !== 'network') return;
        
        const container = document.getElementById('reddit-3d-canvas');
        const rect = container.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycast to find hovered objects
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.nodeGroups.map(g => g.core)
        );
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            const subreddit = object.userData.data;
            
            // Update tooltip
            const vector = new THREE.Vector3();
            vector.setFromMatrixPosition(object.matrixWorld);
            vector.project(this.camera);
            
            const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
            const y = (-vector.y * 0.5 + 0.5) * container.clientHeight;
            
            this.showTooltip(subreddit, x, y);
        } else {
            this.hideTooltip();
        }
    }
    
    onMouseClick(event) {
        if (this.currentView !== 'network') return;
        
        this.onMouseMove(event); // Update raycast
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.nodeGroups.map(g => g.core)
        );
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            const subreddit = object.userData.data;
            this.drillDownSubreddit(subreddit.name);
        }
    }
    
    showTooltip(subreddit, x, y) {
        if (!this.tooltip) return;
        
        const html = `
            <h3>${subreddit.name}</h3>
            <p>${subreddit.description}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0;">
                <div>
                    <strong>Network Metrics:</strong>
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.8);">
                        <div>Nodes: ${subreddit.nodes.toLocaleString()}</div>
                        <div>Edges: ${subreddit.edges.toLocaleString()}</div>
                        <div>Communities: ${subreddit.communities}</div>
                    </div>
                </div>
                <div>
                    <strong>Power Dynamics:</strong>
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.8);">
                        <div>Centralization: ${subreddit.degreeCentralization.toFixed(4)}</div>
                        <div>Modularity: ${subreddit.modularity.toFixed(4)}</div>
                        <div>Sentiment: ${subreddit.sentimentScore.toFixed(3)}</div>
                    </div>
                </div>
            </div>
            <div>
                <strong>Key Phrases:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                    ${subreddit.keyPhrases.map(phrase => `
                        <span style="background: rgba(96, 165, 250, 0.2); padding: 4px 10px; border-radius: 20px; font-size: 0.8rem;">
                            ${phrase}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.tooltip.innerHTML = html;
        this.tooltip.style.left = `${x + 20}px`;
        this.tooltip.style.top = `${y}px`;
        this.tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    // ========== ANIMATION LOOP ==========
    startAnimation() {
        this.isAnimating = true;
        this.animate();
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;
        
        // Update based on current view
        switch(this.currentView) {
            case 'network':
                this.updateNetworkAnimation(time);
                break;
            case 'galaxy':
                this.updateGalaxyAnimation(time);
                break;
        }
        
        // Update controls
        if (this.controls && this.currentView !== 'multiples') {
            this.controls.update();
        }
        
        // Render
        if (this.renderer && this.camera && this.scene) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    updateNetworkAnimation(time) {
        // Animate particles
        this.particlesData.forEach(data => {
            if (data.particles && data.particles.userData.shaderMaterial) {
                data.particles.userData.shaderMaterial.uniforms.time.value = time;
                data.particles.userData.shaderMaterial.needsUpdate = true;
            }
            
            // Rotate particles around their parent
            if (data.particles && data.parent) {
                data.particles.rotation.y += data.speed;
                data.particles.rotation.x += data.speed * 0.3;
            }
        });
        
        // Animate subreddit cores
        this.nodeGroups.forEach((nodeGroup, index) => {
            if (nodeGroup.group && nodeGroup.group.userData) {
                // Floating animation
                const floatOffset = Math.sin(time * 0.8 + index) * 0.3;
                nodeGroup.group.position.y = nodeGroup.subreddit.position.y + floatOffset;
                
                // Gentle rotation
                nodeGroup.group.rotation.y += 0.002;
            }
        });
        
        // Animate connection lines
        this.connectionLines.forEach((line, index) => {
            if (line.material) {
                line.material.opacity = 0.08 + Math.sin(time * 0.5 + index) * 0.04;
            }
        });
    }
    
    updateGalaxyAnimation(time) {
        if (this.galaxyObjects) {
            // Update star twinkling
            if (this.galaxyObjects.starMaterial) {
                this.galaxyObjects.starMaterial.uniforms.time.value = time;
                this.galaxyObjects.starMaterial.needsUpdate = true;
            }
            
            // Rotate galaxy
            if (this.galaxyObjects.stars) {
                this.galaxyObjects.stars.rotation.y += 0.001;
                this.galaxyObjects.stars.rotation.x += 0.0005;
            }
            
            // Pulsing black hole
            if (this.galaxyObjects.blackHole) {
                const pulse = Math.sin(time * 1.5) * 0.1 + 0.9;
                this.galaxyObjects.blackHole.scale.setScalar(pulse);
            }
            
            // Rotating distortion field
            if (this.galaxyObjects.distortion) {
                this.galaxyObjects.distortion.rotation.y += 0.002;
                this.galaxyObjects.distortion.rotation.x += 0.001;
            }
        }
    }
    
    // ========== UTILITY METHODS ==========
    populateDetailedUI() {
        // Populate metrics table if exists
        const metricsBody = document.getElementById('metrics-table-body');
        if (metricsBody) {
            metricsBody.innerHTML = '';
            
            this.subredditData.forEach(subreddit => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="color: #${subreddit.color.toString(16).padStart(6, '0')}; font-weight: 600;">
                        ${subreddit.name}
                    </td>
                    <td>${subreddit.nodes.toLocaleString()}</td>
                    <td>${subreddit.edges.toLocaleString()}</td>
                    <td>${subreddit.degreeCentralization.toFixed(4)}</td>
                    <td>${subreddit.modularity.toFixed(4)}</td>
                    <td>${subreddit.communities}</td>
                `;
                metricsBody.appendChild(row);
            });
        }
        
        // Update insights if elements exist
        const centralityInsight = document.getElementById('centrality-insight');
        const modularityInsight = document.getElementById('modularity-insight');
        const scaleInsight = document.getElementById('scale-insight');
        
        if (centralityInsight) {
            const highestCentralization = this.subredditData.reduce((max, sub) => 
                sub.degreeCentralization > max.degreeCentralization ? sub : max
            );
            centralityInsight.innerHTML = `<strong>⚡ Power Concentration:</strong> ${highestCentralization.name} shows highest centralization (${highestCentralization.degreeCentralization.toFixed(4)}), indicating a star-like network structure where a few users dominate discourse.`;
        }
        
        if (modularityInsight) {
            const highestModularity = this.subredditData.reduce((max, sub) => 
                sub.modularity > max.modularity ? sub : max
            );
            const lowestModularity = this.subredditData.reduce((min, sub) => 
                sub.modularity < min.modularity ? sub : min
            );
            modularityInsight.innerHTML = `<strong>🧩 Community Fragmentation:</strong> ${highestModularity.name} has highest modularity (${highestModularity.modularity.toFixed(4)}), indicating strong ideological fragmentation. ${lowestModularity.name} shows low modularity, suggesting unified echo-chamber discourse.`;
        }
        
        if (scaleInsight) {
            const largestCommunity = this.subredditData.reduce((max, sub) => 
                sub.nodes > max.nodes ? sub : max
            );
            scaleInsight.innerHTML = `<strong>🌐 Network Scale:</strong> ${largestCommunity.name} is the largest network with ${largestCommunity.nodes.toLocaleString()} users and ${largestCommunity.edges.toLocaleString()} interactions, maintaining ${largestCommunity.communities} distinct communities.`;
        }
    }
    
    onWindowResize(container) {
        if (!this.camera || !this.renderer || !container) return;
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    clearScene() {
        // Clear particle data
        this.particlesData = [];
        this.nodeGroups = [];
        this.connectionLines = [];
        
        // Remove all objects from scene
        if (this.scene) {
            while(this.scene.children.length > 0) { 
                this.scene.remove(this.scene.children[0]); 
            }
        }
        
        // Clear insight callouts
        this.insightCallouts.forEach(callout => callout.remove());
        this.insightCallouts = [];
    }
    
    destroy() {
        this.isAnimating = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Remove tooltip
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        // Remove controls panel
        if (this.controlsPanel && this.controlsPanel.parentNode) {
            this.controlsPanel.parentNode.removeChild(this.controlsPanel);
        }
        
        // Remove insight callouts
        this.insightCallouts.forEach(callout => {
            if (callout.parentNode) {
                callout.parentNode.removeChild(callout);
            }
        });
        
        // Clean up Three.js
        if (this.renderer && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        
        // Clear scene
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.nodeGroups = [];
        this.particlesData = [];
        this.connectionLines = [];
        this.insightCallouts = [];
        this.tooltip = null;
        this.controlsPanel = null;
        
        console.log('Reddit Network Visualization destroyed');
    }
}