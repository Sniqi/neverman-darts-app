// Node test environment setup.
// dexie-export-import uses browser globals (self, FileReader, Blob) at module
// evaluation time and during export/import operations. Polyfill them for the
// node unit project so backup.test.ts runs without happy-dom/jsdom.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

// self — referenced at module load time in dexie-export-import/tson.ts
g.self = globalThis;

// FileReader polyfill.
// dexie-export-import calls readAsArrayBuffer and accesses ev.target.result /
// ev.target.error in onload/onerror handlers (readBlobAsync, helpers.ts).
// We implement the minimal surface that satisfies that contract.
if (typeof g.FileReader === 'undefined') {
	g.FileReader = class FileReaderPolyfill {
		result: ArrayBuffer | string | null = null;
		error: Error | null = null;
		readyState: 0 | 1 | 2 = 0;

		onload: ((ev: { target: FileReaderPolyfill }) => void) | null = null;
		onerror: ((ev: { target: FileReaderPolyfill }) => void) | null = null;
		onabort: ((ev: { target: FileReaderPolyfill }) => void) | null = null;

		readAsArrayBuffer(blob: Blob): void {
			this.readyState = 1;
			blob
				.arrayBuffer()
				.then((buf) => {
					this.result = buf;
					this.readyState = 2;
					if (this.onload) this.onload({ target: this });
				})
				.catch((err: Error) => {
					this.error = err;
					this.readyState = 2;
					if (this.onerror) this.onerror({ target: this });
				});
		}

		readAsText(blob: Blob): void {
			this.readyState = 1;
			blob
				.text()
				.then((text) => {
					this.result = text;
					this.readyState = 2;
					if (this.onload) this.onload({ target: this });
				})
				.catch((err: Error) => {
					this.error = err;
					this.readyState = 2;
					if (this.onerror) this.onerror({ target: this });
				});
		}
	};
}
