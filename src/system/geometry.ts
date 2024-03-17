

// Clean this up, this file is a heterogenous hodgepuge...

import { Mesh, PerspectiveCamera, Sphere, Spherical, Vector3 } from "three";
import { Vector } from "./vecs";

function toRad(degrees:number): number{
    return degrees * Math.PI / 180;
}

function toDeg(rad: number): number {
    return rad * 180 / Math.PI;
}

function angleTo(v1: Vector, v2: Vector, plane: Vector): number {  
  const v1Projected = v1.clone().projectOnPlane(plane);
  const v2Projected = v2.clone().projectOnPlane(plane);
  const angle = v1Projected.angleTo(v2Projected);  
  const cross = v1Projected.clone().cross(v2Projected);
  return cross.angleTo(plane) < Math.PI/2 ? angle: Math.PI*2-angle;
}


type ElevationmTrend = 1|-1;

class AltitudeAzimuth {
  elevation: number;
  azimuth: number;

  trend?: ElevationmTrend; 

  constructor(elevation: number, azimuth: number){
    this.elevation = elevation;
    this.azimuth = azimuth;
  }

  toString(): string {

    const trendCharacter = this.trend == -1 ? '\u2193': this.trend == 1? '\u2191': '';

    const northOrSouth = this.elevation<0? "S": "N"
    // const elevationString = Math.abs(this.elevation).toLocaleString(undefined, {maximumFractionDigits: 1});
    const elevationString = this.elevation.toLocaleString(undefined, {maximumFractionDigits: 1});
    const azimuthString = this.azimuth.toLocaleString(undefined, {maximumFractionDigits: 1});
    return `${elevationString}\u00B0${trendCharacter}, ${azimuthString}\u00B0`;
    
  }

  calcTrend(previous?: AltitudeAzimuth){

    if(previous != undefined){
      if (this.elevation < previous.elevation){
        this.trend = -1;
      }
      if(this.elevation > previous.elevation){
        this.trend = 1;
      }
    }
  }
}


class LatLon {
  // Not sure this offset applies to all bodies. But it applies to earth's surface mesh.
  static LON_OFFSET = 90;

  lat: number;
  lon: number;

  /**
   * 
   * @param lat degrees latitude
   * @param lon degrees longitude
   */
  constructor(lat: number, lon: number){
    this.lat = lat;
    this.lon = lon;
  }

  toString(): string {
    return `${this.lat}, ${this.lon}`;
  }

  static fromString(s: string): LatLon|undefined {
    const locationString = s.split(",");
    const lat = parseFloat(locationString[0]);
    const lon = parseFloat(locationString[1])
    return (!isNaN(lat) &&  !isNaN(lon))? new LatLon(lat, lon): undefined;
  }

  /**
   * 
   * @param radius radius of body in km
   * @returns 
   */
  toSpherical(radius: number): Spherical {
      const phi = toRad(90 - this.lat);  // down from the y axis
      const theta = toRad(this.lon+LatLon.LON_OFFSET) // around z axis, from position z 
      const sphereCoords = new Spherical(radius, phi, theta);
      return sphereCoords;    
  }
};


const DistanceUnits = {
  au: {abbrev: "au", conversion: 149597870.691},

  mi: {abbrev: "mi", conversion: 1.609344},
  km: {abbrev: "km", conversion: 1},

}

type DistanceUnit = typeof DistanceUnits[keyof typeof DistanceUnits];

/**
 * Assumes our distances are based in km.
 * 
 * @param distance 
 * @param unit 
 * @returns A distance based on unit
 */
function distanceToUnits(distance: number, unit: DistanceUnit=DistanceUnits.km): number {
  return distance/unit.conversion;
}

// todo: move this directly where its uses
class Dim {
    w: number;
    h: number;

    constructor(w: number, h: number){
        this.w = w;
        this.h = h;
    }

    ratio(): number {
        return this.w/this.h;
    }
};

/**
 * 
 * Given a mesh is shown on a perspective camera, what percentage of the view does the mesh occupy in x and y.
 * We use this to determine the size in pixels of a mesh shown in a view if we know the screen size 
 * (@see getObjectScreenSize).
 * 
 * @param mesh 
 * @returns the x and y ratio of the mesh on the screen.
 */
function getMeshSizeFromCameraView(mesh: Mesh, camera: PerspectiveCamera): Dim {
    mesh.geometry.computeBoundingSphere();
    const sphere: Sphere = mesh.geometry.boundingSphere!;
    return getObjectSizeFromCameraView(new Dim(sphere.radius*2, sphere.radius*2), mesh.position, camera);
  }
  
  function getObjectSizeFromCameraView(objsectSize: Dim, objectPosition: Vector3, camera: PerspectiveCamera): Dim {
    const camPos = camera.position;
    const distance = camPos.distanceTo(objectPosition);  
    const fovDeg = camera.getEffectiveFOV();
    const fovRad = toRad(fovDeg);// * Math.PI/180;
    const height = 2 * Math.tan(fovRad/2) * distance;
    const width = camera.aspect * height;
    return new Dim(objsectSize.w/width, objsectSize.h/height);
  }

  /**
   * Size of a mesh's bounds in pixels on a screen.
   *  
   * @param mesh 
   * @param camera 
   * @param screenSize 
   * @returns 
   */
  function getMeshScreenSize(mesh: Mesh,camera: PerspectiveCamera, screenSize: Dim): Dim {
    const cameraSize = getMeshSizeFromCameraView(mesh, camera);
    return new Dim(screenSize.w * cameraSize.w, screenSize.h * cameraSize.h );
  }

  function getObjectScreenSize(objsectSize: Dim, objectPosition: Vector3,camera: PerspectiveCamera, screenSize: Dim): Dim {
    const cameraSize = getObjectSizeFromCameraView(objsectSize, objectPosition, camera);
    return new Dim(screenSize.w * cameraSize.w, screenSize.h * cameraSize.h );
  }


  // todo: get rid of this
type WindowSizeObserver = (size: Dim) => void;

export { Dim, toRad, toDeg, angleTo, getObjectScreenSize, getMeshScreenSize, DistanceUnits, distanceToUnits, LatLon, AltitudeAzimuth };
export type { WindowSizeObserver, DistanceUnit };
