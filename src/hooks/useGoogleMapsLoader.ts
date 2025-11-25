import { useJsApiLoader } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";

const libraries: Libraries = ["maps"];

export function useGoogleMapsLoader() {
  return useJsApiLoader({
    id: "stargazer-map", // shared singleton id
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
    language: "en",
    region: "US",
  });
}
