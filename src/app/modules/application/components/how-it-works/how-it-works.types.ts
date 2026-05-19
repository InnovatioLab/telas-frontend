export type HowItWorksSubItemIcon =
  | 'upload'
  | 'clipboard'
  | 'send'
  | 'eye'
  | 'check'
  | 'check-success';

export interface HowItWorksSubItem {
  label: string;
  icon?: HowItWorksSubItemIcon;
  variant?: 'default' | 'success';
}

export interface HowItWorksStep {
  number: number;
  title: string;
  subItems?: HowItWorksSubItem[];
  imageSrc?: string;
  imageCover?: boolean;
  imageMonitor?: boolean;
  imageWhiteFrame?: boolean;
}
