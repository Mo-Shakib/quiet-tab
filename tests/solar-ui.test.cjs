const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup(){
  const nodes={},styles={},storage={},events={},requests=[],fetchRequests=[];let now='2026-09-11T06:00:00Z';
  const node=id=>nodes[id]??={value:'',checked:false,textContent:'',dataset:{},attributes:{},events:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.events[k]=f;},showModal(){},focus(){}};
  class FixedDate extends Date {constructor(...a){super(...(a.length?a:[now]));}}
  const context={Date:FixedDate,Intl,console,encodeURIComponent,updateClock(){},setInterval(){},addEventListener(){},fetch:url=>new Promise(resolve=>fetchRequests.push({url,resolve})),localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},navigator:{geolocation:{getCurrentPosition:(success,error)=>requests.push({success,error})}},document:{hidden:false,getElementById:node,querySelector:()=>({getBoundingClientRect:()=>({left:0,top:0,width:640})}),querySelectorAll:()=>Array.from({length:5},(_,i)=>node(`label-${i}`)),documentElement:{style:{setProperty:(k,v)=>styles[k]=v,getPropertyValue:k=>styles[k]}},addEventListener:(k,f)=>events[k]=f}};
  context.window=context;vm.createContext(context);
  for(const file of ['vendor/suncalc.js','solar-model.js','solar.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  events.DOMContentLoaded();return {node,styles,context,requests,fetchRequests,storage,advance:iso=>{now=iso;events.visibilitychange();}};
}
test('preview drives the same timestamp, theme, solar position and clock context',()=>{
  const s=setup();s.node('time-slider').events.input({target:{value:1080}});
  assert.equal(s.context.solarContext.date.toISOString(),'2026-09-11T18:00:00.000Z');
  assert.equal(s.context.solarContext.timeZone,'UTC');const sunsetHue=s.styles['--ui-hue'];
  assert(parseFloat(s.styles['--sun-x'])>50);
  s.node('time-slider').events.input({target:{value:0}});assert.notEqual(s.styles['--ui-hue'],sunsetHue);assert.equal(s.styles['--sun-opacity'],0);
  s.node('live-button').events.click();assert.equal(s.context.solarContext.date,null);assert.equal(s.node('live-label').textContent,'Live sky');
});
test('city search saves the city name and timezone without displaying coordinates',async()=>{
  const s=setup();s.node('city-search').value='London';
  const submitted=s.node('city-form').events.submit({preventDefault(){}});
  assert.match(s.fetchRequests[0].url,/name=London/);
  s.fetchRequests[0].resolve({ok:true,json:async()=>({results:[{name:'London',country:'United Kingdom',latitude:51.5085,longitude:-.1257,timezone:'Europe\/London'}]})});
  await submitted;
  assert.equal(s.context.solarContext.timeZone,'Europe/London');
  assert.equal(s.node('location-label').textContent,'London, United Kingdom');
  assert.doesNotMatch(s.node('location-label').textContent,/51|\.1257/);
});
test('location denial preserves current coordinates; stale device responses are ignored',()=>{
  const s=setup();s.node('use-device-location').events.click();s.requests[0].error();assert.match(s.node('location-settings-status').textContent,/denied/);
  s.node('use-device-location').events.click();s.node('location-source').events.change({target:{value:'city'}});s.requests[1].success({coords:{latitude:0,longitude:0}});
  assert.equal(s.node('location-label').textContent,'Choose a city');
});
test('a location-zone midnight rebuilds the graph even on the same UTC date',()=>{
  const s=setup();s.advance('2026-09-11T23:59:00Z');const graph=s.node('solar-path').attributes.d;
  s.advance('2026-09-12T00:01:00Z');assert.equal(s.node('time-slider').value,1);assert.notEqual(s.node('solar-path').attributes.d,graph);
});
