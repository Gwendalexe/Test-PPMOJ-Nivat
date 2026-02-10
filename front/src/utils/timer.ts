export function timeToString(time: number): string {
  const timeMinutes = Math.floor(time / 60);
  const timeSecondes = time % 60;
  const textMinutes = timeMinutes == 1 ? 'minute' : 'minutes';
  const textSecondes = timeSecondes == 1 ? 'seconde' : 'secondes';
  return `${timeMinutes ? timeMinutes + ' ' + textMinutes + ' ' : ''}${timeSecondes + ' ' + textSecondes}`;
}
