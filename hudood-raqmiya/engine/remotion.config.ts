import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16);
// Heavy CSS-3D scenes: keep concurrency moderate to avoid dropped frames on small machines.
Config.setConcurrency(null);
Config.setChromiumOpenGlRenderer('angle');
