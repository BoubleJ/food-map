import { Center, Skeleton, Text } from "@mantine/core";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface KakaoMapProps {
  fitCoordinates?: Coordinate[];
  defaultCenter?: Coordinate;
  defaultLevel?: number;
  onCreate?: (map: kakao.maps.Map) => void;
}

const SEOUL_CITY_HALL: Coordinate = { latitude: 37.5665, longitude: 126.978 };

export function KakaoMap({
  fitCoordinates = [],
  defaultCenter = SEOUL_CITY_HALL,
  defaultLevel = 7,
  onCreate,
  children,
}: PropsWithChildren<KakaoMapProps>) {
  const [isLoading, error] = useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_JS_KEY });
  const [map, setMap] = useState<kakao.maps.Map>();

  const fittedKeyRef = useRef<string>(undefined);

  useEffect(() => {
    if (!map) return;
    const fitKey = fitCoordinates
      .map(({ latitude, longitude }) => `${latitude},${longitude}`)
      .join("|");
    if (fitKey === fittedKeyRef.current) return;
    fittedKeyRef.current = fitKey;
    if (fitCoordinates.length === 0) return;

    const bounds = new kakao.maps.LatLngBounds();
    for (const { latitude, longitude } of fitCoordinates) {
      bounds.extend(new kakao.maps.LatLng(latitude, longitude));
    }
    map.setBounds(bounds);
  }, [map, fitCoordinates]);

  const handleCreate = (createdMap: kakao.maps.Map) => {
    setMap(createdMap);
    onCreate?.(createdMap);
  };

  if (error) {
    return (
      <Center h="100%">
        <Text c="dimmed">지도를 불러오지 못했습니다.</Text>
      </Center>
    );
  }

  if (isLoading) return <Skeleton h="100%" radius={0} />;

  return (
    <Map
      center={{ lat: defaultCenter.latitude, lng: defaultCenter.longitude }}
      level={defaultLevel}
      onCreate={handleCreate}
      style={{ width: "100%", height: "100%" }}
    >
      {children}
    </Map>
  );
}
