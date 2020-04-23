function declOfNum(number: number, titles: string[]): string {
  const hundreds = Math.abs(number) % 100;
  const tens = hundreds % 10;
  if (hundreds > 10 && hundreds < 20) { return titles[2]; }
  if (tens > 1 && tens < 5) { return titles[1]; }
  if (tens == 1) { return titles[0]; }
  return titles[2];
}

export {
  declOfNum
}