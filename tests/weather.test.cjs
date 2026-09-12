const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../weather.js');
const {classify,normalise}=SkyWeather;

test('cloud decks follow the reported cover',()=>{
  const clear=classify({code:0,cloudCover:0,low:0,mid:0,high:0});
  assert.equal(clear.kind,'clear');
  for(const deck of Object.values(clear.layers))assert.equal(deck,0);
  const overcast=classify({code:3,cloudCover:98,low:95,mid:70,high:30});
  assert.equal(overcast.kind,'overcast');
  assert.equal(classify({humidity:81}).humidity,81);
  assert.equal(classify({visibility:4200}).visibility,4.2);
  assert(overcast.layers.low>clear.layers.low&&overcast.density>.9);
  assert(overcast.shade>clear.shade,'an overcast deck reads greyer than clear sky');
});
test('rain and thunder darken the sky more than fair-weather cloud',()=>{
  const fair=classify({code:2,cloudCover:45});
  const rain=classify({code:63,cloudCover:95});
  const storm=classify({code:95,cloudCover:98});
  assert(storm.shade>rain.shade&&rain.shade>fair.shade);
  assert.equal(rain.precipitation,'rain');
  assert.equal(fair.precipitation,null);
  assert.equal(classify({code:71,cloudCover:90}).precipitation,'snow');
  assert(classify({code:45,cloudCover:90}).haze>fair.haze,'fog is hazier than fair weather');
});
test('a partial or empty reading still produces a usable sky',()=>{
  for(const reading of [{},{code:2},{cloudCover:60},{code:null,cloudCover:null,humidity:null}]){
    const sky=classify(reading);
    for(const value of [sky.cover,sky.density,sky.shade,sky.haze,sky.drift,...Object.values(sky.layers)]){
      assert(Number.isFinite(value)&&value>=0&&value<=1,`${JSON.stringify(reading)} produced ${value}`);
    }
    assert.equal(typeof sky.label,'string');
  }
  // Cover alone is enough: thin cover becomes high cloud, thick cover a low deck.
  assert(classify({cloudCover:20}).layers.high>classify({cloudCover:20}).layers.low);
  assert(classify({code:65,cloudCover:95}).layers.low>classify({code:65,cloudCover:95}).layers.high);
});
test('malformed responses are rejected rather than drawn',()=>{
  assert.equal(normalise(null),null);
  assert.equal(normalise({}),null);
  const reading=normalise({current:{weather_code:3,cloud_cover:88,temperature_2m:21.4,apparent_temperature:23.1,visibility:8500,wind_speed_10m:12,wind_gusts_10m:27}});
  assert.equal(reading.code,3);
  assert.equal(reading.high,null);
  assert.equal(reading.apparentTemperature,23.1);
  assert.equal(reading.visibility,8500);
  assert.equal(classify(reading).kind,'overcast');
});
