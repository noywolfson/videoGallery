const express = require("express");
const cors = require('cors')
const path = require('path')
const { spawn } = require('child_process');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const corsOptions = {
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(fileUpload({}));
app.use('/public', express.static(path.join(__dirname, 'public')));


let uploadedVideos = [];

app.post("/upload", (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const videoFile = req.files.video;
        videoFile.description = req.body.description;
        videoFile.date = req.body.date;
        uploadedVideos.push(videoFile);
        const outputDir = path.join(__dirname, `/public/compressed`);
        const outputFileName = `${Date.now()}-${videoFile.name}`;
        const outputFilePath = path.join(outputDir, outputFileName);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        videoFile.mv(outputFilePath, async (err) => {
            if (err) {
                console.error('Error moving uploaded file:', err);
                return res.status(500).json({ message: 'Error uploading file' });
            }

            try {
                await compressVideo(outputFilePath, outputFileName);
                console.log('File uploaded and compressed successfully');
                res.status(200).json({ success: true, message: 'File uploaded and compressed successfully', videoName: videoFile.name });
            } catch (e) {
                console.error('Video compression failed:', e);
                res.status(500).json({ message: 'Video compression failed' });
            }
        });
    } catch (e) {
        console.error('Error uploading file:', e);
        res.status(500).json({ message: 'Error uploading file' });
    }
    console.log(req.body);
});

app.get('/gallery', (req, res) => {
    if (uploadedVideos.length === 0) {
        return res.status(404).json({ message: 'No videos uploaded yet' });
    }
    try {
        const videoUrls = uploadedVideos.map((video, index) => ({
            id: index + 1,
            name: video.name,
            description: video.description,
            date: video.date,
            url: `http://localhost:3000/video/${index}`
        }));
        res.status(200).json(videoUrls);
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).json({ message: 'Error fetching videos' });
    }
});

app.get('/video/:id', (req, res) => {
    const id = req.params.id;

    if (id >= 0 && id < uploadedVideos.length) {
        const video = uploadedVideos[id];
        res.status(200)
            .set('Content-Type', 'video/mp4')
            .send(video.data);
    } else {
        res.status(404).json({ message: 'Video not found' });
    }

});


function compressVideo(inputPath, fileName) {
    return new Promise((resolve, reject) => {

        const outputDir = path.dirname(inputPath);
        const outputFileName = `compressed-${fileName}`;
        const outputPath = path.join(outputDir, outputFileName);

        const ffmpegProcess = spawn('ffmpeg', [
            '-y',
            '-i', inputPath,
            '-c:v', 'libx264',
            '-crf', '23',
            '-preset', 'medium',
            '-c:a', 'aac',
            '-b:a', '128k',
            outputPath
        ]);

        ffmpegProcess.stdout.on('data', (data) => {
            console.log(`ffmpeg stdout: ${data}`);
        });

        ffmpegProcess.stderr.on('data', (data) => {
            console.error(`ffmpeg stderr: ${data}`);
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                console.log('ffmpeg process exited with success');
                resolve();
            } else {
                console.error(`ffmpeg process exited with code ${code}`);
                reject(`ffmpeg process exited with code ${code}`);
            }
        });

        ffmpegProcess.on('error', (err) => {
            console.error('ffmpeg spawn error:', err);
            reject(err);
        });
    });
}

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});
