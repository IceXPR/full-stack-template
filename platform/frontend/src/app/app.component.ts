import { Component } from '@angular/core';
import { NodeGraphComponent } from './components/node-graph/node-graph.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: true,
    imports: [NodeGraphComponent]
})
export class AppComponent {
  title = 'full-stack-template';
}
