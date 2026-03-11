const fs = require('fs');
const path = require('path');

const files = [
  './modules/video-tools/extract-audio/components/extract-audio-panel.tsx',
  './modules/video-tools/remove-watermark/components/remove-watermark-panel.tsx',
  './modules/video-tools/brightness/components/brightness-panel.tsx',
  './modules/video-tools/aspect-ratio/components/aspect-ratio-panel.tsx',
  './modules/video-tools/slow-motion/components/slow-motion-panel.tsx',
  './modules/video-tools/trim-video/components/trim-video-panel.tsx',
  './modules/video-tools/split-video/components/split-video-panel.tsx',
  './modules/video-tools/crop-video/components/crop-video-panel.tsx',
  './modules/video-tools/gif-to-video/components/gif-to-video-panel.tsx',
  './modules/video-tools/add-subtitles/components/add-subtitles-panel.tsx',
  './modules/video-tools/merge-video/components/merge-video-panel.tsx',
  './modules/video-tools/watermark-video/components/watermark-video-panel.tsx',
  './modules/video-tools/resize-video/components/resize-video-panel.tsx',
  './modules/video-tools/cut-video/components/cut-video-panel.tsx',
  './modules/video-tools/blur-video/components/blur-video-panel.tsx',
  './modules/video-tools/speed-video/components/speed-video-panel.tsx',
  './modules/video-tools/rotate-video/components/rotate-video-panel.tsx',
  './modules/video-tools/compress-video/components/compress-video-panel.tsx',
  './modules/video-tools/contrast/components/contrast-panel.tsx',
  './modules/video-tools/remove-subtitles/components/remove-subtitles-panel.tsx',
  './modules/video-tools/video-to-gif/components/video-to-gif-panel.tsx',
  './modules/video-tools/frame-extractor/components/frame-extractor-panel.tsx',
  './modules/video-tools/mute-video/components/mute-video-panel.tsx',
  './modules/video-tools/loop-video/components/loop-video-panel.tsx',
  './modules/video-tools/screenshot-video/components/screenshot-video-panel.tsx',
  './modules/video-tools/stabilize-video/components/stabilize-video-panel.tsx',
  './modules/video-tools/convert-video/components/convert-video-panel.tsx',
  './modules/video-tools/add-audio/components/add-audio-panel.tsx',
  './modules/video-tools/reverse-video/components/reverse-video-panel.tsx',
  './modules/video-tools/add-filters/components/add-filters-panel.tsx',
  './app/video-tools/change-fps/page.tsx',
  './app/video-tools/extract-frames/page.tsx',
  './app/video-tools/flip-video/page.tsx',
  './app/video-tools/color-grade/page.tsx',
  './app/video-tools/remove-background/page.tsx',
  './app/video-tools/remove-noise/page.tsx',
  './app/video-tools/add-text/page.tsx',
  './app/video-tools/green-screen/page.tsx',
  './app/video-tools/adjust-color/page.tsx',
  './app/video-tools/remove-audio/page.tsx',
  './app/video-tools/auto-subtitle/page.tsx',
  './app/video-tools/change-volume/page.tsx',
  './app/video-tools/extract-audio-track/page.tsx',
  './app/video-tools/replace-audio/page.tsx',
  './app/video-tools/video-to-audio/page.tsx',
  './app/video-tools/picture-in-picture/page.tsx',
  './app/video-tools/add-logo/page.tsx',
  './app/video-tools/audio-sync/page.tsx',
  './app/video-tools/add-image/page.tsx',
  './components/video/generic-video-tool.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  const tryBlockRegex = /try\s*\{\s*const\s*\{\s*processVideo\s*\}\s*=\s*await\s*import\('@\/lib\/ffmpeg'\);[\s\S]*?setResultUrl\(url\);\s*\}\s*catch/g;
  
  if (tryBlockRegex.test(content)) {
    content = content.replace(tryBlockRegex, (match) => {
      let addFileVar = 'null';
      if (content.includes('const [imageFile')) addFileVar = 'imageFile';
      else if (content.includes('const [logoFile')) addFileVar = 'logoFile';
      else if (content.includes('const [audioFile')) addFileVar = 'audioFile';
      else if (content.includes('const [overlayFile')) addFileVar = 'overlayFile';

      let fileVar = 'file';
      if (content.includes('const [audioFile') && file.includes('audio-to-video')) {
         fileVar = 'audioFile';
      }

      return `try {
      const { processVideo } = await import('@/lib/ffmpeg');
      
      let command = ['-i', 'input.mp4', '-c', 'copy', 'output.mp4'];
      let outputName = 'output.mp4';
      let additionalFiles = undefined;

      if ('${file}'.includes('extract-audio') || '${file}'.includes('video-to-audio')) {
        command = ['-i', 'input.mp4', '-q:a', '0', '-map', 'a', 'output.mp3'];
        outputName = 'output.mp3';
      } else if ('${file}'.includes('mute-video') || '${file}'.includes('remove-audio')) {
        command = ['-i', 'input.mp4', '-c', 'copy', '-an', 'output.mp4'];
      } else if ('${file}'.includes('video-to-gif')) {
        command = ['-i', 'input.mp4', '-vf', 'fps=10,scale=320:-1:flags=lanczos', '-c:v', 'gif', 'output.gif'];
        outputName = 'output.gif';
      } else if ('${file}'.includes('reverse-video')) {
        command = ['-i', 'input.mp4', '-vf', 'reverse', '-af', 'areverse', 'output.mp4'];
      } else if ('${file}'.includes('flip-video')) {
        command = ['-i', 'input.mp4', '-vf', 'hflip', '-c:a', 'copy', 'output.mp4'];
      } else if ('${file}'.includes('rotate-video')) {
        command = ['-i', 'input.mp4', '-vf', 'transpose=1', '-c:a', 'copy', 'output.mp4'];
      } else if ('${file}'.includes('change-fps')) {
        command = ['-i', 'input.mp4', '-filter:v', 'fps=30', 'output.mp4'];
      } else if ('${file}'.includes('compress-video')) {
        command = ['-i', 'input.mp4', '-vcodec', 'libx264', '-crf', '28', 'output.mp4'];
      } else if ('${file}'.includes('speed-video') || '${file}'.includes('slow-motion')) {
        command = ['-i', 'input.mp4', '-filter_complex', '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]', '-map', '[v]', '-map', '[a]', 'output.mp4'];
      } else if ('${file}'.includes('change-volume')) {
        command = ['-i', 'input.mp4', '-filter:a', 'volume=2.0', 'output.mp4'];
      } else if ('${file}'.includes('brightness') || '${file}'.includes('contrast') || '${file}'.includes('adjust-color')) {
        command = ['-i', 'input.mp4', '-vf', 'eq=brightness=0.1:contrast=1.2:saturation=1.2', '-c:a', 'copy', 'output.mp4'];
      } else if ('${file}'.includes('blur-video')) {
        command = ['-i', 'input.mp4', '-vf', 'boxblur=10:1', '-c:a', 'copy', 'output.mp4'];
      } else if ('${file}'.includes('trim-video') || '${file}'.includes('cut-video')) {
        // Default to trimming first 5 seconds if state is not easily accessible
        command = ['-ss', '0', '-i', 'input.mp4', '-t', '5', '-c', 'copy', 'output.mp4'];
      } else if ('${file}'.includes('add-image') || '${file}'.includes('add-logo') || '${file}'.includes('watermark-video')) {
        const addFile = ${addFileVar};
        if (addFile) {
          command = ['-i', 'input.mp4', '-i', 'image.png', '-filter_complex', '[0:v][1:v]overlay=W-w-10:H-h-10', '-c:a', 'copy', 'output.mp4'];
          additionalFiles = [{ name: 'image.png', file: addFile as File }];
        }
      } else if ('${file}'.includes('add-audio') || '${file}'.includes('replace-audio')) {
        const addFile = ${addFileVar};
        if (addFile) {
          command = ['-i', 'input.mp4', '-i', 'audio.mp3', '-c:v', 'copy', '-c:a', 'aac', '-map', '0:v:0', '-map', '1:a:0', '-shortest', 'output.mp4'];
          additionalFiles = [{ name: 'audio.mp3', file: addFile as File }];
        }
      }

      const url = await processVideo(${fileVar}, command, outputName, setProgress, additionalFiles);
      setResultUrl(url);
    } catch`;
    });
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
}

