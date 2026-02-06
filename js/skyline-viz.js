/**
 * Advanced NYC Gentrification Hexagonal Visualization
 * Master-level geospatial analytics with comprehensive data integration
 */

class EnhancedSkylineViz {
    constructor(containerId) {
        this.containerId = containerId;
        this.mapboxToken = 'pk.eyJ1IjoiaGFtemE5NzEzIiwiYSI6ImNtazB4eGhkNTAwM2szZ29leWJ5bzkxNzQifQ.5SDMfgkGfOKSBOkMDIqWWw';
        this.map = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.tractData = [];
        this.instancedMesh = null;
        this.dummy = new THREE.Object3D();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredIndex = -1;
        this.clock = new THREE.Clock();
        this.animationId = null;
    }

    async init() {
        try {
            this.updateProgress('Loading data sources...', 15);
            await this.loadAllData();
            this.cityStats = {};

                    const numericKeys = [
                    'gmi',
                    'rent',
                    'income',
                    'poverty_rate',
                    'homeownership_rate',
                    'displacement_risk'
                    ];

                numericKeys.forEach(k => {
                const values = this.tractData
                    .map(t => t[k])
                    .filter(v => typeof v === 'number' && !isNaN(v));

                this.cityStats[k] = {
                    values,
                    avg: values.reduce((a, b) => a + b, 0) / values.length
                };
                });

            
            if (this.tractData.length === 0) throw new Error('No valid tract data found');
            
            this.updateProgress('Initializing Mapbox...', 40);
            await this.initMapbox();
            
            this.updateProgress('Creating hexagonal grid...', 70);
            this.create3DLayer();
            
            this.updateProgress('Finalizing...', 90);
            this.setupInteractions();
            this.updateUI();
            
            setTimeout(() => {
                this.hideLoader();
                this.animate();
            }, 300);
            
            console.log(`✅ ${this.tractData.length} tracts visualized`);
        } catch (error) {
            console.error('❌', error);
            this.showError(error.message);
        }
    }

    async loadAllData() {
        const [geoRes, aggRes, skylineRes] = await Promise.all([
            fetch('data/nyc_fault_lines.geojson').catch(() => null),
            fetch('data/aggregated_data_json.json').catch(() => null),
            fetch('data/skyline_analytic_payload.json').catch(() => null)
        ]);

        const tractMap = new Map();

        // Parse GeoJSON
        if (geoRes?.ok) {
            const geojson = await geoRes.json();
            if (geojson.features) {
                geojson.features.forEach(feature => {
                    const geoid = feature.properties.GEOID;
                    const lat = parseFloat(feature.properties.INTPTLAT);
                    const lon = parseFloat(feature.properties.INTPTLON);
                    
                    if (geoid && !isNaN(lat) && !isNaN(lon)) {
                        tractMap.set(geoid, {
                            id: geoid,
                            lat,
                            lon,
                            geometry: feature.geometry
                        });
                    }
                });
                console.log(`✓ GeoJSON: ${tractMap.size} tracts`);
            }
        }

        // Parse skyline_analytic_payload.json
        if (skylineRes?.ok) {
            const skylineData = await skylineRes.json();
            Object.entries(skylineData).forEach(([geoid, data]) => {
                const tract = tractMap.get(geoid) || {};
                tractMap.set(geoid, {
                    ...tract,
                    id: geoid,
                    lon: data.lon ?? tract.lon,
                    lat: data.lat ?? tract.lat,
                    gmi: data.gmi ?? 0,
                    gmi_class: data.gmi_class,
                    rent: data.median_rent ?? 0,
                    income: data.median_household_income ?? 0,
                    rent_income_ratio: data.rent_income_ratio,
                    lai_gap: data.lai_gap,
                    displacement_risk: data.displacement_risk ?? 0
                });
            });
            console.log(`✓ Skyline payload: ${Object.keys(skylineData).length} records`);
        }

        // Parse aggregated_data_json.json
        if (aggRes?.ok) {
            const aggData = await aggRes.json();
            Object.entries(aggData).forEach(([geoid, data]) => {
                const tract = tractMap.get(geoid) || {};
                tractMap.set(geoid, {
                    ...tract,
                    id: geoid,
                    neighborhood: data.neighborhood,
                    borough: data.borough,
                    year: data.year,
                    rent: data.medianRent ?? tract.rent,
                    income: data.medianIncome ?? tract.income,
                    poverty_rate: data.povertyRate,
                    homeownership_rate: data.homeownershipRate,
                    gmi: data.gmi ?? tract.gmi,
                    dvi: data.dvi ?? tract.displacement_risk,
                    missing_middle: data.missingMiddle,
                    middle_income_affordable: data.middleIncomeAffordable,
                    local_affordability_mismatch: data.localAffordabilityMismatch,
                    federal_affordability_mismatch: data.federalAffordabilityMismatch,
                    false_affordability_zone: data.falseAffordabilityZone,
                    high_displacement_risk: data.highDisplacementRisk
                });
            });
            console.log(`✓ Aggregated data: ${Object.keys(aggData).length} records`);
        }

        // Filter valid tracts with coordinates
        this.tractData = Array.from(tractMap.values()).filter(t => t.lon && t.lat);
        console.log(`✓ Final dataset: ${this.tractData.length} complete tracts`);
        

    }

