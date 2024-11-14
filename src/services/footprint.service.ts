import { Injectable } from '@angular/core';
import axios from 'axios';
import { BehaviorSubject } from 'rxjs';
import { API_KEY } from '../constants/constants';
import type { Country, CountryEmissionsForYear } from '../typings/Country';

@Injectable({
  providedIn: 'root',
})
export class FootprintService {
  private topCountriesByYear = new Map<number, { countryName: string; carbon: number }[]>();
  private currentYearSubject = new BehaviorSubject<number | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  currentYear$ = this.currentYearSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor() {}

  async initializeData() {
    this.loadingSubject.next(true);
    const cachedData = this.getCachedData('topCountriesByYear');

    if (cachedData) {
      this.topCountriesByYear = cachedData;
    } else {
      const allEmissions = await this.fetchAllEmissionsData();
      this.processEmissionsData(allEmissions);
      this.setCachedData('topCountriesByYear', this.topCountriesByYear);
    }

    this.setInitialYear();
    this.loadingSubject.next(false);
  }

  private async fetchAllEmissionsData(): Promise<CountryEmissionsForYear[]> {
    const countries = await this.getCountries();
    const allEmissions: CountryEmissionsForYear[] = [];

    for (const country of countries) {
      const countryCode = Number(country.countryCode);
      if (!isNaN(countryCode)) {
        const emissions = await this.getCountry(countryCode);
        allEmissions.push(...emissions);
      }
    }

    return allEmissions;
  }

  private processEmissionsData(emissions: CountryEmissionsForYear[]) {
    const years = Array.from(new Set(emissions.map(record => record.year)));
    years.forEach(year => {
      const dataForYear = emissions
        .filter(record => record.year === year)
        .map(record => ({ countryName: record.countryName, carbon: record.carbon }))
        .sort((a, b) => b.carbon - a.carbon)
        .slice(0, 20); // take top 20
      this.topCountriesByYear.set(year, dataForYear);
    });
  }

  private async getCountries(): Promise<Country[]> {
    const { data } = await axios.get<Country[]>('https://api.footprintnetwork.org/v1/countries', {
      auth: { username: 'asbarn', password: API_KEY },
    });
    return data;
  }

  private async getCountry(countryCode: number): Promise<CountryEmissionsForYear[]> {
    const { data } = await axios.get<CountryEmissionsForYear[]>(
      `https://api.footprintnetwork.org/v1/data/${countryCode}/all/EFCpc`,
      { auth: { username: 'asbarn', password: API_KEY } }
    );
    return data;
  }

  private setInitialYear() {
    const minYear = Math.min(...Array.from(this.topCountriesByYear.keys()));
    this.currentYearSubject.next(minYear);
  }

  getDataForYear(year: number) {
    return this.topCountriesByYear.get(year) || [];
  }

  incrementYear() {
    const currentYear = this.currentYearSubject.value;
    const nextYear = currentYear ? currentYear + 1 : null;
    if (nextYear && this.topCountriesByYear.has(nextYear)) {
      this.currentYearSubject.next(nextYear);
    }
  }

  private getCachedData(key: string): Map<number, { countryName: string; carbon: number }[]> | null {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return new Map(data);
      }
      localStorage.removeItem(key);
    }
    return null;
  }

  private setCachedData(key: string, data: Map<number, { countryName: string; carbon: number }[]>) {
    localStorage.setItem(key, JSON.stringify({ data: Array.from(data.entries()), timestamp: Date.now() }));
  }
}