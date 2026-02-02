export const parseCSV = (text: string): string[][] => {
  if (!text || text.trim() === "") return [];

  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

  return lines.map(line => {
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    
    if (!matches) {
      return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    }

    return matches.map(cell => 
      cell.trim().replace(/^"|"$/g, '')
    );
  });
};

export const processStudentData = (rows: any[]): Map<string, { totalPoints: number; history: any[] }> => {
  const studentMap = new Map<string, { totalPoints: number; history: any[] }>();

  rows.forEach((row) => {
    const rawId = row['ID'] || '';
    const cleanNumberId = String(rawId).split('.')[0].trim();
    
    if (!cleanNumberId) return;

    const studentId = cleanNumberId.startsWith('t') ? cleanNumberId : `t${cleanNumberId}`;

    const totalPoints = parseFloat(row['Total learning-progress points']) || 0;

    const history: any[] = [];
    Object.keys(row).forEach(key => {
      if (key.includes('/') && !isNaN(parseFloat(row[key]))) {
        history.push({
          date: key,
          points: parseFloat(row[key]) || 0
        });
      }
    });

    const sortedHistory = history.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    studentMap.set(studentId, {
      totalPoints: totalPoints,
      history: sortedHistory
    });
  });

  return studentMap;
};