const socket = io();

let canvas, ctx;
let isDrawing = false;
let currentLayerIndex = -1;
let networkLayers = [];

// Global context state for AI assistant
let appContext = {
    hasDrawing: false,
    lastPrediction: null,
    currentTraining: {
        isTraining: false,
        epochs: 5,
        learningRate: 0.001,
        currentEpoch: 0,
        currentBatch: 0,
        lastLoss: null,
        lastAccuracy: null
    },
    lastProcessing: {
        isProcessing: false,
        currentLayer: null,
        layerIndex: -1,
        activations: {}
    },
    openInfoModals: [],
    userInteractions: [],
    chatHistory: [],
    liveExplanationHistory: []
};

// Info content for all UI elements
const infoContent = {
    'clear-canvas': {
        title: 'Clear Canvas',
        content: `
            <h4>What it does:</h4>
            <p>Clears the drawing canvas so you can start fresh with a new digit.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> An eraser that wipes your whiteboard clean so you can draw something new.
            </div>
        `
    },
    'process-image': {
        title: 'Process Through CNN',
        content: `
            <h4>What it does:</h4>
            <p>Sends your drawing through the Convolutional Neural Network to see how it recognizes the digit you drew.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> Feeding your drawing into a smart machine that examines it layer by layer, like a detective looking for clues to identify what number you wrote.
            </div>
            
            <div class="example">
                <strong>What you'll see:</strong> The network will process your image step-by-step, showing how each layer transforms and analyzes your drawing until it makes a final prediction.
            </div>
        `
    },
    'upload-image': {
        title: 'Upload Image',
        content: `
            <h4>What it does:</h4>
            <p>Lets you upload an image file from your computer instead of drawing on the canvas.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> Bringing a photo to show the AI, instead of drawing something yourself. The AI will still analyze it the same way.
            </div>
            
            <div class="example">
                <strong>Best images:</strong> Clear, simple images with digits (0-9) work best. The AI was trained to recognize handwritten numbers.
            </div>
        `
    },
    'epochs': {
        title: 'Epochs - Training Rounds',
        content: `
            <h4>What it does:</h4>
            <p>An epoch is one complete pass through all the training data. More epochs = more learning time.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> Reading a textbook multiple times. The first time you might understand 30%, the second time 60%, and so on. Each complete read-through is like one epoch.
            </div>
            
            <div class="example">
                <strong>In practice:</strong> 
                <br>• 1 epoch = quick learning, might not be enough
                <br>• 5 epochs = good balance of learning and time
                <br>• 20 epochs = very thorough learning, but takes longer
            </div>
        `
    },
    'learning-rate': {
        title: 'Learning Rate - How Fast to Learn',
        content: `
            <h4>What it does:</h4>
            <p>Controls how big steps the AI takes when learning from mistakes. Higher = faster learning, but might overshoot the best answer.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> Learning to ride a bike. A high learning rate is like making big adjustments to your balance - you might learn faster but risk overcorrecting and falling. A low learning rate is like making tiny adjustments - safer but slower to learn.
            </div>
            
            <div class="example">
                <strong>Common values:</strong>
                <br>• 0.1 = Very fast learning (might be unstable)
                <br>• 0.001 = Steady, reliable learning (recommended)
                <br>• 0.0001 = Very slow but safe learning
            </div>
        `
    },
    'start-training': {
        title: 'Start Training',
        content: `
            <h4>What it does:</h4>
            <p>Begins teaching the neural network to recognize digits by showing it many examples and correcting its mistakes.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> Teaching a child to recognize letters by showing them flashcards over and over, correcting them when they're wrong, until they get really good at it.
            </div>
            
            <div class="example">
                <strong>What you'll see:</strong> 
                <br>• Loss going down (fewer mistakes)
                <br>• Accuracy going up (more correct guesses)
                <br>• Real-time updates as the AI learns
            </div>
        `
    },
    'loss': {
        title: 'Loss - How Wrong the AI Is',
        content: `
            <h4>What it measures:</h4>
            <p>Loss measures how far off the AI's guesses are from the correct answers. Lower loss = better performance.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> A golf score - lower is better! If you're aiming for the hole and miss by 10 feet, that's a high "loss". If you miss by 1 inch, that's a very low "loss".
            </div>
            
            <div class="example">
                <strong>Typical values:</strong>
                <br>• 2.3 = Random guessing (very bad)
                <br>• 0.5 = Getting better
                <br>• 0.05 = Very good performance
            </div>
        `
    },
    'accuracy': {
        title: 'Accuracy - How Often the AI is Right',
        content: `
            <h4>What it measures:</h4>
            <p>Accuracy shows the percentage of correct predictions. Higher accuracy = better performance.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> A test score in school. If you get 9 out of 10 questions right, your accuracy is 90%. If you get 5 out of 10 right, your accuracy is 50%.
            </div>
            
            <div class="example">
                <strong>Typical values:</strong>
                <br>• 10% = Random guessing (terrible)
                <br>• 50% = Getting somewhere
                <br>• 95% = Excellent performance
            </div>
        `
    },
    'chat-assistant': {
        title: 'AI Chat Assistant',
        content: `
            <h4>What it does:</h4>
            <p>Your smart assistant that can see everything happening with the CNN in real-time and answer your questions using advanced AI.</p>
            
            <div class="analogy">
                <strong>Think of it like:</strong> Having a knowledgeable tutor sitting next to you who can see your screen and explain anything you're curious about.
            </div>
            
            <div class="example">
                <strong>What it knows:</strong>
                <br>• Your current drawings and predictions
                <br>• Training progress and metrics
                <br>• Layer activations and processing
                <br>• All parameter settings
                <br>• Which info modals you've opened
                
                <br><br><strong>Try asking:</strong>
                <br>• "Why did it predict 8 instead of 3?"
                <br>• "What's happening in the conv layers?"
                <br>• "Should I increase the learning rate?"
                <br>• "Explain this layer's activation pattern"
            </div>
        `
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    initializeNetworkVisualization();
    setupEventListeners();
    setupSocketListeners();
    setupInfoModal();
});

