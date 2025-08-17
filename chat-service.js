const OpenAI = require('openai');

class ChatService {
    constructor() {
        // Initialize OpenAI - user will need to set OPENAI_API_KEY environment variable
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
        });
    }

    generateContextPrompt(context) {
        const { appContext, networkLayers, currentLayerIndex, canvasHasDrawing } = context;
        
        let prompt = `You are an AI assistant helping users understand a Convolutional Neural Network (CNN) visualization application. You can see everything that's happening in real-time.

CURRENT APPLICATION STATE:
`;

        // Canvas and drawing state
        prompt += `\n📷 CANVAS STATUS:
- Has drawing: ${canvasHasDrawing}
- Last prediction: ${appContext.lastPrediction ? 
            `Predicted digit ${appContext.lastPrediction.predictedClass} with ${(appContext.lastPrediction.confidence * 100).toFixed(1)}% confidence` : 
            'No prediction yet'}
`;

        // Training state
        prompt += `\n🎯 TRAINING STATUS:
- Currently training: ${appContext.currentTraining.isTraining}
- Epochs setting: ${appContext.currentTraining.epochs}
- Learning rate: ${appContext.currentTraining.learningRate}`;

        if (appContext.currentTraining.isTraining) {
            prompt += `
- Current epoch: ${appContext.currentTraining.currentEpoch}
- Current batch: ${appContext.currentTraining.currentBatch}
- Latest loss: ${appContext.currentTraining.lastLoss}
- Latest accuracy: ${appContext.currentTraining.lastAccuracy}`;
        }

        // Processing state
        prompt += `\n⚡ PROCESSING STATUS:
- Currently processing: ${appContext.lastProcessing.isProcessing}`;

        if (appContext.lastProcessing.currentLayer) {
            prompt += `
- Current layer: ${appContext.lastProcessing.currentLayer} (index ${appContext.lastProcessing.layerIndex})
- Layer activations available: ${Object.keys(appContext.lastProcessing.activations).length > 0}`;
        }

        // Network architecture
        prompt += `\n🏗️ NETWORK ARCHITECTURE:`;
        networkLayers.forEach((layer, index) => {
            const status = index === currentLayerIndex ? ' (CURRENTLY PROCESSING)' : '';
            prompt += `\n- ${layer.name}: ${layer.type} layer, size ${layer.size}${status}`;
        });

        // Recent user interactions
        if (appContext.userInteractions.length > 0) {
            prompt += `\n👤 RECENT USER ACTIONS:`;
            appContext.userInteractions.slice(-5).forEach(interaction => {
                const time = new Date(interaction.timestamp).toLocaleTimeString();
                prompt += `\n- ${time}: ${interaction.action}`;
                if (interaction.data && Object.keys(interaction.data).length > 0) {
                    prompt += ` (${JSON.stringify(interaction.data)})`;
                }
            });
        }

        // Info modals opened
        if (appContext.openInfoModals.length > 0) {
            prompt += `\n📚 INFO MODALS VIEWED:
- User has opened info for: ${appContext.openInfoModals.join(', ')}`;
        }

        prompt += `\n\nINSTRUCTIONS:
- Answer questions about the CNN, its layers, training process, or current state
- Use the current application state to give specific, contextual answers
- Explain complex concepts in simple terms with analogies
- If the user asks about specific predictions or training metrics, reference the actual current values
- If they ask about layer processing, explain what's currently happening or what just happened
- Be encouraging and educational
- Keep responses concise but informative (2-3 sentences usually)
- Use emojis sparingly for clarity

CONVERSATION HISTORY:`;

        // Add recent chat history for context
        if (appContext.chatHistory.length > 0) {
            appContext.chatHistory.slice(-10).forEach(msg => {
                prompt += `\n${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.message}`;
            });
        }

        return prompt;
    }

    async getChatResponse(userMessage, context) {
        try {
            const systemPrompt = this.generateContextPrompt(context);
            
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API Error:', error);
            
            // Fallback responses based on context
            return this.getFallbackResponse(userMessage, context);
        }
    }

    getFallbackResponse(userMessage, context) {
        const { appContext, currentLayerIndex, canvasHasDrawing } = context;
        const message = userMessage.toLowerCase();

        // Simple keyword-based fallback responses
        if (message.includes('prediction') || message.includes('predict')) {
            if (appContext.lastPrediction) {
                return `Based on your drawing, the CNN predicted the digit ${appContext.lastPrediction.predictedClass} with ${(appContext.lastPrediction.confidence * 100).toFixed(1)}% confidence. The network analyzed your drawing through multiple layers to reach this conclusion!`;
            } else {
                return `No prediction has been made yet. Try drawing a digit (0-9) on the canvas and click "Process Through CNN" to see what the network predicts!`;
            }
        }

        if (message.includes('training') || message.includes('train')) {
            if (appContext.currentTraining.isTraining) {
                return `Training is currently in progress! The network is learning from examples with ${appContext.currentTraining.epochs} epochs and a learning rate of ${appContext.currentTraining.learningRate}. Current performance: Loss ${appContext.currentTraining.lastLoss}, Accuracy ${appContext.currentTraining.lastAccuracy}.`;
            } else {
                return `The network isn't currently training. You can start training by clicking "Start Training" to teach the CNN to recognize digits better!`;
            }
        }

        if (message.includes('layer') || message.includes('convolution') || message.includes('pooling')) {
            if (currentLayerIndex >= 0) {
                const currentLayer = context.networkLayers[currentLayerIndex];
                return `The network is currently processing the ${currentLayer.name} layer (${currentLayer.type}). This layer ${this.getLayerExplanation(currentLayer.type)}.`;
            } else {
                return `The CNN has multiple layers: convolution layers detect patterns, pooling layers reduce size, and dense layers make final decisions. Each layer transforms your image step by step!`;
            }
        }

        if (message.includes('draw') || message.includes('canvas')) {
            if (canvasHasDrawing) {
                return `I can see you have something drawn on the canvas! Click "Process Through CNN" to see how the network analyzes your drawing layer by layer.`;
            } else {
                return `The canvas is currently empty. Try drawing a digit (0-9) with your mouse or finger, then process it through the CNN to see how it recognizes your drawing!`;
            }
        }

        // Default response
        return `I'm here to help you understand this CNN visualization! You can ask me about the current prediction, training progress, what each layer does, or anything else about how neural networks work. What would you like to know?`;
    }

    getLayerExplanation(layerType) {
        switch (layerType) {
            case 'input':
                return 'receives your original image data';
            case 'conv':
            case 'convolution':
                return 'scans for patterns like edges and shapes using filters';
            case 'pool':
            case 'maxpooling':
                return 'reduces image size while keeping important features';
            case 'flatten':
                return 'converts 2D data into a 1D list for the final layers';
            case 'dense':
                return 'makes connections between features to determine the final prediction';
            case 'output':
                return 'produces the final prediction probabilities for each digit';
            default:
                return 'processes the data in a specific way';
        }
    }
}

module.exports = ChatService;