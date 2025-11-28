export class ZipCodeExtractor {
  static extractFromAddress(address: string): string | null {
    const brRegex = /\b\d{5}-\d{3}\b/;
    const usRegex = /\b\d{5}(?:-\d{4})?\b/;

    const brMatch = brRegex.exec(address);
    if (brMatch) {
      return brMatch[0].replace('-', '');
    }

    const usMatch = usRegex.exec(address);
    if (usMatch) {
      return usMatch[0].replace('-', '');
    }

    return null;
  }
}














