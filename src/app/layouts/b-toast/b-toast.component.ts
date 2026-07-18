import { Component } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { BToastService } from '../../services/b-toast.service';

@Component({
  selector: 'app-b-toast',
  imports: [SharedCommonModule],
  templateUrl: './b-toast.component.html',
  styleUrl: './b-toast.component.scss'
})
export class BToastComponent {
  toasts: any[] = [];

  constructor(private toastService: BToastService) {
    this.toastService.toasts$.subscribe(data => this.toasts = data);
  }
  themeIcons: Record<string, string> = {
    arcade: 'fa-gamepad',
    professional: 'fa-briefcase',
    brutalist: 'fa-cube',
    glass: 'fa-wine-glass',
    neon: 'fa-bolt-lightning'
  };

  getIcon(theme?: string): string {
    return this.themeIcons[theme || 'arcade'] || 'fa fa-envelope';
  }


  remove(id?: number) {
    if (id) this.toastService.remove(id);
  }
}