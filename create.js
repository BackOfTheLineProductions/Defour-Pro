// Create Page JavaScript for DefourPro

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeSliders();
    initializeTimeline();
    initializeAutoSave();
    initializeKeyframeEditor();
});

// Tab switching functionality
function initializeTabs() {
    // Parameters panel tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show target tab content
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });

    // Advanced panel tabs
    const advancedTabs = document.querySelectorAll('.advanced-tab');
    const advancedContents = document.querySelectorAll('.advanced-content');

    advancedTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remove active class from all tabs
            advancedTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Hide all tab contents
            advancedContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show target tab content
            const targetContent = document.getElementById(`${targetTab}-content`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
}

// Slider value display
function initializeSliders() {
    const sliders = document.querySelectorAll('.param-slider');
    
    sliders.forEach(slider => {
        const updateValue = () => {
            const section = slider.closest('.param-section');
            const valueDisplay = section.querySelector('.param-value');
            if (valueDisplay) {
                let value = slider.value;
                // Format value based on range
                if (slider.max > 10) {
                    value = Math.round(value);
                } else {
                    value = parseFloat(value).toFixed(1);
                }
                valueDisplay.textContent = value;
            }
        };
        
        slider.addEventListener('input', updateValue);
        updateValue(); // Set initial value
    });
}

