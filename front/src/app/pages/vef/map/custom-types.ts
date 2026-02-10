// custom-types.ts
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSON.Geometry;
  properties: { [key: string]: any };
}
