// Pure, bounded trajectories. No accumulated random walk.
export function motionOffset(m = {}, time) {
  const {speed=.55,amplitudeX=.08,amplitudeY=.08,amplitudeZ=.06,phase=0,direction=1,pattern='sway'}=m;
  const t=time*speed*direction+phase, s=Math.sin, c=Math.cos;
  let x,y,z;
  switch(pattern) {
    case 'orbit': x=c(t);y=.4*s(t*.7);z=s(t);break;
    case 'vertical': x=.5*s(t*.73);y=s(t);z=.4*c(t*.81);break;
    case 'horizontal': x=s(t);y=.3*c(t*.67);z=.5*s(t*.83);break;
    case 'diagonal': x=s(t);y=s(t+.4);z=c(t*.71);break;
    case 'figure8': x=s(t);y=s(2*t)*.75;z=c(t)*.6;break;
    case 'still': x=s(t*.6);y=c(t*.7);z=s(t*.5);break;
    case 'turning': {const angle=t*.45+.85*s(t*.7);x=c(angle);y=s(t*.79);z=s(angle);break;}
    default: x=.7*s(t)+.3*s(t*.61+1);y=.65*c(t*.81)+.35*s(t*.43);z=s(t*.67+2);
  }
  return [x*amplitudeX,y*amplitudeY,z*amplitudeZ];
}
