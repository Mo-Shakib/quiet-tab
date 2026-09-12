const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup({configured=false,saved=null}={}){
  const nodes={},styles={},storage={},events={},requests=[],fetchRequests=[];let now='2026-09-11T06:00:00Z';
  if(configured)storage.nt_solar_settings=JSON.stringify({source:'city',custom:{latitude:0,longitude:0},city:'Test location',timeZone:'UTC',clouds:false,size:100});
  if(saved)storage.nt_solar_settings=JSON.stringify(saved);
  const makeNode=()=>({value:'',checked:false,textContent:'',hidden:false,disabled:false,dataset:{},attributes:{},events:{},children:[],setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.events[k]=f;},showModal(){},focus(){},replaceChildren(...items){this.children=items;},append(item){this.children.push(item);}});
  const node=id=>nodes[id]??=(makeNode());
  class FixedDate extends Date {constructor(...a){super(...(a.length?a:[now]));}}
  const context={Date:FixedDate,Intl,console,encodeURIComponent,updateClock(){},setInterval(){},addEventListener(){},fetch:url=>new Promise(resolve=>fetchRequests.push({url,resolve})),localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},navigator:{geolocation:{getCurrentPosition:(success,error)=>requests.push({success,error})}},document:{hidden:false,getElementById:node,createElement:makeNode,querySelector:()=>({getBoundingClientRect:()=>({left:0,top:0,width:640})}),querySelectorAll:()=>Array.from({length:5},(_,i)=>node(`label-${i}`)),documentElement:{style:{setProperty:(k,v)=>styles[k]=v,getPropertyValue:k=>styles[k]}},addEventListener:(k,f)=>events[k]=f}};
  context.window=context;vm.createContext(context);
  for(const file of ['vendor/suncalc.js','solar-model.js','solar.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  events.DOMContentLoaded();return {node,styles,context,requests,fetchRequests,storage,advance:iso=>{now=iso;events.visibilitychange();}};
}
test('preview drives the same timestamp, theme, solar position and clock context',()=>{
  const s=setup({configured:true});s.node('time-slider').events.input({target:{value:1080}});
  assert.equal(s.context.solarContext.date.toISOString(),'2026-09-11T18:00:00.000Z');
  assert.equal(s.context.solarContext.timeZone,'UTC');const sunsetHue=s.styles['--ui-hue'];
  assert(parseFloat(s.styles['--sun-x'])>50);
  s.node('time-slider').events.input({target:{value:0}});assert.notEqual(s.styles['--ui-hue'],sunsetHue);assert.equal(s.styles['--sun-opacity'],0);
  assert.equal(s.node('sky-message').textContent,'Previewing the sun and sky at this time.');
  assert.equal(s.node('sky-fact').textContent,'Tomorrow’s light is already on its way.');
  s.node('live-button').events.click();assert.equal(s.context.solarContext.date,null);assert.equal(s.node('live-label').textContent,'Live sky');
});
test('city search offers labelled matches and saves the selected timezone without displaying coordinates',async()=>{
  const s=setup();s.node('city-search').value='London';
  const submitted=s.node('city-form').events.submit({preventDefault(){}});
  assert.match(s.fetchRequests[0].url,/name=London/);
  s.fetchRequests[0].resolve({ok:true,json:async()=>({results:[{name:'London',country:'United Kingdom',latitude:51.5085,longitude:-.1257,timezone:'Europe\/London'}]})});
  await submitted;
  assert.equal(s.node('city-results').children.length,1);
  s.node('city-results').children[0].events.click();
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
  const s=setup({configured:true});s.advance('2026-09-11T23:59:00Z');const graph=s.node('solar-path').attributes.d;
  s.advance('2026-09-12T00:01:00Z');assert.equal(s.node('time-slider').value,1);assert.notEqual(s.node('solar-path').attributes.d,graph);
});
test('first run is explicitly illustrative and makes no weather request',()=>{
  const s=setup();
  assert.equal(s.node('sky-phase').textContent,'Illustrative sky');
  assert.match(s.node('sky-message').textContent,/calm preview/);
  assert.equal(s.node('sunrise-time').textContent,'—');
  assert.equal(s.node('weather-readout').textContent,'Illustrative sky');
  assert.equal(s.fetchRequests.length,0);
});
test('legacy zero-coordinate placeholder migrates to the unconfigured state',()=>{
  const s=setup({saved:{source:'city',custom:{latitude:0,longitude:0},city:'Choose a city',timeZone:'UTC',clouds:true,size:100}});
  assert.equal(s.node('solar-summary').textContent,'Choose a location for your local sun');
  assert.equal(s.fetchRequests.length,0);
});
test('ambiguous city search shows every valid labelled result',async()=>{
  const s=setup();s.node('city-search').value='Springfield';
  const submitted=s.node('city-form').events.submit({preventDefault(){}});
  s.fetchRequests[0].resolve({ok:true,json:async()=>({results:[
    {name:'Springfield',admin1:'Illinois',country:'United States',latitude:39.8,longitude:-89.6,timezone:'America/Chicago'},
    {name:'Springfield',admin1:'Massachusetts',country:'United States',latitude:42.1,longitude:-72.6,timezone:'America/New_York'}
  ]})});
  await submitted;
  assert.equal(s.node('city-results').children.length,2);
  assert.match(s.node('city-results').children[1].textContent,/Massachusetts/);
});
