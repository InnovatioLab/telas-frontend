import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipsModule } from 'primeng/chips';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { SplitButtonModule } from 'primeng/splitbutton';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';
import { ListboxModule } from 'primeng/listbox';
import { FieldsetModule } from 'primeng/fieldset';
import { TabViewModule } from 'primeng/tabview';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CarouselModule } from 'primeng/carousel';
import { ImageModule } from 'primeng/image';
import { ColorPickerModule } from 'primeng/colorpicker';
import { EditorModule } from 'primeng/editor';
import { StepperModule } from 'primeng/stepper';
import { AvatarModule } from 'primeng/avatar';
import { PaginatorModule } from 'primeng/paginator';
import { SliderModule } from 'primeng/slider';
import { SkeletonModule } from 'primeng/skeleton';
import { GalleriaModule } from 'primeng/galleria';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
// Tipo para o manipulador DOM do PrimeNG
interface PrimeDomHandlerType {
  zindex: number;
  generateZIndex: () => number;
}

@NgModule({
  providers: [MessageService],
  exports: [
    MenubarModule,
    ButtonModule,
    InputTextModule,
    InputMaskModule,
    DropdownModule,
    StepsModule,
    CardModule,
    DialogModule,
    CheckboxModule,
    ConfirmDialogModule,
    MessagesModule,
    ToastModule,
    TooltipModule,
    PasswordModule,
    TableModule,
    RadioButtonModule,
    ChipsModule,
    ReactiveFormsModule,
    ToastModule,
    SplitButtonModule,
    OverlayPanelModule,
    PanelModule,
    FormsModule,
    AutoCompleteModule,
    CalendarModule,
    InputNumberModule,
    BadgeModule,
    InputSwitchModule,
    RatingModule,
    FileUploadModule,
    MultiSelectModule,
    AccordionModule,
    ListboxModule,
    FieldsetModule,
    TabViewModule,
    MenuModule,
    SidebarModule,
    PanelMenuModule,
    ChipModule,
    DividerModule,
    DynamicDialogModule,
    SelectButtonModule,
    CarouselModule,
    ImageModule,
    EditorModule,
    ColorPickerModule,
    StepperModule,
    AvatarModule,
    PaginatorModule,
    SkeletonModule,
    GalleriaModule,
    SliderModule,
    DatePickerModule,
    SelectModule,
    DrawerModule,
  ]
})
export class PrimengModule {
  constructor() {
    // Definir propriedade PrimeDomHandler no objeto window de forma segura usando um tipo personalizado
    (window as unknown as { PrimeDomHandler: PrimeDomHandlerType }).PrimeDomHandler = {
      zindex: 10000,
      generateZIndex: function() {
        return this.zindex++;
      }
    };
  }
}
