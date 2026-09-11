/* Solar geometry and civil-day helpers. SunCalc 2.0.2 uses degrees, north-clockwise azimuth.
 * Meeus ch. 25 supplies the orbital radius used for apparent diameter.
 * Screen coordinates are an east–west / altitude projection, enlarged for readability.
 */
(function (root) {
  const rad=Math.PI/180, day=86400000;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const parts=(date,timeZone)=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  function midnight(year,month,date,timeZone) {
    const target=Date.UTC(year,month-1,date);
    let guess=target;
    for(let i=0;i<5;i++) {const p=parts(new Date(guess),timeZone); const delta=target-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);guess+=delta;if(!delta)break;}
    return new Date(guess);
  }
  function civilDay(date,timeZone) {
    const p=parts(date,timeZone),next=new Date(Date.UTC(p.year,p.month-1,p.day+1));
    return {start:midnight(p.year,p.month,p.day,timeZone),end:midnight(next.getUTCFullYear(),next.getUTCMonth()+1,next.getUTCDate(),timeZone)};
  }
  function refraction(h) {return .0002967/Math.tan(Math.max(0,h)*rad+.00312536/(Math.max(0,h)*rad+.08901179))/rad;}
  function geometricAltitude(apparent) {
    if(apparent<=refraction(0))return apparent-refraction(0);
    let lo=0,hi=90;for(let i=0;i<28;i++){const m=(lo+hi)/2;if(m+refraction(m)>apparent)hi=m;else lo=m;}return (lo+hi)/2;
  }
  /* Meeus ch. 25/28: declination and the equation of time, which together give the
   * hour angle. The hour angle is what makes the sky path line up with the real
   * sunrise and sunset rather than with clock noon. */
  function angles(date) {
    const t=(date/day+2440587.5-2451545)/36525;
    const meanLongitude=280.46646+t*(36000.76983+.0003032*t);
    const meanAnomaly=357.52911+t*(35999.05029-.0001537*t);
    const eccentricity=.016708634-t*(.000042037+.0000001267*t);
    const centre=(1.914602-t*(.004817+.000014*t))*Math.sin(meanAnomaly*rad)+(.019993-.000101*t)*Math.sin(2*meanAnomaly*rad)+.000289*Math.sin(3*meanAnomaly*rad);
    const node=125.04-1934.136*t;
    const apparentLongitude=meanLongitude+centre-.00569-.00478*Math.sin(node*rad);
    const obliquity=23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60+.00256*Math.cos(node*rad);
    const declination=Math.asin(Math.sin(obliquity*rad)*Math.sin(apparentLongitude*rad))/rad;
    const y=Math.tan(obliquity*rad/2)**2;
    const equationOfTime=4*(y*Math.sin(2*meanLongitude*rad)-2*eccentricity*Math.sin(meanAnomaly*rad)+4*eccentricity*y*Math.sin(meanAnomaly*rad)*Math.cos(2*meanLongitude*rad)-.5*y*y*Math.sin(4*meanLongitude*rad)-1.25*eccentricity*eccentricity*Math.sin(2*meanAnomaly*rad))/rad;
    const distanceAU=1.000001018*(1-eccentricity*eccentricity)/(1+eccentricity*Math.cos((meanAnomaly+centre)*rad));
    return {declination,equationOfTime,distanceAU};
  }
  /* Horizontal sky position: the viewport width is one sunrise-to-sunset arc.
   * x = 0 at sunrise, .5 at solar noon, 1 at sunset, continuing past the edges at
   * night. Height is normalised against the day's own peak altitude so a winter sun
   * still rises gently while a summer sun climbs high. */
  function skyPath(date,latitude,longitude,{declination,equationOfTime},elevation) {
    const solarMinutes=(date/60000)%1440+equationOfTime+4*longitude;
    let hourAngle=(solarMinutes/4-180)%360;
    if(hourAngle<-180)hourAngle+=360; else if(hourAngle>180)hourAngle-=360;
    const cosArc=(Math.sin(-.833*rad)-Math.sin(latitude*rad)*Math.sin(declination*rad))/(Math.cos(latitude*rad)*Math.cos(declination*rad));
    // |cos| > 1 means the sun never crosses the horizon today; sweep the full turn.
    const halfArc=Math.abs(cosArc)>=1?180:Math.acos(clamp(cosArc,-1,1))/rad;
    const peakAltitude=90-Math.abs(latitude-declination);
    const reach=Math.max(Math.sin(peakAltitude*rad),Math.sin(18*rad));
    // The arc is inset by half a sun's width so the disk is whole as it rises and sets.
    const inset=.045;
    return {
      hourAngle,declination,peakAltitude,
      x:clamp(inset+(1-2*inset)*(.5+hourAngle/(2*Math.max(halfArc,20))),-.15,1.15),
      height:clamp(Math.sin(elevation*rad)/reach,-.4,1)
    };
  }
  function position(date,latitude,longitude) {
    const p=root.SunCalc.getPosition(date,latitude,longitude);
    const orbit=angles(date);
    const diameter=.533128/orbit.distanceAU;
    const elevation=geometricAltitude(p.altitude);
    const sky=skyPath(date,latitude,longitude,orbit,elevation);
    return {...p,elevation,distanceAU:orbit.distanceAU,diameter,sky,
      // Orthographic east–west projection for the chart: east is left, west is right.
      x:50-43*Math.cos(p.altitude*rad)*Math.sin(p.azimuth*rad),
      y:84-60*Math.sin(p.altitude*rad),
      visible:clamp((elevation+.833)/diameter,0,1)};
  }
  function eventsForDay(date,timeZone,latitude,longitude) {
    const {start,end}=civilDay(date,timeZone),events=[];
    const seen=new Set();
    for(let i=-2;i<=2;i++) {
      const times=root.SunCalc.getTimes(new Date((+start + +end)/2+i*day),latitude,longitude);
      for(const type of ['sunrise','sunset']) {const time=times[type];if(time&&Number.isFinite(+time)&&!seen.has(+time)){seen.add(+time);events.push({type,time});}}
    }
    events.sort((a,b)=>a.time-b.time);
    const today=events.filter(e=>e.time>=start&&e.time<end);
    let up=position(start,latitude,longitude).elevation>-.833, cursor=+start,daylight=0;
    for(const event of today){if(up)daylight+=event.time-cursor;cursor=+event.time;up=event.type==='sunrise';}
    if(up)daylight+=end-cursor;
    return {start,end,events,daylight,sunrise:today.find(e=>e.type==='sunrise')?.time??null,sunset:today.find(e=>e.type==='sunset')?.time??null};
  }
  root.SolarModel={position,civilDay,eventsForDay,parts,angles,skyPath};
})(typeof window==='undefined'?globalThis:window);
