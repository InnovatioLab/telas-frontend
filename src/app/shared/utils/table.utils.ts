import { Injectable } from '@angular/core';
import { SortEvent } from 'primeng/api';

export interface IColumn {
  header: string;
  body: string;
  placeholder?: string;
  sortType?: 'text' | 'number' | 'date';
  typeContent?: string;
  headerStyles?: string;
  inlineStyles?: string;
  bodyStyles?: string;
  bodyInlineStyles?: string;
  sortable?: boolean;
  cortarTexto?: number;
}



@Injectable({
  providedIn: 'root'
})
export class TableUtils {
  static customSort(event: SortEvent, columns: IColumn[]) {
    const column = columns.find(col => col.body === event.field);
    const sortType = column ? column.sortType : 'text';

    event.data.sort((data1, data2) => {
      let value1 = data1[event.field];
      let value2 = data2[event.field];
      let result = 0;

      if (sortType === 'text' || !sortType) {
        value1 = value1 ? value1.toString().toLowerCase().trim() : '';
        value2 = value2 ? value2.toString().toLowerCase().trim() : '';
        result = value1.localeCompare(value2);
      }

      return event.order * result;
    });
  }
}
