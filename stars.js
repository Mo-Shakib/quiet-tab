/* Bright-star sky projection. J2000 positions are sufficient for this visual
 * scale; local sidereal time places each star over the selected horizon. */
(function(root){
  const STARS=[
    ['Sirius',6.7525,-16.7161,-1.46],['Canopus',6.3992,-52.6957,-.74],['Arcturus',14.261,19.1824,-.05],
    ['Vega',18.6156,38.7837,.03],['Capella',5.2782,45.998,.08],['Rigel',5.2423,-8.2016,.13],
    ['Procyon',7.655,5.225,.34],['Betelgeuse',5.9195,7.4071,.42],['Achernar',1.6286,-57.2368,.46],
    ['Hadar',14.0637,-60.373,.61],['Altair',19.8464,8.8683,.76],['Acrux',12.4433,-63.0991,.77],
    ['Aldebaran',4.5987,16.5093,.85],['Spica',13.4199,-11.1613,.98],['Antares',16.4901,-26.4319,1.06],
    ['Pollux',7.7553,28.0262,1.14],['Fomalhaut',22.9608,-29.6222,1.16],['Deneb',20.6905,45.2803,1.25],
    ['Regulus',10.1395,11.9672,1.35],['Castor',7.5767,31.8883,1.58],['Shaula',17.5601,-37.1038,1.62],
    ['Bellatrix',5.4189,6.3497,1.64],['Elnath',5.4382,28.6075,1.65],['Miaplacidus',9.22,-69.7172,1.67],
    ['Alnilam',5.6036,-1.2019,1.69],['Alnair',22.1372,-46.961,1.74],['Alioth',12.9005,55.9598,1.76],
    ['Kaus Australis',18.4029,-34.3846,1.79],['Mirfak',3.4054,49.8612,1.79],['Dubhe',11.0621,61.751,1.79],
    ['Wezen',7.1399,-26.3932,1.83],['Avior',8.3752,-59.5095,1.86],['Alkaid',13.7923,49.3133,1.86],
    ['Menkalinan',5.9921,44.9474,1.9],['Atria',16.8111,-69.0277,1.91],['Alhena',6.6285,16.3993,1.93],
    ['Peacock',20.4275,-56.7351,1.94],['Mirzam',6.3783,-17.9559,1.98],['Alphard',9.4598,-8.6586,1.98],
    ['Polaris',2.5303,89.2641,1.98]
  ];
  const rad=n=>n*Math.PI/180;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const mod=(n,m)=>((n%m)+m)%m;
  function siderealHours(date,longitude){
    const days=date.getTime()/86400000+2440587.5-2451545;
    return mod(18.697375+24.065709824279*days+longitude/15,24);
  }
  function horizontal(raHours,decDegrees,date,latitude,longitude){
    const hourAngle=rad((siderealHours(date,longitude)-raHours)*15);
    const dec=rad(decDegrees),lat=rad(latitude);
    const altitude=Math.asin(Math.sin(dec)*Math.sin(lat)+Math.cos(dec)*Math.cos(lat)*Math.cos(hourAngle));
    const azimuth=Math.atan2(-Math.sin(hourAngle),Math.tan(dec)*Math.cos(lat)-Math.sin(lat)*Math.cos(hourAngle));
    return {altitude:altitude*180/Math.PI,azimuth:mod(azimuth*180/Math.PI,360)};
  }
  function atmosphericVisibility(state){
    if(!state.configured||state.solarElevation>-4)return 0;
    const darkness=clamp((-state.solarElevation-4)/14,0,1);
    const weather=state.weather;
    if(!weather)return darkness*.72;
    if(['storm','rain','snow','fog'].includes(weather.kind))return 0;
    const cloud=clamp(1-weather.cover*.92,0,1);
    const measured=Number.isFinite(weather.visibility)?clamp((weather.visibility-2)/18,0,1):1-weather.haze*.75;
    return darkness*cloud*measured;
  }
  function render(state){
    const canvas=typeof document!=='undefined'&&document.getElementById('star-field');
    if(!canvas||!state)return;
    const visibility=atmosphericVisibility(state);
    canvas.style.opacity=visibility.toFixed(3);
    const width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    if(visibility<=.015)return;
    const horizon=Math.min(height*.82,height-30),ceiling=Math.max(18,height*.05);
    const moon=typeof SunCalc!=='undefined'?SunCalc.getMoonIllumination(state.date):null;
    const moonWash=moon?1-moon.fraction*.38:1;
    for(const [name,ra,dec,magnitude] of STARS){
      const position=horizontal(ra,dec,state.date,state.latitude,state.longitude);
      if(position.altitude<=2)continue;
      const x=position.azimuth/360*width;
      const y=horizon-Math.sin(rad(position.altitude))*(horizon-ceiling);
      const brightness=clamp((3.15-magnitude)/4.6,0,1)*moonWash*clamp(position.altitude/12,0,1);
      if(brightness<.08)continue;
      const radius=.55+brightness*1.35;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fillStyle=`rgba(238,244,255,${(.32+brightness*.68).toFixed(3)})`;ctx.shadowColor='#dce9ff';ctx.shadowBlur=brightness*5;ctx.fill();ctx.shadowBlur=0;
    }
  }
  const api={STARS,siderealHours,horizontal,atmosphericVisibility};
  root.QuietStars=api;
  if(typeof window!=='undefined'&&typeof document!=='undefined'){
    let pending=false,last=null;
    const schedule=state=>{last=state;if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;render(last);});}};
    window.addEventListener('quiet-sky-update',event=>schedule(event.detail));
    window.addEventListener('resize',()=>schedule(window.quietSkyState));
    document.addEventListener('DOMContentLoaded',()=>schedule(window.quietSkyState));
  }
})(typeof globalThis!=='undefined'?globalThis:this);
