# OCR runtime resources

This directory contains the browser-local OCR runtime resources used by the V2 application.

- `worker/worker.min.js` matches `tesseract.js` 6.0.1 and is distributed under Apache-2.0.
- `core/` WASM resources match `tesseract.js-core` 6.1.2 and are distributed under Apache-2.0.
- `lang/` contains the `chi_sim`, `chi_tra`, and `eng` trained-data archives required by the configured OCR languages.
- `LICENSE` is the complete Apache License 2.0 text copied byte-for-byte from `naptha/tessdata` commit [`806cd9adc8c6e8abc11c782db1818c990576bebc`](https://github.com/naptha/tessdata/tree/806cd9adc8c6e8abc11c782db1818c990576bebc). Its SHA-256 is `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4` and its size is 11,357 bytes.
- `chi_sim.traineddata.gz` matches the upstream file at `4.0.0_best_int/chi_sim.traineddata.gz` in that fixed `naptha/tessdata` commit. Its gzip SHA-256 is `b8a23f10c7de500891eb458a8adc9cc58ab7f242f08b7d149f5e9aea4ad5db7c`; its decompressed SHA-256 is `9784f7c917c546424b690fcde708ce1f604a4393d08bb51ddab146d7d7c794e6`.
- `eng.traineddata.gz` matches the upstream file at `4.0.0_best_int/eng.traineddata.gz` in that fixed `naptha/tessdata` commit. Its gzip SHA-256 is `45b4cb346724ac1774f1c36f42f182b887bcdb28ebe63e6fff90ac41f3fcff91`; its decompressed SHA-256 is `5dc5d8d640a212c9d6184921ba103b186f50e0fed9ee716c53e6b312b400d747`.
- `chi_tra.traineddata.gz` was decompressed and matched byte-for-byte against `tesseract-ocr/tessdata_best` `chi_tra.traineddata` at commit [`e12c65a915945e4c28e237a9b52bc4a8f39a0cec`](https://github.com/tesseract-ocr/tessdata_best/tree/e12c65a915945e4c28e237a9b52bc4a8f39a0cec). The repository's [LICENSE](https://github.com/tesseract-ocr/tessdata_best/blob/e12c65a915945e4c28e237a9b52bc4a8f39a0cec/LICENSE) applies to that matched source.

The application loads these files locally through the Vite `BASE_URL`-derived OCR path. They are runtime assets, not generated build output.
