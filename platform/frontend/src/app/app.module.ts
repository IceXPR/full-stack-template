import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { NodeGraphComponent } from './components/node-graph/node-graph.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [],
  imports: [
    AppComponent,
    NodeGraphComponent,
    BrowserModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  bootstrap: []
})
export class AppModule { } 