function initializeCanvas() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

function initializeNetworkVisualization() {
    networkLayers = [
        { name: 'Input', type: 'input', size: '28×28×1', description: 'Original image data' },
        { name: 'Conv1', type: 'conv', size: '26×26×32', description: '32 filters, 3×3 kernel' },
        { name: 'Pool1', type: 'pool', size: '13×13×32', description: '2×2 max pooling' },
        { name: 'Conv2', type: 'conv', size: '11×11×64', description: '64 filters, 3×3 kernel' },
        { name: 'Pool2', type: 'pool', size: '5×5×64', description: '2×2 max pooling' },
        { name: 'Dense', type: 'dense', size: '128', description: '128 neurons' },
        { name: 'Output', type: 'output', size: '10', description: '10 classes (0-9)' }
    ];
    
    renderNetworkVisualization();
}

function renderNetworkVisualization() {
    const networkViz = document.getElementById('networkVisualization');
    networkViz.innerHTML = '';
    
    networkLayers.forEach((layer, index) => {
        const layerNode = document.createElement('div');
        layerNode.className = 'layer-node';
        layerNode.setAttribute('data-layer-index', index);
        
        const layerShape = document.createElement('div');
        layerShape.className = `layer-shape ${layer.type}`;
        layerShape.textContent = layer.name;
        
        const layerInfo = document.createElement('div');
        layerInfo.className = 'layer-info';
        layerInfo.innerHTML = `
            <div class="layer-name">${layer.name}</div>
            <div class="layer-details">${layer.size}</div>
        `;
        
        layerNode.appendChild(layerShape);
        layerNode.appendChild(layerInfo);
        
        layerNode.addEventListener('mouseenter', (e) => showTooltip(e, layer.description));
        layerNode.addEventListener('mouseleave', hideTooltip);
        
        networkViz.appendChild(layerNode);
        
        if (index < networkLayers.length - 1) {
            const connection = document.createElement('div');
            connection.className = 'connection';
            networkViz.appendChild(connection);
        }
    });
}

