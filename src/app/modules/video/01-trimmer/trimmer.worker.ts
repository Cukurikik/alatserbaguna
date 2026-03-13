/// <reference lib="webworker" />

import { TrimmerInput } from './trimmer.schema';

addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const config = data.config as TrimmerInput;
    
    // Notify start
    postMessage({ type: 'progress', value: 0 });

    try {
      // Stub: in a real application here we would:
      // 1. Write the file to OPFS via FFmpeg
      // 2. Run: ffmpeg -i input.mp4 -ss [start] -to [end] -c copy output.mp4
      // 3. Read output.mp4 from OPFS into a Blob
      
      const totalSteps = 10;
      for (let i = 1; i <= totalSteps; i++) {
        // Sleep for 200ms
        await new Promise(resolve => setTimeout(resolve, 200));
        postMessage({ type: 'progress', value: (i / totalSteps) * 100 });
      }

      // Return a dummy blob instead of the real video
      const dummyBlob = new Blob(['Dummy video output data'], { type: `video/${config.outputFormat}` });
      
      // Notify completion
      postMessage({ type: 'complete', data: dummyBlob });
      
    } catch (error: any) {
      postMessage({ type: 'error', errorCode: 'PROCESSING_FAILED', message: error.message });
    }
  }
});