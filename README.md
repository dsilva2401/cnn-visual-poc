# 🧠 CNN Real-Time Visualization

An interactive web application that demonstrates how Convolutional Neural Networks work with **real-time WebSocket visualization**. Perfect for educational purposes and making CNN concepts accessible to non-technical users.

## ✨ Features

### 🎯 Real-Time CNN Processing
- **Live layer-by-layer visualization** as the network processes images
- **WebSocket streaming** of activations, weights, and gradients
- **Interactive network architecture** display with animated data flow
- **Real-time training metrics** (loss, accuracy) with live updates

### 🎨 Interactive Interface
- **Drawing canvas** for creating custom input images
- **Image upload** support for testing with real images
- **Animated visualizations** of convolutions, pooling, and dense layers
- **Educational tooltips** explaining each layer's purpose

### 🔧 Training Controls
- **Adjustable hyperparameters** (epochs, learning rate)
- **Live training visualization** with real-time metric updates
- **Weight update animations** during backpropagation
- **Interactive parameter tuning** with instant feedback

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

4. **Start exploring:**
   - Draw a digit on the canvas
   - Click "🚀 Process Through CNN" to see real-time layer processing
   - Try "🏃‍♂️ Start Training" to watch live model training

## 🎮 How to Use

### 1. **Image Processing**
- Draw a digit (0-9) on the canvas or upload an image
- Click "Process Through CNN" 
- Watch as each layer processes the data in real-time:
  - **Input Layer**: Original image visualization
  - **Convolution Layers**: See filters scanning and feature maps activating
  - **Pooling Layers**: Observe downsampling animations  
  - **Dense Layers**: View neural connections and activations
  - **Output Layer**: Real-time prediction probabilities

### 2. **Live Training**
- Adjust training parameters (epochs, learning rate)
- Click "Start Training"
- Watch real-time updates of:
  - Loss and accuracy metrics
  - Weight updates across layers
  - Training progress animations

### 3. **Educational Features**
- Hover over layer nodes for explanations
- Interactive tooltips explain CNN concepts
- Visual metaphors make complex operations intuitive
- Step-by-step processing breakdown

## 🏗️ Architecture

### Backend (Node.js + TensorFlow.js)
- **Express.js** server with Socket.io for real-time communication
- **TensorFlow.js** for actual CNN implementation
- **Real-time event broadcasting** for every layer operation
- **Memory-efficient** tensor operations with automatic cleanup

### Frontend (Vanilla JS + Canvas)
- **WebSocket client** for live updates
- **HTML5 Canvas** for drawing and visualizations
- **CSS3 animations** for smooth layer transitions
- **Responsive design** for all devices

### CNN Model
```javascript
// 7-layer CNN architecture
Input (28×28×1) → 
Conv2D (32 filters) → MaxPool → 
Conv2D (64 filters) → MaxPool → 
Flatten → Dense (128) → Dropout → 
Dense (10, softmax)
```

## 🎯 Educational Value

### For Non-Technical Users
- **Visual metaphors** (filters as "pattern detectors")
- **Step-by-step explanations** of each operation
- **Real-time feedback** makes abstract concepts concrete
- **Interactive exploration** encourages learning

### For Technical Users
- **Actual TensorFlow.js implementation** (not just mock data)
- **Real-time tensor operations** and gradient flows
- **Performance monitoring** and optimization insights
- **Extensible architecture** for adding new features

## 🔧 Technical Details

### WebSocket Events
- `layer-processing-start/complete`: Layer-by-layer progress
- `filter-activation`: Real-time convolution filter responses
- `training-step`: Live training metrics
- `weight-update`: Real-time weight changes during training

### Performance Optimizations
- **Selective data streaming** (only visible layers)
- **Adaptive update frequency** based on client performance
- **Tensor memory management** with automatic disposal
- **Progressive loading** of complex visualizations

## 🎨 Customization

### Adding New Layers
```javascript
// In cnn-model.js
tf.layers.conv2d({
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
    name: 'custom_conv'
})
```

### Custom Visualizations
```javascript
// In script.js
socket.on('custom-layer-event', (data) => {
    // Add your visualization logic
});
```

### Styling
- Modify `public/styles.css` for visual customizations
- Add new animations and color schemes
- Customize layer representations

## 🤝 Contributing

This is an educational project demonstrating real-time CNN visualization. Feel free to:
- Add new layer types and visualizations
- Improve the educational explanations
- Optimize performance for larger models
- Add support for different datasets

## 📚 Learning Resources

The visualization demonstrates these CNN concepts:
- **Convolution**: Pattern detection with sliding filters
- **Pooling**: Spatial dimension reduction
- **Feature Maps**: Hierarchical feature learning
- **Backpropagation**: Weight updates during training
- **Gradient Flow**: How errors propagate backward

## 🎯 Use Cases

- **Educational institutions**: Teaching ML/AI concepts
- **Workshops and presentations**: Demonstrating CNN mechanics
- **Self-learning**: Understanding neural network internals
- **Prototyping**: Testing visualization ideas for ML models

---

**Made with ❤️ for ML education and powered by TensorFlow.js + WebSockets**