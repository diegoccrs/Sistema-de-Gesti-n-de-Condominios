import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDocumentDialogComponent } from './upload-document-dialog.component';

describe('UploadDocumentDialogComponent', () => {
  let component: UploadDocumentDialogComponent;
  let fixture: ComponentFixture<UploadDocumentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDocumentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDocumentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
