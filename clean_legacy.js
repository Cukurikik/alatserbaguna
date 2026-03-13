const fs = require('fs');
const path = require('path');

const keep = [
  '01-trimmer', '02-merger', '03-converter', '04-compressor',
  '05-stabilizer', '06-reverser', '07-speed-controller', '08-looper',
  '09-flip-rotate', '10-crop-resize', '11-color-grading', '12-subtitle-burner',
  '13-thumbnail-generator', '14-watermark', '15-audio-extractor', '16-audio-replacer',
  '17-denoiser', '18-interpolator', '19-metadata-editor', '20-splitter',
  '21-screen-recorder', '22-video-to-gif', '23-pip', '24-blur',
  '25-transitions', '26-compare', '27-slideshow', '28-batch',
  '29-analyser', '30-upscaler', 'shared'
];

const basePath = path.join('c:', 'Users', 'IKYY', 'Downloads', 'generated', 'src', 'app', 'modules', 'video');
const items = fs.readdirSync(basePath);

items.forEach(item => {
  const fullPath = path.join(basePath, item);
  if (fs.statSync(fullPath).isDirectory() && !keep.includes(item)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log('Removed old folder:', item);
  }
});
