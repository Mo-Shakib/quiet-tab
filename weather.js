/* Live cloud cover from Open-Meteo (open data, no key, no account).
 * Coordinates are rounded to ~1 km before they leave the device, the response is
 * cached, and every consumer keeps working when the request fails.
 */
(function (root) {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const unit=n=>clamp(n,0,1);
  const number=value=>Number.isFinite(value)?value:null;
  const ENDPOINT='https://api.open-meteo.com/v1/forecast';
  const FIELDS='temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation';
  const MAX_AGE=15*60000;

  // WMO 4677 weather codes, grouped by what the sky actually looks like.
  const CONDITIONS=[
    [[0],'clear','Clear sky'],
    [[1],'fair','Mainly clear'],
    [[2],'partly','Partly cloudy'],
    [[3],'overcast','Overcast'],
    [[45,48],'fog','Fog'],
    [[51,53,55,56,57],'drizzle','Drizzle'],
    [[61,63,65,66,67,80,81,82],'rain','Rain'],
    [[71,73,75,77,85,86],'snow','Snow'],
    [[95,96,99],'storm','Thunderstorm']
  ];
  const condition=code=>CONDITIONS.find(([codes])=>codes.includes(code))??[[],'unknown','Cloud cover'];

  /* Turns a reading into the three cloud decks the sky draws, plus how grey and
   * how hazy they are. Missing deck data is split out of total cover: thin cover
   * reads as high cirrus, thick or wet cover as a low deck. */
  function classify(reading={}) {
    const code=number(reading.code);
    const [,kind,label]=condition(code);
    const wet=['drizzle','rain','snow','storm'].includes(kind);
    const fallbackCover={clear:2,fair:18,partly:50,overcast:96,fog:88,drizzle:82,rain:92,snow:92,storm:97}[kind]??35;
    const cover=unit((number(reading.cloudCover)??fallbackCover)/100);
    const deck=(value,share)=>unit((number(value)??cover*100*share)/100);
    const low=deck(reading.low,wet?.95:cover<.4?.25:.6);
    const mid=deck(reading.mid,wet?.6:.5);
    const high=deck(reading.high,cover<.4?.75:.45);
    const humidity=number(reading.humidity)??60;
    return {
      kind,label,cover,
      layers:{low,mid,high},
      // Rain-bearing and deep decks read grey; thin fair-weather cloud stays bright.
      density:unit(Math.max(low,mid*.8,high*.55)),
      shade:unit((wet?.34:0)+(kind==='storm'?.22:0)+low*.3+cover*.1),
      haze:unit(kind==='fog'?.85:Math.max((humidity-72)/70,0)+(wet?.25:0)+cover*.08),
      drift:clamp((number(reading.windSpeed)??8)/40,.12,1),
      precipitation:wet?kind:null,
      temperature:number(reading.temperature),
      apparentTemperature:number(reading.apparentTemperature),
      humidity,
      windSpeed:number(reading.windSpeed),
      windDirection:number(reading.windDirection),
      windGusts:number(reading.windGusts),
      visibility:Number.isFinite(reading.visibility)?Math.max(0,reading.visibility/1000):null,
      precipitationRate:number(reading.precipitationRate),
      observedAt:number(reading.observedAt)
    };
  }

  function normalise(payload) {
    const current=payload?.current;
    if(!current)return null;
    return {
      code:number(current.weather_code),
      cloudCover:number(current.cloud_cover),
      low:number(current.cloud_cover_low),
      mid:number(current.cloud_cover_mid),
      high:number(current.cloud_cover_high),
      humidity:number(current.relative_humidity_2m),
      windSpeed:number(current.wind_speed_10m),
      precipitationRate:number(current.precipitation),
      temperature:number(current.temperature_2m),
      apparentTemperature:number(current.apparent_temperature),
      visibility:number(current.visibility),
      windGusts:number(current.wind_gusts_10m),
      windDirection:number(current.wind_direction_10m),
      observedAt:Date.now()
    };
  }

  const cacheKey=(latitude,longitude)=>`nt_weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  function readCache(key) {
    try {
      const saved=JSON.parse(root.localStorage.getItem(key));
      return saved&&Date.now()-saved.observedAt<MAX_AGE?saved:null;
    } catch {return null;}
  }

  async function fetchReading(latitude,longitude) {
    const key=cacheKey(latitude,longitude);
    const cached=readCache(key);
    if(cached)return {...cached,cacheStatus:'cached'};
    const url=`${ENDPOINT}?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}&current=${FIELDS}&timezone=UTC`;
    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)throw new Error(`Weather request failed: ${response.status}`);
    const reading=normalise(await response.json());
    if(!reading)throw new Error('Weather response was empty');
    try {root.localStorage.setItem(key,JSON.stringify(reading));} catch {}
    return {...reading,cacheStatus:'live'};
  }

  /* Follows one location, refreshing quietly and never throwing into the caller. */
  function watch(onChange,onStatus=()=>{}) {
    let coordinates=null,timer=null,version=0,enabled=false;
    const emit=value=>onChange(value);
    async function refresh() {
      if(!enabled||!coordinates)return;
      const request=++version;
      onStatus('loading');
      try {
        const reading=await fetchReading(coordinates.latitude,coordinates.longitude);
        if(request===version){emit({...classify(reading),cacheStatus:reading.cacheStatus});onStatus(reading.cacheStatus);}
      } catch {
        if(request===version){emit(null);onStatus('unavailable');}
      }
    }
    return {
      setLocation(next) {
        if(coordinates&&Math.abs(coordinates.latitude-next.latitude)<.01&&Math.abs(coordinates.longitude-next.longitude)<.01)return;
        coordinates=next;refresh();
      },
      setEnabled(next) {
        if(enabled===next)return;
        enabled=next;
        if(!enabled){version++;clearInterval(timer);timer=null;emit(null);onStatus('idle');return;}
        timer??=setInterval(refresh,MAX_AGE);
        refresh();
      }
    };
  }

  root.SkyWeather={classify,normalise,watch,MAX_AGE};
})(typeof window==='undefined'?globalThis:window);
