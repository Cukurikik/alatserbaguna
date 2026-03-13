/// <reference lib="webworker" />

addEventListener('message', async ({ data }) => {
  if (data.type === 'start') {
    const { files, outputFormat } = data.config;
    postMessage({ type: 'progress', value: 0 });

    try {
      // Real FFmpeg WASM logic would:
      // 1. Write all input files to OPFS
      // 2. Generate a concat list.txt:
      //    "file 'input0.mp4'\nfile 'input1.mp4'\n..."
      // 3. Run: ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
      // 4. Read output from OPFS into Blob
      const totalFiles = files.length || 2;
      for (let i = 1; i <= totalFiles; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        postMessage({ type: 'progress', value: (i / totalFiles) * 95 });
      }
      postMessage({ type: 'progress', value: 100 });

      const dummyBlob = new Blob(['Merged video output'], { type: `video/${outputFormat}` });
      postMessage({ type: 'complete', data: dummyBlob });
    } catch (err: any) {
      postMessage({ type: 'error', errorCode: 'MERGE_FAILED', message: err.message });
    }
  }
});