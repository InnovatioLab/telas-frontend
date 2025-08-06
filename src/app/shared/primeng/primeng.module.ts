import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AccordionModule } from "primeng/accordion";
import { MessageService } from "primeng/api";
import { AutoCompleteModule } from "primeng/autocomplete";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CalendarModule } from "primeng/calendar";
import { CardModule } from "primeng/card";
import { CarouselModule } from "primeng/carousel";
import { CheckboxModule } from "primeng/checkbox";
import { ChipModule } from "primeng/chip";
import { ChipsModule } from "primeng/chips";
import { ColorPickerModule } from "primeng/colorpicker";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DatePickerModule } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { DrawerModule } from "primeng/drawer";
import { DropdownModule } from "primeng/dropdown";
import { DynamicDialogModule } from "primeng/dynamicdialog";
import { EditorModule } from "primeng/editor";
import { FieldsetModule } from "primeng/fieldset";
import { FileUploadModule } from "primeng/fileupload";
import { GalleriaModule } from "primeng/galleria";
import { ImageModule } from "primeng/image";
import { InputMaskModule } from "primeng/inputmask";
import { InputNumberModule } from "primeng/inputnumber";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputTextModule } from "primeng/inputtext";
import { ListboxModule } from "primeng/listbox";
import { MenuModule } from "primeng/menu";
import { MenubarModule } from "primeng/menubar";
import { MessagesModule } from "primeng/messages";
import { MultiSelectModule } from "primeng/multiselect";
import { OverlayPanelModule } from "primeng/overlaypanel";
import { PaginatorModule } from "primeng/paginator";
import { PanelModule } from "primeng/panel";
import { PanelMenuModule } from "primeng/panelmenu";
import { PasswordModule } from "primeng/password";
import { RadioButtonModule } from "primeng/radiobutton";
import { RatingModule } from "primeng/rating";
import { SelectModule } from "primeng/select";
import { SelectButtonModule } from "primeng/selectbutton";
import { SidebarModule } from "primeng/sidebar";
import { SkeletonModule } from "primeng/skeleton";
import { SliderModule } from "primeng/slider";
import { SplitButtonModule } from "primeng/splitbutton";
import { StepperModule } from "primeng/stepper";
import { StepsModule } from "primeng/steps";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { MessageModule } from "primeng/message";

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
    MessageModule,
  ],
})
export class PrimengModule {
  constructor() {
    (
      window as unknown as { PrimeDomHandler: PrimeDomHandlerType }
    ).PrimeDomHandler = {
      zindex: 10000,
      generateZIndex: function () {
        return this.zindex++;
      },
    };
  }
}
