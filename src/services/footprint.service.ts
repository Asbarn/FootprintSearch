import { Injectable } from '@angular/core';
import axios from 'axios';
import { BehaviorSubject } from 'rxjs';
import { API_KEY } from '../constants/constants';
import type { Country, CountryEmissionsForYear } from '../typings/Country';

@Injectable({
  providedIn: 'root',
})
export class FootprintService {
  private emissionsData: Map<number, { countryName: string; carbon: number }[]> = new Map();
  private currentYearSubject = new BehaviorSubject<number | null>(null);
  currentYear$ = this.currentYearSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  constructor() {}

  async initializeData() {
    this.loadingSubject.next(true);
    const cachedData = this.getCachedData();
    if (cachedData) {
      this.emissionsData = cachedData;
    } else {
      await this.loadData();
      this.cacheData();
    }
    this.setInitialYear();
    this.loadingSubject.next(false);
  }

  private async loadData() {
    try {
      const countries = await this.getCountries();
      for (const country of countries) {
        const countryCode = Number(country.countryCode);
        if (isNaN(countryCode)) continue;
        const emissions = await this.getCountry(countryCode);
        emissions.forEach((record) => {
          if (!this.emissionsData.has(record.year)) {
            this.emissionsData.set(record.year, []);
          }
          this.emissionsData.get(record.year)?.push({ countryName: record.countryName, carbon: record.carbon });
        });
      }
    } catch (error) {
      console.error("Error in loading:", error);
    }
  }

  private async getCountries() {
    const { data } = await axios.get<Country[]>('https://api.footprintnetwork.org/v1/countries', {
      auth: { username: 'asbarn', password: API_KEY },
    });
    return data;
  }

  private async getCountry(countryCode: number) {
    const { data } = await axios.get<CountryEmissionsForYear[]>(
      `https://api.footprintnetwork.org/v1/data/${countryCode}/all/EFCpc`,
      { auth: { username: 'asbarn', password: API_KEY } }
    );
    return data;
  }

  private setInitialYear() {
    const minYear = Math.min(...Array.from(this.emissionsData.keys()));
    this.currentYearSubject.next(minYear);
  }

  getDataForYear(year: number) {
    return this.emissionsData.get(year) || [];
  }

  incrementYear() {
    const currentYear = this.currentYearSubject.value;
    if (currentYear !== null) {
      const nextYear = currentYear + 1;
      if (this.emissionsData.has(nextYear)) {
        this.currentYearSubject.next(nextYear);
      }
    }
  }

  private getCachedData(): Map<number, { countryName: string; carbon: number }[]> | null {
    const cached = localStorage.getItem('emissionsData');
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return new Map(data);
      }
      localStorage.removeItem('emissionsData');
    }
    return null;
  }

  private cacheData() {
    const data = Array.from(this.emissionsData.entries());
    localStorage.setItem('emissionsData', JSON.stringify({ data, timestamp: Date.now() }));
  }
}