function setupEventListeners() {
    document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
    document.getElementById('processImage').addEventListener('click', processImage);
    document.getElementById('startTraining').addEventListener('click', startTraining);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    
    // Chat functionality
    document.getElementById('sendChatMessage').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

function setupInfoModal() {
    // Setup info button click handlers
    document.querySelectorAll('.info-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const infoKey = button.getAttribute('data-info');
            showInfoModal(infoKey);
        });
    });
    
    // Setup modal close handlers
    document.getElementById('closeInfoModal').addEventListener('click', hideInfoModal);
    document.getElementById('infoModal').addEventListener('click', (e) => {
        if (e.target.id === 'infoModal') {
            hideInfoModal();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideInfoModal();
        }
    });
}

function showInfoModal(infoKey) {
    const modal = document.getElementById('infoModal');
    const title = document.getElementById('infoModalTitle');
    const body = document.getElementById('infoModalBody');
    
    const info = infoContent[infoKey];
    if (info) {
        title.textContent = info.title;
        body.innerHTML = info.content;
        modal.classList.add('show');
        
        // Track for context
        trackUserInteraction('info_modal_opened', { infoKey, title: info.title });
        appContext.openInfoModals.push(infoKey);
    }
}

function hideInfoModal() {
    document.getElementById('infoModal').classList.remove('show');
}

function updateLiveExplanation(text, type = 'info') {
    const explanationContent = document.querySelector('.explanation-content');
    let icon = '🤖';
    
    switch(type) {
        case 'training': icon = '🎯'; break;
        case 'processing': icon = '⚡'; break;
        case 'success': icon = '✅'; break;
        case 'thinking': icon = '🧠'; break;
        default: icon = '🤖';
    }
    
    explanationContent.innerHTML = `
        <div class="step-indicator">${icon} Live Status</div>
        <p>${text}</p>
    `;
    
    // Track live explanation messages for AI context
    const explanationEntry = {
        timestamp: Date.now(),
        type: type,
        text: text,
        icon: icon
    };
    
    appContext.liveExplanationHistory.push(explanationEntry);
    
    // Keep only last 20 explanations to prevent memory bloat
    if (appContext.liveExplanationHistory.length > 20) {
        appContext.liveExplanationHistory.shift();
    }
}

// Context tracking functions
function trackUserInteraction(action, data = {}) {
    const interaction = {
        timestamp: Date.now(),
        action: action,
        data: data
    };
    appContext.userInteractions.push(interaction);
    
    // Keep only last 50 interactions to prevent memory bloat
    if (appContext.userInteractions.length > 50) {
        appContext.userInteractions.shift();
    }
}

// Chat functionality
function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Update chat status
    updateChatStatus('AI is thinking...', 'thinking');
    
    // Track interaction
    trackUserInteraction('chat_message_sent', { message });
    
    // Send to backend with full context
    socket.emit('chat-message', {
        message: message,
        context: getCurrentContext()
    });
}

function addChatMessage(message, sender = 'ai') {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const avatar = sender === 'ai' ? '🤖' : '👤';
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message}</p>
            <div class="message-time">${timestamp}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Track in context
    appContext.chatHistory.push({ sender, message, timestamp: Date.now() });
}

function updateChatStatus(text, type = 'ready') {
    const chatStatus = document.getElementById('chatStatus');
    let icon = '💬';
    
    switch(type) {
        case 'thinking': icon = '🤔'; break;
        case 'error': icon = '❌'; break;
        case 'ready': icon = '✅'; break;
    }
    
    chatStatus.innerHTML = `${icon} ${text}`;
}

function getCurrentContext() {
    // Update current parameter values
    appContext.currentTraining.epochs = parseInt(document.getElementById('epochs').value);
    appContext.currentTraining.learningRate = parseFloat(document.getElementById('learningRate').value);
    
    return {
        appContext: appContext,
        networkLayers: networkLayers,
        currentLayerIndex: currentLayerIndex,
        canvasHasDrawing: appContext.hasDrawing,
        timestamp: Date.now()
    };
}

