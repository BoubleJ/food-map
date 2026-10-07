import { CustomOverlayMap } from "react-kakao-maps-sdk";
import type { Coordinate } from "@/components/KakaoMap";
import classes from "@/components/PlaceMarker.module.css";
import { PLACE_MARKER_Z_INDEX } from "@/constants/zindex";

type PlaceMarkerVariant = "default" | "selected" | "registered";

interface PlaceMarkerProps {
  name: string;
  coordinate: Coordinate;
  variant?: PlaceMarkerVariant;
  isActive?: boolean;
}

export function PlaceMarker({
  name,
  coordinate,
  variant = "default",
  isActive = false,
}: PlaceMarkerProps) {
  return (
    <CustomOverlayMap
      position={{ lat: coordinate.latitude, lng: coordinate.longitude }}
      yAnchor={1}
      zIndex={isActive ? PLACE_MARKER_Z_INDEX.active : PLACE_MARKER_Z_INDEX[variant]}
    >
      <div className={classes.root} data-variant={variant} data-active={isActive || undefined}>
        <div className={classes.bubble}>
          <span className={classes.name}>{name}</span>
        </div>
      </div>
    </CustomOverlayMap>
  );
}
