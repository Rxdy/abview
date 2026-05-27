declare module 'heic-convert' {
  function heicConvert(options: {
    blob: Buffer | Uint8Array
    toType: string
    quality?: number
  }): Promise<Uint8Array | Blob>

  export default heicConvert
}
