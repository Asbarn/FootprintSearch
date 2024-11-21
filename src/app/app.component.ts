import { Component, OnInit } from "@angular/core";
import { FootprintService } from "../services/footprint.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  constructor(
    private footprintService: FootprintService,
  ) {
  }

  ngOnInit() {
    const countryCodes: string[] = [];
    this.footprintService.getCountries().subscribe(countries => {
      countries.forEach(({ countryCode }) => {
        countryCodes.push(countryCode);
      });

      this.fetchCountriesWithInterval(countryCodes);
    });
  }

  fetchCountriesWithInterval(strings: string[]) {
    let index = 0;

    const intervalId = setInterval(() => {
      if (index < strings.length) {
        this.footprintService.getCountry(strings[index]).subscribe(country => {
          console.log(country);
        });
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, 250);
  }
}