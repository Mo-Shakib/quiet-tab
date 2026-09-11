const {test}=require('node:test');
const assert=require('node:assert/strict');
global.SunCalc=require('../vendor/suncalc.js');
require('../solar-model.js');
const {position,civilDay,eventsForDay}=SolarModel;
const close=(actual,expected,tolerance)=>assert(Math.abs(actual-expected)<tolerance,`${actual} differs from ${expected}`);
test('position agrees with the NREL SPA worked example',()=>{
  // Reda & Andreas, NREL/TP-560-34302, Table A5.1: 2003-10-17 12:30:30 MST.
  // Standard atmosphere differs from the example's 820 mbar; allow .02 degrees.
  const p=position(new Date('2003-10-17T19:30:30Z'),39.742476,-105.1786);
  close(p.azimuth,194.340241,.02);close(p.altitude,90-50.111622,.02);
});
test('Dhaka civil day and sunrise / sunset are aligned',()=>{
  const d=eventsForDay(new Date('2026-09-11T06:00:00Z'),'Asia/Dhaka',23.8,90.4);
  assert.equal(d.start.toISOString(),'2026-09-10T18:00:00.000Z');
  assert(d.sunrise>=d.start&&d.sunset<d.end);assert(d.sunrise<d.sunset);
  close(d.daylight,d.sunset-d.sunrise,1);
  close(position(d.sunrise,23.8,90.4).elevation,-.833,.002);
  close(position(d.sunset,23.8,90.4).elevation,-.833,.002);
  assert(position(new Date(+d.sunrise+60000),23.8,90.4).x<50);
  assert(position(new Date(+d.sunset-60000),23.8,90.4).x>50);
});
test('DST days contain the actual 23 or 25 hours',()=>{
  for(const [date,hours] of [['2026-03-08T12:00:00Z',23],['2026-11-01T12:00:00Z',25]]){
    const d=civilDay(new Date(date),'America/New_York');assert.equal((d.end-d.start)/3600000,hours);
  }
});
test('civil date is independent of the host timezone',()=>{
  const d=civilDay(new Date('2026-09-11T23:00:00Z'),'Asia/Dhaka');assert.equal(d.start.toISOString(),'2026-09-11T18:00:00.000Z');
  const ny=eventsForDay(new Date('2026-09-11T23:00:00Z'),'America/New_York',40.71,-74.01);
  assert(ny.sunrise>=ny.start&&ny.sunset<ny.end);
});
test('polar day and polar night never produce invalid event dates',()=>{
  const summer=eventsForDay(new Date('2026-06-21T12:00:00Z'),'Arctic/Longyearbyen',80,15);
  const winter=eventsForDay(new Date('2026-12-21T12:00:00Z'),'Arctic/Longyearbyen',80,15);
  assert.equal(summer.sunrise,null);assert.equal(summer.sunset,null);assert.equal(summer.daylight,summer.end-summer.start);
  assert.equal(winter.sunrise,null);assert.equal(winter.daylight,0);
});
test('apparent size follows orbital distance, not time-of-day exaggeration',()=>{
  const jan=position(new Date('2026-01-03T06:00:00Z'),23.78,90.4),jul=position(new Date('2026-07-04T06:00:00Z'),23.78,90.4);
  assert(jan.diameter>jul.diameter);assert(jan.diameter<.55&&jul.diameter>.52);
  const morning=position(new Date('2026-09-11T00:00:00Z'),23.78,90.4),noon=position(new Date('2026-09-11T06:00:00Z'),23.78,90.4);
  close(morning.diameter,noon.diameter,.0001);
});
test('the sky path spans one screen width from sunrise to sunset',()=>{
  const [lat,lon]=[23.8,90.4];
  const d=eventsForDay(new Date('2026-09-11T06:00:00Z'),'Asia/Dhaka',lat,lon);
  // Sunrise and sunset sit one sun-width inside the edges so the disk stays whole.
  close(position(d.sunrise,lat,lon).sky.x,.045,.004);
  close(position(d.sunset,lat,lon).sky.x,.955,.004);
  const noon=new Date((+d.sunrise + +d.sunset)/2);
  close(position(noon,lat,lon).sky.x,.5,.004);
  // The sun only ever moves left to right, and it peaks at the top of the arc.
  // Off-screen night positions are clamped, so they hold rather than reverse.
  let previous=-Infinity;
  for(let minute=0;minute<1440;minute+=10){
    const at=new Date(+d.start+minute*60000),p=position(at,lat,lon);
    const moved=p.sky.x-previous;
    assert(moved>=0,`x went backwards at minute ${minute}`);
    if(at>d.sunrise&&at<d.sunset)assert(moved>0,`x stalled in daylight at minute ${minute}`);
    previous=p.sky.x;
  }
  close(position(noon,lat,lon).sky.height,1,.01);
  assert(position(d.sunrise,lat,lon).sky.height<0);
});
test('the sky path stays sane where the sun never rises or never sets',()=>{
  for(const date of ['2026-06-21T12:00:00Z','2026-12-21T12:00:00Z']){
    const sweep=[0,6,12,18,23].map(hour=>position(new Date(new Date(date).setUTCHours(hour)),80,15).sky);
    for(const sky of sweep){assert(Number.isFinite(sky.x)&&Number.isFinite(sky.height));assert(sky.x>=-.18&&sky.x<=1.18);}
  }
  const winter=position(new Date('2026-12-21T12:00:00Z'),80,15).sky;
  assert(winter.height<0,'polar night stays below the horizon');
  const summer=position(new Date('2026-06-21T00:00:00Z'),80,15).sky;
  assert(summer.height>0,'the midnight sun stays above the horizon');
});
test('coordinates stay finite throughout the year, including the poles',()=>{
  for(const lat of [-90,-80,-23,0,23.8,80,90])for(const month of [0,3,6,9])for(const hour of [0,6,12,18]){
    const p=position(new Date(Date.UTC(2026,month,11,hour)),lat,90.4);
    for(const key of ['altitude','azimuth','diameter','x','y','visible'])assert(Number.isFinite(p[key]),`${lat}: ${key}`);
    assert(p.visible>=0&&p.visible<=1);
  }
});
