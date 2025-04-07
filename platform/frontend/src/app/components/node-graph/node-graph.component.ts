import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Node, Connection } from '../../models/node.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SimulationElement {
  id: string;
  type: string;
  amount?: number;
  symbol?: string;
  price?: number;
  dividendShare?: number;
  description?: string;
  splits?: { name: string; percentage: number; }[];
  shares?: number;
}

interface SimulationConnector {
  name: string;
  description: string;
  percentage: number;
  connect_from: {
    id: string;
    type: string;
  };
  connect_to: {
    id: string;
    type: string;
  };
}

interface SimulationPayload {
  months: number;
  elements: SimulationElement[];
  connectors: SimulationConnector[];
}

@Component({
    selector: 'app-node-graph',
    templateUrl: './node-graph.component.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    styleUrls: ['./node-graph.component.scss']
})

export class NodeGraphComponent implements OnInit {
  nodes: Node[] = [];
  connections: Connection[] = [];
  selectedNodeType: string = 'investment';
  isDragging = false;
  // currentConnection: Partial<Connection> | undefined;
  currentConnection: Connection | undefined;
  draggedNode: Node | null = null;
  dragOffset = { x: 0, y: 0 };
  connectorHeight = 59;
  outputConnectorOffset = 170;
  simulationMonths: number = 12;
  canvasClicked = false;
  simulationId: string = '';
  savedSimulations: any[] = [];
  simulationName: string = '';
  selectedSimulation: any = null;
  pendingConnection: Connection | undefined;
  showPercentageInput = false;
  percentageInputPosition = { x: 0, y: 0 };
  temporaryPercentage = 100;
  editingConnection: Connection | null = null;
  connectionInputPosition = { x: 0, y: 0 };
  showConnectionInput = false;
  temporaryConnectionPercentage = 100;

  nodeTypes = [
    { id: 'investment', name: 'Investment', input: false, output: true },
    { id: 'accumulator', name: 'Accumulator', input: true, output: true },
    { id: 'ticker', name: 'Ticker', input: false, output: true },
    { id: 'ticker-purchase', name: 'Ticker Purchase', input: true, output: false }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialize component here if needed
    this.listSimulations();
  }

  handleCanvasClick(event: MouseEvent): void {
    // Only register as a canvas click if we're not interacting with nodes or connections
    if (!this.draggedNode && !this.currentConnection && !this.isDragging) {
      this.canvasClicked = true;
      console.log("Canvas clicked");
      // Reset after a short delay to allow for other click handlers
      setTimeout(() => {
        this.canvasClicked = false;
      }, 100);
    }
  }

