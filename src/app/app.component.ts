import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import AOS from 'aos'
import { SharedModule } from './modules/shared/shared.module';
import { LoadingSpinnerComponent } from "./layouts/loading-spinner/loading-spinner.component";
import { BToastComponent } from "./layouts/b-toast/b-toast.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule, LoadingSpinnerComponent, BToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = ''

  constructor(@Inject(PLATFORM_ID) private platformId: object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
      });
    }
  }
}
