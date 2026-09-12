/* SunCalc 2.0.2 + SolarModel. Astronomy stays on-device; sky colors are a clear-sky approximation. */
(() => {
  const el = id => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  // Coordinates used only to paint an illustrative sky before onboarding.
  const defaultLocation = {latitude:0, longitude:0};
  const validCoordinates = value => value && Number.isFinite(value.latitude) && Math.abs(value.latitude)<=90 && Number.isFinite(value.longitude) && Math.abs(value.longitude)<=180;
  let config = {source:'city', custom:null, city:'Choose a city', device:null, size:100, timeZone:null, deviceTimeZone:null, clouds:true};
  try {
    const saved = JSON.parse(localStorage.getItem('nt_solar_settings'));
    if (saved) {
      const legacyPlaceholder=saved.city==='Choose a city'&&saved.custom?.latitude===0&&saved.custom?.longitude===0;
      config = {source:saved.source==='device'?'device':'city', custom:validCoordinates(saved.custom)&&!legacyPlaceholder?saved.custom:null, city:legacyPlaceholder?'Choose a city':saved.city||'Choose a city', device:validCoordinates(saved.device)?saved.device:null, size:Number.isFinite(saved.size)?clamp(saved.size,60,160):100, timeZone:legacyPlaceholder?null:saved.timeZone||null, deviceTimeZone:saved.deviceTimeZone||null, clouds:saved.clouds!==false};
    }
  } catch {}
  for(const key of ['timeZone','deviceTimeZone']) if(config[key]) try {new Intl.DateTimeFormat('en',{timeZone:config[key]});} catch {config[key]=null;}
  const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const configured = () => config.source==='device' ? validCoordinates(config.device) : validCoordinates(config.custom);
  const zone = () => config.source==='device' && config.device ? (config.deviceTimeZone||browserZone()) : (config.timeZone||browserZone());
  let location = config.source === 'device' && config.device ? config.device : (config.custom||defaultLocation);
  let requestVersion = 0;
  const persist = () => {try {localStorage.setItem('nt_solar_settings',JSON.stringify(config));} catch {el('location-settings-status').textContent='Updated for this session. Browser storage is unavailable.';}};
  let preview = null;
  let dayKey = '';
  let times, start, end, coordinates;
  const valid = date => date instanceof Date && Number.isFinite(+date);
  const _fmtCache = new Map();
  function cachedFmt(options) {
    const key = JSON.stringify(options);
    let fmt = _fmtCache.get(key);
    if (!fmt) { fmt = new Intl.DateTimeFormat(options.locale || [], options); _fmtCache.set(key, fmt); }
    return fmt;
  }
  const formatTime = date => valid(date) ? cachedFmt({timeZone:zone(),hour:'2-digit', minute:'2-digit', hour12: !el('setting-24h').checked}).format(date) : '—';
  const duration = ms => { const minutes = Math.round(ms / 60000); return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; };
  const altitude = date => SolarModel.position(date, coordinates.latitude, coordinates.longitude).altitude;
  const point = date => [640 * (date - start) / (end - start), 73 - altitude(date) * .5];
  function prepareDay(now) {
    const localDate=SolarModel.parts(now,zone());
    const key = `${localDate.year}-${localDate.month}-${localDate.day}-${JSON.stringify(location)}-${config.source}-${zone()}`;
    if (key === dayKey) return;
    dayKey = key;
    coordinates = location;
    times = SolarModel.eventsForDay(now,zone(),coordinates.latitude,coordinates.longitude);
    start=times.start; end=times.end;
    el('time-slider').max=Math.round((end-start)/60000)-1;
    const labels=document.querySelectorAll('.timeline-labels span');
    labels.forEach((label,i)=>{ label.textContent=cachedFmt({timeZone:zone(),hour:'numeric',minute:'2-digit',hour12:!el('setting-24h').checked}).format(new Date(+start+(end-start)*i/4)); });
    const stops=Array.from({length:25},(_,i)=>{const elevation=SolarModel.position(new Date(+start+(end-start)*i/24),coordinates.latitude,coordinates.longitude).elevation; return `${elevation< -6?'#303955':elevation<0?'#9c819e':elevation<8?'#e5a178':'#f1dfb1'} ${i/24*100}%`;});
    document.documentElement.style.setProperty('--day-track',`linear-gradient(90deg,${stops.join(',')})`);
    const points = Array.from({length:145}, (_, i) => point(new Date(+start + (end-start)*i/144)));
    el('solar-path').setAttribute('d', points.map(([x,y],i) => `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' '));
    el('location-label').textContent = config.source==='device' && config.device ? 'Device location' : config.city;
    el('location-note').textContent = `${zone()} · click to change.`;
  }
  /* Sky palette by solar elevation: zenith, mid sky, horizon band, and the warm
   * glow that pools around the sun. The stops crowd together near the horizon
   * because that is where twilight colour changes fastest. */
  const palettes = [
    [-18, ['#05070f','#0a1020','#141c30','#1b2440']],
    [-12, ['#070b18','#111a31','#23304c','#313e63']],
    [-6, ['#0b1226','#1e2b4f','#445074','#7b5f84']],
    [-3, ['#131c3a','#3a3f6b','#8a6b8d','#d1749a']],
    [-.833, ['#1c2a4f','#5b5580','#c9806f','#ff9060']],
    [2, ['#26456f','#85748c','#eaa06d','#ff9e54']],
    [6, ['#2b5580','#8e94a2','#f0be92','#ffb877']],
    [12, ['#2a5f91','#7fa0bb','#ddc7ad','#ffcb95']],
    [30, ['#1d5a8f','#5c93bb','#b4cfd8','#d8dcd4']],
    [90, ['#0e4d80','#4a8ec6','#a7d2e6','#bcd9e6']]
  ];
  const skyMessages = {
    night: [
      'Rest is part of the work.',
      'Even the sun makes room for darkness.',
      'Quiet hours can bring clear answers.',
      'The stars are daylight traveling from far away.',
      'Tomorrow’s light is already on its way.'
    ],
    dawn: [
      'Begin gently; the day is beginning with you.',
      'First light is proof that change can arrive quietly.',
      'A small start can brighten an entire day.',
      'The horizon gets lighter before the sun appears.',
      'New light, new choices, no need to rush.',
      'Near the equator, sunrise sweeps westward at roughly 1,600 km/h.'
    ],
    morning: [
      'Use the fresh light for the work that matters most.',
      'Morning light helps set your body’s daily clock.',
      'Choose one meaningful thing and begin.',
      'Momentum often starts with ten focused minutes.',
      'Face the day before the day fills up.',
      'The sun has been shining for about 4.6 billion years.'
    ],
    midday: [
      'The brightest hours are made for clear decisions.',
      'Pause, breathe, and notice how far you have come.',
      'Strong light, steady effort, simple priorities.',
      'Progress grows where attention stays.',
      'At solar noon, the sun reaches its highest point today.',
      'Sunlight reaches Earth in about eight minutes.'
    ],
    afternoon: [
      'There is still good light left for meaningful work.',
      'A slower pace can still move important things forward.',
      'Finish what matters; release what does not.',
      'Protect your attention as the day gets busier.',
      'The afternoon is a second chance to reset your focus.',
      'Longer shadows make the remaining light easier to notice.'
    ],
    evening: [
      'Let the fading light soften the edges of the day.',
      'Not every task needs to follow you into the evening.',
      'Sunset is a daily invitation to let go.',
      'Review the day with honesty, not judgment.',
      'Warm sunset colors travel through more of the atmosphere.',
      'Enough for today can be a form of wisdom.'
    ]
  };
  function messageFor(date,alt,rising) {
    const hour=SolarModel.parts(date,zone()).hour;
    const group=alt < -9 ? 'night' : alt < 3 ? (rising?'dawn':'evening') : hour < 10 ? 'morning' : hour < 14 ? 'midday' : hour < 18 ? 'afternoon' : 'evening';
    const messages=skyMessages[group];
    // A stable 20-minute slot keeps new tabs fresh without changing while read.
    const slot=Math.floor(+date/1200000);
    return messages[((slot%messages.length)+messages.length)%messages.length];
  }
  function solarMoment(date,alt,rising) {
    const hour=SolarModel.parts(date,zone()).hour;
    if(alt < -12) return 'Night';
    if(alt < 0) return rising ? 'Dawn' : 'Dusk';
    if(alt < 6) return 'Golden hour';
    if(hour < 11) return 'Morning';
    if(hour < 14) return 'Midday';
    if(hour < 18) return 'Afternoon';
    return 'Evening';
  }
  const EXPERIENCE_DATA={
    weather:{
      storm:{heading:'charged and stormy',sky:'Dark, unsettled cloud and possible thunder may make being outside feel exposed.'},
      rain:{heading:'rain-soaked',sky:'Rain is veiling much of the sky and making outdoor plans feel less inviting.'},
      drizzle:{heading:'soft and drizzly',sky:'Fine rain is softening the view and leaving exposed surfaces damp.'},
      snow:{heading:'quiet and snowy',sky:'Snow is diffusing the light and may make movement outside slower.'},
      fog:{heading:'hazy and hushed',sky:'Low visibility is hiding the distance and may make travel feel more demanding.'},
      overcast:{heading:'muted and overcast',sky:'A solid cloud layer is flattening the light and hiding most of the open sky.'},
      partly:{heading:'softly changing',sky:'Passing clouds are alternating the view between open sky and soft shade.'},
      fair:{heading:'mostly open',sky:'Most of the sky is visible, with only occasional cloud softening the light.'},
      clear:{heading:'open-sky',sky:'The sky is largely unobstructed and distant details may be easier to make out.'},
      unknown:{heading:'cloud-softened',sky:'Cloud is softening the light, though the exact condition is uncertain.'}
    },
    comfort:[
      {max:5,heading:'sharply cold',feel:'The air may feel biting, especially on exposed skin.'},
      {max:12,heading:'cold and crisp',feel:'The air may feel brisk enough for an extra layer.'},
      {max:18,heading:'cool',feel:'The air may feel cool and comfortable with a light layer.'},
      {max:25,heading:'gentle',feel:'The air may feel mild and easy to settle into.'},
      {max:30,heading:'warm',feel:'The warmth may be noticeable without feeling overwhelming.'},
      {max:35,heading:'hot',feel:'The heat may feel tiring after time outside.'},
      {max:Infinity,heading:'intensely hot',feel:'The heat may feel strenuous, so shade and water could matter.'}
    ],
    visibility:[
      {max:1,heading:'low-visibility',text:'Measured visibility is very low, so nearby surroundings may fade quickly into the air.'},
      {max:5,heading:'veiled',text:'Measured visibility is limited and the horizon may be difficult to make out.'},
      {max:10,heading:'hazy',text:'The distance may look muted even when the nearby sky seems clear.'}
    ]
  };
  function experienceSignals(weather) {
    const feelsLike=Number.isFinite(weather.apparentTemperature)?weather.apparentTemperature:weather.temperature;
    const humidity=weather.humidity;
    const comfort=Number.isFinite(feelsLike)?EXPERIENCE_DATA.comfort.find(item=>feelsLike<=item.max):EXPERIENCE_DATA.comfort[3];
    const visibility=Number.isFinite(weather.visibility)?EXPERIENCE_DATA.visibility.find(item=>weather.visibility<item.max):null;
    const humid=Number.isFinite(humidity)&&humidity>=72;
    const dry=Number.isFinite(humidity)&&humidity<=35;
    let heading=comfort.heading, feel=comfort.feel;
    if(Number.isFinite(feelsLike)&&feelsLike>=27&&humid){heading=feelsLike>=33?'hot and heavy':'warm and muggy';feel='The air may feel sticky and heavier than the temperature alone suggests.';}
    else if(Number.isFinite(feelsLike)&&feelsLike<=17&&humid){heading='cool and damp';feel='The cool air may feel more penetrating with the added moisture.';}
    else if(dry&&Number.isFinite(feelsLike)&&feelsLike>=27){heading='hot and dry';feel='The warmth may feel sharp and drying, especially in direct light.';}
    const wind=Number.isFinite(weather.windGusts)?weather.windGusts:weather.windSpeed;
    const windText=Number.isFinite(wind)&&wind>=45?'Strong gusts may make the conditions feel more forceful.':Number.isFinite(wind)&&wind>=25?'A noticeable breeze may change how the air feels on exposed skin.':'';
    return {heading,feel,visibility,windText};
  }
  function conditionHeading(date,alt,rising,weather) {
    const solarLabel=solarMoment(date,alt,rising);
    if(!weather) return solarLabel;
    const moment=solarLabel.toLowerCase();
    const scenario=EXPERIENCE_DATA.weather[weather.kind]||EXPERIENCE_DATA.weather.unknown;
    const signals=experienceSignals(weather);
    const weatherFirst=['storm','rain','drizzle','snow','fog'].includes(weather.kind);
    const rainHeading=weather.kind==='rain'&&Number.isFinite(weather.precipitationRate)?(weather.precipitationRate>=7.5?'heavy, rain-filled':weather.precipitationRate>=2.5?'steadily rainy':scenario.heading):scenario.heading;
    const descriptor=weatherFirst?rainHeading:signals.visibility?.heading||((weather.kind==='clear'||weather.kind==='fair')?signals.heading:scenario.heading);
    return `${/^[aeiou]/i.test(descriptor)?'An':'A'} ${descriptor} ${moment}`;
  }
  function conditionMessage(weather,date,alt,rising) {
    if(!weather) return messageFor(date,alt,rising);
    const scenario=EXPERIENCE_DATA.weather[weather.kind]||EXPERIENCE_DATA.weather.unknown;
    const signals=experienceSignals(weather);
    const rainText=weather.kind==='rain'&&Number.isFinite(weather.precipitationRate)&&weather.precipitationRate>=7.5?'Heavy rain is sharply reducing the usable view and may make travel difficult.':weather.kind==='rain'&&Number.isFinite(weather.precipitationRate)&&weather.precipitationRate>=2.5?'Steady rain is veiling the sky and keeping exposed areas thoroughly wet.':scenario.sky;
    const skyText=signals.visibility?.text||rainText;
    return [signals.feel,skyText,signals.windText].filter(Boolean).slice(0,3).join(' ');
  }
  const channels = hex => hex.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16));
  const _mixCache = new Map();
  function mix(a,b,t) {
    const key = a + b + (t * 1000 | 0);
    let result = _mixCache.get(key);
    if (result) return result;
    if (_mixCache.size > 2048) _mixCache.clear();
    const x=channels(a),y=channels(b);
    result = `#${x.map((n,i)=>Math.round(n+(y[i]-n)*t).toString(16).padStart(2,'0')).join('')}`;
    _mixCache.set(key, result);
    return result;
  }

  const _domCache = new Map();
  function setTextOnce(id, text) { if (_domCache.get('t:'+id) !== text) { el(id).textContent = text; _domCache.set('t:'+id, text); } }
  function setAttrOnce(id, attr, value) { const k = `a:${id}:${attr}`; if (_domCache.get(k) !== value) { el(id).setAttribute(attr, value); _domCache.set(k, value); } }
  const _cssCache = new Map();
  function setCSSOnce(css, name, value) { const sv = String(value); if (_cssCache.get(name) !== sv) { css.setProperty(name, value); _cssCache.set(name, sv); } }

  /* Live cloud decks. Everything degrades to the clear-sky model when the reading
   * is missing, stale or switched off, so the sky never waits on the network. */
  const ago = ms => {const minutes=Math.round(ms/60000); return minutes<1?'just now':minutes<60?`${minutes} min ago`:`${Math.round(minutes/60)} h ago`;};
  const clouds = (() => {
    let reading = null;
    function describe() {
      const readout=el('weather-readout'), note=el('sky-model-note');
      if(!configured()) {readout.hidden=false; readout.textContent='Illustrative sky'; readout.dataset.status='unconfigured'; note.textContent='Choose a location for local sun and clouds'; return;}
      if(!config.clouds) {readout.hidden=true; note.textContent='Clear-sky simulation · live clouds off'; return;}
      if(status==='loading'&&!reading) {readout.hidden=false;readout.textContent='Updating clouds…';readout.dataset.status='loading';note.textContent='Requesting current cloud cover from Open-Meteo';return;}
      if(!reading) {readout.hidden=false; readout.textContent=status==='unavailable'?'Clouds unavailable':'Waiting for clouds…';readout.dataset.status=status; note.textContent='Clear-sky simulation · cloud data unavailable'; return;}
      readout.hidden=false;
      const temperature=Number.isFinite(reading.temperature)?` · ${Math.round(reading.temperature)}°C`:'';
      readout.textContent=`${reading.label} · ${Math.round(reading.cover*100)}% cloud${temperature}${reading.cacheStatus==='cached'?' · cached':''}`;
      readout.dataset.status=reading.cacheStatus||'live';
      note.textContent=`Live cloud cover · Open-Meteo · ${ago(Date.now()-reading.observedAt)}`;
    }
    let status='idle';
    const watcher=window.SkyWeather?window.SkyWeather.watch(next=>{reading=next;describe();render();},next=>{status=next;describe();}):null;
    return {
      current:()=>config.clouds?reading:null,
      describe,
      sync() {if(!watcher){describe();return;} watcher.setLocation(location); watcher.setEnabled(config.clouds&&configured()); describe();}
    };
  })();
  /* Cloud colour is a two-tone shading model: a sunlit face that tracks the sun's
   * own colour and a shadowed base that deepens with cover and falling light. */
  function paintClouds(weather,elevation,warmth) {
    const css=document.documentElement.style;
    const daylight=clamp((elevation+8)/14,0,1);
    if(!weather) {['--cloud-low','--cloud-mid','--cloud-high','--cloud-sheet','--cloud-glow','--haze'].forEach(name=>setCSSOnce(css,name,'0')); return;}
    const cloudTones={
      storm:{shadow:'#222938',light:'#687384',shadeBoost:.34,glow:.22},
      rain:{shadow:'#303849',light:'#8793a4',shadeBoost:.2,glow:.38},
      drizzle:{shadow:'#465164',light:'#aab4c1',shadeBoost:.1,glow:.55},
      snow:{shadow:'#8290a3',light:'#f4f7fb',shadeBoost:-.08,glow:.7},
      fog:{shadow:'#788391',light:'#d8dfe5',shadeBoost:.02,glow:.2},
      overcast:{shadow:'#465164',light:'#a6afbb',shadeBoost:.12,glow:.42},
      partly:{shadow:'#59677a',light:'#eef2f6',shadeBoost:0,glow:.85},
      fair:{shadow:'#66758a',light:'#fafbfc',shadeBoost:-.04,glow:1},
      clear:{shadow:'#6e7d91',light:'#ffffff',shadeBoost:-.08,glow:1}
    };
    const tone=cloudTones[weather.kind]||cloudTones.partly;
    const sunlit=mix(tone.light,'#ffad73',warmth*.72);
    const lit=mix('#39415f',sunlit,daylight);
    setCSSOnce(css,'--cloud-lit',lit);
    setCSSOnce(css,'--cloud-top',mix(lit,tone.light,.32));
    setCSSOnce(css,'--cloud-shade',mix(tone.shadow,mix('#9aa7b9','#927887',warmth),daylight*clamp(.62-weather.shade-tone.shadeBoost,0,.62)));
    const presence=.28+.72*daylight;
    setCSSOnce(css,'--cloud-low',(weather.layers.low*presence).toFixed(3));
    setCSSOnce(css,'--cloud-mid',(weather.layers.mid*presence).toFixed(3));
    setCSSOnce(css,'--cloud-high',(weather.layers.high*presence).toFixed(3));
    setCSSOnce(css,'--cloud-sheet',(clamp((weather.cover-.55)/.45,0,1)*.8*presence).toFixed(3));
    setCSSOnce(css,'--cloud-glow',(weather.density*daylight*.85*tone.glow).toFixed(3));
    setCSSOnce(css,'--cloud-drift',weather.drift.toFixed(2));
    const towardEast=Number.isFinite(weather.windDirection)?-Math.sin(weather.windDirection*Math.PI/180):1;
    setCSSOnce(css,'--cloud-direction',towardEast>=0?'normal':'reverse');
    const gustiness=Number.isFinite(weather.windGusts)&&Number.isFinite(weather.windSpeed)?clamp((weather.windGusts-weather.windSpeed)/35,0,1):0;
    setCSSOnce(css,'--cloud-breathe',`${(2.5+gustiness*2).toFixed(1)}s`);
    setCSSOnce(css,'--haze',(weather.haze*(.3+.7*daylight)*.5).toFixed(3));
  }
  function render() {
    const now = new Date(); prepareDay(now);
    const hasLocation = configured();
    const solarPanel = el('solar-panel');
    if (solarPanel?.classList) solarPanel.classList.toggle('is-unconfigured', !hasLocation);
    el('location-onboarding').hidden = hasLocation;
    const date = preview === null ? now : new Date(+start+clamp(preview,0,(end-start)/60000-1)*60000);
    window.solarContext={date:preview===null?null:date,timeZone:zone()};
    updateClock();
    const position=SolarModel.position(date,coordinates.latitude,coordinates.longitude);
    const alt = position.elevation;
    const rising = altitude(new Date(+date+60000)) > position.altitude;
    const weather = clouds.current();
    const headingWeather = preview === null ? weather : null;
    const phase = solarMoment(date,alt,rising);
    setTextOnce('sky-phase', configured()?conditionHeading(date,alt,rising,headingWeather):'Illustrative sky');
    const weatherMessage=headingWeather?conditionMessage(headingWeather,date,alt,rising):preview!==null?'Previewing the sun and sky at this time.':'Weather details are unavailable right now.';
    setTextOnce('sky-message', configured()?weatherMessage:'A calm preview until you make it yours.');
    setTextOnce('sky-fact',messageFor(date,alt,rising));
    const upper = palettes.findIndex(([e])=>e >= alt);
    const hi = upper < 0 ? palettes.length-1 : upper, lo = Math.max(0,hi-1);
    const t = hi===lo ? 0 : clamp((alt-palettes[lo][0])/(palettes[hi][0]-palettes[lo][0]),0,1);
    const sky = palettes[lo][1].map((color,i)=>mix(color,palettes[hi][1][i],t));
    const light = clamp(Math.sin(Math.max(0,alt)*Math.PI/180),0,1);
    const [x,y] = point(date);
    const css = document.documentElement.style;
    const airMass=1/(Math.sin(clamp(position.altitude,0,90)*Math.PI/180)+.50572*Math.pow(clamp(position.altitude,0,90)+6.07995,-1.6364));
    const warmth=clamp(1-Math.exp(-.09*(airMass-1)),0,1);
    const grey = weather ? weather.shade*.5 : 0;
    ['--sky-top','--sky-mid','--sky-bottom'].forEach((name,i)=>setCSSOnce(css,name,mix(sky[i],'#6d7585',grey)));
    const horizonGlow = Math.exp(-((alt>=0?alt/9:alt/12)**2))*(alt<-16?0:1);
    const glowColor = sky[3];
    setCSSOnce(css,'--sky-glow',glowColor);
    setCSSOnce(css,'--glow-strength',`${Math.round(horizonGlow*72*clamp(1-grey*1.1,0,1))}%`);
    setCSSOnce(css,'--glow-core',mix(glowColor,'#fff0cd',.45));
    setCSSOnce(css,'--glow-edge',glowColor);
    setCSSOnce(css,'--glow-belt',mix(glowColor,'#b57fae',.55));
    setCSSOnce(css,'--afterglow',(horizonGlow*(1-grey*.8)).toFixed(3));
    setCSSOnce(css,'--sun-x',`${(position.sky.x*100).toFixed(2)}%`);
    setCSSOnce(css,'--sun-height',position.sky.height.toFixed(4));
    setCSSOnce(css,'--sun-opacity',position.visible>0?(1-(weather?weather.density*.55:0)).toFixed(2):0);
    setCSSOnce(css,'--sun-clip',`${(1-position.visible)*100}%`);
    setCSSOnce(css,'--sun-glow',((.03+light*.22)*(weather?1-weather.density*.6:1)).toFixed(3));
    setCSSOnce(css,'--sun-color',mix('#fff8e8','#ff7132',warmth));
    setCSSOnce(css,'--sun-core',mix('#fffdf4','#fff3c4',warmth));
    setCSSOnce(css,'--sun-body',mix('#fff8e8','#ffc266',warmth));
    paintClouds(weather,alt,warmth);
    clouds.describe();
    setCSSOnce(css,'--sun-scale',((position.diameter/.533128)*config.size/100).toFixed(4));
    const daylight=clamp((alt+12)/24,0,1);
    const lowSun=warmth*clamp(1-alt/14,0,1);
    const dayHue=222+166*lowSun;
    const hue=(225+(dayHue-225)*clamp((alt+12)/12,0,1)+360)%360;
    setCSSOnce(css,'--ui-hue',hue.toFixed(1));
    setCSSOnce(css,'--ui-saturation',`${Math.round(22+18*daylight)}%`);
    setCSSOnce(css,'--ui-lightness',`${(7+11*daylight).toFixed(1)}%`);
    setCSSOnce(css,'--ui-accent',alt<0?mix('#b9c9f1','#ffd2a3',clamp((alt+12)/12,0,1)):mix('#e3f2ff','#ffd2a3',warmth));
    setCSSOnce(css,'--light-strength',(.025+.13*daylight).toFixed(3));
    setCSSOnce(css,'--shadow-x',`${((50-position.sky.x*100)*.35).toFixed(1)}px`);
    setCSSOnce(css,'--shadow-y',`${(10+24*(1-light)).toFixed(1)}px`);
    setCSSOnce(css,'--plasma-rotation',`${((+date/86400000)%27.2753)/27.2753*360}deg`);
    const xStr = String(x), yStr = String(y);
    ['chart-sun','chart-sun-halo'].forEach(id=>{ setAttrOnce(id,'cx',xStr); setAttrOnce(id,'cy',yStr); });
    setAttrOnce('sun-guide','x1',xStr); setAttrOnce('sun-guide','x2',xStr); setAttrOnce('sun-guide','y1',yStr);
    el('sun-chart').setAttribute('aria-label',`Sun altitude throughout today. ${formatTime(date)}: ${position.altitude.toFixed(1)} degrees apparent elevation above the horizon.`);
    setTextOnce('sunrise-time', configured()?formatTime(times.sunrise):'—');
    setTextOnce('sunset-time', configured()?formatTime(times.sunset):'—');
    setTextOnce('daylight-duration', configured()?(times.daylight===0?'0h · no daylight':duration(times.daylight)):'Set location');
    const next=times.events.find(event=>event.time>date);
    setTextOnce('solar-summary', configured()?(next ? `${duration(next.time-date)} until ${next.type}` : position.visible>0 ? 'The sun stays above the horizon' : 'The sun stays below the horizon'):'Choose a location for your local sun');
    const compass=['N','NE','E','SE','S','SW','W','NW'][Math.round(position.azimuth/45)%8];
    setTextOnce('light-level', `${position.altitude.toFixed(1)}° elevation · ${position.azimuth.toFixed(1)}° ${compass}`);
    el('light-level').title = `Apparent elevation with standard refraction. Solar diameter ${position.diameter.toFixed(3)}°, distance ${position.distanceAU.toFixed(4)} AU. East is left in the sky projection.`;
    setTextOnce('preview-time', preview === null ? `Now · ${formatTime(date)}` : `Previewing · ${formatTime(date)}`);
    el('time-slider').setAttribute('aria-valuetext',`${formatTime(date)}, ${phase}`);
    if(preview === null) el('time-slider').value = Math.floor((now-start)/60000);
    el('live-button').dataset.preview = String(preview !== null);
    if (solarPanel) solarPanel.dataset.preview = String(preview !== null);
    setTextOnce('live-label', preview === null ? 'Live sky' : 'Return to now');
    window.quietSkyState={date,latitude:coordinates.latitude,longitude:coordinates.longitude,configured:configured(),solarElevation:alt,weather:preview===null?weather:null};
    if(typeof CustomEvent==='function') window.dispatchEvent(new CustomEvent('quiet-sky-update',{detail:window.quietSkyState}));
  }
  el('time-slider').addEventListener('input',event=>{preview=Number(event.target.value);render();});
  el('live-button').addEventListener('click',()=>{preview=null;render();});
  el('setting-24h').addEventListener('change',()=>{dayKey='';_fmtCache.clear();render();});
  function syncLocationSettings() {
    el('location-source').value=config.source;
    el('city-form').hidden=config.source==='device';
    el('device-location-controls').hidden=config.source!=='device';
    el('city-search').value=config.city==='Choose a city'?'':config.city;
    el('sun-size-scale').value=config.size;
    el('sun-size-output').textContent=`${config.size}%`;
    el('setting-clouds').checked=config.clouds;
  }
  function applyLocation() {
    location=config.source==='device' && config.device ? config.device : (config.custom||defaultLocation);
    dayKey='';
    persist(); clouds.sync(); render();
  }
  const cityLabel=result=>[result.name,result.admin1,result.country].filter(Boolean).filter((part,index,array)=>array.indexOf(part)===index).join(', ');
  function chooseCity(result) {
    const next={latitude:Number(result.latitude),longitude:Number(result.longitude)};
    if(!validCoordinates(next)||!result.timezone)return;
    try {new Intl.DateTimeFormat('en',{timeZone:result.timezone});} catch {return;}
    config.custom=next;config.city=cityLabel(result);config.timeZone=result.timezone;config.source='city';
    el('city-results').hidden=true;applyLocation();syncLocationSettings();
    el('location-settings-status').textContent=`Using ${config.city}.`;
  }
  function showCityResults(results) {
    const list=el('city-results');list.replaceChildren();
    results.forEach(result=>{const button=document.createElement('button');button.type='button';button.className='city-result';button.textContent=cityLabel(result);button.addEventListener('click',()=>chooseCity(result));list.append(button);});
    list.hidden=!results.length;
  }
  el('location-button').addEventListener('click',()=>{ syncLocationSettings(); el('settings-modal').showModal(); el('location-source').focus(); });
  el('onboarding-location-button').addEventListener('click',()=>{ syncLocationSettings(); el('settings-modal').showModal(); el('city-search').focus(); });
  el('location-source').addEventListener('change',event=>{
    requestVersion++; el('use-device-location').disabled=false;
    config.source=event.target.value; syncLocationSettings(); applyLocation();
    el('location-settings-status').textContent=config.source==='device' ? (config.device?'Using your saved device location. Refresh to update.':'Click Get device location. Using the selected city until a position is available.') : `Using ${config.city}.`;
  });
  el('city-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const query=el('city-search').value.trim();
    if(!query)return;
    const request=++requestVersion;
    el('location-settings-status').textContent='Searching for that city…';
    try {
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      if(!response.ok)throw new Error('search failed');
      const results=(await response.json()).results?.filter(result=>validCoordinates({latitude:Number(result.latitude),longitude:Number(result.longitude)})&&result.timezone)||[];
      if(request!==requestVersion)return;
      if(!results.length)throw new Error('not found');
      showCityResults(results);
      el('location-settings-status').textContent=results.length===1?'One match found. Choose it to continue.':`${results.length} matches found. Choose the right place.`;
    } catch {
      if(request===requestVersion)el('location-settings-status').textContent='City not found. Check the spelling and try again.';
    }
  });
  el('use-device-location').addEventListener('click',()=>{
    if (!navigator.geolocation) {el('location-settings-status').textContent='Device location is unavailable. Your selected city is still in use.';return;}
    const request=++requestVersion;
    el('use-device-location').disabled=true;
    el('location-settings-status').textContent='Waiting for your device’s location…';
    navigator.geolocation.getCurrentPosition(async position=>{
      if(request!==requestVersion)return;
      el('use-device-location').disabled=false;
      const next={latitude:position.coords.latitude,longitude:position.coords.longitude};
      if(!validCoordinates(next)){el('location-settings-status').textContent='The device returned an invalid position. Your current coordinates are still in use.';return;}
      let resolvedZone=null;
      try {const response=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${next.latitude.toFixed(4)}&longitude=${next.longitude.toFixed(4)}&current=is_day&timezone=auto`);if(response.ok)resolvedZone=(await response.json()).timezone||null;} catch {}
      if(request!==requestVersion)return;
      if(resolvedZone)try {new Intl.DateTimeFormat('en',{timeZone:resolvedZone});} catch {resolvedZone=null;}
      config.device=next;config.deviceTimeZone=resolvedZone;config.source='device';applyLocation();syncLocationSettings();
      el('location-settings-status').textContent=resolvedZone?'Device location and timezone saved. Refresh here whenever you move.':'Device location saved. Using your browser timezone because its timezone could not be resolved.';
    },()=>{
      if(request!==requestVersion)return;
      el('use-device-location').disabled=false;
      el('location-settings-status').textContent='Location unavailable or permission denied. Your selected city is still in use. You can retry or choose city search.';
    },{enableHighAccuracy:false,timeout:15000,maximumAge:60000});
  });
  el('setting-clouds').addEventListener('change',event=>{
    config.clouds=event.target.checked; persist(); clouds.sync(); render();
  });
  el('sun-size-scale').addEventListener('input',event=>{
    config.size=Number(event.target.value); el('sun-size-output').textContent=`${config.size}%`; persist(); render();
  });
  document.addEventListener('quiet-reset',()=>{
    requestVersion++; el('use-device-location').disabled=false;
    config={source:'city',custom:null,city:'Choose a city',device:null,size:100,timeZone:null,deviceTimeZone:null,clouds:true}; preview=null;
    el('location-settings-status').textContent='Preferences reset. Search for a city to localize the sun.';
    syncLocationSettings(); applyLocation();
  });
  let _rafPending = false;
  function scheduleRender() { if (!_rafPending) { _rafPending = true; requestAnimationFrame(() => { _rafPending = false; render(); }); } }
  syncLocationSettings();
  clouds.sync();
  window.addEventListener('resize', scheduleRender);
  window.addEventListener('scroll', scheduleRender, {passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) render();});
  document.addEventListener('DOMContentLoaded',render);
  setInterval(()=>{if(!document.hidden) render();},1000);
})();
