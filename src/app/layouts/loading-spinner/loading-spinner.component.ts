import { Component } from '@angular/core';
import { LoadingSpinnerService } from '../../services/loading-spinner.service';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';


@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [SharedCommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  loading$;

  constructor(private loader: LoadingSpinnerService) {
    this.loading$ = this.loader.loading$;
  }
}
