import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FootprintChartComponent } from './components/footprint-chart/footprint-chart.component';

const routes: Routes = [
  {path: '', component: FootprintChartComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