function setupSocketListeners() {
    socket.on('processing-start', (data) => {
        updateProcessingStatus('Processing started...', 0);
        updateLiveExplanation('🔍 Starting to analyze your drawing! The CNN will examine it layer by layer to figure out what digit you drew.', 'processing');
        resetNetworkVisualization();
        
        // Update context
        appContext.lastProcessing.isProcessing = true;
        trackUserInteraction('processing_started');
    });
    
    socket.on('layer-processing-start', (data) => {
        updateProcessingStatus(`Processing ${data.layer.name}...`, data.progress);
        highlightLayer(data.layerIndex);
        createLayerDetailCard(data.layer, data.layerIndex);
        
        // Live explanations for each layer type
        let explanation = '';
        switch(data.layer.type) {
            case 'convolution':
                explanation = `🔍 <strong>Convolution layer</strong> is scanning your image with ${data.layer.filters || 32} different filters, looking for patterns like edges, curves, and shapes. Think of it like having multiple magnifying glasses, each looking for different features.`;
                break;
            case 'maxpooling':
                explanation = `📏 <strong>Pooling layer</strong> is shrinking the image while keeping the important information. It's like taking a high-resolution photo and making a smaller version that still shows all the key details.`;
                break;
            case 'flatten':
                explanation = `📋 <strong>Flatten layer</strong> is converting the 2D image data into a long list of numbers, preparing it for the final decision-making layers. Like unrolling a carpet to see all the pattern details in a line.`;
                break;
            case 'dense':
                explanation = `🧠 <strong>Dense layer</strong> is making connections between all the features found earlier. These neurons are like a committee discussing what digit this might be based on all the patterns they've seen.`;
                break;
            default:
                explanation = `⚡ Processing through <strong>${data.layer.name}</strong> layer...`;
        }
        updateLiveExplanation(explanation, 'processing');
    });
    
    socket.on('filter-activation', (data) => {
        animateFilterActivation(data);
    });
    
    socket.on('layer-processing-complete', (data) => {
        completeLayerProcessing(data);
        updateLayerDetailCard(data);
    });
    
    socket.on('processing-complete', (data) => {
        updateProcessingStatus('Processing complete!', 100);
        displayPredictions(data.predictions);
        resetNetworkVisualization();
        
        const predictedDigit = data.predictedClass;
        const confidence = (data.confidence * 100).toFixed(1);
        updateLiveExplanation(`🎉 <strong>Analysis complete!</strong> The CNN thinks your drawing is the digit <strong>${predictedDigit}</strong> with ${confidence}% confidence. Look at the prediction bars below to see how confident it is about each possible digit.`, 'success');
        
        // Update context
        appContext.lastProcessing.isProcessing = false;
        appContext.lastPrediction = {
            predictedClass: predictedDigit,
            confidence: data.confidence,
            predictions: data.predictions
        };
        trackUserInteraction('processing_completed', data);
    });
    
    socket.on('training-epoch-start', (data) => {
        updateLiveExplanation(`📚 <strong>Training Epoch ${data.epoch}/${data.total}</strong> - The AI is about to see a bunch of example images and learn from its mistakes. Think of this like studying flashcards!`, 'training');
    });
    
    socket.on('training-step', (data) => {
        updateTrainingMetrics(data.loss, data.accuracy);
        updateLiveExplanation(`🎯 <strong>Learning in progress...</strong> Epoch ${data.epoch}, Batch ${data.batch}. Loss: ${data.loss} (lower is better), Accuracy: ${data.accuracy} (higher is better). The AI is getting smarter with each example!`, 'training');
        
        // Update context
        appContext.currentTraining.currentEpoch = data.epoch;
        appContext.currentTraining.currentBatch = data.batch;
        appContext.currentTraining.lastLoss = data.loss;
        appContext.currentTraining.lastAccuracy = data.accuracy;
    });
    
    socket.on('training-epoch-complete', (data) => {
        updateLiveExplanation(`✅ <strong>Epoch ${data.epoch} completed!</strong> The AI has seen all the training examples once. Average loss: ${data.avgLoss}, Average accuracy: ${data.avgAccuracy}. Ready for the next round of learning!`, 'training');
    });
    
    socket.on('training-complete', (data) => {
        updateProcessingStatus(data.message, 100);
        showSuccessMessage('Training completed successfully!');
        updateLiveExplanation(`🏆 <strong>Training finished!</strong> The AI has learned to recognize digits! Final performance: Loss ${data.finalLoss}, Accuracy ${data.finalAccuracy}. Now try drawing a digit to test what it learned!`, 'success');
        
        // Update context
        appContext.currentTraining.isTraining = false;
        trackUserInteraction('training_completed', data);
    });
    
    // Chat response handler
    socket.on('chat-response', (data) => {
        if (data.error) {
            addChatMessage('Sorry, I encountered an error processing your message. Please try again.', 'ai');
            updateChatStatus('Error occurred', 'error');
        } else {
            addChatMessage(data.response, 'ai');
            updateChatStatus('Ready to help!', 'ready');
        }
    });
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Update context - user is drawing
    if (!appContext.hasDrawing) {
        appContext.hasDrawing = true;
        trackUserInteraction('started_drawing');
    }
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (e.type === 'touchstart') {
        isDrawing = true;
    }
    
    if (isDrawing) {
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('predictions').innerHTML = '';
    document.getElementById('layerDetails').innerHTML = '';
    resetNetworkVisualization();
    updateLiveExplanation('🧹 Canvas cleared! Draw a digit (0-9) and then click "Process Through CNN" to see how the AI recognizes it.', 'info');
    
    // Update context
    appContext.hasDrawing = false;
    appContext.lastPrediction = null;
    trackUserInteraction('canvas_cleared');
}

function processImage() {
    const imageData = canvas.toDataURL();
    socket.emit('process-image', imageData);
    
    updateLiveExplanation('🚀 <strong>Starting CNN analysis!</strong> Your drawing is being sent through the neural network. Watch as each layer processes and transforms your image to recognize what digit you drew.', 'thinking');
    
    const btn = document.getElementById('processImage');
    btn.disabled = true;
    btn.textContent = '🔄 Processing...';
    
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🚀 Process Through CNN';
    }, 3000);
}

