const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const MockRealTimeCNN = require('./mock-cnn');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const cnnInstances = new Map();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  const cnn = new MockRealTimeCNN(socket);
  cnnInstances.set(socket.id, cnn);

  socket.on('start-training', async (data) => {
    console.log('Starting CNN training with parameters:', data);
    try {
      await cnn.trainWithRealTimeUpdates(data.epochs || 5);
    } catch (error) {
      console.error('Training error:', error);
      socket.emit('training-error', { message: error.message });
    }
  });

  socket.on('process-image', async (imageData) => {
    console.log('Processing image through CNN');
    try {
      await cnn.processImageWithVisualization(imageData);
    } catch (error) {
      console.error('Processing error:', error);
      socket.emit('processing-error', { message: error.message });
    }
  });

  socket.on('update-parameters', async (params) => {
    console.log('Updating model parameters:', params);
    try {
      await cnn.updateModelParameters(params);
      socket.emit('parameter-update-confirmed', params);
    } catch (error) {
      console.error('Parameter update error:', error);
      socket.emit('parameter-update-error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const cnn = cnnInstances.get(socket.id);
    if (cnn) {
      cnn.dispose();
      cnnInstances.delete(socket.id);
    }
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CNN Visualization Server running on http://localhost:${PORT}`);
  console.log('📊 Real-time neural network visualization ready!');
});