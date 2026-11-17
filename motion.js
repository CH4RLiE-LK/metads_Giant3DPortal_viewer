import * as THREE from 'three';
export function phoneAngles(alpha,beta,gamma,orientation=0){
 const r=THREE.MathUtils.degToRad;
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(r(beta),r(alpha),-r(gamma),'YXZ'));
 q.multiply(new THREE.Quaternion(-Math.SQRT1_2,0,0,Math.SQRT1_2));
 q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-r(orientation)));
 return new THREE.Euler().setFromQuaternion(q,'YXZ');
}
export function installMotionLook(controls,button,message){
 let active=false,pending=false,manualLook=false,anchor=null,lastYaw=null,unwrapped=0,timer=null;
 const say=text=>{message.textContent=text;message.hidden=!text;};
 const reset=()=>{anchor=null;lastYaw=null;};
 function stop(){active=false;controls.motionActive=false;clearTimeout(timer);window.removeEventListener('deviceorientation',read);window.removeEventListener('orientationchange',reset);screen.orientation?.removeEventListener('change',reset);button.setAttribute('aria-pressed','false');button.textContent='Motion view';reset();}
 function read(event){
  if(!active||manualLook||![event.alpha,event.beta,event.gamma].every(Number.isFinite))return;
  clearTimeout(timer);
  const angles=phoneAngles(event.alpha,event.beta,event.gamma,screen.orientation?.angle??window.orientation??0);
  if(!anchor){anchor={yaw:controls.yawGoal,pitch:controls.pitchGoal,phoneYaw:angles.y,phonePitch:angles.x};unwrapped=angles.y;lastYaw=angles.y;say('');}
  const delta=Math.atan2(Math.sin(angles.y-lastYaw),Math.cos(angles.y-lastYaw));unwrapped+=delta;lastYaw=angles.y;
  controls.yawGoal=anchor.yaw+unwrapped-anchor.phoneYaw;
  controls.pitchGoal=THREE.MathUtils.clamp(anchor.pitch+angles.x-anchor.phonePitch,-Math.PI*.47,Math.PI*.47);
 }
 controls.onViewChange=reset;
 controls.onManualLookStart=()=>{manualLook=true;reset();};
 controls.onManualLookEnd=()=>{manualLook=false;reset();};
 button.onclick=async()=>{
  if(active){stop();say('');return;}
  if(pending)return;
  if(!window.isSecureContext){say('Open the HTTPS website to use motion view.');return;}
  if(!window.DeviceOrientationEvent){say('Motion sensors are unavailable here. Use drag controls.');return;}
  pending=true;button.disabled=true;
  try{
   if(typeof DeviceOrientationEvent.requestPermission==='function'){
    const permission=await DeviceOrientationEvent.requestPermission();
    if(permission!=='granted'){say('Motion permission was not granted. Drag controls still work.');return;}
   }
   active=true;controls.motionActive=true;controls.drag=null;reset();button.setAttribute('aria-pressed','true');button.textContent='Motion on';say('');
   window.addEventListener('deviceorientation',read);window.addEventListener('orientationchange',reset);screen.orientation?.addEventListener('change',reset);
   timer=setTimeout(()=>{if(active){stop();say('No motion data received. Use drag controls or try your phone browser.');}},6000);
  }catch{stop();say('Motion permission unavailable. Use drag controls.');}
  finally{pending=false;button.disabled=false;}
 };
 window.addEventListener('pagehide',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active){stop();say('');}});
}
