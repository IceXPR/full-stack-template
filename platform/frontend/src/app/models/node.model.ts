export interface Node {
  id: string;
  name: string;
  type: string;
  inputConnector: boolean;
  outputConnector: boolean;
  x: number;
  y: number;
  inputs: Connection[];
  outputs: Connection[];
  properties: {
    amount?: number;
    dividendShare?: number;
    symbol?: string;
    price?: number;
    shares?: number;
    dividendAnnualYield?: number;
  };
  history?: History[];
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePoint: Point;
  targetPoint: Point;
  percentage: number;
}

export interface Point {
  x: number;
  y: number;
} 

export interface History {
  iteration: number;
  amount: number;
}