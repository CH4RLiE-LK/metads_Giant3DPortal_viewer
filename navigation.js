import * as THREE from 'three';

export function smooth(current,target,velocity,dt,speed=12){
  const offset=current-target,term=velocity+speed*offset,e=Math.exp(-speed*dt);
  return [target+(offset+term*dt)*e,(velocity-speed*term*dt)*e];
}
export class TunnelNavigation {
  constructor(camera,canvas){
    this.camera=camera;this.canvas=canvas;this.obstacles=[];this.drag=null;this.keys=new Set();
    this.yaw=0;this.pitch=0;this.yawGoal=0;this.pitchGoal=0;this.yawVelocity=0;this.pitchVelocity=0;
    this.goal=camera.position.clone();this.velocity=new THREE.Vector3();this.ray=new THREE.Raycaster();camera.rotation.order='YXZ';canvas.style.touchAction='none';canvas.style.cursor='grab';
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('pointerdown',e=>{if(this.drag||![0,2].includes(e.button))return;this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,move:e.button===2||e.shiftKey};this.onManualLookStart?.();canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
    canvas.addEventListener('pointermove',e=>{if(!this.drag||e.pointerId!==this.drag.id)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.x=e.clientX;this.drag.y=e.clientY;if(this.drag.move)this.move(-dy*.008,dx*.008);else{this.yawGoal-=dx*.003;this.pitchGoal=THREE.MathUtils.clamp(this.pitchGoal-dy*.003,-Math.PI*.47,Math.PI*.47);}});
    const end=e=>{if(this.drag?.id===e.pointerId){this.drag=null;canvas.style.cursor='grab';this.onManualLookEnd?.();}};for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,end);
    canvas.addEventListener('wheel',e=>{e.preventDefault();const units=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;this.move(THREE.MathUtils.clamp(e.deltaY*units*.005,-.8,.8),0);},{passive:false});
    const movement=['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    addEventListener('keydown',e=>{if(e.target.closest?.('input,textarea,button,select,[contenteditable]')||e.ctrlKey||e.metaKey||e.altKey)return;if(movement.includes(e.code)){e.preventDefault();this.keys.add(e.code);}});
    addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>this.keys.clear());
  }
  setView(position,target){this.camera.position.fromArray(position);this.goal.copy(this.camera.position);this.velocity.set(0,0,0);this.camera.lookAt(new THREE.Vector3().fromArray(target));const angles=new THREE.Euler().setFromQuaternion(this.camera.quaternion,'YXZ');this.yaw=this.yawGoal=angles.y;this.pitch=this.pitchGoal=angles.x;this.yawVelocity=this.pitchVelocity=0;this.onViewChange?.();}
  move(forward,right){
    this.goal.x+=-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right;
    this.goal.z+=-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right;
    this.goal.x=THREE.MathUtils.clamp(this.goal.x,-20,20);this.goal.z=THREE.MathUtils.clamp(this.goal.z,-15,35);
    // Avoid queued movement continuing long after scrolling stops.
    const delta=this.goal.clone().sub(this.camera.position);if(delta.length()>1.2)this.goal.copy(this.camera.position).add(delta.setLength(1.2));
  }
  travel(delta){
    const distance=delta.length();if(distance<1e-9)return true;
    const direction=delta.clone().normalize(),side=new THREE.Vector3(-direction.z,0,direction.x);let allowed=distance;
    for(const x of [-.18,0,.18])for(const y of [-.18,0,.18]){
      const origin=this.camera.position.clone().addScaledVector(side,x);origin.y+=y;
      this.ray.set(origin,direction);this.ray.near=0;this.ray.far=distance+.22;
      const hits=this.ray.intersectObjects(this.obstacles,true);if(hits.length)allowed=Math.min(allowed,Math.max(0,hits[0].distance-.22));
    }
    this.camera.position.addScaledVector(direction,allowed);return allowed>=distance-1e-7;
  }
  update(dt){
    dt=Math.min(dt,.05);
    const f=(this.analog?.forward||0)+Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'));
    const r=(this.analog?.right||0)+Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));const n=Math.max(1,Math.hypot(f,r));
    if(f||r)this.move(f/n*dt*1.5,r/n*dt*1.5);
    [this.yaw,this.yawVelocity]=smooth(this.yaw,this.yawGoal,this.yawVelocity,dt,14);
    [this.pitch,this.pitchVelocity]=smooth(this.pitch,this.pitchGoal,this.pitchVelocity,dt,14);
    this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    const next=this.camera.position.clone();for(const axis of ['x','z'])[next[axis],this.velocity[axis]]=smooth(next[axis],this.goal[axis],this.velocity[axis],dt,10);
    if(!this.travel(next.sub(this.camera.position))){this.goal.copy(this.camera.position);this.velocity.set(0,0,0);}
  }
}
