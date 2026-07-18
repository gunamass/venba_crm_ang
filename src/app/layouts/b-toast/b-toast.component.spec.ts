import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BToastComponent } from './b-toast.component';

describe('BToastComponent', () => {
  let component: BToastComponent;
  let fixture: ComponentFixture<BToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BToastComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
