
import { Place, CameraParameters } from "@wwtelescope/engine";
import { Classification, ImageSetType, SolarSystemObjects } from "@wwtelescope/engine-types";

interface Place2 extends Place {
  createCameraParams(
    name: string,
    camParams: CameraParameters,
    classification: Classification,
    constellation: string,
    type: ImageSetType,
    target: SolarSystemObjects
  ): Place;
}

export function copyPlace(originalPlace: Place): Place {
  // Create a new Place object using the original's properties
  const copiedPlace = (Place as unknown as Place2).createCameraParams(
    originalPlace.get_name(),
    originalPlace.get_camParams().copy(), // Copy camera parameters
    originalPlace.get_classification(),
    originalPlace.get_constellation(),
    originalPlace.get_type(), // Ensure get_type is called correctly
    originalPlace.get_target() // Ensure get_target is called correctly
  );

  // Copy additional properties
  copiedPlace.set_zoomLevel(originalPlace.get_zoomLevel());
  copiedPlace.set_studyImageset(originalPlace.get_studyImageset());
  copiedPlace.set_backgroundImageset(originalPlace.get_backgroundImageset());
  copiedPlace.set_annotation(originalPlace.get_annotation());
  copiedPlace.set_magnitude(originalPlace.get_magnitude());
  copiedPlace.set_distance(originalPlace.get_distance());
  copiedPlace.set_lat(originalPlace.get_lat());
  copiedPlace.set_lng(originalPlace.get_lng());
  copiedPlace.set_opacity(originalPlace.get_opacity());

  return copiedPlace;
}