// Metro turns an imported image into a numeric asset id
declare module '*.png' {
  const source: number;
  export default source;
}