  addNode(event: MouseEvent): void {
    // Modify existing check to include canvas click
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.closest('.node') || this.draggedNode || this.isDragging || this.currentConnection) {
      return;
    }
    console.debug("Adding node");

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id: id,
      name: this.nodeTypes.find(type => type.id === this.selectedNodeType)?.name || id,
      type: this.selectedNodeType,
      inputConnector: this.nodeTypes.find(type => type.id === this.selectedNodeType)?.input || false,
      outputConnector: this.nodeTypes.find(type => type.id === this.selectedNodeType)?.output || false,
      x,
      y,
      inputs: [],
      outputs: [],
      properties: {}
    };

    // Set properties based on node type for the html to show defaults
    switch (this.selectedNodeType) {
      case 'investment':
        newNode.properties = {
          amount: 0 // Default value
        };
        break;
      case 'ticker':
        newNode.properties = {
          dividendShare: 0.0,
          price: 0.0,
          shares: 0,
          symbol: 'UNKNOWN'
        };
        break;
      case 'ticker-purchase':
        newNode.properties = {
          symbol: 'UNKNOWN'
        };
        break;
    }
    

    console.log("Adding node", newNode);
    this.nodes.push(newNode);
  }

  removeNode(nodeId: string): void {
    // First find the node to be removed
    const nodeToRemove = this.nodes.find(node => node.id === nodeId);
    if (!nodeToRemove) return;

    // Remove any connections where this node is source or target
    const connectionsToRemove = this.connections.filter(
      conn => conn.sourceId === nodeId || conn.targetId === nodeId
    );

    // Remove the connections from connected nodes' inputs/outputs arrays
    connectionsToRemove.forEach(conn => {
      // Remove from source node's outputs if not the node being deleted
      if (conn.sourceId !== nodeId) {
        const sourceNode = this.nodes.find(n => n.id === conn.sourceId);
        if (sourceNode && sourceNode.outputs) {
          sourceNode.outputs = sourceNode.outputs.filter(c => c.id !== conn.id);
        }
      }

      // Remove from target node's inputs if not the node being deleted
      if (conn.targetId !== nodeId) {
        const targetNode = this.nodes.find(n => n.id === conn.targetId);
        if (targetNode && targetNode.inputs) {
          targetNode.inputs = targetNode.inputs.filter(c => c.id !== conn.id);
        }
      }
    });

    // Remove the connections from the main connections array
    this.connections = this.connections.filter(
      conn => conn.sourceId !== nodeId && conn.targetId !== nodeId
    );

    // Finally remove the node itself
    this.nodes = this.nodes.filter(node => node.id !== nodeId);
  }

  startConnection(node: Node, isOutput: boolean, event: MouseEvent): void {
    console.log("Starting connection node, isOutput", node, isOutput);
    // if (this.draggedNode == null || this.isDragging) {
    //   return;
    // }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    // if (!this.currentConnection) { // If we don't have a current connection, create a new one
    this.currentConnection = {
      id: `conn-${Date.now()}`,
      sourceId: isOutput ? node.id : '',
      targetId: isOutput ? '' : node.id,
      sourcePoint: {
        x: isOutput ? node.x + this.outputConnectorOffset : node.x,
        y: node.y + this.connectorHeight
      },
      targetPoint: {
        x: isOutput ? node.x : node.x,
        y: node.y + this.connectorHeight
      },
      percentage: 1.0
    };
    console.log("New connector currentConnection", this.currentConnection);
  }

  completeConnection(node: Node, isOutput: boolean, event: MouseEvent): void {
    event.stopPropagation();
    
    if (this.currentConnection) {
      if (isOutput) {
        this.currentConnection.sourceId = node.id;
        this.currentConnection.sourcePoint = {
          x: node.x + this.outputConnectorOffset,
          y: node.y + this.connectorHeight
        };
      } else {
        this.currentConnection.targetId = node.id;
        this.currentConnection.targetPoint = {
          x: node.x,
          y: node.y + this.connectorHeight
        };
      }

      if (this.currentConnection.sourceId && this.currentConnection.targetId) {
        this.pendingConnection = {
          ...this.currentConnection,
          id: `conn-${Date.now()}`,
          percentage: 1.0
        };
        
        // Show percentage input at mouse position
        this.percentageInputPosition = {
          x: event.clientX,
          y: event.clientY
        };
        this.showPercentageInput = true;
        this.temporaryPercentage = 100;
        
        // Stop all dragging
        this.draggedNode = null;
        this.isDragging = false;
        
        // Keep the current connection visible
        this.currentConnection = this.pendingConnection;
      }
    }
  }

  confirmPercentage(): void {
    if (this.pendingConnection) {
      this.pendingConnection.percentage = this.temporaryPercentage / 100;
      this.connections.push(this.pendingConnection);
      this.hidePercentageInput();
    }
  }

  hidePercentageInput(): void {
    this.showPercentageInput = false;
    this.pendingConnection = undefined;
    this.currentConnection = undefined; // Clear the connection when canceled
  }

  updateConnection(event: MouseEvent): void {
    // Don't update anything if percentage input is showing
    if (this.showPercentageInput) return;

    const rect = (event.target as HTMLElement).closest('.graph-area')?.getBoundingClientRect();
    if (!rect) return;

    // Only handle node dragging if we're not creating a connection
    if (this.draggedNode && !this.currentConnection) {
      this.draggedNode.x = event.clientX - rect.left - this.dragOffset.x;
      this.draggedNode.y = event.clientY - rect.top - this.dragOffset.y;

      // Update connected paths
      this.connections.forEach(conn => {
        if (conn.sourceId === this.draggedNode?.id) {
          conn.sourcePoint = {
            x: this.draggedNode.x + this.outputConnectorOffset,
            y: this.draggedNode.y + this.connectorHeight
          };
        }
        if (conn.targetId === this.draggedNode?.id) {
          conn.targetPoint = {
            x: this.draggedNode.x,
            y: this.draggedNode.y + this.connectorHeight
          };
        }
      });
    }

    // Existing connection update logic
    if (this.currentConnection) {
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      if (this.currentConnection.sourceId) {
        this.currentConnection.targetPoint = point;
      } else {
        this.currentConnection.sourcePoint = point;
      }
    }
  }

  generatePath(connection: Connection): string {
    if (!connection) return '';

    const startX = connection.sourcePoint.x;
    const startY = connection.sourcePoint.y;
    const endX = connection.targetPoint.x;
    const endY = connection.targetPoint.y;

    return `M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`;
  }

  startDrag(node: Node, event: MouseEvent): void {
    this.draggedNode = node;
    this.dragOffset = {
      x: event.clientX - node.x,
      y: event.clientY - node.y
    };
    event.stopPropagation(); // Prevent node creation while dragging
  }

  stopDrag(): void {
    console.log("Stopping drag");
    this.draggedNode = null;
    this.currentConnection = undefined;  // Remove dragging connection
  }

  // saveArea(event: MouseEvent): void {
  //   const areaData = {
  //     nodes: this.nodes,
  //     connections: this.connections
  //   };
  //   localStorage.setItem('nodeGraphData', JSON.stringify(areaData));
  //   console.log('Area saved to local storage');
  // }

  // loadArea(event: MouseEvent): void {
  //   const savedData = localStorage.getItem('nodeGraphData');
  //   if (savedData) {
  //     const areaData = JSON.parse(savedData);
  //     this.nodes = areaData.nodes;
  //     this.connections = areaData.connections;
  //     console.log('Area loaded from local storage');
  //   } else {
  //     console.log('No saved data found');
  //   }
  // }

  attachHistory(history: any): void {
    console.log('Attaching history', history);
    this.nodes.forEach(node => {
      const historyItem = history.find((h: any) => h.id === node.id);
      if (historyItem) {
        node.history = historyItem.history.sort((a: any, b: any) => b.iteration - a.iteration);
      }
    });
  }

  resetSimulation(event: MouseEvent): void {
    this.nodes = [];
    this.connections = [];
    this.simulationName = '';
    this.selectedSimulation = null;
    localStorage.removeItem('nodeGraphData');
    console.log('Area cleared');
  }

  generateSimulation(shiftKey: boolean): void {
    const simulation: SimulationPayload = {
      months: this.simulationMonths,
      elements: this.nodes.map(node => {
        const element: SimulationElement = {
          id: node.id,
          type: node.type
        };

        // Update investment properties handling
        switch (node.type) {
          case 'investment':
            element.amount = node.properties?.amount || 0;
            break;
          case 'ticker':
            element.symbol = node.properties?.symbol || 'UNKNOWN';
            element.dividendShare = node.properties?.dividendShare || 0.0;
            element.price = node.properties?.price || 0.0;
            element.shares = node.properties?.shares || 0;
            break;
          case 'ticker-purchase':
            element.symbol = node.properties?.symbol || 'UNKNOWN';
            break;
          case 'accumulator':
            // No additional properties needed for these types
            break;
        }

        return element;
      }),
      connectors: this.connections.map((conn, index) => {
        const sourceNode = this.nodes.find(n => n.id === conn.sourceId);
        const targetNode = this.nodes.find(n => n.id === conn.targetId);

        return {
          name: `connection-${index + 1}`,
          // type: 'plain',
          description: `Connection from ${sourceNode?.type} to ${targetNode?.type}`,
          percentage: conn.percentage || 1.0,
          connect_from: {
            id: sourceNode?.id || '',
            type: sourceNode?.type || ''
          },
          connect_to: {
            id: targetNode?.id || '',
            type: targetNode?.type || ''
          }
        };
      })
    };

    console.log('Generated Simulation:', JSON.stringify(simulation));
    if(shiftKey) {  // Download simulation
      this.downloadSimulation(simulation);  
    }
    else {  // Post simulation
      console.log('Posting simulation');
      fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simulation)
      })
      .then(response => response.json())
      .then(data => {
        console.log('Simulation response:', data);
        this.attachHistory(data.history);
      })
      .catch(error => {
        console.error('Error posting simulation:', error);
      });
    }
  }

  private downloadSimulation(simulation: SimulationPayload): void {
    const blob = new Blob([JSON.stringify(simulation, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  saveSimulation(event: MouseEvent): void {
    if (!this.simulationName) {
        alert('Please enter a simulation name');
        return;
    }
    
    const simulation = {
        name: this.simulationName,
        nodes: this.nodes,
        connections: this.connections
    };

    // Check if we're updating an existing simulation
    if (this.selectedSimulation) {
        // Use PUT to update
        fetch(`/api/simulations/${this.selectedSimulation.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(simulation)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Simulation updated:', data);
        });
    } else {
        // Use POST for new simulation
        fetch('/api/simulations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(simulation)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Simulation saved:', data);
            this.savedSimulations.push({name: this.simulationName, id: data.id});
        });
    }
  }

  loadSimulation(event: MouseEvent): void {
    if (!this.selectedSimulation) return;

    console.log('Loading simulation', this.selectedSimulation);
    fetch(`/api/simulations/${this.selectedSimulation.id}`)
      .then(response => response.json())
      .then(data => {
        console.log('Simulation response:', data);
        const parsedData = JSON.parse(data.json);
        this.nodes = [...parsedData.nodes];
        this.connections = [...parsedData.connections];
        this.simulationName = data.name;
      });
  }

  listSimulations(): void {
    fetch('/api/simulations')
      .then(response => response.json())
      .then(data => {
        this.savedSimulations = data.map((sim: any) => ({name: sim.name, id: sim.id}));
      });
  }

  deleteSimulation(event: Event) {
    if (this.selectedSimulation) {
      fetch(`/api/simulations/${this.selectedSimulation.id}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        console.log('Simulation deleted:', data);
        this.savedSimulations = this.savedSimulations.filter(s => s.id !== this.selectedSimulation.id);
        this.selectedSimulation = null;
        this.simulationName = '';
      });
    }
  }

  duplicateSimulation(event: Event) {
    if (this.selectedSimulation) {
        const duplicatedSimulation = {
            name: `${this.selectedSimulation.name} (Copy)`,
            nodes: this.nodes,
            connections: this.connections
        };
        
        fetch('/api/simulations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(duplicatedSimulation)
        })
        .then(response => response.json())
        .then(data => {
            this.savedSimulations.push({name: duplicatedSimulation.name, id: data.id});
        });
    }
  }

  getTextPosition(connection: Connection): { x: number; y: number } {
    // Position the text 20px above the midpoint of the connection
    const startX = connection.sourcePoint.x;
    const startY = connection.sourcePoint.y;
    const endX = connection.targetPoint.x;
    const endY = connection.targetPoint.y;
    
    return {
      x: startX + (endX - startX) * 0.2, // 20% from the start
      y: startY + (endY - startY) * 0.5 - 10 // Middle of the path, 10px above
    };
  }

  editConnectionPercentage(connection: Connection, event: MouseEvent): void {
    console.log("Editing connection percentage", connection);
    event.stopPropagation();
    this.editingConnection = connection;
    this.temporaryConnectionPercentage = connection.percentage * 100;
    this.connectionInputPosition = {
      x: event.clientX,
      y: event.clientY
    };
    this.showConnectionInput = true;
  }

  confirmConnectionEdit(): void {
    if (this.editingConnection) {
      this.editingConnection.percentage = this.temporaryConnectionPercentage / 100;
      this.hideConnectionInput();
    }
  }

  hideConnectionInput(): void {
    this.showConnectionInput = false;
    this.editingConnection = null;
  }
} 