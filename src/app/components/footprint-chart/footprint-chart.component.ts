import { Component, OnInit, OnDestroy } from '@angular/core';
import { FootprintService } from '../../../services/footprint.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-footprint-chart',
  templateUrl: './footprint-chart.component.html',
  styleUrls: ['./footprint-chart.component.scss']
})
export class FootprintChartComponent implements OnInit, OnDestroy {
  countriesData: { countryName: string; carbon: number }[] = [];
  totalFootprint: number = 0;
  currentYear: number | null = null;
  isLoading: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(private footprintService: FootprintService) {}

  ngOnInit() {
    this.footprintService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.isLoading = loading);

    this.footprintService.currentYear$
      .pipe(takeUntil(this.destroy$))
      .subscribe(year => {
        this.currentYear = year;
        this.updateChartData(year);
      });

    this.footprintService.initializeData();
    setInterval(() => this.footprintService.incrementYear(), 2000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateChartData(year: number | null) {
    if (year !== null) {
      this.countriesData = this.footprintService.getDataForYear(year);
      this.totalFootprint = this.countriesData.reduce((sum, country) => sum + country.carbon, 0);
    }
  }

  calculateWidth(carbon: number): number {
    const maxCarbon = this.countriesData[0]?.carbon || 1;
    return (carbon / maxCarbon) * 100;
  }
}