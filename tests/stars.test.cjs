const {test}=require('node:test'),assert=require('node:assert/strict');
require('../stars.js');

test('bright-star catalog projects finite positions for any observer',()=>{
  const date=new Date('2026-09-13T00:00:00Z');
  for(const [,ra,dec] of QuietStars.STARS){
    const point=QuietStars.horizontal(ra,dec,date,23.81,90.41);
    assert(Number.isFinite(point.altitude));
    assert(point.azimuth>=0&&point.azimuth<360);
  }
});

test('stars require a configured, dark, reasonably clear sky',()=>{
  const clear={configured:true,solarElevation:-20,weather:{kind:'clear',cover:.05,haze:.05,visibility:25}};
  assert(QuietStars.atmosphericVisibility(clear)>.8);
  assert.equal(QuietStars.atmosphericVisibility({...clear,solarElevation:2}),0);
  assert.equal(QuietStars.atmosphericVisibility({...clear,configured:false}),0);
  assert.equal(QuietStars.atmosphericVisibility({...clear,weather:{kind:'rain',cover:1,haze:.8,visibility:2}}),0);
});
