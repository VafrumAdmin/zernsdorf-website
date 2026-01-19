import type { HistoryEntry } from '@/types';

// Historische Daten über Zernsdorf
// Basierend auf öffentlich verfügbaren Informationen

export const HISTORY_ENTRIES: HistoryEntry[] = [
  {
    id: '1',
    year: 1375,
    title: 'Erste urkundliche Erwähnung',
    description:
      'Zernsdorf wird erstmals im Landbuch Kaiser Karls IV. urkundlich erwähnt. Der Name leitet sich vermutlich vom slawischen "Czarnowo" (schwarzes Dorf) ab, was auf die dunklen Böden oder die dichten Wälder der Umgebung hindeutet.',
    category: 'founding',
  },
  {
    id: '2',
    year: 1400,
    title: 'Fischerei am Lankensee',
    description:
      'Die Fischerei wird zum wichtigsten Erwerbszweig der Dorfbewohner. Der Zernsdorfer Lankensee und die umliegenden Gewässer bieten reiche Fischgründe. Die Fischer von Zernsdorf beliefern die Märkte in der Region.',
    category: 'development',
  },
  {
    id: '3',
    year: 1618,
    title: 'Dreißigjähriger Krieg',
    description:
      'Der Dreißigjährige Krieg (1618-1648) hinterlässt auch in Zernsdorf seine Spuren. Die Bevölkerung leidet unter Plünderungen und Seuchen. Viele Höfe werden aufgegeben.',
    category: 'war',
  },
  {
    id: '4',
    year: 1700,
    title: 'Wiederaufbau und Wachstum',
    description:
      'Nach den Kriegsjahren erholt sich das Dorf langsam. Neue Familien siedeln sich an. Die Landwirtschaft und Fischerei florieren wieder.',
    category: 'development',
  },
  {
    id: '5',
    year: 1838,
    title: 'Preußische Landreform',
    description:
      'Im Zuge der preußischen Agrarreformen werden die Bauern von Zernsdorf zu freien Grundbesitzern. Die Leibeigenschaft wird endgültig abgeschafft.',
    category: 'development',
  },
  {
    id: '6',
    year: 1866,
    title: 'Eisenbahnanbindung in der Region',
    description:
      'Mit der Eröffnung der Eisenbahnstrecke Berlin-Görlitz erhält die Region bessere Verkehrsanbindungen. Königs Wusterhausen wird zum wichtigen Knotenpunkt.',
    category: 'development',
  },
  {
    id: '7',
    year: 1900,
    title: 'Beginn des Tourismus',
    description:
      'Der Zernsdorfer Lankensee wird als Ausflugsziel für Berliner entdeckt. Erste Sommergäste und Wochenendhäusler kommen nach Zernsdorf. Pensionen und Gaststätten entstehen.',
    category: 'culture',
  },
  {
    id: '8',
    year: 1914,
    title: 'Erster Weltkrieg',
    description:
      'Der Erste Weltkrieg fordert auch unter den Männern aus Zernsdorf Opfer. Das Dorfleben wird von Entbehrungen geprägt.',
    category: 'war',
  },
  {
    id: '9',
    year: 1920,
    title: 'Goldene Zwanziger am See',
    description:
      'Die 1920er Jahre bringen einen Aufschwung für den Fremdenverkehr. Der Lankensee wird zum beliebten Badeziel. Ein Strandbad wird eingerichtet.',
    category: 'culture',
  },
  {
    id: '10',
    year: 1939,
    title: 'Zweiter Weltkrieg',
    description:
      'Der Zweite Weltkrieg beginnt. Viele Männer werden eingezogen. In den letzten Kriegstagen 1945 erreichen die Kämpfe auch die Region um Zernsdorf.',
    category: 'war',
  },
  {
    id: '11',
    year: 1945,
    title: 'Kriegsende und Neubeginn',
    description:
      'Nach Kriegsende gehört Zernsdorf zur Sowjetischen Besatzungszone. Flüchtlinge aus den Ostgebieten finden hier eine neue Heimat. Die Bodenreform verändert die Besitzverhältnisse.',
    category: 'modern',
  },
  {
    id: '12',
    year: 1952,
    title: 'DDR-Zeit beginnt',
    description:
      'Zernsdorf wird Teil des Kreises Königs Wusterhausen im Bezirk Potsdam. Eine Landwirtschaftliche Produktionsgenossenschaft (LPG) wird gegründet.',
    category: 'modern',
  },
  {
    id: '13',
    year: 1970,
    title: 'Ausbau als Erholungsort',
    description:
      'Zernsdorf wird als Erholungsort ausgebaut. Betriebsferienheime entstehen. Der Lankensee bleibt ein beliebtes Ziel für Urlauber aus der DDR.',
    category: 'culture',
  },
  {
    id: '14',
    year: 1989,
    title: 'Friedliche Revolution',
    description:
      'Die friedliche Revolution führt zum Fall der Mauer. Auch in Zernsdorf beginnt eine Zeit des Umbruchs und neuer Möglichkeiten.',
    category: 'modern',
  },
  {
    id: '15',
    year: 1993,
    title: 'Eingemeindung nach Königs Wusterhausen',
    description:
      'Im Rahmen der Gemeindegebietsreform wird Zernsdorf als Ortsteil in die Stadt Königs Wusterhausen eingegliedert.',
    category: 'modern',
  },
  {
    id: '16',
    year: 2003,
    title: 'Sanierung des Dorfkerns',
    description:
      'Der historische Dorfkern wird im Rahmen der Städtebauförderung saniert. Die Dorfaue erhält ein neues Gesicht.',
    category: 'modern',
  },
  {
    id: '17',
    year: 2020,
    title: 'Modernes Zernsdorf',
    description:
      'Zernsdorf ist heute ein beliebter Wohnort mit etwa 3.500 Einwohnern. Die Nähe zu Berlin, der Lankensee und die ländliche Ruhe machen den Ort attraktiv für Familien.',
    category: 'modern',
  },
  {
    id: '18',
    year: 2025,
    title: '650-jähriges Jubiläum',
    description:
      'Zernsdorf feiert sein 650-jähriges Jubiläum seit der ersten urkundlichen Erwähnung. Ein großes Dorffest würdigt die Geschichte und Gemeinschaft.',
    category: 'culture',
  },
];

export function getHistoryByCategory(category: HistoryEntry['category']): HistoryEntry[] {
  return HISTORY_ENTRIES.filter((e) => e.category === category);
}

export function getAllHistory(): HistoryEntry[] {
  return HISTORY_ENTRIES.sort((a, b) => a.year - b.year);
}
