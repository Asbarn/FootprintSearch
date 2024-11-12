import { Injectable } from '@angular/core';
import axios from 'axios'

import { API_KEY } from '../constants/constants'

import type { Country, CountryEmissionsForYear } from '../typings/Country'

@Injectable({
  providedIn: 'root',
})
export class FootprintService {
  constructor() {}

  async getCountries() {
    const { data } = await axios.get<Country[]>('https://api.footprintnetwork.org/v1/countries', {
      auth: {
        username: 'asbarn',
        password: API_KEY
      }
    })
    return data
  }

  // get a single country by countryCode
  async getCountry(countryCode: number) {
    const { data } = await axios.get<CountryEmissionsForYear[]>(
      `https://api.footprintnetwork.org/v1/data/${countryCode}/all/EFCpc`,
      {
        headers: {
          Authorization: API_KEY,
        },
      }
    )

    return data
  }
}
