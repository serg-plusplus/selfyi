import wasmModule from "../../../node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm";

(globalThis as Record<string, unknown>).__IDKIT_WASM_MODULE__ = wasmModule;
