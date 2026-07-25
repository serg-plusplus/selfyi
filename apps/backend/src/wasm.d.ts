/** Wrangler's CompiledWasm module rule: `.wasm` imports resolve to a compiled module. */
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}