    async initMapbox() {
        mapboxgl.accessToken = this.mapboxToken;
        
        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-73.95, 40.73],
            zoom: 10.5,
            pitch: 60,
            bearing: -17.6,
            antialias: true
        });

        return new Promise((resolve) => {
            this.map.on('load', () => {
                console.log('✓ Mapbox initialized');
                resolve();
            });
        });
    }

    create3DLayer() {
        const modelOrigin = [-73.95, 40.73];
        const modelAltitude = 0;
        const modelRotate = [Math.PI / 2, 0, 0];
        const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
            modelOrigin,
            modelAltitude
        );
        const modelTransform = {
            translateX: modelAsMercatorCoordinate.x,
            translateY: modelAsMercatorCoordinate.y,
            translateZ: modelAsMercatorCoordinate.z,
            rotateX: modelRotate[0],
            rotateY: modelRotate[1],
            rotateZ: modelRotate[2],
            scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
        };

        const customLayer = {
            id: '3d-model',
            type: 'custom',
            renderingMode: '3d',
            onAdd: (map, gl) => {
                this.camera = new THREE.Camera();
                this.scene = new THREE.Scene();

                // Enhanced lighting
                this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

                const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
                dirLight.position.set(100, 200, 100).normalize();
                this.scene.add(dirLight);

                const pointLight1 = new THREE.PointLight(0x00ffff, 1.5, 6000);
                pointLight1.position.set(-2000, 1800, 2000);
                this.scene.add(pointLight1);

                const pointLight2 = new THREE.PointLight(0xff00ff, 1.5, 6000);
                pointLight2.position.set(2000, 1800, -2000);
                this.scene.add(pointLight2);

                const pointLight3 = new THREE.PointLight(0xffff00, 1.2, 5000);
                pointLight3.position.set(0, 2500, 0);
                this.scene.add(pointLight3);

                this.createHexagonalMesh();

                this.renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialias: true
                });
                this.renderer.autoClear = false;
                this.renderer.shadowMap.enabled = true;
                this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                this.renderer.toneMappingExposure = 1.4;
            },
            render: (gl, matrix) => {
                const rotationX = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(1, 0, 0),
                    modelTransform.rotateX
                );
                const rotationY = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 1, 0),
                    modelTransform.rotateY
                );
                const rotationZ = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(0, 0, 1),
                    modelTransform.rotateZ
                );

                const m = new THREE.Matrix4().fromArray(matrix);
                const l = new THREE.Matrix4()
                    .makeTranslation(
                        modelTransform.translateX,
                        modelTransform.translateY,
                        modelTransform.translateZ
                    )
                    .scale(
                        new THREE.Vector3(
                            modelTransform.scale,
                            -modelTransform.scale,
                            modelTransform.scale
                        )
                    )
                    .multiply(rotationX)
                    .multiply(rotationY)
                    .multiply(rotationZ);

                this.camera.projectionMatrix = m.multiply(l);
                
                const time = this.clock.getElapsedTime();
                if (this.instancedMesh?.material?.uniforms) {
                    this.instancedMesh.material.uniforms.time.value = time;
                    this.instancedMesh.material.uniforms.hoveredIndex.value = this.hoveredIndex;
                }
                
                this.renderer.resetState();
                this.renderer.render(this.scene, this.camera);
                this.map.triggerRepaint();
            }
        };

        this.map.addLayer(customLayer);
        console.log('✓ 3D hexagonal layer added');
    }

    createHexagonalMesh() {
        const count = this.tractData.length;
        
        // Create hexagonal prism geometry
        const hexGeo = new THREE.CylinderGeometry(1, 1, 1, 6);
        
        // Advanced shader with hover animation
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                hoveredIndex: { value: -1 }
            },
            vertexShader: `
                uniform float time;
                uniform float hoveredIndex;
                
                attribute float instanceId;
                
                varying vec3 vPos;
                varying vec3 vNorm;
                varying vec3 vColor;
                varying float vHovered;
                
                void main() {
                    vPos = position;
                    vNorm = normal;
                    vColor = instanceColor;
                    vHovered = (instanceId == hoveredIndex) ? 1.0 : 0.0;
                    
                    // Scale up on hover
                    vec3 scaledPos = position;
                    if (vHovered > 0.5) {
                        scaledPos *= 1.3;
                    }
                    
                    vec4 worldPos = instanceMatrix * vec4(scaledPos, 1.0);
                    gl_Position = projectionMatrix * modelViewMatrix * worldPos;
                }
            `,
            fragmentShader: `
                uniform float time;
                
                varying vec3 vPos;
                varying vec3 vNorm;
                varying vec3 vColor;
                varying float vHovered;
                
                void main() {
                    float heightFactor = (vPos.y + 0.5);
                    
                    // Vertical gradient glow
                    float glow = pow(heightFactor, 2.5) * 1.5;
                    
                    // Pulsing emissive
                    float pulse = sin(time * 2.0 + heightFactor * 3.0) * 0.2 + 0.8;
                    
                    // Animated scanlines
                    float scanline = sin(vPos.y * 100.0 + time * 3.0) * 0.1 + 0.9;
                    
                    // Fresnel edge glow
                    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
                    float fresnel = pow(1.0 - abs(dot(vNorm, viewDir)), 4.0);
                    float edgeGlow = fresnel * 0.8;
                    
                    // Extra glow on hover
                    float hoverGlow = vHovered * 0.5;
                    
                    vec3 finalColor = vColor * (glow + edgeGlow + hoverGlow) * scanline * pulse;
                    
                    // Brighter on hover
                    if (vHovered > 0.5) {
                        finalColor *= 1.5;
                    }
                    
                    gl_FragColor = vec4(finalColor, 0.9);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: true
        });

        this.instancedMesh = new THREE.InstancedMesh(hexGeo, mat, count);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        // Add instance IDs for hover detection
        const instanceIds = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            instanceIds[i] = i;
        }
        hexGeo.setAttribute('instanceId', new THREE.InstancedBufferAttribute(instanceIds, 1));

        const color = new THREE.Color();
        this.tractData.forEach((tract, i) => {
            const x = (tract.lon - (-73.95)) * 111320 * Math.cos(40.73 * Math.PI / 180);
            const z = (tract.lat - 40.73) * 111320;
            
            const gmi = tract.gmi ?? 0;
            const height = 80 + Math.abs(gmi) * 2200;
            
            this.dummy.position.set(x, height / 2, z);
            this.dummy.scale.set(75, height, 75); // Uniform hex size
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
            
            // Enhanced color coding
            if (gmi > 0.822) color.setHex(0xff0066);
            else if (gmi > 0.208) color.setHex(0xff6600);
            else if (gmi > 0.038) color.setHex(0xffcc00);
            else if (gmi > 0) color.setHex(0x00ff99);
            else color.setHex(0x00ccff);
            
            this.instancedMesh.setColorAt(i, color);
        });

        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
        }

        this.scene.add(this.instancedMesh);
        
        // Atmospheric effects
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(1200 * 3);
        for (let i = 0; i < 1200; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 28000;
            positions[i * 3 + 1] = Math.random() * 3500;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 28000;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particles = new THREE.Points(
            particleGeo,
            new THREE.PointsMaterial({
                color: 0x00ffff,
                size: 10,
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(particles);

        console.log(`✓ ${count} hexagonal instances`);
    }



    percentileRank(values, v) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = sorted.findIndex(x => x >= v);
        return index === -1 ? 100 : ((index + 1) / sorted.length * 100);
    }

    zScore(values, v) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sd = Math.sqrt(
            values.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / values.length
        );
        return sd === 0 ? 0 : (v - mean) / sd;
    }

    setupInteractions() {
        this.map.on('mousemove', (e) => this.onMouseMove(e));
        this.map.on('click', (e) => this.onClick(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === '1') this.map.flyTo({ center: [-73.95, 40.73], zoom: 10.5, pitch: 60, bearing: -17.6, duration: 2000 });
            if (e.key === '2') this.map.flyTo({ center: [-73.97, 40.78], zoom: 12, pitch: 65, bearing: 30, duration: 2000 });
            if (e.key === '3') this.map.flyTo({ center: [-73.87, 40.85], zoom: 12, pitch: 70, bearing: -45, duration: 2000 });
            if (e.key === '4') this.map.flyTo({ center: [-73.94, 40.65], zoom: 11, pitch: 60, bearing: 0, duration: 2000 });
            if (e.key === '5') this.map.flyTo({ center: [-73.82, 40.72], zoom: 11, pitch: 55, bearing: 90, duration: 2000 });
        });
    }
    


    onMouseMove(e) {
        const features = this.map.queryRenderedFeatures(e.point, { layers: ['3d-model'] });
        
        if (features.length > 0 && this.instancedMesh) {
            const rect = this.map.getCanvas().getBoundingClientRect();
            this.mouse.x = (e.point.x / rect.width) * 2 - 1;
            this.mouse.y = -(e.point.y / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.instancedMesh);

            if (intersects.length > 0) {
                const idx = intersects[0].instanceId;
                if (idx !== this.hoveredIndex && idx < this.tractData.length) {
                    this.hoveredIndex = idx;
                    this.showComprehensiveTooltip(this.tractData[idx], e.originalEvent);
                }
            } else if (this.hoveredIndex !== -1) {
                this.hoveredIndex = -1;
                this.hideTooltip();
            }
        } else if (this.hoveredIndex !== -1) {
            this.hoveredIndex = -1;
            this.hideTooltip();
        }
    }

            onClick(e) {
                if (this.hoveredIndex !== -1) {
                    console.log('Selected tract:', this.tractData[this.hoveredIndex]);
                }
            }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    showComprehensiveTooltip(tract, e) {
        let tooltip = document.getElementById('tract-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'tract-tooltip';
            tooltip.className = 'tract-tooltip';
            document.body.appendChild(tooltip);
        }

        const gmiClass = tract.gmi_class || (
            tract.gmi > 0.822 ? 'Critical Risk' :
            tract.gmi > 0.208 ? 'High Risk' :
            tract.gmi > 0.038 ? 'Moderate' :
            tract.gmi > 0 ? 'Low Pressure' : 'Stable/Improving'
        );

        tooltip.innerHTML = `
            

            <div style="border-bottom: 2px solid rgba(0,255,255,0.4); padding-bottom: 10px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: #00ffff; font-size: 1.1em;">${tract.neighborhood || 'NYC Census Tract'}</strong>
                    <span style="background: ${tract.gmi > 0.208 ? '#ff0066' : '#00ff99'}; color: #000; padding: 2px 8px; border-radius: 10px; font-size: 0.75em; font-weight: bold;">
                        ${gmiClass.toUpperCase()}
                    </span>
                </div>
                <div style="color: #999; font-size: 0.85em; margin-top: 5px;">
                    ${tract.borough || 'NYC'} • ${tract.id}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 0.85em; margin-bottom: 12px;">
                <div style="color: #7b7676;">GMI Score:</div>
                <div style="color: ${tract.gmi > 0.208 ? '#ff0066' : '#00ff99'}; font-weight: bold;">
                    ${(tract.gmi ?? 0).toFixed(3)}

                    
                </div>
                
                <div style="color: #888;">DVI Score:</div>
                <div style="color: #ffcc00; font-weight: bold;">
                    ${(tract.dvi ?? tract.displacement_risk ?? 0).toFixed(2)}
                </div>
                
                <div style="color: #888;">Median Income:</div>
                <div style="color: #00ffff;">${tract.income > 0 ? '$' + tract.income.toLocaleString() : 'N/A'}</div>
                
                <div style="color: #888;">Median Rent:</div>
                <div style="color: #ff6600;">${tract.rent > 0 ? '$' + tract.rent.toLocaleString() : 'N/A'}</div>
                
                <div style="color: #888;">Rent/Income:</div>
                <div style="color: ${(tract.rent_income_ratio ?? 0) > 0.3 ? '#ff0066' : '#00ff99'}; font-weight: bold;">
                    ${((tract.rent_income_ratio ?? 0) * 100).toFixed(1)}%
                </div>
                
                ${tract.poverty_rate ? `
                <div style="color: #888;">Poverty Rate:</div>
                <div style="color: #ff9900;">${(tract.poverty_rate * 100).toFixed(1)}%</div>
                ` : ''}
                
                ${tract.homeownership_rate ? `
                <div style="color: #888;">Homeownership:</div>
                <div style="color: #00ccff;">${(tract.homeownership_rate * 100).toFixed(1)}%</div>
                ` : ''}
            </div>
            
            ${tract.lai_gap ? `
            <div style="background: rgba(255,204,0,0.1); padding: 8px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #ffcc00;">
                <div style="font-size: 0.8em; color: #ffcc00; font-weight: bold;">LOCAL AFFORDABILITY GAP</div>
                <div style="font-size: 0.85em; color: #fff; margin-top: 4px;">
                    ${tract.lai_gap > 0 ? '+' : ''}$${Math.round(tract.lai_gap).toLocaleString()}
                </div>
            </div>
            ` : ''}
            
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">
                ${tract.high_displacement_risk ? '<span style="background: #ff0066; color: #000; padding: 3px 8px; border-radius: 8px; font-size: 0.75em; font-weight: bold;">🚨 HIGH RISK</span>' : ''}
                ${tract.false_affordability_zone ? '<span style="background: #ffcc00; color: #000; padding: 3px 8px; border-radius: 8px; font-size: 0.75em; font-weight: bold;">⚠️ FALSE AFFORDABILITY</span>' : ''}
                ${tract.missing_middle ? '<span style="background: #ff6600; color: #000; padding: 3px 8px; border-radius: 8px; font-size: 0.75em; font-weight: bold;">🏘️ MISSING MIDDLE</span>' : ''}
                ${tract.middle_income_affordable ? '<span style="background: #00ff99; color: #000; padding: 3px 8px; border-radius: 8px; font-size: 0.75em; font-weight: bold;">✓ MIDDLE INCOME OK</span>' : ''}
            </div>
        `;

        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY + 15}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('tract-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    }

    updateUI() {
        const highRisk = this.tractData.filter(t => (t.gmi ?? 0) > 0.208 || t.high_displacement_risk).length;
        const falseAffordability = this.tractData.filter(t => t.false_affordability_zone).length;
        const stats = document.querySelector('.stats-grid');
        if (stats) {
            stats.innerHTML = `
                <div class="stat">
                    <div class="stat-label">Total Tracts</div>
                    <div class="stat-value">${this.tractData.length}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">High-Risk</div>
                    <div class="stat-value">${highRisk}</div>
                </div>
            `;
        }
    }

    updateProgress(text, pct) {
        const el = document.querySelector('.progress-text');
        const bar = document.querySelector('.progress-bar');
        if (el) el.textContent = text;
        if (bar) bar.style.transform = `scaleX(${pct / 100})`;
    }

    hideLoader() {
        const loader = document.querySelector('.viz-loading');
        if (loader) {
            loader.style.transition = 'opacity 0.5s';
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }

    showError(msg) {
        const loader = document.querySelector('.viz-loading');
        if (loader) {
            loader.innerHTML = `<div style="color: #ff0066; font-size: 1.2rem;">❌ ${msg}</div>
                <p style="color: #ccc; margin-top: 15px; font-size: 0.9rem;">Check console for details</p>`;
        }
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.map) this.map.remove();
        if (this.scene) {
            this.scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
        }
    }




}

if (typeof window !== 'undefined') {
    window.EnhancedSkylineViz = EnhancedSkylineViz;
}

console.log(' Advanced Hexagonal Visualization Ready');