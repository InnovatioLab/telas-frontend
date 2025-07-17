export class ResponseDTO<T> {
  constructor(
    public errors?: [],
    public warns?: string[],
    public infos?: string[],
    public messagem?: string,
    public uri?: string,
    public status?: number,
    public data?: T
  ) {}
}
