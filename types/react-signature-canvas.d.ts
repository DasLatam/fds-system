declare module "react-signature-canvas" {
  import * as React from "react";

  export type SignatureCanvasProps = {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    backgroundColor?: string;
    penColor?: string;
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
    minDistance?: number;
    dotSize?: number;
  };

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    getTrimmedCanvas(): HTMLCanvasElement;
    fromDataURL(dataUrl: string): void;
    toDataURL(type?: string): string;
  }
}
