import { Component, OnInit } from "@angular/core";
import { catchError, delay, forkJoin, map, of } from "rxjs";
import { FootprintService } from "../services/footprint.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  public emissionsByCountry: { country: string; carbon: number }[] = [];
  public selectedYear = 2019;
  public totalCarbon = 0;

  constructor(private footprintService: FootprintService) {}

  ngOnInit() {
    this.footprintService.getCountries().subscribe((countries) => {
      const countryCodes = this.extractTopCountryCodes(countries, 30);
      this.fetchEmissionsData(countryCodes);
    });
  }

  private extractTopCountryCodes(
    countries: { countryCode: string }[],
    limit: number
  ): string[] {
    return countries.map((c) => c.countryCode).slice(0, limit);
  }

  private fetchEmissionsData(countryCodes: string[]): void {
    const requests = countryCodes.map((code) =>
      this.footprintService.getCountry(code).pipe(
        map((data) => this.mapToCarbonEntry(data)),
        delay(300),
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe((results) => {
      const validResults = results
        .filter((r): r is { country: string; carbon: number } => !!r)
        .sort((a, b) => b.carbon - a.carbon)
        .slice(0, 20);

      this.emissionsByCountry = validResults.slice(0, 20);
      this.totalCarbon = validResults.reduce((sum, r) => sum + r.carbon, 0);
    });
  }

  private mapToCarbonEntry(
    data: any[]
  ): { country: string; carbon: number } | null {
    const yearData = data.find((d) => d.year === this.selectedYear);
    return yearData?.carbon
      ? { country: yearData.shortName, carbon: yearData.carbon }
      : null;
  }
}
