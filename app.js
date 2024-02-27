// Function to analyze uploaded images using TensorFlow.js
async function analyzeImages() {
    // Clear previous analysis report
    analysisReport.innerHTML = '';
  
    // Load pre-trained MobileNet model
    const model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
  
    // Loop through each image upload input
    for (let i = 1; i <= 7; i++) {
      const input = document.getElementById(`image-upload-${i}`);
      const file = input.files[0];
  
      if (file) {
        // Display uploaded image
        const imageURL = URL.createObjectURL(file);
        analysisReport.innerHTML += `<h3>Image ${i}</h3>`;
        analysisReport.innerHTML += `<img src="${imageURL}" width="200"><br>`;
  
        // Preprocess image
        const image = await preprocessImage(file);
  
        // Perform inference
        const predictions = await predict(model, image);
  
        // Display inference results
        const occupancyStatus = predictions[0].className === 'occupied' ? 'Occupied' : 'Vacant';
        analysisReport.innerHTML += `Occupancy Status: ${occupancyStatus}<br><br>`;
      }
    }
  }
  
  // Function to preprocess the image
  async function preprocessImage(file) {
    const image = new Image();
    const reader = new FileReader();
  
    // Read image file as data URL
    const imagePromise = new Promise((resolve, reject) => {
      reader.onload = () => {
        image.onload = () => resolve(image);
        image.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  
    await imagePromise;
  
    // Resize image to 224x224 (required input size for MobileNet)
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, 224, 224);
    const imageData = ctx.getImageData(0, 0, 224, 224);
  
    // Normalize image data
    return tf.tidy(() => {
      const tensor = tf.browser.fromPixels(imageData).toFloat();
      const offset = tf.scalar(127.5);
      return tensor.sub(offset).div(offset).expandDims();
    });
  }
  
  // Function to perform inference using the pre-trained model
  async function predict(model, image) {
    const predictions = await model.predict(image);
    return Array.from(predictions.dataSync())
      .map((probability, index) => ({
        className: index === 1 ? 'occupied' : 'vacant',
        probability: probability
      }))
      .sort((a, b) => b.probability - a.probability);
  }
  