// Timeline functionality
function initializeTimeline() {
    const timeline = document.querySelector('.timeline-canvas');
    if (!timeline) return;

    const playhead = document.querySelector('.playhead');
    const keyframes = document.querySelectorAll('.keyframe');
    
    // Playhead dragging
    let isDraggingPlayhead = false;
    
    if (playhead) {
        playhead.addEventListener('mousedown', (e) => {
            isDraggingPlayhead = true;
            e.preventDefault();
        });
    }
    
    document.addEventListener('mousemove', (e) => {
        if (isDraggingPlayhead && playhead) {
            const rect = timeline.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const percentage = (x / rect.width) * 100;
            playhead.style.left = `${percentage}%`;
            
            // Update frame display
            updateFrameDisplay(percentage);
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDraggingPlayhead = false;
    });
    
    // Keyframe dragging
    keyframes.forEach(keyframe => {
        let isDraggingKeyframe = false;
        let startX = 0;
        let startLeft = 0;
        
        keyframe.addEventListener('mousedown', (e) => {
            if (e.target.closest('.keyframe-marker')) {
                isDraggingKeyframe = true;
                startX = e.clientX;
                startLeft = parseFloat(keyframe.style.left);
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDraggingKeyframe) {
                const rect = timeline.getBoundingClientRect();
                const deltaX = e.clientX - startX;
                const deltaPercentage = (deltaX / rect.width) * 100;
                let newLeft = startLeft + deltaPercentage;
                newLeft = Math.max(0, Math.min(newLeft, 100));
                keyframe.style.left = `${newLeft}%`;
                
                // Update frame number
                const maxFrames = 120; // Get from settings
                const frame = Math.round((newLeft / 100) * maxFrames);
                keyframe.dataset.frame = frame;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDraggingKeyframe) {
                isDraggingKeyframe = false;
                // Save keyframe position
                saveProjectData();
            }
        });
        
        // Keyframe click to select
        keyframe.addEventListener('click', (e) => {
            if (!isDraggingKeyframe) {
                selectKeyframe(keyframe);
            }
        });
    });
    
    // Timeline playback controls
    const playButton = document.querySelector('.timeline-controls-bottom .btn-icon-sm');
    if (playButton) {
        let isPlaying = false;
        let playInterval;
        
        playButton.addEventListener('click', () => {
            isPlaying = !isPlaying;
            
            if (isPlaying) {
                playButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="3" y="2" width="4" height="12"/>
                        <rect x="9" y="2" width="4" height="12"/>
                    </svg>
                `;
                
                // Animate playhead
                playInterval = setInterval(() => {
                    let currentLeft = parseFloat(playhead.style.left || 0);
                    currentLeft += 0.5;
                    
                    if (currentLeft >= 100) {
                        currentLeft = 0;
                        isPlaying = false;
                        clearInterval(playInterval);
                        playButton.innerHTML = `
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 2l10 6-10 6z"/>
                            </svg>
                        `;
                    }
                    
                    playhead.style.left = `${currentLeft}%`;
                    updateFrameDisplay(currentLeft);
                }, 50);
            } else {
                clearInterval(playInterval);
                playButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 2l10 6-10 6z"/>
                    </svg>
                `;
            }
        });
    }
}

// Update frame display in preview info
function updateFrameDisplay(percentage) {
    const maxFrames = 120; // Get from settings
    const fps = 24; // Get from settings
    const currentFrame = Math.round((percentage / 100) * maxFrames);
    const currentTime = currentFrame / fps;
    const totalTime = maxFrames / fps;
    
    const frameDisplay = document.querySelector('.preview-info span:first-child strong');
    const timeDisplay = document.querySelector('.preview-info span:nth-child(2) strong');
    
    if (frameDisplay) {
        frameDisplay.textContent = `${currentFrame} / ${maxFrames}`;
    }
    if (timeDisplay) {
        timeDisplay.textContent = `${currentTime.toFixed(2)}s / ${totalTime.toFixed(2)}s`;
    }
}

// Select keyframe
function selectKeyframe(keyframe) {
    // Remove selection from all keyframes
    document.querySelectorAll('.keyframe').forEach(kf => {
        kf.classList.remove('selected');
    });
    
    // Add selection to clicked keyframe
    keyframe.classList.add('selected');
    
    // Load keyframe data into parameters panel
    // This would populate the form fields with the keyframe's settings
    console.log('Selected keyframe at frame:', keyframe.dataset.frame);
}

// Keyframe editor
function initializeKeyframeEditor() {
    const addKeyframeBtn = document.querySelector('.timeline-controls .btn-primary');
    
    if (addKeyframeBtn) {
        addKeyframeBtn.addEventListener('click', () => {
            addKeyframe();
        });
    }
}

function addKeyframe() {
    const playhead = document.querySelector('.playhead');
    const promptTrack = document.querySelector('.timeline-track .track-content');
    
    if (!playhead || !promptTrack) return;
    
    const playheadPosition = parseFloat(playhead.style.left || 0);
    const maxFrames = 120;
    const frame = Math.round((playheadPosition / 100) * maxFrames);
    
    // Create new keyframe
    const keyframe = document.createElement('div');
    keyframe.className = 'keyframe';
    keyframe.style.left = `${playheadPosition}%`;
    keyframe.dataset.frame = frame;
    keyframe.innerHTML = `
        <div class="keyframe-marker"></div>
        <div class="keyframe-tooltip">Frame ${frame}: New keyframe</div>
    `;
    
    promptTrack.appendChild(keyframe);
    
    // Re-initialize timeline to add event listeners to new keyframe
    initializeTimeline();
    
    // Show success message
    if (window.DefourPro) {
        window.DefourPro.showToast(`Keyframe added at frame ${frame}`, 'success');
    }
    
    // Save project
    saveProjectData();
}

// Auto-save functionality
function initializeAutoSave() {
    let saveTimeout;
    const saveIndicator = document.querySelector('.save-indicator');
    
    // Watch for changes in input fields
    const inputs = document.querySelectorAll('.param-input, .param-select, .param-textarea, .param-slider');
    
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            
            if (saveIndicator) {
                saveIndicator.classList.remove('saved');
                saveIndicator.classList.add('saving');
                saveIndicator.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="6"/>
                    </svg>
                    Saving...
                `;
            }
            
            // Save after 1 second of no changes
            saveTimeout = setTimeout(() => {
                saveProjectData();
            }, 1000);
        });
    });
    
    // Watch project name changes
    const projectNameInput = document.querySelector('.project-name-input');
    if (projectNameInput) {
        projectNameInput.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveProjectData();
            }, 1000);
        });
    }
}

function saveProjectData() {
    const saveIndicator = document.querySelector('.save-indicator');
    
    // Collect all project data
    const projectData = {
        name: document.querySelector('.project-name-input')?.value || 'Untitled Project',
        timestamp: new Date().toISOString(),
        parameters: collectParameters(),
        keyframes: collectKeyframes()
    };
    
    // Save to localStorage (in production, this would be an API call)
    if (window.DefourPro) {
        window.DefourPro.storage.set('current_project', projectData);
    }
    
    // Update save indicator
    if (saveIndicator) {
        saveIndicator.classList.remove('saving');
        saveIndicator.classList.add('saved');
        saveIndicator.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13.33 4L6 11.33L2.67 8"/>
            </svg>
            Saved
        `;
    }
}

function collectParameters() {
    const params = {};
    
    document.querySelectorAll('.param-input, .param-select, .param-textarea').forEach(input => {
        if (input.id || input.name) {
            params[input.id || input.name] = input.value;
        }
    });
    
    document.querySelectorAll('.param-slider').forEach(slider => {
        if (slider.id || slider.name) {
            params[slider.id || slider.name] = slider.value;
        }
    });
    
    return params;
}

function collectKeyframes() {
    const keyframes = [];
    
    document.querySelectorAll('.keyframe').forEach(kf => {
        keyframes.push({
            frame: parseInt(kf.dataset.frame),
            position: kf.style.left,
            type: kf.classList.contains('camera') ? 'camera' : 'prompt'
        });
    });
    
    return keyframes;
}

// Render button functionality
document.addEventListener('DOMContentLoaded', () => {
    const renderButton = document.querySelector('.create-toolbar .btn-primary');
    
    if (renderButton) {
        renderButton.addEventListener('click', () => {
            // Validate parameters
            const prompt = document.querySelector('.param-textarea')?.value;
            
            if (!prompt || prompt.trim() === '') {
                if (window.DefourPro) {
                    window.DefourPro.showToast('Please enter a prompt before rendering', 'warning');
                }
                return;
            }
            
            // In production, this would submit to render queue
            if (window.DefourPro) {
                window.DefourPro.showToast('Video added to render queue!', 'success');
            }
            
            // Redirect to render queue
            setTimeout(() => {
                window.location.href = 'render-queue.html';
            }, 1500);
        });
    }
});

// Zoom controls for timeline
document.addEventListener('DOMContentLoaded', () => {
    const zoomInBtn = document.querySelector('.zoom-controls .btn-icon-sm:last-child');
    const zoomOutBtn = document.querySelector('.zoom-controls .btn-icon-sm:first-child');
    const zoomLevel = document.querySelector('.zoom-level');
    
    let currentZoom = 100;
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentZoom = Math.min(currentZoom + 25, 400);
            updateZoom(currentZoom, zoomLevel);
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            currentZoom = Math.max(currentZoom - 25, 50);
            updateZoom(currentZoom, zoomLevel);
        });
    }
});

function updateZoom(zoom, display) {
    if (display) {
        display.textContent = `${zoom}%`;
    }
    
    const timelineCanvas = document.querySelector('.timeline-canvas');
    if (timelineCanvas) {
        // In a real implementation, this would scale the timeline
        console.log('Zoom level:', zoom);
    }
}
