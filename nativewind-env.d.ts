/// <reference types="nativewind/types" />

// Metro resolves these; TypeScript needs telling they exist.
declare module "*.css" {
  const content: string;
  export default content;
}
