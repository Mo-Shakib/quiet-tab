# Solar model

The clock, preview, solar graph, events and theme share one timestamp and time zone. The initial neutral location uses UTC until the user searches for a city or enables device location. City search supplies an IANA time zone. Device mode uses the device's location and system time zone; it can be refreshed in Preferences.

## Astronomy

- Vendored SunCalc 2.0.2 (BSD-2-Clause) computes apparent elevation, north-clockwise azimuth and iterative sunrise/sunset times. The implementation includes standard atmospheric refraction, nutation, aberration and time-dependent obliquity.
- Events are selected within the selected zone's civil day, including 23/25-hour daylight-saving days. Daylight duration is integrated across its sunrise/set intervals. Missing events at high latitude remain absent.
- Apparent solar diameter is approximately 0.533128° divided by orbital distance in AU, calculated using the Meeus chapter 25 orbital equations. It changes slightly with the season, not dramatically between morning and noon.
- The altitude chart uses an east–west orthographic projection: east appears on the left, west on the right, and height follows the sine of elevation. It is a diagram, not a compass-aligned camera view.
- The sky itself spans the window width with one sunrise-to-sunset arc. Horizontal position comes from the hour angle, derived from the declination and equation of time (Meeus ch. 25/28), so the sun reaches the left edge at sunrise, the centre at solar noon and the right edge at sunset; the arc is inset by roughly half a disk so the sun stays whole at both ends. Height is the sine of elevation normalised against the day's own peak altitude, floored at an 18° reference so a low winter sun still rises visibly. Where the sun never crosses the horizon, the arc falls back to the full daily turn. The solar disk is heavily magnified so it reads as the focal point: its base diameter scales with the viewport width, multiplied by the model's seasonal size ratio and the Preferences display scale. The disk stays brighter than the sky it sits in, while the light it casts reddens with air mass.

## Appearance

The full interface uses a common elevation-derived theme. Color approximates clear-sky extinction using relative air mass, with an interpolated sky palette; warm tint, the horizon glow and the UI hue are driven by that same low-sun warmth. Highlights follow the displayed sun, and shadows point away from it. These are visual approximations rather than a radiative-transfer model. Pressure, aerosols, terrain and buildings are not supplied, so exact observed colors and horizon events will differ. Texture is illustrative.

## Clouds

Cloud cover comes from [Open-Meteo](https://open-meteo.com/) (open data, no key). Coordinates are rounded to two decimals, about a kilometre, before the request; the reading is cached for 15 minutes and can be switched off in Preferences. Low, middle and high cover drive three drifting decks, a solid sheet fades in as cover approaches overcast, and WMO weather codes set how grey and hazy the decks read. Deck shapes are stitched fractal noise, not a forecast of where individual clouds are. Every layer degrades to the clear-sky model when the request fails, the data is stale or the setting is off.

## Validation

Run `node --test tests/*.test.cjs`.

Tests cover the NREL SPA worked example (within 0.02° for this single reference case; not a global accuracy guarantee), event/elevation consistency, Dhaka's civil day, DST, time-zone midnight rollover, poles, orbital diameter, location validation and stale device responses, synchronized live/preview state, the sky arc's alignment with sunrise and sunset and its behaviour under polar day and night, and the cloud mapping including partial and malformed weather responses.

References:
- [SunCalc](https://github.com/mourner/suncalc), pinned version 2.0.2; license in vendor/SunCalc-LICENSE.
- [Open-Meteo](https://open-meteo.com/en/docs) current-weather variables and [WMO 4677 weather codes](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM).
- [NOAA calculation details and atmospheric limits](https://gml.noaa.gov/grad/solcalc/calcdetails.html).
- [NREL Solar Position Algorithm reference](https://midcdmz.nlr.gov/spa/), Reda and Andreas, NREL/TP-560-34302, Table A5.1.
