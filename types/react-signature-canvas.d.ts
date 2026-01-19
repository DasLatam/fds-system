declare module "react-signature-canvas" {
  import * as React from "react";

  export interface ReactSignatureCanvasProps
    extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
    penColor?: string;
    backgroundColor?: string;
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
    throttle?: number;
    minDistance?: number;
    dotSize?: number | (() => number);
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
  }

  export default class SignatureCanvas extends React.Component<ReactSignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    fromData(data: any): void;
    toData(): any;
    fromDataURL(dataURL: string, options?: any): void;
    toDataURL(type?: string, encoderOptions?: number): string;
    getCanvas(): HTMLCanvasElement;
    getTrimmedCanvas(): HTMLCanvasElement;
    on(): void;
    off(): void;
  }
}
