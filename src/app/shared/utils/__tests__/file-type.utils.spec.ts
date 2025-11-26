import { getFileExtension, isImageFile, isPdfFile } from '../file-type.utils';

describe('file-type.utils', () => {
  describe('isPdfFile', () => {
    it('deve retornar true para URLs com extensão .pdf', () => {
      expect(isPdfFile('https://example.com/documento.pdf')).toBe(true);
      expect(isPdfFile('documento.pdf')).toBe(true);
      expect(isPdfFile('/path/to/file.pdf')).toBe(true);
    });

    it('deve retornar true para URLs com .pdf e query string', () => {
      expect(isPdfFile('https://example.com/documento.pdf?token=123')).toBe(true);
      expect(isPdfFile('documento.pdf?download=true')).toBe(true);
    });

    it('deve retornar true para URLs com .pdf e fragmento', () => {
      expect(isPdfFile('https://example.com/documento.pdf#page=1')).toBe(true);
    });

    it('deve retornar false para URLs sem extensão .pdf', () => {
      expect(isPdfFile('https://example.com/imagem.jpg')).toBe(false);
      expect(isPdfFile('https://example.com/documento.png')).toBe(false);
      expect(isPdfFile('https://example.com/arquivo')).toBe(false);
    });

    it('deve retornar false para null ou undefined', () => {
      expect(isPdfFile(null)).toBe(false);
      expect(isPdfFile(undefined)).toBe(false);
      expect(isPdfFile('')).toBe(false);
    });

    it('deve ser case insensitive', () => {
      expect(isPdfFile('documento.PDF')).toBe(true);
      expect(isPdfFile('documento.Pdf')).toBe(true);
      expect(isPdfFile('documento.pDf')).toBe(true);
    });

    it('não deve detectar .pdf no meio da URL', () => {
      expect(isPdfFile('https://example.com/pdf-documento.jpg')).toBe(false);
      expect(isPdfFile('https://pdf.example.com/documento.jpg')).toBe(false);
    });
  });

  describe('isImageFile', () => {
    it('deve retornar true para URLs com extensões de imagem', () => {
      expect(isImageFile('https://example.com/imagem.jpg')).toBe(true);
      expect(isImageFile('https://example.com/imagem.jpeg')).toBe(true);
      expect(isImageFile('https://example.com/imagem.png')).toBe(true);
      expect(isImageFile('https://example.com/imagem.gif')).toBe(true);
      expect(isImageFile('https://example.com/imagem.svg')).toBe(true);
      expect(isImageFile('https://example.com/imagem.bmp')).toBe(true);
      expect(isImageFile('https://example.com/imagem.tiff')).toBe(true);
      expect(isImageFile('https://example.com/imagem.webp')).toBe(true);
    });

    it('deve retornar true para URLs com extensão de imagem e query string', () => {
      expect(isImageFile('https://example.com/imagem.jpg?size=large')).toBe(true);
      expect(isImageFile('imagem.png?token=123')).toBe(true);
    });

    it('deve retornar false para URLs com extensão .pdf', () => {
      expect(isImageFile('https://example.com/documento.pdf')).toBe(false);
    });

    it('deve retornar false para null ou undefined', () => {
      expect(isImageFile(null)).toBe(false);
      expect(isImageFile(undefined)).toBe(false);
      expect(isImageFile('')).toBe(false);
    });

    it('deve ser case insensitive', () => {
      expect(isImageFile('imagem.JPG')).toBe(true);
      expect(isImageFile('imagem.PNG')).toBe(true);
      expect(isImageFile('imagem.JpEg')).toBe(true);
    });
  });

  describe('getFileExtension', () => {
    it('deve retornar a extensão do arquivo', () => {
      expect(getFileExtension('documento.pdf')).toBe('pdf');
      expect(getFileExtension('imagem.jpg')).toBe('jpg');
      expect(getFileExtension('arquivo.png')).toBe('png');
    });

    it('deve retornar extensão em lowercase', () => {
      expect(getFileExtension('documento.PDF')).toBe('pdf');
      expect(getFileExtension('imagem.JPG')).toBe('jpg');
    });

    it('deve ignorar query strings e fragmentos', () => {
      expect(getFileExtension('documento.pdf?token=123')).toBe('pdf');
      expect(getFileExtension('imagem.jpg#section')).toBe('jpg');
    });

    it('deve retornar null para URLs sem extensão', () => {
      expect(getFileExtension('https://example.com/arquivo')).toBe(null);
      expect(getFileExtension('arquivo')).toBe(null);
    });

    it('deve retornar null para null ou undefined', () => {
      expect(getFileExtension(null)).toBe(null);
      expect(getFileExtension(undefined)).toBe(null);
      expect(getFileExtension('')).toBe(null);
    });

    it('deve retornar extensão mesmo com caminho completo', () => {
      expect(getFileExtension('/path/to/documento.pdf')).toBe('pdf');
      expect(getFileExtension('https://example.com/path/imagem.jpg')).toBe('jpg');
    });
  });
});

