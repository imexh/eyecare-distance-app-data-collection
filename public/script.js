const video = document.getElementById('video')

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo())

video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)

    const displaySize = {
        width: video.width,
        height: video.height
    }
    faceapi.matchDimensions(canvas, displaySize)

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
            .withFaceExpressions()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

        var distance = 0.0

        if (resizedDetections.length > 0) {
            distance = calculateDistance(resizedDetections)
        }

        // faceapi.draw.drawDetections(canvas, resizedDetections) // Uncomment if the box is needed
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        showDistanceOnCanvas(canvas, distance, {x: 10, y: 30})
    }, 100)
})

function startVideo() {
    navigator.getUserMedia({
            video: {}
        },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}

function showDistanceOnCanvas(canvas, value, position, fontSize = 20, textColor = 'white', bgColor = 'black') {
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    const textWidth = ctx.measureText(`Distance: ${value.toFixed(2)}cm`).width;
    const textHeight = fontSize;
    ctx.fillRect(position.x, position.y - textHeight, textWidth + 5, textHeight + 5);

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.fillText(`Distance: ${value.toFixed(2)}cm`, position.x, position.y);
}

function calculateDistance(resizedDetections) {
    // Get coordinations of left and right eyes
    const landmarks = resizedDetections[0].landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Calculate the distance between the eyes in units pixels
    const distanceBetweenEyes = Math.sqrt(
        Math.pow(leftEye[0]._x - rightEye[3]._x, 2) +
        Math.pow(leftEye[0]._y - rightEye[3]._y, 2)
    );

    const averageHumanFaceWidth = 6.3; // In centimeters (Need to be accurate)
    const focalLength = 610; // Estimated focal length of the camera (Changes with camera)

    return (averageHumanFaceWidth * focalLength) / distanceBetweenEyes + 30
}