function startTraining() {
    const epochs = document.getElementById('epochs').value;
    const learningRate = document.getElementById('learningRate').value;
    
    updateLiveExplanation(`🎓 <strong>Starting AI training!</strong> The neural network will study ${epochs} rounds of example images, learning to recognize digits. Learning rate: ${learningRate} (how big steps it takes when learning). This is like teaching a student with flashcards!`, 'training');
    
    socket.emit('start-training', {
        epochs: parseInt(epochs),
        learningRate: parseFloat(learningRate)
    });
    
    // Update context
    appContext.currentTraining.isTraining = true;
    appContext.currentTraining.epochs = parseInt(epochs);
    appContext.currentTraining.learningRate = parseFloat(learningRate);
    trackUserInteraction('training_started', { epochs, learningRate });
    
    const btn = document.getElementById('startTraining');
    btn.disabled = true;
    btn.textContent = '🏃‍♂️ Training...';
    
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🏃‍♂️ Start Training';
    }, 5000);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        updateLiveExplanation('📁 <strong>Image uploaded!</strong> Your image has been loaded onto the canvas. Now click "Process Through CNN" to see how the AI analyzes it. For best results, use clear images of single digits (0-9).', 'info');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function updateProcessingStatus(text, progress) {
    document.querySelector('.status-text').textContent = text;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

function highlightLayer(layerIndex) {
    const layers = document.querySelectorAll('.layer-shape');
    layers.forEach((layer, index) => {
        layer.classList.remove('processing');
        if (index === layerIndex) {
            layer.classList.add('processing');
        }
    });
    
    currentLayerIndex = layerIndex;
}

function resetNetworkVisualization() {
    const layers = document.querySelectorAll('.layer-shape');
    layers.forEach(layer => {
        layer.classList.remove('processing');
    });
    currentLayerIndex = -1;
}

function createLayerDetailCard(layer, layerIndex) {
    const layerDetails = document.getElementById('layerDetails');
    
    const card = document.createElement('div');
    card.className = 'layer-detail-card';
    card.id = `layer-card-${layerIndex}`;
    
    card.innerHTML = `
        <h4>${layer.name} Layer</h4>
        <p><strong>Type:</strong> ${layer.type}</p>
        <p><strong>Output Size:</strong> ${layer.outputSize}</p>
        <div class="processing-indicator">Processing...</div>
    `;
    
    layerDetails.appendChild(card);
}

function updateLayerDetailCard(data) {
    const card = document.getElementById(`layer-card-${data.layerIndex}`);
    if (card) {
        const processingIndicator = card.querySelector('.processing-indicator');
        processingIndicator.innerHTML = `
            <p><strong>Computation Time:</strong> ${data.computationTime.toFixed(2)}ms</p>
            <div class="activation-viz" id="activation-${data.layerIndex}"></div>
        `;
        
        if (data.activationData && data.activationData.length > 0) {
            renderActivationVisualization(data.layerIndex, data.activationData);
        }
    }
}

function renderActivationVisualization(layerIndex, activationData) {
    const container = document.getElementById(`activation-${layerIndex}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    activationData.slice(0, 32).forEach(activation => {
        const cell = document.createElement('div');
        cell.className = 'activation-cell';
        const intensity = Math.min(255, Math.max(0, activation * 255));
        cell.style.backgroundColor = `rgba(76, 175, 80, ${activation})`;
        container.appendChild(cell);
    });
}

function animateFilterActivation(data) {
    const layerCard = document.getElementById(`layer-card-${data.layerIndex}`);
    if (layerCard) {
        layerCard.style.borderLeftColor = `hsl(${data.activation * 120}, 70%, 50%)`;
        layerCard.classList.add('processing-animation');
        
        setTimeout(() => {
            layerCard.classList.remove('processing-animation');
        }, 500);
    }
}

function completeLayerProcessing(data) {
    const layerShape = document.querySelector(`[data-layer-index="${data.layerIndex}"] .layer-shape`);
    if (layerShape) {
        layerShape.classList.remove('processing');
        layerShape.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.6)';
        
        setTimeout(() => {
            layerShape.style.boxShadow = '';
        }, 1000);
    }
}

function displayPredictions(predictions) {
    const predictionsContainer = document.getElementById('predictions');
    predictionsContainer.innerHTML = '';
    
    const classes = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    predictions.forEach((probability, index) => {
        const predictionBar = document.createElement('div');
        predictionBar.className = 'prediction-bar';
        
        predictionBar.innerHTML = `
            <div class="prediction-label">${classes[index]}</div>
            <div class="prediction-fill-container">
                <div class="prediction-fill" style="width: ${probability * 100}%">
                    ${(probability * 100).toFixed(1)}%
                </div>
            </div>
        `;
        
        predictionsContainer.appendChild(predictionBar);
    });
    
    setTimeout(() => {
        const maxPrediction = Math.max(...predictions);
        const bestClass = predictions.indexOf(maxPrediction);
        showSuccessMessage(`Predicted: ${classes[bestClass]} (${(maxPrediction * 100).toFixed(1)}% confidence)`);
    }, 500);
}

function updateTrainingMetrics(loss, accuracy) {
    document.getElementById('currentLoss').textContent = loss;
    document.getElementById('currentAccuracy').textContent = accuracy;
    
    animateMetricUpdate('currentLoss');
    animateMetricUpdate('currentAccuracy');
}

function animateMetricUpdate(elementId) {
    const element = document.getElementById(elementId);
    element.style.transform = 'scale(1.1)';
    element.style.color = '#4CAF50';
    
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.color = '#2c3e50';
    }, 300);
}

function showTooltip(e, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = text;
    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top = e.pageY + 10 + 'px';
    tooltip.classList.add('show');
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('show');
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #4CAF50, #45a049);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.5s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);