import { CustomOverlayMap } from "react-kakao-maps-sdk";
import type { Coordinate } from "@/components/KakaoMap";
import classes from "@/components/PlaceMarker.module.css";
import { PLACE_MARKER_Z_INDEX } from "@/constants/zindex";

type PlaceMarkerVariant = "default" | "selected" | "registered" | "address";

export type PlaceMarkerShape = "bubble" | "dot";

interface PlaceMarkerProps {
  name: string;
  coordinate: Coordinate;
  variant?: PlaceMarkerVariant;
  shape?: PlaceMarkerShape;
  isActive?: boolean;
}

export function PlaceMarker({
  name,
  coordinate,
  variant = "default",
  shape = "bubble",
  isActive = false,
}: PlaceMarkerProps) {
  const isDot = shape === "dot" && !isActive;

  return (
    <CustomOverlayMap
      position={{ lat: coordinate.latitude, lng: coordinate.longitude }}
      yAnchor={isDot ? 0.5 : 1}
      zIndex={isActive ? PLACE_MARKER_Z_INDEX.active : PLACE_MARKER_Z_INDEX[variant]}
    >
      <div
        className={classes.root}
        data-variant={variant}
        data-shape={isDot ? "dot" : "bubble"}
        data-active={isActive || undefined}
      >
        {isDot ? (
          <span className={classes.dot} role="img" aria-label={name} title={name} />
        ) : (
          <div className={classes.bubble}>
            <span className={classes.name}>{name}</span>
          </div>
        )}
      </div>
    </CustomOverlayMap>
  );
}
