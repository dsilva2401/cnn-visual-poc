const socket = io();

let canvas, ctx;
let isDrawing = false;
let currentLayerIndex = -1;
let networkLayers = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    initializeNetworkVisualization();
    setupEventListeners();
    setupSocketListeners();
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
}

function setupSocketListeners() {
    socket.on('processing-start', (data) => {
        updateProcessingStatus('Processing started...', 0);
        resetNetworkVisualization();
    });
    
    socket.on('layer-processing-start', (data) => {
        updateProcessingStatus(`Processing ${data.layer.name}...`, data.progress);
        highlightLayer(data.layerIndex);
        createLayerDetailCard(data.layer, data.layerIndex);
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
    });
    
    socket.on('training-step', (data) => {
        updateTrainingMetrics(data.loss, data.accuracy);
    });
    
    socket.on('training-complete', (data) => {
        updateProcessingStatus(data.message, 100);
        showSuccessMessage('Training completed successfully!');
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
}

function processImage() {
    const imageData = canvas.toDataURL();
    socket.emit('process-image', imageData);
    
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
    
    socket.emit('start-training', {
        epochs: parseInt(epochs),
        learningRate: parseFloat(learningRate)
    });
    
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