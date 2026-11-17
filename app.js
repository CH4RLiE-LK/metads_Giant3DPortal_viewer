import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {TunnelNavigation} from './navigation.js';
import {installMotionLook} from './motion.js';
const $=id=>document.getElementById(id);
const definitions=[['back','Back','EXPORT_back'],['left','Left','EXPORT_left'],['right','Right','EXPORT_right'],['ceiling','Ceiling','EXPORT_ceiling'],['ceiling-front','Ceiling front','EXPORT_ceiling front']];
const channels=definitions.map(([id,label,material])=>({id,label,material,meshes:[],video:null,texture:null,url:null,version:0}));
const status=text=>{$('status').textContent=text;$('status').hidden=!text;};
const scene=new THREE.Scene();scene.background=new THREE.Color('#222');
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;$('viewport').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(50,1,.03,150),controls=new TunnelNavigation(camera,renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x666666,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(4,8,6);scene.add(light);
const ground=new THREE.GridHelper(80,160,0x444444,0x444444);ground.position.set(0,-.025,-.25);scene.add(ground);
// GiantPortalCam from the supplied Blender file, converted from Z-up to Y-up.
// Position and rotation are exact source values; the FOV remains adjustable.
const sourceCameraPosition=[-7.393238377062517e-8,1.5,13.040109634399414];
const sourceCameraPitch=1.6109389066696167-Math.PI/2;
function sweetspot(){const [x,y,z]=sourceCameraPosition;controls.setView(sourceCameraPosition,[x,y+Math.sin(sourceCameraPitch),z-Math.cos(sourceCameraPitch)]);$('camera-height').value=y;$('camera-height-value').value=y.toFixed(2)+' m';}
document.querySelector('[data-view="sweetspot"]').onclick=sweetspot;sweetspot();
let playing=true,time=0,scrubbing=false,lastSync=0;
function duration(){return Math.max(0,...channels.map(c=>Number.isFinite(c.video?.duration)?c.video.duration:0));}
function transport(){const enabled=duration()>0;for(const id of ['play','seek','step-back','step-forward'])$(id).disabled=!enabled;$('play').setAttribute('aria-label',playing?'Pause':'Play');$('play').title=playing?'Pause':'Play';$('play').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(playing?'<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>':'<path d="M8 5l12 7-12 7z"/>')+'</svg>';$('seek').max=duration()||1;}
function apply(c){c.meshes.forEach(m=>{m.material.map=c.texture;m.material.needsUpdate=true;});}
function dispose(c){if(c.video){c.video.pause();c.video.removeAttribute('src');c.video.load();}c.texture?.dispose();if(c.url)URL.revokeObjectURL(c.url);}
async function resumeVideos(){const results=await Promise.allSettled(channels.filter(c=>c.video).map(c=>c.video.play()));if(results.some(r=>r.status==='rejected')){playing=false;channels.forEach(c=>c.video?.pause());transport();status('Tap Play to start all screens.');}}
function seekTo(value){time=THREE.MathUtils.clamp(value,0,duration());channels.forEach(c=>{if(c.video&&Number.isFinite(c.video.duration)&&c.video.duration>0)c.video.currentTime=time%c.video.duration;});}
function pause(){playing=false;channels.forEach(c=>c.video?.pause());transport();}
async function load(c,source,label,isImage=false,isLocal=false){
 const version=++c.version;let video=null,texture=null;const url=isLocal?URL.createObjectURL(source):source;
 try{
  if(isImage){texture=await new THREE.TextureLoader().loadAsync(url);}else{
   video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.playsInline=true;video.loop=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('muted','');
   await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{cleanup();reject(new Error('Video loading timed out'));},30000);const cleanup=()=>{clearTimeout(timeout);video.onloadeddata=video.onerror=null;};video.onloadeddata=()=>{cleanup();resolve();};video.onerror=()=>{cleanup();reject(new Error('Use an H.264 MP4'));};video.src=url;video.load();});
   texture=new THREE.VideoTexture(video);
  }
  if(version!==c.version){video?.pause();if(video){video.removeAttribute('src');video.load();}texture.dispose();if(isLocal)URL.revokeObjectURL(url);return;}
  // glTF UV coordinates already encode the Blender mapping: no tunnel-specific flips.
  texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;dispose(c);c.video=video;c.texture=texture;c.url=isLocal?url:null;apply(c);$('name-'+c.id).textContent=label;transport();
  if(video){video.currentTime=time%video.duration;if(playing)await resumeVideos();}
 }catch(error){video?.pause();if(video){video.removeAttribute('src');video.load();}texture?.dispose();if(isLocal)URL.revokeObjectURL(url);if(version===c.version)status(c.label+': '+error.message);}
}
channels.forEach(c=>{$('file-'+c.id).onchange=e=>{const file=e.target.files[0];if(!file)return;if(!/^(video|image)\//.test(file.type)){status('Select an MP4, WebM, PNG or JPG.');return;}status('');load(c,file,file.name,file.type.startsWith('image/'),true);};});
async function defaults(){status('Loading five screens…');await Promise.all(channels.map(c=>load(c,'./assets/'+c.id+'.mp4',c.label+' · default')));if(channels.every(c=>c.texture))status('');}
$('default').onclick=()=>{seekTo(0);defaults();};
$('grid').onclick=()=>{pause();channels.forEach(c=>{c.version++;dispose(c);c.video=null;c.url=null;const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');for(let y=0;y<8;y++)for(let x=0;x<8;x++){ctx.fillStyle=(x+y)%2?'#222':'#ddd';ctx.fillRect(x*128,y*128,128,128);ctx.fillStyle=(x+y)%2?'#fff':'#111';ctx.font='24px sans-serif';ctx.fillText(`${String.fromCharCode(65+y)}${x+1}`,x*128+20,y*128+65);}c.texture=new THREE.CanvasTexture(canvas);c.texture.flipY=false;c.texture.colorSpace=THREE.SRGBColorSpace;apply(c);$('name-'+c.id).textContent=c.label+' · grid';});transport();};
$('play').onclick=()=>{status('');if(playing)pause();else{playing=true;transport();resumeVideos();}};
$('seek').oninput=()=>seekTo(Number($('seek').value));$('seek').onpointerdown=()=>scrubbing=true;addEventListener('pointerup',()=>scrubbing=false);addEventListener('pointercancel',()=>scrubbing=false);
for(const [id,step] of [['step-back',-1],['step-forward',1]])$(id).onclick=()=>{pause();seekTo(time+step/30);};
$('fov').oninput=()=>{camera.fov=Number($('fov').value);camera.updateProjectionMatrix();$('fov-value').value=camera.fov+'°';};
$('camera-height').oninput=()=>{camera.position.y=controls.goal.y=Number($('camera-height').value);$('camera-height-value').value=camera.position.y.toFixed(2)+' m';};
$('content-toggle').onclick=()=>{const open=$('content-body').hidden;$('content-body').hidden=!open;$('content-toggle').setAttribute('aria-expanded',String(open));$('content-toggle').setAttribute('aria-label',open?'Collapse content panel':'Expand content panel');};
$('ui-toggle').onclick=()=>{const hidden=document.body.classList.toggle('ui-hidden');for(const id of ['controls','content-panel'])$(id).hidden=hidden;$('ui-toggle').setAttribute('aria-expanded',String(!hidden));};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{status('Full screen unavailable in this browser.');}};
const backdrop=document.createElement('canvas');backdrop.width=16;backdrop.height=512;const ctx=backdrop.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#858585');gradient.addColorStop(.45,'#686868');gradient.addColorStop(1,'#414141');ctx.fillStyle=gradient;ctx.fillRect(0,0,16,512);const day=new THREE.CanvasTexture(backdrop);day.colorSpace=THREE.SRGBColorSpace;
let night=true;document.body.classList.add('night');$('theme').setAttribute('aria-checked','true');$('theme').onclick=()=>{night=!night;document.body.classList.toggle('night',night);scene.background=night?new THREE.Color('#222'):day;const colors=ground.geometry.attributes.color,color=new THREE.Color(night?'#444':'#888');for(let i=0;i<colors.count;i++)colors.setXYZ(i,color.r,color.g,color.b);colors.needsUpdate=true;$('theme').setAttribute('aria-checked',String(night));};
installMotionLook(controls,$('motion-toggle'),$('motion-status'));
const joystick=$('joystick'),knob=$('joystick-knob');let pointer=null;
function releaseJoystick(){pointer=null;controls.analog={forward:0,right:0};knob.style.transform='translate(0,0)';joystick.classList.remove('held');}
function moveJoystick(e){if(e.pointerId!==pointer)return;const rect=joystick.getBoundingClientRect();let x=e.clientX-(rect.left+rect.width/2),y=e.clientY-(rect.top+rect.height/2);const radius=rect.width*.3,length=Math.hypot(x,y);if(length>radius){x*=radius/length;y*=radius/length;}knob.style.transform=`translate(${x}px,${y}px)`;const magnitude=Math.hypot(x,y)/radius,weight=magnitude<.12?0:(magnitude-.12)/(.88*magnitude);controls.analog={forward:-y/radius*weight,right:x/radius*weight};}
joystick.onpointerdown=e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;joystick.setPointerCapture(pointer);joystick.classList.add('held');moveJoystick(e);};joystick.onpointermove=moveJoystick;for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,e=>{if(e.pointerId===pointer)releaseJoystick();});addEventListener('blur',releaseJoystick);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseJoystick();});releaseJoystick();
new GLTFLoader().load('./assets/portal.glb',gltf=>{scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;controls.obstacles.push(mesh);const c=channels.find(c=>c.material===mesh.material.name);if(c){if(!mesh.geometry.attributes.uv)throw Error('Missing UVs: '+c.label);mesh.material=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});c.meshes.push(mesh);}else{mesh.material.side=THREE.DoubleSide;}});const missing=channels.filter(c=>!c.meshes.length);if(missing.length){status('Missing mapped screens: '+missing.map(c=>c.label).join(', '));return;}defaults();},undefined,e=>status('Model loading failed: '+e.message));
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();transport();
let last=0;renderer.setAnimationLoop(now=>{const dt=last?Math.min((now-last)/1000,.05):0;last=now;controls.update(dt);const length=duration();if(playing&&length&&!scrubbing)time=(time+dt)%length;if(now-lastSync>400){lastSync=now;for(const c of channels){if(c.video&&Number.isFinite(c.video.duration)&&c.video.duration>0){const target=time%c.video.duration;if(Math.abs(c.video.currentTime-target)>.12)c.video.currentTime=target;}}}if(!scrubbing)$('seek').value=time;$('time').textContent=`${time.toFixed(2)} / ${length.toFixed(2)} s`;renderer.render(scene,camera);});
