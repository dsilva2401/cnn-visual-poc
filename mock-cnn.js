class MockRealTimeCNN {
    constructor(socket) {
        this.socket = socket;
        this.isTraining = false;
        this.layers = [
            { name: 'conv1', type: 'convolution', filters: 32, kernelSize: 3, outputShape: [null, 26, 26, 32] },
            { name: 'pool1', type: 'maxpooling', poolSize: 2, outputShape: [null, 13, 13, 32] },
            { name: 'conv2', type: 'convolution', filters: 64, kernelSize: 3, outputShape: [null, 11, 11, 64] },
            { name: 'pool2', type: 'maxpooling', poolSize: 2, outputShape: [null, 5, 5, 64] },
            { name: 'flatten', type: 'flatten', outputShape: [null, 1600] },
            { name: 'dense1', type: 'dense', units: 128, outputShape: [null, 128] },
            { name: 'dropout', type: 'dropout', rate: 0.2, outputShape: [null, 128] },
            { name: 'output', type: 'dense', units: 10, outputShape: [null, 10] }
        ];
    }

    async trainWithRealTimeUpdates(epochs = 5) {
        if (this.isTraining) return;
        
        this.isTraining = true;
        console.log('Starting mock CNN training...');

        for (let epoch = 0; epoch < epochs; epoch++) {
            this.socket.emit('training-epoch-start', { 
                epoch: epoch + 1, 
                total: epochs 
            });

            const numBatches = 8;
            let epochLoss = 2.3 * Math.exp(-epoch * 0.3); // Simulated decreasing loss
            let epochAccuracy = 0.1 + (epoch / epochs) * 0.8; // Simulated increasing accuracy

            for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
                // Simulate batch processing time
                await new Promise(resolve => setTimeout(resolve, 300));

                // Add some realistic noise to the metrics
                const batchLoss = epochLoss + (Math.random() - 0.5) * 0.1;
                const batchAccuracy = epochAccuracy + (Math.random() - 0.5) * 0.05;

                this.socket.emit('training-step', {
                    epoch: epoch + 1,
                    batch: batchIndex + 1,
                    loss: Math.max(0.01, batchLoss).toFixed(4),
                    accuracy: Math.min(0.99, Math.max(0.01, batchAccuracy)).toFixed(4)
                });

                // Simulate weight updates
                this.emitWeightUpdates(epoch, batchIndex + 1);
            }

            this.socket.emit('training-epoch-complete', {
                epoch: epoch + 1,
                avgLoss: epochLoss.toFixed(4),
                avgAccuracy: epochAccuracy.toFixed(4)
            });
        }

        this.isTraining = false;
        this.socket.emit('training-complete', {
            finalLoss: (0.02 + Math.random() * 0.03).toFixed(4),
            finalAccuracy: (0.88 + Math.random() * 0.1).toFixed(4),
            message: 'CNN training completed successfully!'
        });
    }

    async processImageWithVisualization(imageData) {
        console.log('Processing image through mock CNN...');
        
        this.socket.emit('processing-start', { 
            totalLayers: this.layers.length 
        });

        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            
            this.socket.emit('layer-processing-start', {
                layerIndex: i,
                layer: {
                    name: layer.name,
                    type: layer.type,
                    outputShape: layer.outputShape
                },
                progress: (i / this.layers.length) * 100
            });

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));

            // Simulate convolution filter activations
            if (layer.type === 'convolution') {
                await this.simulateConvolutionLayer(i, layer);
            }

            // Generate realistic activation data
            const activationData = this.generateActivationData(layer);
            
            this.socket.emit('layer-processing-complete', {
                layerIndex: i,
                layer: {
                    name: layer.name,
                    type: layer.type,
                    outputShape: layer.outputShape
                },
                activationData: activationData,
                computationTime: Math.random() * 50 + 15
            });
        }

        // Generate realistic predictions
        const predictions = this.generateRealisticPredictions();
        
        this.socket.emit('processing-complete', {
            predictions: predictions,
            predictedClass: predictions.indexOf(Math.max(...predictions)),
            confidence: Math.max(...predictions)
        });
    }

    async simulateConvolutionLayer(layerIndex, layer) {
        const numFilters = Math.min(layer.filters, 16); // Limit for performance
        
        for (let filter = 0; filter < numFilters; filter++) {
            const activation = Math.random() * 0.8 + 0.1; // Realistic activation range
            
            this.socket.emit('filter-activation', {
                layerIndex: layerIndex,
                filterIndex: filter,
                activation: activation,
                featureMap: this.generateFeatureMap(layer.outputShape, activation)
            });
            
            await new Promise(resolve => setTimeout(resolve, 80));
        }
    }

    generateFeatureMap(outputShape, baseActivation) {
        if (outputShape.length < 3) return [];
        
        const height = Math.min(outputShape[1] || 20, 20);
        const width = Math.min(outputShape[2] || 20, 20);
        const featureMap = [];
        
        for (let h = 0; h < height; h++) {
            const row = [];
            for (let w = 0; w < width; w++) {
                // Create more realistic feature map with spatial correlation
                const centerDistance = Math.sqrt((h - height/2)**2 + (w - width/2)**2);
                const spatialWeight = Math.exp(-centerDistance / (height/3));
                const value = baseActivation * spatialWeight * (0.7 + Math.random() * 0.6);
                row.push(Math.min(1, Math.max(0, value)));
            }
            featureMap.push(row);
        }
        
        return featureMap;
    }

    generateActivationData(layer) {
        let size = 64; // Default size
        
        if (layer.type === 'dense') {
            size = Math.min(layer.units || 64, 64);
        } else if (layer.outputShape && layer.outputShape.length > 1) {
            const totalSize = layer.outputShape.slice(1).reduce((a, b) => (a || 1) * (b || 1), 1);
            size = Math.min(totalSize || 64, 64);
        }
        
        // Generate realistic activation patterns
        const activations = [];
        for (let i = 0; i < size; i++) {
            // Create some structure in activations (not purely random)
            const baseValue = Math.sin(i * 0.3) * 0.3 + 0.5;
            const noise = (Math.random() - 0.5) * 0.4;
            activations.push(Math.min(1, Math.max(0, baseValue + noise)));
        }
        
        return activations;
    }

    generateRealisticPredictions() {
        // Create more realistic prediction distribution
        const predictions = new Array(10).fill(0);
        
        // Pick a "confident" class
        const confidentClass = Math.floor(Math.random() * 10);
        predictions[confidentClass] = 0.6 + Math.random() * 0.3;
        
        // Add some probability to nearby classes
        for (let i = 0; i < 10; i++) {
            if (i !== confidentClass) {
                predictions[i] = Math.random() * 0.1;
            }
        }
        
        // Normalize to sum to 1
        const sum = predictions.reduce((a, b) => a + b, 0);
        return predictions.map(p => p / sum);
    }

    emitWeightUpdates(epoch, batch) {
        this.layers.forEach((layer, index) => {
            if (layer.type === 'convolution' || layer.type === 'dense') {
                this.socket.emit('weight-update', {
                    layerIndex: index,
                    layerName: layer.name,
                    epoch: epoch,
                    batch: batch,
                    weightStats: {
                        mean: (Math.random() - 0.5) * 0.1,
                        std: Math.random() * 0.5 + 0.1,
                        shape: layer.type === 'convolution' ? [3, 3, 32, 64] : [128, 10]
                    }
                });
            }
        });
    }

    async updateModelParameters(params) {
        console.log('Mock CNN parameters updated:', params);
        // Simulate parameter update
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    dispose() {
        this.isTraining = false;
        console.log('Mock CNN disposed');
    }
}

module.exports = MockRealTimeCNN;