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

        // Processing state with detailed layer information
        prompt += `\n⚡ PROCESSING STATUS:
- Currently processing: ${appContext.lastProcessing.isProcessing}`;

        if (appContext.lastProcessing.currentLayer) {
            prompt += `
- Current layer: ${appContext.lastProcessing.currentLayer} (index ${appContext.lastProcessing.layerIndex})
- Layer activations available: ${Object.keys(appContext.lastProcessing.activations).length > 0}`;
        }

        // Add current layer focus if user is asking about specific layers
        if (currentLayerIndex >= 0 && networkLayers[currentLayerIndex]) {
            const currentLayer = networkLayers[currentLayerIndex];
            prompt += `\n- FOCUS LAYER: ${currentLayer.name} (Layer ${currentLayerIndex + 1})
  * Currently being processed or just completed
  * Type: ${currentLayer.type}
  * Description: ${currentLayer.description}
  * This is what the user might be asking about when referring to "this layer" or "current layer"`;
        }

        // Network architecture with detailed information
        prompt += `\n🏗️ NETWORK ARCHITECTURE (Complete Layer Details):`;
        networkLayers.forEach((layer, index) => {
            const status = index === currentLayerIndex ? ' (CURRENTLY PROCESSING)' : '';
            const isProcessed = index < currentLayerIndex ? ' (COMPLETED)' : '';
            const isPending = index > currentLayerIndex ? ' (PENDING)' : '';
            
            prompt += `\n- Layer ${index + 1}: ${layer.name}`;
            prompt += `\n  * Type: ${layer.type}`;
            prompt += `\n  * Size/Shape: ${layer.size}`;
            prompt += `\n  * Description: ${layer.description}`;
            prompt += `\n  * Status: ${status}${isProcessed}${isPending}`;
            
            // Add layer-specific details based on type
            if (layer.type === 'conv') {
                prompt += `\n  * Function: Detects patterns and features using convolutional filters`;
                prompt += `\n  * Purpose: Identifies edges, shapes, and textures in the image`;
            } else if (layer.type === 'pool') {
                prompt += `\n  * Function: Reduces spatial dimensions while preserving important features`;
                prompt += `\n  * Purpose: Makes computation more efficient and reduces overfitting`;
            } else if (layer.type === 'dense') {
                prompt += `\n  * Function: Fully connected layer that combines all features`;
                prompt += `\n  * Purpose: Makes final classification decisions based on learned features`;
            } else if (layer.type === 'input') {
                prompt += `\n  * Function: Receives the original image data`;
                prompt += `\n  * Purpose: Entry point for the neural network`;
            } else if (layer.type === 'output') {
                prompt += `\n  * Function: Produces probability scores for each digit class (0-9)`;
                prompt += `\n  * Purpose: Final prediction layer using softmax activation`;
            }
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

        // Live explanation messages history
        if (appContext.liveExplanationHistory && appContext.liveExplanationHistory.length > 0) {
            prompt += `\n📢 RECENT LIVE STATUS MESSAGES:`;
            appContext.liveExplanationHistory.slice(-10).forEach(explanation => {
                const time = new Date(explanation.timestamp).toLocaleTimeString();
                prompt += `\n- ${time} [${explanation.type}]: ${explanation.text}`;
            });
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
            
            // Comprehensive logging for debugging
            console.log('\n=== CHAT PAYLOAD DEBUG ===');
            console.log('📝 User Message:', userMessage);
            console.log('🕐 Timestamp:', new Date().toISOString());
            
            console.log('\n🎯 CURRENT CONTEXT SUMMARY:');
            console.log('- Has Drawing:', context.canvasHasDrawing);
            console.log('- Is Training:', context.appContext.currentTraining.isTraining);
            console.log('- Is Processing:', context.appContext.lastProcessing.isProcessing);
            console.log('- Current Layer Index:', context.currentLayerIndex);
            console.log('- Last Prediction:', context.appContext.lastPrediction);
            console.log('- Training Metrics:', {
                epochs: context.appContext.currentTraining.epochs,
                learningRate: context.appContext.currentTraining.learningRate,
                lastLoss: context.appContext.currentTraining.lastLoss,
                lastAccuracy: context.appContext.currentTraining.lastAccuracy
            });
            
            console.log('\n📢 RECENT LIVE EXPLANATIONS:');
            if (context.appContext.liveExplanationHistory && context.appContext.liveExplanationHistory.length > 0) {
                context.appContext.liveExplanationHistory.slice(-5).forEach((explanation, index) => {
                    console.log(`${index + 1}. [${explanation.type}] ${explanation.text}`);
                });
            } else {
                console.log('No live explanations yet');
            }
            
            console.log('\n👤 RECENT USER INTERACTIONS:');
            if (context.appContext.userInteractions && context.appContext.userInteractions.length > 0) {
                context.appContext.userInteractions.slice(-5).forEach((interaction, index) => {
                    console.log(`${index + 1}. ${interaction.action}`, interaction.data || '');
                });
            } else {
                console.log('No user interactions yet');
            }
            
            console.log('\n📚 OPEN INFO MODALS:', context.appContext.openInfoModals);
            
            console.log('\n🏗️ NETWORK LAYERS:');
            context.networkLayers.forEach((layer, index) => {
                const status = index === context.currentLayerIndex ? ' [CURRENT]' : 
                              index < context.currentLayerIndex ? ' [COMPLETED]' : ' [PENDING]';
                console.log(`${index + 1}. ${layer.name} (${layer.type}) - ${layer.size}${status}`);
                console.log(`   Description: ${layer.description}`);
            });
            
            console.log('\n🔧 FULL CONTEXT PAYLOAD:');
            console.log(JSON.stringify(context, null, 2));
            
            console.log('\n🤖 SYSTEM PROMPT LENGTH:', systemPrompt.length, 'characters');
            
            const messagesToSend = [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userMessage
                }
            ];
            
            console.log('\n📤 COMPLETE OPENAI MESSAGE PAYLOAD:');
            console.log('=== FULL MESSAGES ARRAY ===');
            messagesToSend.forEach((message, index) => {
                console.log(`\nMessage ${index + 1}:`);
                console.log(`Role: ${message.role}`);
                console.log(`Content length: ${message.content.length} characters`);
                console.log(`Content: ${message.content}`);
                console.log('--- END MESSAGE ---');
            });
            console.log('=== END MESSAGES ARRAY ===\n');
            
            console.log('📤 SENDING TO OPENAI...\n');
            
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messagesToSend,
                max_tokens: 300,
                temperature: 0.7
            });

            const response = completion.choices[0].message.content;
            console.log('✅ OpenAI Response:', response);
            console.log('=== END CHAT DEBUG ===\n');
            
            return response;
        } catch (error) {
            console.error('\n❌ OpenAI API Error:', error);
            console.log('🔄 Using fallback response system...\n');
            
            // Fallback responses based on context
            return this.getFallbackResponse(userMessage, context);
        }
    }

    getFallbackResponse(userMessage, context) {
        const { appContext, currentLayerIndex, canvasHasDrawing } = context;
        const message = userMessage.toLowerCase();
        
        console.log('\n🔄 FALLBACK RESPONSE SYSTEM:');
        console.log('- User message:', userMessage);
        console.log('- Recent live explanation:', appContext.liveExplanationHistory?.[appContext.liveExplanationHistory.length - 1]?.text || 'None');
        console.log('- Context summary: Drawing=' + canvasHasDrawing + ', Training=' + appContext.currentTraining.isTraining + ', Processing=' + appContext.lastProcessing.isProcessing);

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

        if (message.includes('layer') || message.includes('convolution') || message.includes('pooling') || message.includes('node')) {
            if (currentLayerIndex >= 0 && context.networkLayers[currentLayerIndex]) {
                const currentLayer = context.networkLayers[currentLayerIndex];
                return `The network is currently focused on the ${currentLayer.name} layer (Layer ${currentLayerIndex + 1}). This is a ${currentLayer.type} layer that ${this.getLayerExplanation(currentLayer.type)}. Description: ${currentLayer.description}`;
            } else {
                let layerSummary = 'The CNN has these layers:\n';
                context.networkLayers.forEach((layer, index) => {
                    layerSummary += `${index + 1}. ${layer.name} (${layer.type}): ${layer.description}\n`;
                });
                return layerSummary + 'Each layer transforms your image step by step to recognize digits!';
            }
        }

        if (message.includes('draw') || message.includes('canvas')) {
            if (canvasHasDrawing) {
                return `I can see you have something drawn on the canvas! Click "Process Through CNN" to see how the network analyzes your drawing layer by layer.`;
            } else {
                return `The canvas is currently empty. Try drawing a digit (0-9) with your mouse or finger, then process it through the CNN to see how it recognizes your drawing!`;
            }
        }

        // Check if user is asking about what just happened based on recent live explanations
        if (message.includes('what') && (message.includes('happening') || message.includes('happened'))) {
            const recentExplanation = appContext.liveExplanationHistory?.[appContext.liveExplanationHistory.length - 1];
            if (recentExplanation) {
                return `Based on what just happened: ${recentExplanation.text.replace(/<[^>]*>/g, '')} This was a ${recentExplanation.type} event in the CNN visualization.`;
            }
        }

        // Default response with context awareness
        let contextualResponse = `I'm here to help you understand this CNN visualization! `;
        
        // Add context from recent live explanations
        const recentExplanation = appContext.liveExplanationHistory?.[appContext.liveExplanationHistory.length - 1];
        if (recentExplanation) {
            const cleanText = recentExplanation.text.replace(/<[^>]*>/g, '');
            contextualResponse += `Right now: ${cleanText.substring(0, 100)}... `;
        }
        
        contextualResponse += `You can ask me about the current prediction, training progress, what each layer does, or anything else about how neural networks work. What would you like to know?`;
        
        return contextualResponse;
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