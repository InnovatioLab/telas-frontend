export class MensagensUtils {
  static substituirVariavelNoTexto(
    message: string,
    values: (string | number)[]
  ): string {
    let valueIndex = 0;
    return message.replace(/{{\w+}}/g, () => {
      return values[valueIndex] !== undefined
        ? String(values[valueIndex++])
        : '';
    });
  }
}
