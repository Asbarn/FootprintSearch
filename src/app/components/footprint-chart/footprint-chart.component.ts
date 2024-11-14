import { Component, OnInit, OnDestroy } from '@angular/core';
import { FootprintService } from '../../../services/footprint.service';
import { Subscription } from 'rxjs';

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
  private subscriptions: Subscription = new Subscription();

  constructor(private footprintService: FootprintService) {}

  async ngOnInit() {
    this.subscriptions.add(
      this.footprintService.loading$.subscribe((loading) => {
        this.isLoading = loading;
      })
    );

    await this.footprintService.initializeData();

    this.subscriptions.add(
      this.footprintService.currentYear$.subscribe((year) => {
        if (year !== null) {
          this.currentYear = year;
          this.updateChartData(year);
        }
      })
    );

    setInterval(() => {
      this.footprintService.incrementYear();
    }, 2000);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private updateChartData(year: number) {
    this.countriesData = this.footprintService.getDataForYear(year)
      .sort((a, b) => b.carbon - a.carbon)
      .slice(0, 20); // take top 20
    this.totalFootprint = this.countriesData.reduce((sum, country) => sum + country.carbon, 0);
  }

  calculateWidth(carbon: number): number {
    const maxCarbon = this.countriesData[0]?.carbon || 1;
    return (carbon / maxCarbon) * 100;
  }
}