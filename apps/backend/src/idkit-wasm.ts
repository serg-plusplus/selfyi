/**
 * IDKit WASM bootstrap for Cloudflare Workers.
 *
 * idkit-core's default init does `new URL("idkit_wasm_bg.wasm", import.meta.url)`
 * + fetch — impossible in a bundled Worker (`import.meta.url` is empty and local
 * files can't be fetched), which throws "Failed to initialize IDKit WASM:
 * TypeError: Invalid URL string".
 *
 * Instead, wrangler's built-in CompiledWasm rule turns a `.wasm` import into a
 * ready `WebAssembly.Module`. We stash it on a global that our pnpm patch of
 * @worldcoin/idkit-core (patches/@worldcoin__idkit-core@4.1.8.patch) passes to
 * `__wbg_init` — see that patch if you bump the package version.
 *
 * Import this module ONCE, first thing in the Worker entry (src/index.ts),
 * so the global is set before any IDKit call.
 */
// Relative path into the hoisted root node_modules (node-linker=hoisted): the
// package's `exports` map doesn't expose ./dist/*.wasm, so a bare specifier
// import would be rejected by the bundler.
import wasmModule from "../../../node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm";

(globalThis as Record<string, unknown>).__IDKIT_WASM_MODULE__ = wasmModule;
