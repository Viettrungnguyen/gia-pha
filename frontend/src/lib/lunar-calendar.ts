/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/lunar-calendar.ts
 * @description Vietnamese lunar and solar calendar conversion utilities
 * @version 1.0.0
 * @updated 2026-07-24
 */

const PI = Math.PI;

function jdFromDate(day: number, month: number, year: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd: number): [number, number, number] {
  let b: number;
  let c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}

function newMoon(k: number): number {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const dr = PI / 180;
  let jd = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  jd += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  let correction = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * dr * m);
  correction -= 0.4068 * Math.sin(mPrime * dr);
  correction += 0.0161 * Math.sin(2 * dr * mPrime) - 0.0004 * Math.sin(3 * dr * mPrime);
  correction += 0.0104 * Math.sin(2 * dr * f) - 0.0051 * Math.sin(dr * (m + mPrime));
  correction -= 0.0074 * Math.sin(dr * (m - mPrime));
  correction += 0.0004 * Math.sin(dr * (2 * f + m)) - 0.0004 * Math.sin(dr * (2 * f - m));
  correction -= 0.0006 * Math.sin(dr * (2 * f + mPrime));
  correction += 0.001 * Math.sin(dr * (2 * f - mPrime)) + 0.0005 * Math.sin(dr * (2 * mPrime + m));
  const delta =
    t < -11
      ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
      : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return jd + correction - delta;
}

function sunLongitude(jdn: number): number {
  const t = (jdn - 2451545) / 36525;
  const t2 = t * t;
  const dr = PI / 180;
  const m = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  let dl = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m);
  dl += (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m) + 0.00029 * Math.sin(3 * dr * m);
  let longitude = (l0 + dl) * dr;
  longitude -= PI * 2 * Math.floor(longitude / (PI * 2));
  return Math.floor((longitude / PI) * 6);
}

function getLunarMonth11(year: number, timeZone: number): number {
  const offset = jdFromDate(31, 12, year) - 2415021;
  const k = Math.floor(offset / 29.530588853);
  let moon = newMoon(k);
  if (sunLongitude(moon + 0.5 + timeZone / 24) >= 9) moon = newMoon(k - 1);
  return Math.floor(moon + 0.5 + timeZone / 24);
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last: number;
  let index = 1;
  let arc = sunLongitude(newMoon(k + index) + 0.5 + timeZone / 24);
  do {
    last = arc;
    index += 1;
    arc = sunLongitude(newMoon(k + index) + 0.5 + timeZone / 24);
  } while (arc !== last && index < 14);
  return index - 1;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

export function solarToLunar(
  day: number,
  month: number,
  year: number,
  timeZone = 7
): LunarDate {
  const dayNumber = jdFromDate(day, month, year);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = Math.floor(newMoon(k) + 0.5 + timeZone / 24);
  if (monthStart > dayNumber) monthStart = Math.floor(newMoon(k - 1) + 0.5 + timeZone / 24);

  let a11 = getLunarMonth11(year, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = getLunarMonth11(year - 1, timeZone);
  } else {
    lunarYear = year + 1;
    b11 = getLunarMonth11(year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapOffset = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapOffset) {
      lunarMonth = diff + 10;
      if (diff === leapOffset) leap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap = false,
  timeZone = 7
): { day: number; month: number; year: number } {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let offset = lunarMonth - 11;
  if (offset < 0) offset += 12;
  if (b11 - a11 > 365) {
    const leapOffset = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOffset - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (lunarLeap && lunarMonth !== leapMonth) return { day: 0, month: 0, year: 0 };
    if (lunarLeap || offset >= leapOffset) offset += 1;
  }
  const monthStart = Math.floor(newMoon(k + offset) + 0.5 + timeZone / 24);
  const [day, month, year] = jdToDate(monthStart + lunarDay - 1);
  return { day, month, year };
}

export function parseLunarString(value: string): { day: number; month: number } | null {
  const parts = value.split('/');
  if (parts.length !== 2) return null;
  const day = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10);
  if (!Number.isInteger(day) || !Number.isInteger(month) || day < 1 || day > 30 || month < 1 || month > 12) {
    return null;
  }
  return { day, month };
}

export function getNextLunarOccurrence(
  lunarDay: number,
  lunarMonth: number,
  referenceDate = new Date()
): Date {
  const reference = new Date(referenceDate);
  reference.setHours(0, 0, 0, 0);
  const currentLunarYear = solarToLunar(
    reference.getDate(),
    reference.getMonth() + 1,
    reference.getFullYear()
  ).year;

  for (const year of [currentLunarYear, currentLunarYear + 1]) {
    const solar = lunarToSolar(lunarDay, lunarMonth, year);
    const date = new Date(solar.year, solar.month - 1, solar.day);
    if (date >= reference) return date;
  }

  const fallback = lunarToSolar(lunarDay, lunarMonth, currentLunarYear + 2);
  return new Date(fallback.year, fallback.month - 1, fallback.day);
}

export function findLunarOccurrenceInSolarMonth(
  lunarDay: number,
  lunarMonth: number,
  solarMonth: number,
  solarYear: number
): Date | null {
  for (const lunarYear of [solarYear - 1, solarYear, solarYear + 1]) {
    const solar = lunarToSolar(lunarDay, lunarMonth, lunarYear);
    if (solar.year === solarYear && solar.month === solarMonth) {
      return new Date(solar.year, solar.month - 1, solar.day);
    }
  }
  return null;
}

export function formatLunarDate(day: number, month: number): string {
  return `${day}/${month} (ÂL)`;
}
