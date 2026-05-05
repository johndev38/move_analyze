import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const video = document.getElementById('video') as HTMLVideoElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scoreDiv = document.getElementById('score')!;

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  const pose = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'
    },
    runningMode: 'VIDEO'
  });

  function angle(a: any, b: any, c: any) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
    const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);
    return Math.acos(dot / (magAB * magCB)) * 180 / Math.PI;
  }

  function loop() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const res = pose.detectForVideo(video, performance.now());

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0);

    if (res.landmarks.length > 0) {
      const pts = res.landmarks[0];

      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
      });

      const hip = pts[23];
      const knee = pts[25];
      const ankle = pts[27];
      const kneeAngle = angle(hip, knee, ankle);

      scoreDiv.innerText = `Angle genou: ${kneeAngle.toFixed(1)}`;
    }

    requestAnimationFrame(loop);
  }

  video.onloadeddata = () => loop();
}

init();
